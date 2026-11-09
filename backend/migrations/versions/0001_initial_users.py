"""Create initial users and role assignments."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial_users"
down_revision = None
branch_labels = None
depends_on = None
user_role = postgresql.ENUM("advertiser", "publisher", "developer", "admin", name="user_role", create_type=False)


def upgrade() -> None:
    user_role.create(op.get_bind(), checkfirst=True)
    op.create_table("users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_email_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_table("user_role_assignments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.UniqueConstraint("user_id", "role", name="uq_user_role"))
    op.create_index("ix_user_role_assignments_user_id", "user_role_assignments", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_user_role_assignments_user_id", table_name="user_role_assignments")
    op.drop_table("user_role_assignments")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    user_role.drop(op.get_bind(), checkfirst=True)
