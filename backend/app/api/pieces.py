import uuid
from datetime import date, datetime, timezone

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import select

from ..auth import is_owner, require_owner
from ..db import SessionLocal
from ..errors import ApiError
from ..models import Collection, CollectionPiece, Piece, Tag
from ..schemas import piece_detail_to_dict, piece_to_dict
from ..services.images import InvalidImage, process_upload
from ..services.slugs import slugify
from .helpers import parse_uuid

bp = Blueprint("pieces", __name__, url_prefix="/pieces")


@bp.get("")
def list_pieces():
    """
    Gallery order, newest first. Also the picker source for curation.

    Waived pieces are excluded unless the owner asks for them by name.
    The default is the safe one: a caller who forgets the parameter gets
    the gallery, never the reserve.
    """
    session = SessionLocal()
    want_waived = request.args.get("waived") == "true"

    if want_waived:
        if not is_owner():
            raise ApiError("Owner credentials required.", status=401)
        # Most recently waived first: this is a trash can, and the thing
        # just put in it is the thing most likely to be wanted back.
        stmt = select(Piece).where(Piece.waived_at.is_not(None)).order_by(
            Piece.waived_at.desc(), Piece.title
        )
    else:
        stmt = select(Piece).where(Piece.waived_at.is_(None)).order_by(
            Piece.created_at.desc(), Piece.title
        )

    return jsonify([piece_to_dict(p) for p in session.scalars(stmt).all()])


@bp.get("/<uuid:piece_id>")
def get_piece(piece_id):
    session = SessionLocal()
    piece = session.get(Piece, piece_id)
    # 404 rather than 403 for a waived piece: a 403 would confirm it
    # exists, which is the one fact being withheld.
    if piece is None or (piece.is_waived and not is_owner()):
        raise ApiError("Piece not found.", status=404)
    return jsonify(piece_detail_to_dict(piece))


def _resolve_tags(session, names: list[str]) -> list[Tag]:
    """
    Get-or-create by slug.

    Two uploads introducing the same new tag at once would race; the unique
    constraint on tags.slug is what makes that safe rather than lucky.
    """
    tags: list[Tag] = []
    for raw in names:
        name = (raw or "").strip()
        if not name:
            continue
        slug = slugify(name)
        if not slug:
            continue
        tag = session.scalars(select(Tag).where(Tag.slug == slug)).first()
        if tag is None:
            tag = Tag(name=name, slug=slug)
            session.add(tag)
            session.flush()
        if tag not in tags:
            tags.append(tag)
    return tags


@bp.post("")
@require_owner
def create_piece():
    """
    Upload a piece.

    multipart/form-data: `image` plus title, description, medium, year,
    createdDate, and repeated `tags` fields.

    Ordering matters here. Files are written before the row is committed:
    files-then-database can leave orphaned bytes, which are invisible and
    sweepable, while database-then-files can leave a row pointing at
    nothing, which is a broken image on the page. The commit is the point
    of truth, and a failed commit takes the objects back out.
    """
    upload = request.files.get("image")
    if upload is None or not upload.filename:
        raise ApiError("An image file is required.", details={"image": "required"})

    title = (request.form.get("title") or "").strip()
    if not title:
        raise ApiError("A piece needs a title.", details={"title": "required"})

    raw = upload.read()
    if not raw:
        raise ApiError("The uploaded file is empty.")

    try:
        processed = process_upload(raw)
    except InvalidImage as exc:
        raise ApiError(str(exc), details={"image": "invalid"})

    year_raw = request.form.get("year")
    try:
        year = int(year_raw) if year_raw else None
    except ValueError:
        raise ApiError("year must be a number.", details={"year": year_raw})

    created_raw = request.form.get("createdDate")
    try:
        created = date.fromisoformat(created_raw) if created_raw else None
    except ValueError:
        raise ApiError(
            "createdDate must be YYYY-MM-DD.", details={"createdDate": created_raw}
        )

    # The id is generated here, before anything is written: every object key
    # derives from it, so it cannot wait for the INSERT to assign one.
    piece = Piece(
        id=uuid.uuid4(),
        title=title,
        description=(request.form.get("description") or "").strip() or None,
        original_ext=processed.original_ext,
        byte_size=processed.byte_size,
        medium=(request.form.get("medium") or "").strip() or None,
        year=year,
        width=processed.width,
        height=processed.height,
        created_date=created,
    )

    storage = current_app.extensions["storage"]
    session = SessionLocal()

    for rendition in processed.renditions:
        storage.save(
            piece.key(rendition.variant), rendition.data, rendition.content_type
        )

    try:
        piece.tags = _resolve_tags(session, request.form.getlist("tags"))
        session.add(piece)
        session.commit()
    except Exception:
        session.rollback()
        storage.delete_prefix(piece.storage_prefix)
        raise

    return jsonify(piece_to_dict(piece)), 201


