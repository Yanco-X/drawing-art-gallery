from flask import Blueprint, jsonify
from sqlalchemy import select

from ..db import SessionLocal
from ..errors import ApiError
from ..models import Piece
from ..schemas import piece_to_dict

bp = Blueprint("pieces", __name__, url_prefix="/pieces")


@bp.get("")
def list_pieces():
    """Gallery order, newest first. Also the picker source for curation."""
    session = SessionLocal()
    pieces = session.scalars(
        select(Piece).order_by(Piece.created_at.desc(), Piece.title)
    ).all()
    return jsonify([piece_to_dict(piece) for piece in pieces])


@bp.get("/<uuid:piece_id>")
def get_piece(piece_id):
    session = SessionLocal()
    piece = session.get(Piece, piece_id)
    if piece is None:
        raise ApiError("Piece not found.", status=404)
    return jsonify(piece_to_dict(piece))
