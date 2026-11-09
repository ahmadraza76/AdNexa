from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
import jwt
from app.core.config import settings
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.database import get_db
from app.models.user import User, UserRole, UserRoleAssignment
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["authentication"])
bearer = HTTPBearer(auto_error=False)
PUBLIC_ROLES = {UserRole.advertiser, UserRole.publisher, UserRole.developer}


def serialize_user(user: User, db: Session) -> UserResponse:
    roles = list(db.scalars(select(UserRoleAssignment.role).where(UserRoleAssignment.user_id == user.id)))
    return UserResponse(id=user.id, email=user.email, full_name=user.full_name, is_active=user.is_active,
                        is_email_verified=user.is_email_verified, roles=roles)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if payload.role not in PUBLIC_ROLES:
        raise HTTPException(status_code=403, detail="Admin registration is invitation-only")
    email = str(payload.email).lower()
    user = User(email=email, full_name=payload.full_name.strip(), password_hash=hash_password(payload.password))
    try:
        db.add(user)
        db.flush()
        db.add(UserRoleAssignment(user_id=user.id, role=payload.role))
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, expires_in=settings.access_token_expire_minutes * 60, user=serialize_user(user, db))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password", headers={"WWW-Authenticate": "Bearer"})
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, expires_in=settings.access_token_expire_minutes * 60, user=serialize_user(user, db))


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required", headers={"WWW-Authenticate": "Bearer"})
    try:
        claims = decode_access_token(credentials.credentials)
        user_id = int(claims["sub"])
    except (jwt.InvalidTokenError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid or expired access token", headers={"WWW-Authenticate": "Bearer"})
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid or inactive account")
    return user


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return serialize_user(user, db)
