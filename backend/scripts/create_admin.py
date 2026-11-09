"""Create the first AdNexa administrator from a trusted server shell.

This bootstrap command is intentionally not exposed as an HTTP endpoint.
It refuses to run once an administrator role has been assigned.
"""
from getpass import getpass
from sqlalchemy import select
from app.database import SessionLocal
from app.models.user import User, UserRole, UserRoleAssignment
from app.core.security import hash_password


def main() -> None:
    email = input("Admin email: ").strip().lower()
    full_name = input("Admin full name: ").strip()
    password = getpass("Admin password (minimum 16 characters): ")
    confirmation = getpass("Confirm password: ")
    if len(password) < 16:
        raise SystemExit("Password must contain at least 16 characters.")
    if password != confirmation:
        raise SystemExit("Passwords do not match.")

    with SessionLocal() as db:
        existing_admin = db.scalar(
            select(UserRoleAssignment.id).where(UserRoleAssignment.role == UserRole.admin).limit(1)
        )
        if existing_admin:
            raise SystemExit("An administrator already exists. Bootstrap is disabled.")
        if db.scalar(select(User.id).where(User.email == email)):
            raise SystemExit("That email already belongs to an account; refusing automatic privilege escalation.")
        user = User(email=email, full_name=full_name, password_hash=hash_password(password))
        db.add(user)
        db.flush()
        db.add(UserRoleAssignment(user_id=user.id, role=UserRole.admin))
        db.commit()
        print(f"Initial administrator created: {email}")


if __name__ == "__main__":
    main()
