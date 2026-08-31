"""drop pieces.original_filename

Object keys derive from the piece id, so the uploaded name was never used
to find a file -- it was only ever a label. Nothing read it, and keeping a
user-supplied string with no reader is a liability rather than a record.

Revision ID: 64c7a2ba6f09
Revises: 88c31e2c7d76
Create Date: 2026-08-30 21:18:04.531400

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '64c7a2ba6f09'
down_revision: Union[str, Sequence[str], None] = '88c31e2c7d76'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column('pieces', 'original_filename')


def downgrade() -> None:
    """Downgrade schema."""
    # Restores the column, not its contents -- the names are gone for good.
    op.add_column(
        'pieces',
        sa.Column('original_filename', sa.VARCHAR(length=255), nullable=True),
    )
