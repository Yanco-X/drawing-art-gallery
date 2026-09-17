"""add users.session_token

What Flask-Login stores in the cookie, in place of the user id, so that
`flask set-owner` ends every session by replacing it -- context/AUTH.md.

Revision ID: 3e9c1f7a52d4
Revises: 7c2e5a9d14b8
Create Date: 2026-09-17 23:30:00.000000

"""
import secrets
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3e9c1f7a52d4'
down_revision: Union[str, Sequence[str], None] = '7c2e5a9d14b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("session_token", sa.String(length=32), nullable=True))
    users = sa.table("users", sa.column("id"), sa.column("session_token"))
    bind = op.get_bind()
    for (user_id,) in bind.execute(sa.select(users.c.id)):
        bind.execute(
            users.update()
            .where(users.c.id == user_id)
            .values(session_token=secrets.token_hex(16))
        )
    op.alter_column("users", "session_token", nullable=False)
    op.create_unique_constraint("uq_users_session_token", "users", ["session_token"])


def downgrade() -> None:
    op.drop_constraint("uq_users_session_token", "users", type_="unique")
    op.drop_column("users", "session_token")
