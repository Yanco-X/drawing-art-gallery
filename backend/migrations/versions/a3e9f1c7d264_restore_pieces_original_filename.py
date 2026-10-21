"""restore pieces.original_filename

Dropped in 64c7a2ba6f09 because nothing read it. The owner's file panel on
the piece page now does, so it returns as a label. Pieces uploaded before
this have no name to recover and stay null.

Revision ID: a3e9f1c7d264
Revises: f6a2d8c3b145
Create Date: 2026-10-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3e9f1c7d264'
down_revision: Union[str, Sequence[str], None] = 'f6a2d8c3b145'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pieces", sa.Column("original_filename", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("pieces", "original_filename")
