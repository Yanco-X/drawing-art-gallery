
from flask import Blueprint, jsonify, request
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..auth import require_owner
from ..db import SessionLocal
from ..errors import ApiError
from ..models import Collection, CollectionPiece, Piece
from ..schemas import collection_summary_to_dict, collection_to_dict
from ..services.slugs import unique_slug
from .helpers import parse_uuid

bp = Blueprint("collections", __name__, url_prefix="/collections")


def _body() -> dict:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError("Expected a JSON object body.")
    return data


def _load(session, collection_id) -> Collection:
    collection = session.get(Collection, collection_id)
    if collection is None:
        raise ApiError("Collection not found.", status=404)
    return collection


def _set_membership(session, collection: Collection, piece_ids: list) -> None:
    """
    Replace the whole membership list, in the given order.

    Curation is 'pick the pieces, arrange them, save', so the write is one
    idempotent replacement rather than a sequence of add/remove calls that
    could half-apply. Positions are rewritten contiguously from 0, which
    keeps display_order readable and avoids gap-juggling.
    """
    if not isinstance(piece_ids, list):
        raise ApiError("pieceIds must be an array.")

    parsed = [parse_uuid(value, "pieceIds") for value in piece_ids]

    duplicates = len(parsed) != len(set(parsed))
    if duplicates:
        raise ApiError("pieceIds contains the same piece more than once.")

    if parsed:
        found = set(
            session.scalars(select(Piece.id).where(Piece.id.in_(parsed))).all()
        )
        missing = [str(pid) for pid in parsed if pid not in found]
        if missing:
            raise ApiError(
                "Some pieces do not exist.",
                status=404,
                details={"missing": missing},
            )

    collection.piece_links.clear()
    session.flush()
    for position, piece_id in enumerate(parsed):
        collection.piece_links.append(
            CollectionPiece(piece_id=piece_id, display_order=position)
        )

    # A cover that is no longer a member would render a face the collection
    # does not contain, so drop it back to the first-member fallback.
    if collection.cover_piece_id and collection.cover_piece_id not in parsed:
        collection.cover_piece_id = None


def _apply_cover(session, collection: Collection, raw_cover) -> None:
    if raw_cover is None:
        collection.cover_piece_id = None
        return
    cover_id = parse_uuid(raw_cover, "coverPieceId")
    member_ids = {link.piece_id for link in collection.piece_links}
    if cover_id not in member_ids:
        raise ApiError(
            "The cover must be a piece inside the collection.",
            details={"coverPieceId": str(cover_id)},
        )
    collection.cover_piece_id = cover_id


@bp.get("")
def list_collections():
    session = SessionLocal()
    stmt = select(Collection).order_by(Collection.created_at.desc(), Collection.name)
    # Visitors never see unpublished collections. Owners pass ?includePrivate=1.
    if request.args.get("includePrivate") != "1":
        stmt = stmt.where(Collection.is_public.is_(True))
    collections = session.scalars(
        stmt.options(selectinload(Collection.piece_links))
    ).unique().all()
    return jsonify([collection_summary_to_dict(c) for c in collections])


@bp.get("/<slug>")
def get_collection(slug: str):
    session = SessionLocal()
    collection = session.scalars(
        select(Collection).where(Collection.slug == slug)
    ).unique().first()
    if collection is None:
        raise ApiError("Collection not found.", status=404)
    return jsonify(collection_to_dict(collection))


@bp.post("")
@require_owner
def create_collection():
    data = _body()
    name = (data.get("name") or "").strip()
    if not name:
        raise ApiError("A collection needs a name.", details={"name": "required"})

    session = SessionLocal()
    collection = Collection(
        name=name,
        slug=unique_slug(session, Collection, data.get("slug") or name),
        description=(data.get("description") or "").strip() or None,
        is_public=bool(data.get("isPublic", True)),
    )
    session.add(collection)

    if "pieceIds" in data:
        _set_membership(session, collection, data["pieceIds"])
    if "coverPieceId" in data:
        _apply_cover(session, collection, data["coverPieceId"])

    session.commit()
    return jsonify(collection_to_dict(collection)), 201


@bp.patch("/<uuid:collection_id>")
@require_owner
def update_collection(collection_id):
    data = _body()
    session = SessionLocal()
    collection = _load(session, collection_id)

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            raise ApiError("A collection needs a name.", details={"name": "required"})
        collection.name = name

    if "slug" in data:
        collection.slug = unique_slug(
            session, Collection, data["slug"], exclude_id=collection.id
        )

    if "description" in data:
        collection.description = (data.get("description") or "").strip() or None

    if "isPublic" in data:
        collection.is_public = bool(data["isPublic"])

    if "coverPieceId" in data:
        _apply_cover(session, collection, data["coverPieceId"])

    session.commit()
    return jsonify(collection_to_dict(collection))


@bp.put("/<uuid:collection_id>/pieces")
@require_owner
def set_collection_pieces(collection_id):
    data = _body()
    if "pieceIds" not in data:
        raise ApiError("pieceIds is required.", details={"pieceIds": "required"})

    session = SessionLocal()
    collection = _load(session, collection_id)
    _set_membership(session, collection, data["pieceIds"])

    if "coverPieceId" in data:
        _apply_cover(session, collection, data["coverPieceId"])

    session.commit()
    return jsonify(collection_to_dict(collection))


@bp.delete("/<uuid:collection_id>")
@require_owner
def delete_collection(collection_id):
    session = SessionLocal()
    collection = _load(session, collection_id)
    # Cascades clear the membership rows only. The pieces themselves are
    # untouched -- a collection is a grouping, not an owner of artwork.
    session.delete(collection)
    session.commit()
    return "", 204
