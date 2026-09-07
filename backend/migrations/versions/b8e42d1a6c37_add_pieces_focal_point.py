"""add pieces.focal_x and pieces.focal_y

Where a crop should be aimed, as percentages across and down the image.

The spotlight band fills its half with `object-fit: cover`, which crops
whatever does not fit. Centred, that beheads a portrait -- and most of this
gallery is portraits with the face near the top. These two numbers tell the
browser what to keep.

Stored rather than derived, and stored as numbers rather than as a cropped
file. Baking a hero rendition per piece would cost a pipeline stage, a
second copy of every image, and a backfill over the archived originals; two
integers cost thirty bytes in a payload the page already fetches and are
spent at paint time, where the image is being drawn regardless.

Both null means dead centre, which is the browser's own default and is what
every piece uploaded before this migration keeps.

Revision ID: b8e42d1a6c37
Revises: f3a17c0d5b92
Create Date: 2026-09-06 22:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8e42d1a6c37'
down_revision: Union[str, Sequence[str], None] = 'f3a17c0d5b92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pieces", sa.Column("focal_x", sa.Integer(), nullable=True))
    op.add_column("pieces", sa.Column("focal_y", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("pieces", "focal_y")
    op.drop_column("pieces", "focal_x")
