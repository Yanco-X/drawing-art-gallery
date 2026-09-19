"""lowercase tag names

Revision ID: a6d0f3b8e217
Revises: 3e9c1f7a52d4
Create Date: 2026-09-17

"""
from alembic import op

revision = "a6d0f3b8e217"
down_revision = "3e9c1f7a52d4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE tags SET name = lower(name) WHERE name <> lower(name)")


def downgrade() -> None:
    # The original casing is not kept anywhere, so there is nothing to restore.
    pass
