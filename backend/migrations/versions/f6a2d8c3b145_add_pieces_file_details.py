"""add pieces.dpi, color_mode, capture_device

What the original says about itself, for the owner's file panel on the piece
page. Read from the file at upload; scripts/backfill_file_details.py fills
the pieces that came before.

Revision ID: f6a2d8c3b145
Revises: e8c4b2a7d913
Create Date: 2026-10-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6a2d8c3b145'
down_revision: Union[str, Sequence[str], None] = 'e8c4b2a7d913'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pieces", sa.Column("dpi", sa.Integer(), nullable=True))
    op.add_column("pieces", sa.Column("color_mode", sa.String(10), nullable=True))
    op.add_column("pieces", sa.Column("capture_device", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("pieces", "capture_device")
    op.drop_column("pieces", "color_mode")
    op.drop_column("pieces", "dpi")
