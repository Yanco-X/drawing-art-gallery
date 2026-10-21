"""add collections cover framing

Where the chosen cover sits in its card: a focal point and a zoom, in the
units of pieces.focal_x / focal_y / focal_zoom. Null on all three is the
cover filling its card from the centre, which is how every cover showed
before this.

Revision ID: c7d2e5a9f318
Revises: a3e9f1c7d264
Create Date: 2026-10-19 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7d2e5a9f318'
down_revision: Union[str, Sequence[str], None] = 'a3e9f1c7d264'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("collections", sa.Column("cover_focal_x", sa.Integer(), nullable=True))
    op.add_column("collections", sa.Column("cover_focal_y", sa.Integer(), nullable=True))
    op.add_column("collections", sa.Column("cover_zoom", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("collections", "cover_zoom")
    op.drop_column("collections", "cover_focal_y")
    op.drop_column("collections", "cover_focal_x")
