from collections.abc import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base, get_db
from app.main import app

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db: Session = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def register_payload(email="publisher@example.com", role="publisher"):
    return {"email": email, "password": "a-very-long-test-password",
            "full_name": "  Test   Publisher  ", "role": role}


def test_register_login_and_me(client: TestClient):
    registration = client.post("/api/v1/auth/register", json=register_payload())
    assert registration.status_code == 201
    token = registration.json()["access_token"]
    assert registration.json()["user"]["roles"] == ["publisher"]
    assert registration.json()["user"]["full_name"] == "Test Publisher"
    assert registration.json()["refresh_token"]

    login = client.post("/api/v1/auth/login", json={
        "email": " PUBLISHER@EXAMPLE.COM ",
        "password": "a-very-long-test-password",
    })
    assert login.status_code == 200
    assert login.json()["refresh_token"]

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "publisher@example.com"


def test_refresh_rotates_token_and_old_token_cannot_be_reused(client: TestClient):
    registration = client.post("/api/v1/auth/register", json=register_payload())
    old_token = registration.json()["refresh_token"]

    rotated = client.post("/api/v1/auth/refresh", json={"refresh_token": old_token})
    assert rotated.status_code == 200
    new_token = rotated.json()["refresh_token"]
    assert new_token != old_token
    assert rotated.json()["access_token"]

    replay = client.post("/api/v1/auth/refresh", json={"refresh_token": old_token})
    assert replay.status_code == 401
    # Reuse detection revokes the entire token family, including the newest token.
    after_replay = client.post("/api/v1/auth/refresh", json={"refresh_token": new_token})
    assert after_replay.status_code == 401


def test_logout_revokes_refresh_token(client: TestClient):
    registration = client.post("/api/v1/auth/register", json=register_payload())
    refresh_token = registration.json()["refresh_token"]
    logout = client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
    assert logout.status_code == 200
    assert logout.json() == {"ok": True}
    refresh = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh.status_code == 401


def test_duplicate_registration_is_rejected(client: TestClient):
    payload = register_payload(email="same@example.com", role="advertiser")
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    assert client.post("/api/v1/auth/register", json=payload).status_code == 409


def test_invalid_login_is_rejected(client: TestClient):
    response = client.post("/api/v1/auth/login", json={
        "email": "missing@example.com", "password": "wrong-password",
    })
    assert response.status_code == 401


def test_admin_cannot_self_register(client: TestClient):
    response = client.post("/api/v1/auth/register", json=register_payload(
        email="admin@example.com", role="admin"))
    assert response.status_code == 403


def test_me_requires_authentication(client: TestClient):
    assert client.get("/api/v1/auth/me").status_code == 401


def test_invalid_access_token_is_rejected(client: TestClient):
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-valid-token"})
    assert response.status_code == 401


def test_short_password_is_rejected(client: TestClient):
    payload = register_payload(email="weak@example.com")
    payload["password"] = "short"
    assert client.post("/api/v1/auth/register", json=payload).status_code == 422


def test_blank_full_name_is_rejected(client: TestClient):
    payload = register_payload(email="blank@example.com")
    payload["full_name"] = "   "
    assert client.post("/api/v1/auth/register", json=payload).status_code == 422
