"""add pieces.spotlight_order

Which slot a piece holds in the landing page spotlight, counting from zero,
or null for a piece the owner has not hand-picked.

A nullable column rather than a join table. The spotlight is at most five
rows and carries nothing of its own, so a table would be an id and a foreign
key to say what one integer already says. It is deliberately not unique:
`PUT /api/spotlight` rewrites the whole list in one transaction, and a
unique index would make an ordinary reorder collide with itself partway
through the rewrite.

Every existing row arrives null, which is the truth -- nothing has been
picked yet, and the band goes on showing the newest five until something is.

Revision ID: f3a17c0d5b92
Revises: e5b71c94f0a2
Create Date: 2026-09-06 21:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a17c0d5b92'
down_revision: Union[str, Sequence[str], None] = 'e5b71c94f0a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pieces", sa.Column("spotlight_order", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("pieces", "spotlight_order")
