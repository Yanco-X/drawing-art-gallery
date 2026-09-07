"""add pieces.focal_zoom

How large a piece is drawn inside its crop, as a percent of the size that
just fills the frame.

The focal point said which part of a piece survives a crop; it could not say
how much of the piece to show. `object-fit: cover` picks the smallest scale
that fills the frame, and for a tall portrait in a wide slot that scale
throws most of the drawing away -- the focal point only chose which part of
the wreckage to keep.

Null is 100: fill the frame exactly, which is what cover does unasked and
what every piece keeps across this migration. Under 100 the piece no longer
fills its half and the hatch shows around it. That is a real reversal of the
band's edge-to-edge look, taken deliberately and per piece: forced hatch on
every portrait was the pass 3 problem, and hatch the owner chose on one
piece because seeing more of it is worth it is not the same thing.

Stored as a multiple of fill rather than an absolute scale or a crop
rectangle. The band is `clamp()`-sized and changes shape between
breakpoints, so a stored rectangle would be correct at exactly one viewport.
A point and a multiple of fill mean the same thing at any size.

Revision ID: c5d93e2f8a41
Revises: b8e42d1a6c37
Create Date: 2026-09-06 23:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5d93e2f8a41'
down_revision: Union[str, Sequence[str], None] = 'b8e42d1a6c37'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pieces", sa.Column("focal_zoom", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("pieces", "focal_zoom")
