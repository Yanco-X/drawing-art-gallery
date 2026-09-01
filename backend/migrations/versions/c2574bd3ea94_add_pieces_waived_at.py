"""add pieces.waived_at

Null is exhibited, set is waived. A timestamp rather than a boolean so
the reserve has a sort order for free and an age-based purge policy
stays possible without a second migration.

Every existing row arrives null, so there is no backfill: nothing that
is on the wall today comes off it.

Revision ID: c2574bd3ea94
Revises: 64c7a2ba6f09
Create Date: 2026-08-31 18:04:32.849104

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2574bd3ea94'
down_revision: Union[str, Sequence[str], None] = '64c7a2ba6f09'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('pieces', sa.Column('waived_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('pieces', 'waived_at')
