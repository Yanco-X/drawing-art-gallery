"""add pieces.tiles_ready

Whether the Deep Zoom pyramid under <id>/tiles/ has been written, so the
detail view knows whether it can offer full-resolution zoom or has to fall
back to the display rendition.

A flag rather than a probe of storage: the answer is needed on every read of
a piece, and a HEAD request per piece to discover it would be absurd.

Every existing row arrives false, which is the truth -- no piece uploaded
before this migration has tiles. `scripts/backfill_tiles.py` re-derives them
from the archived originals and flips the flag as it goes, so the gallery
degrades gracefully in the meantime rather than breaking.

Revision ID: a7f4d91c3b28
Revises: c2574bd3ea94
Create Date: 2026-09-01 12:10:44.218755

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7f4d91c3b28'
down_revision: Union[str, Sequence[str], None] = 'c2574bd3ea94'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'pieces',
        sa.Column(
            'tiles_ready',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('false'),
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('pieces', 'tiles_ready')
