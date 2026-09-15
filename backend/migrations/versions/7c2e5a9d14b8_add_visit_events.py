"""add visit_events

One row per counted look at the gallery: a visit, a piece, a piece in the
detailed view, a collection. Raw rows deduplicated when read, so a question
thought of later is a query rather than another migration --
context/METRICS.md.

Both targets cascade: deleting a piece or a collection deletes its stats,
and the check constraint would refuse a view left with no target anyway.

Revision ID: 7c2e5a9d14b8
Revises: d1f4a7b93c26
Create Date: 2026-09-13 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7c2e5a9d14b8'
down_revision: Union[str, Sequence[str], None] = 'd1f4a7b93c26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TARGET_RULE = (
    "(kind = 'visit' AND piece_id IS NULL AND collection_id IS NULL)"
    " OR (kind IN ('piece_view', 'detailed_view')"
    " AND piece_id IS NOT NULL AND collection_id IS NULL)"
    " OR (kind = 'collection_view'"
    " AND collection_id IS NOT NULL AND piece_id IS NULL)"
)


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'visit_events',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('visitor_id', sa.Uuid(), nullable=False),
        sa.Column('kind', sa.String(length=20), nullable=False),
        sa.Column('piece_id', sa.Uuid(), nullable=True),
        sa.Column('collection_id', sa.Uuid(), nullable=True),
        sa.Column('device', sa.String(length=10), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(TARGET_RULE, name='ck_visit_events_target'),
        sa.ForeignKeyConstraint(['piece_id'], ['pieces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(
            ['collection_id'], ['collections.id'], ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('visit_events')
