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

from flask import Blueprint, jsonify, request
from sqlalchemy import func, select

from ..auth import require_owner
from ..db import SessionLocal
from ..errors import ApiError
from ..models import Collection, Piece
from ..schemas import collection_summary_to_dict, piece_to_dict
from .collections import COLLECTION_ORDER
from .helpers import parse_uuid
from .pieces import GALLERY_ORDER

bp = Blueprint("curation", __name__, url_prefix="/curation")


EXHIBITED = select(Piece).where(Piece.waived_at.is_(None))


def _ordered_ids(field: str, limit: int, too_many: str) -> list:
    """The body's list of ids, bounded by how many there can be."""
    body = request.get_json(silent=True)
    raw = body.get(field) if isinstance(body, dict) else None
    if not isinstance(raw, list):
        raise ApiError(f"{field} must be an array.", details={field: "required"})
    # Every id must be distinct and real, so a longer list cannot be valid.
    if len(raw) > limit:
        raise ApiError(too_many, details={field: str(len(raw))})
    ids = [parse_uuid(value, field) for value in raw]
    if len(ids) != len(set(ids)):
        raise ApiError(f"{field} names the same one twice.")
    return ids


def _load_all(session, model, ids: list) -> dict:
    """The named rows by id, or 404 naming the ones that do not exist."""
    found = {
        row.id: row for row in session.scalars(select(model).where(model.id.in_(ids)))
    } if ids else {}
    missing = [str(row_id) for row_id in ids if row_id not in found]
    if missing:
        raise ApiError("Some do not exist.", status=404, details={"missing": missing})
    return found


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
    ids = _ordered_ids("pieceIds", exhibited, "That is more pieces than the gallery holds.")

    found = _load_all(session, Piece, ids)
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
    ids = _ordered_ids("collectionIds", total, "That is more collections than there are.")

    found = _load_all(session, Collection, ids)
    _rewrite(session, Collection, found, ids)
    session.commit()

    rows = session.scalars(select(Collection).order_by(*COLLECTION_ORDER)).all()
    return jsonify([collection_summary_to_dict(row) for row in rows])
