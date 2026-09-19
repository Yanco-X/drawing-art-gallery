"""add the about page

The artist's own page: `about_page` holds the words, one row, and
`pieces.about_order` places the pieces beside them, the first as the cover.
The same shape as `spotlight_order`: null is not on the page.

The row is seeded with a first draft for the owner to rewrite on the page
itself, so the page is never empty on the day this lands.

Revision ID: b8e3f6a1c9d2
Revises: c4e8a1d2b7f5
Create Date: 2026-09-19 22:00:00.000000

"""
from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8e3f6a1c9d2'
down_revision: Union[str, Sequence[str], None] = 'c4e8a1d2b7f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


FIRST_DRAFT = """I'm Yanco, and this is where my drawings live.

I draw mostly with pencil and charcoal, most of it in sketchbooks. What keeps pulling me back to the page is people: characters I make up, faces I can't stop thinking about, and now and then someone whose own work has inspired me.

Some pieces belong to a series, like Night Calls, where the same figures turn up again from page to page. Others are one-offs, finished in a single sitting or worked on for weeks.

YanCurations is my own corner of the internet: no feed and no algorithm, just the work, arranged the way I want it seen. Wander through the collections, or press "Show me some!" and let the gallery pick for you."""


def upgrade() -> None:
    op.add_column("pieces", sa.Column("about_order", sa.Integer(), nullable=True))
    about = op.create_table(
        "about_page",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.bulk_insert(
        about,
        [{"id": 1, "body": FIRST_DRAFT, "updated_at": datetime.now(timezone.utc)}],
    )


def downgrade() -> None:
    op.drop_table("about_page")
    op.drop_column("pieces", "about_order")
