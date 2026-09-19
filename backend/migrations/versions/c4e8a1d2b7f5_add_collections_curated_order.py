"""add collections.curated_order

The owner's order for the collections themselves, set on the curation page
beside the gallery's. The same shape as `pieces.curated_order`: an integer
per row, not unique, null for a collection not placed yet.

Every collection, drafts included, is placed in the order the list already
showed, newest first, so nothing moves on the day this lands.

Revision ID: c4e8a1d2b7f5
Revises: 9b3d6e2f1a74
Create Date: 2026-09-19 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4e8a1d2b7f5'
down_revision: Union[str, Sequence[str], None] = '9b3d6e2f1a74'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("collections", sa.Column("curated_order", sa.Integer(), nullable=True))
    op.execute(
        """
        UPDATE collections SET curated_order = ranked.position
        FROM (
            SELECT id, row_number() OVER (ORDER BY created_at DESC, name) - 1 AS position
            FROM collections
        ) AS ranked
        WHERE collections.id = ranked.id
        """
    )


def downgrade() -> None:
    op.drop_column("collections", "curated_order")
