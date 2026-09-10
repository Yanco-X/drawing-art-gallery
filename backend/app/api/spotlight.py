"""
Which pieces the landing page band shows first.

No GET: `spotlightOrder` rides along on every piece in `GET /api/pieces`, so
the band works out its own five from the list the landing page already has.
The write takes the whole ordered list and replaces it, the shape
`PUT /api/socials` and `PUT /api/collections/<id>/pieces` already use.
"""

import uuid

from flask import Blueprint, jsonify, request
from sqlalchemy import select

from ..auth import require_owner
from ..db import SessionLocal
from ..errors import ApiError
from ..models import Piece
from ..schemas import piece_to_dict

bp = Blueprint("spotlight", __name__, url_prefix="/spotlight")

# The band has five slots. Picking more than five would silently discard the
# tail, which is worse than refusing it.
MAX_SPOTLIGHT = 5


def _piece_ids(body) -> list[uuid.UUID]:
    """A bare list of piece ids: the position in the array is the slot."""
    if not isinstance(body, list):
        raise ApiError(
            "Send a list of piece ids.", details={"spotlight": "list required"}
        )
    if len(body) > MAX_SPOTLIGHT:
        raise ApiError(
            f"The spotlight holds {MAX_SPOTLIGHT} pieces.",
            details={"spotlight": str(len(body))},
        )

    ids: list[uuid.UUID] = []
    for index, raw in enumerate(body):
        try:
            parsed = uuid.UUID(str(raw))
        except (ValueError, AttributeError, TypeError):
            raise ApiError(
                "That is not a piece id.", details={f"spotlight[{index}]": str(raw)}
            )
        # Two slots holding one piece would render the same work twice and
        # leave a slot doing nothing.
        if parsed in ids:
            raise ApiError(
                "That piece is already in the spotlight.",
                details={f"spotlight[{index}]": str(raw)},
            )
        ids.append(parsed)
    return ids


@bp.put("")
@require_owner
def replace_spotlight():
    """
    The whole list, in the order the band should show it.

    Set semantics: a piece absent from the body loses its slot. An empty list
    is how the owner goes back to the default, the newest five.
    """
    ids = _piece_ids(request.get_json(silent=True))

    session = SessionLocal()
    picked = {
        piece.id: piece
        for piece in session.scalars(select(Piece).where(Piece.id.in_(ids))).all()
    } if ids else {}

    for index, piece_id in enumerate(ids):
        piece = picked.get(piece_id)
        if piece is None:
            raise ApiError(
                "Piece not found.", status=404, details={f"spotlight[{index}]": str(piece_id)}
            )
        # A waived piece is not in the gallery, so it cannot be the first
        # thing shown of it. Waiving already clears the slot; this stops one
        # being handed out in the first place.
        if piece.is_waived:
            raise ApiError(
                "A waived piece cannot be in the spotlight.",
                status=409,
                details={f"spotlight[{index}]": str(piece_id)},
            )

    # Cleared across the board before the picks are written, so a piece
    # dropped from the list in this same request does not keep its old slot.
    for piece in session.scalars(
        select(Piece).where(Piece.spotlight_order.is_not(None))
    ).all():
        piece.spotlight_order = None

    for index, piece_id in enumerate(ids):
        picked[piece_id].spotlight_order = index

    session.commit()

    rows = session.scalars(
        select(Piece)
        .where(Piece.spotlight_order.is_not(None))
        .order_by(Piece.spotlight_order)
    ).all()
    return jsonify([piece_to_dict(piece) for piece in rows])
