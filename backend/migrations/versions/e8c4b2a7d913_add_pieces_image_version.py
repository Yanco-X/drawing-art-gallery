"""add pieces.image_version

Replacing a piece's image -- a scan for a photo -- writes the new files under
fresh keys, so neither a cached URL nor a backed-up original is rewritten in
place. Every existing piece is version 0, at its root, where its files are.

Revision ID: e8c4b2a7d913
Revises: d2a9c5e7f1b3
Create Date: 2026-10-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8c4b2a7d913'
down_revision: Union[str, Sequence[str], None] = 'd2a9c5e7f1b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "pieces",
        sa.Column("image_version", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("pieces", "image_version")
