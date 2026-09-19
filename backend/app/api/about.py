"""
The artist's page: the owner's words, and the pieces shown beside them.

The read is public and the same for everyone. Each write is the owner's and
replaces its half whole -- the text, or the ordered pieces, whose first is
the cover -- the shape the spotlight and the curated orders already use.

The words come in English and Spanish, `body` and `bodyEs`, for the
language toggle the privacy page already has.
"""

from flask import Blueprint, jsonify, request
from sqlalchemy import select

from ..auth import require_owner
from ..db import SessionLocal
from ..errors import ApiError
from ..models import AboutPage, Piece
from ..schemas import piece_to_dict
from .helpers import bounded_text, load_all, ordered_ids

bp = Blueprint("about", __name__, url_prefix="/about")

PAGE_ID = 1
# A cover and a row beneath it. Past a dozen it is a second gallery.
MAX_ABOUT_PIECES = 12
# Several paragraphs, not a book.
MAX_BODY = 6000
# Payload key to column: the languages the page is written in.
LANGUAGES = {"body": "body", "bodyEs": "body_es"}


def _about(session) -> dict:
    page = session.get(AboutPage, PAGE_ID)
    # A waive already clears the place; the filter keeps that from being the
    # only thing standing between a withdrawn piece and the public page.
    shown = session.scalars(
        select(Piece)
        .where(Piece.about_order.is_not(None), Piece.waived_at.is_(None))
        .order_by(Piece.about_order)
    ).all()
    return {
        "body": page.body if page else "",
        "bodyEs": page.body_es if page else "",
        "pieces": [piece_to_dict(piece) for piece in shown],
    }


@bp.get("")
def get_about():
    return jsonify(_about(SessionLocal()))


@bp.put("/text")
@require_owner
def replace_text():
    """
    Body: {"body": "...", "bodyEs": "..."}, either or both; a language left
    out keeps its words. Paragraphs are split by blank lines.
    """
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not LANGUAGES.keys() & payload.keys():
        raise ApiError("Send body, bodyEs or both.", details={"body": "required"})

    given = {}
    for key, column in LANGUAGES.items():
        if key not in payload:
            continue
        if not isinstance(payload[key], str):
            raise ApiError(f"{key} must be a string.", details={key: "not a string"})
        given[column] = bounded_text(payload[key].replace("\r\n", "\n"), key, MAX_BODY)

    session = SessionLocal()
    page = session.get(AboutPage, PAGE_ID)
    # Seeded by the migration; created here too, so a database built from
    # the models alone has a page to write to.
    if page is None:
        page = AboutPage(id=PAGE_ID, body="", body_es="")
        session.add(page)
    for column, text in given.items():
        setattr(page, column, text)
    session.commit()
    return jsonify(_about(session))


@bp.put("/pieces")
@require_owner
def replace_pieces():
    """Body: {"pieceIds": [...]}, the cover first. Empty takes them all off."""
    ids = ordered_ids(
        "pieceIds",
        MAX_ABOUT_PIECES,
        f"The page shows at most {MAX_ABOUT_PIECES} pieces.",
    )

    session = SessionLocal()
    found = load_all(session, Piece, ids)
    waived = [str(piece_id) for piece_id in ids if found[piece_id].is_waived]
    if waived:
        raise ApiError(
            "A waived piece cannot be on the page.",
            status=409,
            details={"waived": waived},
        )

    # Cleared first, so a piece dropped from the list in this same request
    # does not keep its old place.
    for piece in session.scalars(select(Piece).where(Piece.about_order.is_not(None))):
        piece.about_order = None
    for position, piece_id in enumerate(ids):
        found[piece_id].about_order = position

    session.commit()
    return jsonify(_about(session))
