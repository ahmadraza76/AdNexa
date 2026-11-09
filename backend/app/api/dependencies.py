from collections.abc import Callable
from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.auth import get_current_user
from app.database import get_db
from app.models.user import User, UserRole, UserRoleAssignment


def require_roles(*allowed_roles: UserRole) -> Callable:
    allowed = set(allowed_roles)

    def role_dependency(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        assigned = set(db.scalars(select(UserRoleAssignment.role).where(UserRoleAssignment.user_id == user.id)))
        if not assigned.intersection(allowed):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return role_dependency
