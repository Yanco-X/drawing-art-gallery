"""focal_zoom becomes a multiple of fit rather than of fill

Same column, different unit. `focal_zoom` was a percent of the size that
fills the frame; it is now a percent of the size at which the whole piece
fits. 100 means the whole piece is in frame, 200 means twice as close.

Fill is a property of the frame, not of the piece, and the band's frame
changes shape with the window -- its height is a `clamp()` and its width is
a share of the page. Measured on one window at 1906x885 the band was 1.96:1
while the picker's preview was 1.50:1, and the same stored 86 rendered 41.3%
of the piece's height in the band against 53.9% in the preview. The owner
was choosing a crop and getting a different one.

Anchoring to fit removes the frame from the arithmetic. `contain` shows the
whole piece at any shape, so a scale over it means the same thing
everywhere: every visitor sees the same amount of the drawing, and only the
hatch beside it varies with their window. For a gallery of tall portraits
that is the right invariant to hold -- the height is where the faces are,
and it was the axis that drifted.

Existing values are converted through the ratio the owner was judging
against, which is the picker's 3:2 preview, so a piece keeps the framing
they chose while looking at it. Clamped into the new bounds, which start at
100 because below it a piece is smaller than the frame in both directions
and only shrinks into the hatch.

Revision ID: d1f4a7b93c26
Revises: c5d93e2f8a41
Create Date: 2026-09-07 01:20:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'd1f4a7b93c26'
down_revision: Union[str, Sequence[str], None] = 'c5d93e2f8a41'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# The picker's preview, which is what the owner was looking at when they
# chose the number being converted.
PREVIEW_ASPECT = "1.5"

SIZED = (
    "focal_zoom IS NOT NULL AND width IS NOT NULL AND height IS NOT NULL "
    "AND width > 0 AND height > 0"
)


def _fill_ratio(aspect: str) -> str:
    """Where contain and cover coincide, for a piece of a given shape."""
    ratio = "(width::float8 / height::float8)"
    return f"GREATEST({aspect} / {ratio}, {ratio} / {aspect})"


def upgrade() -> None:
    op.execute(
        f"UPDATE pieces SET focal_zoom = LEAST(500, GREATEST(100, "
        f"ROUND(focal_zoom * {_fill_ratio(PREVIEW_ASPECT)})::int)) "
        f"WHERE {SIZED}"
    )


def downgrade() -> None:
    op.execute(
        f"UPDATE pieces SET focal_zoom = LEAST(250, GREATEST(40, "
        f"ROUND(focal_zoom / {_fill_ratio(PREVIEW_ASPECT)})::int)) "
        f"WHERE {SIZED}"
    )
