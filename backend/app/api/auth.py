from datetime import datetime, timedelta, timezone
import hashlib
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
import jwt

from app.core.config import settings
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.core.rate_limit import limiter
from app.database import get_db
from app.models.user import User, UserRole, UserRoleAssignment
from app.models.refresh_token import RefreshToken
from app.schemas.auth import LoginRequest, RegisterRequest, RefreshRequest, TokenResponse, RefreshResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["authentication"])
bearer = HTTPBearer(auto_error=False)
PUBLIC_ROLES = {UserRole.advertiser, UserRole.publisher, UserRole.developer}
REFRESH_TOKEN_EXPIRE_DAYS = 30


def serialize_user(user: User, db: Session) -> UserResponse:
    roles = list(db.scalars(select(UserRoleAssignment.role).where(UserRoleAssignment.user_id == user.id)))
    return UserResponse(id=user.id, email=user.email, full_name=user.full_name, is_active=user.is_active,
                        is_email_verified=user.is_email_verified, roles=roles)


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _new_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def _issue_session(user: User, db: Session, family_id: str | None = None) -> dict:
    raw_token = _new_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    db.add(RefreshToken(
        user_id=user.id,
        token_hash=_token_hash(raw_token),
        family_id=family_id or str(uuid.uuid4()),
        expires_at=expires_at,
    ))
    db.flush()
    return {
        "access_token": create_access_token(str(user.id)),
        "refresh_token": raw_token,
        "expires_in": settings.access_token_expire_minutes * 60,
        "refresh_expires_in": REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    }


def _unauthorized_refresh():
    return HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    if payload.role not in PUBLIC_ROLES:
        raise HTTPException(status_code=403, detail="Admin registration is invitation-only")
    email = str(payload.email).lower()
    user = User(email=email, full_name=payload.full_name.strip(), password_hash=hash_password(payload.password))
    try:
        db.add(user)
        db.flush()
        db.add(UserRoleAssignment(user_id=user.id, role=payload.role))
        tokens = _issue_session(user, db)
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    return TokenResponse(**tokens, user=serialize_user(user, db))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password", headers={"WWW-Authenticate": "Bearer"})
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    tokens = _issue_session(user, db)
    db.commit()
    return TokenResponse(**tokens, user=serialize_user(user, db))


@router.post("/refresh", response_model=RefreshResponse)
@limiter.limit("30/minute")
def refresh(request: Request, payload: RefreshRequest, db: Session = Depends(get_db)):
    digest = _token_hash(payload.refresh_token)
    session = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == digest).with_for_update())
    if not session:
        raise _unauthorized_refresh()

    now = datetime.now(timezone.utc)
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if session.revoked_at is not None:
        # Reuse of a rotated token signals possible theft: revoke every token in its family.
        db.execute(update(RefreshToken).where(
            RefreshToken.family_id == session.family_id,
            RefreshToken.revoked_at.is_(None),
        ).values(revoked_at=now))
        db.commit()
        raise _unauthorized_refresh()

    if expires_at <= now:
        session.revoked_at = now
        db.commit()
        raise _unauthorized_refresh()

    user = db.get(User, session.user_id)
    if not user or not user.is_active:
        session.revoked_at = now
        db.commit()
        raise _unauthorized_refresh()

    tokens = _issue_session(user, db, family_id=session.family_id)
    replacement_hash = _token_hash(tokens["refresh_token"])
    session.revoked_at = now
    session.replaced_by_hash = replacement_hash
    db.commit()
    return RefreshResponse(**tokens)


@router.post("/logout", status_code=status.HTTP_200_OK)
@limiter.limit("30/minute")
def logout(request: Request, payload: RefreshRequest, db: Session = Depends(get_db)):
    digest = _token_hash(payload.refresh_token)
    session = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == digest).with_for_update())
    if session and session.revoked_at is None:
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()
    return {"ok": True}


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
