"""add about_page.body_es

The about page in Spanish beside English, chosen by the same toggle the
privacy page has. Seeded with the first draft in Spanish, so the toggle has
something to switch to on the day this lands; the owner rewrites it on the
page, as they do the English.

Revision ID: d2a9c5e7f1b3
Revises: b8e3f6a1c9d2
Create Date: 2026-09-19 23:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd2a9c5e7f1b3'
down_revision: Union[str, Sequence[str], None] = 'b8e3f6a1c9d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


FIRST_DRAFT_ES = """Soy Yanco, y aquí viven mis dibujos.

Dibujo sobre todo con lápiz y carboncillo, casi siempre en cuadernos de bocetos. Lo que me hace volver una y otra vez a la hoja son las personas: personajes que invento, rostros que no me puedo sacar de la cabeza y, de vez en cuando, alguien cuyo propio trabajo me ha inspirado.

Algunas piezas forman parte de una serie, como Night Calls, donde las mismas figuras reaparecen de una página a otra. Otras son únicas, terminadas de una sentada o trabajadas durante semanas.

YanCurations es mi propio rincón de internet: sin feed y sin algoritmo, solo la obra, ordenada como quiero que se vea. Recorre las colecciones, o presiona "Show me some!" y deja que la galería elija por ti."""


def upgrade() -> None:
    op.add_column(
        "about_page",
        sa.Column("body_es", sa.Text(), nullable=False, server_default=""),
    )
    op.execute(
        sa.text("UPDATE about_page SET body_es = :es").bindparams(es=FIRST_DRAFT_ES)
    )


def downgrade() -> None:
    op.drop_column("about_page", "body_es")
