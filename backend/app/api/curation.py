"""
The owner's orders: the gallery's pieces, and the collections themselves.

No GET: `curatedOrder` rides on every piece in `GET /api/pieces` and every
collection in `GET /api/collections`, which already arrive in these orders.
Each write takes the whole ordered list and replaces it, the shape the
spotlight and collection membership use.

Set semantics: anything absent from the list loses its place and waits at
the top with the new arrivals. That is also what keeps something added while
the page was open from being buried by the save.
"""

from flask import Blueprint, jsonify
from sqlalchemy import func, select

from ..auth import require_owner
from ..db import SessionLocal
from ..errors import ApiError
from ..models import Collection, Piece
from ..schemas import collection_summary_to_dict, piece_to_dict
from .collections import COLLECTION_ORDER
from .helpers import load_all, ordered_ids
from .pieces import GALLERY_ORDER

bp = Blueprint("curation", __name__, url_prefix="/curation")


EXHIBITED = select(Piece).where(Piece.waived_at.is_(None))


def _rewrite(session, model, found: dict, ids: list) -> None:
    # Cleared first, so a row dropped from the list in this same request does
    # not keep its old place.
    for row in session.scalars(select(model).where(model.curated_order.is_not(None))):
        row.curated_order = None
    for position, row_id in enumerate(ids):
        found[row_id].curated_order = position


@bp.put("/pieces")
@require_owner
def replace_piece_order():
    """Body: {"pieceIds": [...]}, the gallery from first to last."""
    session = SessionLocal()
    exhibited = session.scalar(select(func.count()).select_from(EXHIBITED.subquery()))
    ids = ordered_ids("pieceIds", exhibited, "That is more pieces than the gallery holds.")

    found = load_all(session, Piece, ids)
    waived = [str(pid) for pid in ids if found[pid].is_waived]
    if waived:
        raise ApiError(
            "A waived piece has no place in the gallery.",
            status=409,
            details={"waived": waived},
        )

    _rewrite(session, Piece, found, ids)
    session.commit()

    rows = session.scalars(EXHIBITED.order_by(*GALLERY_ORDER)).all()
    return jsonify([piece_to_dict(piece) for piece in rows])


@bp.put("/collections")
@require_owner
def replace_collection_order():
    """
    Body: {"collectionIds": [...]}, first to last.

    Drafts are ordered with the rest: publishing one should not make the
    owner place it again.
    """
    session = SessionLocal()
    total = session.scalar(select(func.count()).select_from(Collection))
    ids = ordered_ids("collectionIds", total, "That is more collections than there are.")

    found = load_all(session, Collection, ids)
    _rewrite(session, Collection, found, ids)
    session.commit()

    rows = session.scalars(select(Collection).order_by(*COLLECTION_ORDER)).all()
    return jsonify([collection_summary_to_dict(row) for row in rows])
