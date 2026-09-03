"""add socials

Where the artist can be found, as rows rather than as a constant in the
bundle. The menu shipped in a first pass reading a hard-coded array; this is
the table that replaces it.

No visibility flag. A link the owner is not ready to share simply is not
added yet, and deleting one is a click -- a flag would have bought a second
visitor rule to write down and test for a case that has never come up.

platform is free text and not an enum: it keys the frontend's icon registry,
which already falls back to a generic mark for anything it does not know, so
joining a new site should not need a migration.

Revision ID: e5b71c94f0a2
Revises: a7f4d91c3b28
Create Date: 2026-09-02 22:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5b71c94f0a2'
down_revision: Union[str, Sequence[str], None] = 'a7f4d91c3b28'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'socials',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('platform', sa.String(length=40), nullable=False),
        sa.Column('label', sa.String(length=80), nullable=False),
        sa.Column('url', sa.String(length=500), nullable=False),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('socials')
