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


def test_register_login_and_me(client: TestClient):
    registration = client.post("/api/v1/auth/register", json={
        "email": "publisher@example.com",
        "password": "a-very-long-test-password",
        "full_name": "Test Publisher",
        "role": "publisher",
    })
    assert registration.status_code == 201
    token = registration.json()["access_token"]
    assert registration.json()["user"]["roles"] == ["publisher"]

    login = client.post("/api/v1/auth/login", json={
        "email": "PUBLISHER@example.com",
        "password": "a-very-long-test-password",
    })
    assert login.status_code == 200

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "publisher@example.com"


def test_duplicate_registration_is_rejected(client: TestClient):
    payload = {
        "email": "same@example.com",
        "password": "a-very-long-test-password",
        "full_name": "Same User",
        "role": "advertiser",
    }
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    assert client.post("/api/v1/auth/register", json=payload).status_code == 409


def test_invalid_login_is_rejected(client: TestClient):
    response = client.post("/api/v1/auth/login", json={
        "email": "missing@example.com",
        "password": "wrong-password",
    })
    assert response.status_code == 401


def test_admin_cannot_self_register(client: TestClient):
    response = client.post("/api/v1/auth/register", json={
        "email": "admin@example.com",
        "password": "a-very-long-test-password",
        "full_name": "Public Admin",
        "role": "admin",
    })
    assert response.status_code == 403
