"""add pieces.curated_order

The gallery's order, set by hand on the owner's curation page. A column
rather than a table for the reason `spotlight_order` is one: an integer per
piece says it all. Not unique, because the owner's save rewrites the whole
list in one transaction and a swap would collide with itself partway.

Every exhibited piece is placed in the order the gallery already shows,
newest first, so nothing moves on the day this lands and the first curation
starts from what the owner is used to. Waived pieces stay null: a waive
clears the place, and a restored piece waits at the top.

Revision ID: 9b3d6e2f1a74
Revises: a6d0f3b8e217
Create Date: 2026-09-19 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b3d6e2f1a74'
down_revision: Union[str, Sequence[str], None] = 'a6d0f3b8e217'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pieces", sa.Column("curated_order", sa.Integer(), nullable=True))
    op.execute(
        """
        UPDATE pieces SET curated_order = ranked.position
        FROM (
            SELECT id, row_number() OVER (ORDER BY created_at DESC, title) - 1 AS position
            FROM pieces
            WHERE waived_at IS NULL
        ) AS ranked
        WHERE pieces.id = ranked.id
        """
    )


def downgrade() -> None:
    op.drop_column("pieces", "curated_order")
