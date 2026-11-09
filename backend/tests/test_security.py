import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.models.user import User, UserRole, UserRoleAssignment
from app.api.dependencies import require_roles

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def test_role_dependency_denies_wrong_role():
    Base.metadata.create_all(bind=engine)
    db = Session()
    try:
        user = User(email="publisher@test.local", password_hash="hash", full_name="Publisher")
        db.add(user)
        db.flush()
        db.add(UserRoleAssignment(user_id=user.id, role=UserRole.publisher))
        db.commit()
        dependency = require_roles(UserRole.admin)
        with pytest.raises(HTTPException) as error:
            dependency(user=user, db=db)
        assert error.value.status_code == 403
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_role_dependency_allows_assigned_role():
    Base.metadata.create_all(bind=engine)
    db = Session()
    try:
        user = User(email="advertiser@test.local", password_hash="hash", full_name="Advertiser")
        db.add(user)
        db.flush()
        db.add(UserRoleAssignment(user_id=user.id, role=UserRole.advertiser))
        db.commit()
        dependency = require_roles(UserRole.advertiser)
        assert dependency(user=user, db=db).id == user.id
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