@bp.delete("/<uuid:piece_id>")
@require_owner
def delete_piece(piece_id):
    session = SessionLocal()
    piece = session.get(Piece, piece_id)
    if piece is None:
        raise ApiError("Piece not found.", status=404)

    # The two-stage rule lives here rather than in the UI. Deletion
    # destroys the original along with the derivatives, and a rule only
    # the frontend enforces is not a rule for anything else holding the
    # owner token.
    if not piece.is_waived:
        raise ApiError(
            "Waive this piece before deleting it.",
            status=409,
            details={"title": piece.title},
        )

    prefix = piece.storage_prefix
    # Cascades clear collection membership and tag links. Collections that
    # used this piece as their cover fall back to their first member.
    session.delete(piece)
    session.commit()

    # Only once the row is gone: an orphaned object is recoverable, a row
    # pointing at deleted bytes is a broken image.
    current_app.extensions["storage"].delete_prefix(prefix)
    return "", 204


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@bp.post("/<uuid:piece_id>/waive")
@require_owner
def waive_piece(piece_id):
    """
    Withdraw a piece from the gallery, reversibly.

    Membership in every collection is dropped rather than filtered out. That
    turns "a row in collection_pieces means the piece is exhibited" into an
    invariant the schema keeps, rather than a filter every present and future
    query has to remember. The cost is that restoring does not put the piece
    back where it was, which is why restore offers to re-curate.
    """
    session = SessionLocal()
    piece = session.get(Piece, piece_id)
    if piece is None:
        raise ApiError("Piece not found.", status=404)
    if piece.is_waived:
        raise ApiError("That piece is already waived.", status=409)

    # Same rule membership replacement already enforces: a cover that is not
    # a member would render a face the collection does not contain.
    for link in piece.collection_links:
        if link.collection.cover_piece_id == piece.id:
            link.collection.cover_piece_id = None

    # delete-orphan on the relationship removes the join rows.
    piece.collection_links.clear()
    piece.waived_at = _utcnow()
    session.commit()

    return jsonify(piece_detail_to_dict(piece))


def _append_to(collection: Collection, piece: Piece) -> None:
    """
    Put a piece at the end of a collection.

    The end rather than a remembered position: the piece was not a member,
    and now it is. Rearranging is what PUT /collections/<id>/pieces is for.
    """
    highest = max(
        (link.display_order for link in collection.piece_links), default=-1
    )
    # `piece=` rather than `piece_id=`: assigning the relationship populates
    # both directions in memory, so the piece's own view of its collections
    # is correct in the response without a round trip.
    collection.piece_links.append(
        CollectionPiece(piece=piece, display_order=highest + 1)
    )


def _load_collections(session, raw_ids, field: str) -> dict:
    """Validate a list of collection ids and load them, or refuse by name."""
    if not isinstance(raw_ids, list):
        raise ApiError(f"{field} must be an array.")

    parsed = [parse_uuid(value, field) for value in raw_ids]
    if len(parsed) != len(set(parsed)):
        raise ApiError(f"{field} names the same collection twice.")
    if not parsed:
        return {}

    found = {
        collection.id: collection
        for collection in session.scalars(
            select(Collection).where(Collection.id.in_(parsed))
        )
    }
    missing = [str(cid) for cid in parsed if cid not in found]
    if missing:
        raise ApiError(
            "Some collections do not exist.",
            status=404,
            details={"missing": missing},
        )
    # Insertion-ordered, so the caller's order is the order pieces land in.
    return {cid: found[cid] for cid in parsed}


def _join_collections(session, piece: Piece, raw_ids) -> None:
    """Append a restored piece to the collections the owner picked."""
    if raw_ids is None:
        return
    for collection in _load_collections(session, raw_ids, "collectionIds").values():
        _append_to(collection, piece)


@bp.post("/<uuid:piece_id>/restore")
@require_owner
def restore_piece(piece_id):
    """
    Return a piece to the gallery, optionally re-curating it.

    Body: {"collectionIds": [...]} -- absent or empty restores to the
    gallery alone. One transaction, so the restore and the membership either
    both land or neither does; a piece back on the wall carrying half its
    curation would be worse than a clean failure.
    """
    session = SessionLocal()
    piece = session.get(Piece, piece_id)
    if piece is None:
        raise ApiError("Piece not found.", status=404)
    if not piece.is_waived:
        raise ApiError("That piece is not waived.", status=409)

    body = request.get_json(silent=True) or {}
    _join_collections(session, piece, body.get("collectionIds"))
    piece.waived_at = None
    session.commit()

    return jsonify(piece_detail_to_dict(piece))


@bp.put("/<uuid:piece_id>/collections")
@require_owner
def set_piece_collections(piece_id):
    """
    Set which collections a piece belongs to.

    A set rather than an append, so the piece page can show a checkbox per
    collection and have unchecking mean what it looks like it means. Ids
    already present keep their position: re-saving an unchanged list must
    not shuffle the owner's curation.

    Refused for a waived piece. A row in collection_pieces means the piece
    is exhibited, and that invariant is worth more than the convenience of
    curating from the reserve.
    """
    session = SessionLocal()
    piece = session.get(Piece, piece_id)
    if piece is None:
        raise ApiError("Piece not found.", status=404)
    if piece.is_waived:
        raise ApiError(
            "Restore this piece before adding it to collections.", status=409
        )

    body = request.get_json(silent=True) or {}
    if "collectionIds" not in body:
        raise ApiError(
            "collectionIds is required.", details={"collectionIds": "required"}
        )

    wanted = _load_collections(session, body["collectionIds"], "collectionIds")
    current = {link.collection_id: link for link in piece.collection_links}

    for cid, link in list(current.items()):
        if cid in wanted:
            continue
        # Leaving a collection is another way to stop being a member, so the
        # cover rule applies here too.
        if link.collection.cover_piece_id == piece.id:
            link.collection.cover_piece_id = None
        piece.collection_links.remove(link)

    for cid, collection in wanted.items():
        if cid not in current:
            _append_to(collection, piece)

    session.commit()
    return jsonify(piece_detail_to_dict(piece))
