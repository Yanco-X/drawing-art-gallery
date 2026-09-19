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
from ..services.tiles import clear_tiles, write_tiles
from .helpers import bounded_text, parse_uuid

bp = Blueprint("pieces", __name__, url_prefix="/pieces")

# The owner's curated order, with the pieces not placed yet above it, newest
# first. Postgres puts nulls last on an ascending sort unless told otherwise.
GALLERY_ORDER = (
    Piece.curated_order.asc().nulls_first(),
    Piece.created_at.desc(),
    Piece.title,
)


@bp.get("")
def list_pieces():
    """
    Gallery order: the owner's curation. Also the picker source for curation.

    Waived pieces are excluded unless the owner asks for them by name.
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
        stmt = select(Piece).where(Piece.waived_at.is_(None)).order_by(*GALLERY_ORDER)

    return jsonify([piece_to_dict(p) for p in session.scalars(stmt).all()])


@bp.get("/<uuid:piece_id>")
def get_piece(piece_id):
    session = SessionLocal()
    piece = session.get(Piece, piece_id)
    if piece is None:
        raise ApiError("Piece not found.", status=404)
    if piece.is_waived and not is_owner():
        # 410 rather than 404: whoever holds this link saw the piece while it
        # hung, so withholding its existence protects nothing.
        return jsonify(
            {"error": "This work is no longer exhibited.", "title": piece.title}
        ), 410
    return jsonify(piece_detail_to_dict(piece))


def _resolve_tags(session, names: list[str]) -> list[Tag]:
    """
    Get-or-create by slug.

    Two uploads introducing the same new tag at once race; the unique
    constraint on tags.slug is what makes that safe rather than lucky.
    """
    tags: list[Tag] = []
    for raw in names:
        name = (raw or "").strip().lower()
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


FOCAL_ZOOM_MIN = 100
FOCAL_ZOOM_MAX = 500


def _parse_focal(raw, field: str):
    """A focal coordinate: a whole percent from 0 to 100, or null for centre."""
    if raw is None or raw == "":
        return None
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise ApiError(
            "A focal point is a percentage.", details={field: str(raw)}
        )
    if not 0 <= value <= 100:
        raise ApiError(
            "A focal point is between 0 and 100.", details={field: str(raw)}
        )
    return value


def _parse_focal_zoom(raw):
    """
    How close the crop is, as a percent of the size at which the whole piece
    fits. 100 is all of it; 200 is twice as close. Null fills the frame.
    """
    if raw is None or raw == "":
        return None
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise ApiError(
            "A zoom is a percentage.", details={"focalZoom": str(raw)}
        )
    if not FOCAL_ZOOM_MIN <= value <= FOCAL_ZOOM_MAX:
        raise ApiError(
            f"A zoom is between {FOCAL_ZOOM_MIN} and {FOCAL_ZOOM_MAX}.",
            details={"focalZoom": str(raw)},
        )
    return value


YEAR_MIN, YEAR_MAX = 1900, 2100
TITLE_MAX, DESCRIPTION_MAX, MEDIUM_MAX = 255, 4000, 100


def _parse_position(raw):
    """A place in the gallery counting from 1, or None for the top."""
    if raw is None or raw.strip() == "":
        return None
    try:
        position = int(raw)
    except ValueError:
        raise ApiError("position must be a whole number.", details={"position": raw})
    if position < 1:
        raise ApiError("position counts from 1.", details={"position": raw})
    return position


def _hang_at(session, piece: Piece, position: int) -> None:
    """
    Put a new piece at a place in the gallery as it shows now; past the end
    is the end.

    Numbers the whole gallery, as a save on the curation page would, so the
    pieces waiting at the top keep their places and stop being unplaced.
    """
    others = session.scalars(
        select(Piece)
        .where(Piece.waived_at.is_(None), Piece.id != piece.id)
        .order_by(*GALLERY_ORDER)
    ).all()
    at = min(position, len(others) + 1) - 1
    for index, member in enumerate([*others[:at], piece, *others[at:]]):
        member.curated_order = index


def _parse_year(raw):
    """
    A year from a form string or a JSON number.

    Empty string and null both mean "no year", not "invalid".
    """
    if raw is None or raw == "":
        return None
    try:
        year = int(raw)
    except (TypeError, ValueError):
        raise ApiError("year must be a number.", details={"year": raw})
    if not YEAR_MIN <= year <= YEAR_MAX:
        raise ApiError(
            f"year must be between {YEAR_MIN} and {YEAR_MAX}.", details={"year": raw}
        )
    return year


def _parse_created_date(raw):
    if raw is None or raw == "":
        return None
    try:
        return date.fromisoformat(str(raw))
    except (TypeError, ValueError):
        raise ApiError(
            "createdDate must be YYYY-MM-DD.", details={"createdDate": raw}
        )


@bp.post("")
@require_owner
def create_piece():
    """
    Upload a piece.

    multipart/form-data: `image` plus title, description, medium, year,
    createdDate, position, and repeated `tags` and `collectionIds` fields.
    No position leaves the piece unplaced, at the top of the gallery.

    Files are written before the row is committed: orphaned bytes are
    sweepable, a row pointing at nothing is a broken image. The commit is the
    point of truth, and a failed commit takes the objects back out.
    """
    upload = request.files.get("image")
    if upload is None or not upload.filename:
        raise ApiError("An image file is required.", details={"image": "required"})

    title = bounded_text(request.form.get("title"), "title", TITLE_MAX)
    if not title:
        raise ApiError("A piece needs a title.", details={"title": "required"})

    raw = upload.read()
    if not raw:
        raise ApiError("The uploaded file is empty.")

    try:
        processed = process_upload(raw)
    except InvalidImage as exc:
        raise ApiError(str(exc), details={"image": "invalid"})

    year = _parse_year(request.form.get("year"))
    created = _parse_created_date(request.form.get("createdDate"))
    position = _parse_position(request.form.get("position"))

    # The id is generated here, before anything is written: every object key
    # derives from it, so it cannot wait for the INSERT to assign one.
    piece = Piece(
        id=uuid.uuid4(),
        title=title,
        description=bounded_text(request.form.get("description"), "description", DESCRIPTION_MAX)
        or None,
        original_ext=processed.original_ext,
        byte_size=processed.byte_size,
        medium=bounded_text(request.form.get("medium"), "medium", MEDIUM_MAX) or None,
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
        # Curation rides in the same transaction as the row, so an unknown id
        # fails the whole thing and the rollback below takes the objects with
        # it. (_join_collections is defined further down, resolved at call time.)
        _join_collections(session, piece, request.form.getlist("collectionIds"))
        if position is not None:
            _hang_at(session, piece, position)
        session.commit()
    except Exception:
        session.rollback()
        storage.delete_prefix(piece.storage_prefix)
        raise

    # After the commit and deliberately not fatal: without a pyramid the
    # detail view falls back to the display rendition, which is what every
    # piece uploaded before tiling does. Synchronous because there is no job
    # queue -- about 1.7s on a typical piece, 6.5s on the largest.
    try:
        write_tiles(storage, piece, raw)
        piece.tiles_ready = True
        session.commit()
    except Exception:
        session.rollback()
        current_app.logger.exception("tiling failed for piece %s", piece.id)
        # Half a pyramid is worse than none: the viewer would open on tiles
        # that stop partway through a zoom. The backfill can rebuild it.
        clear_tiles(storage, piece)

    return jsonify(piece_detail_to_dict(piece)), 201


@bp.patch("/<uuid:piece_id>")
@require_owner
def update_piece(piece_id):
    """
    Correct a piece's wall label.

    Only keys actually present in the body are touched, so a form that sends
    one field cannot blank the rest. Null or an empty string does clear an
    optional field -- that is an edit, not an omission. The image is not
    replaceable here.
    """
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError("Expected a JSON object body.")

    session = SessionLocal()
    piece = session.get(Piece, piece_id)
    if piece is None:
        raise ApiError("Piece not found.", status=404)

    if "title" in data:
        title = bounded_text(data.get("title"), "title", TITLE_MAX)
        if not title:
            raise ApiError("A piece needs a title.", details={"title": "required"})
        piece.title = title

    if "description" in data:
        piece.description = (
            bounded_text(data.get("description"), "description", DESCRIPTION_MAX) or None
        )

    if "medium" in data:
        piece.medium = bounded_text(data.get("medium"), "medium", MEDIUM_MAX) or None

    if "year" in data:
        piece.year = _parse_year(data["year"])

    if "createdDate" in data:
        piece.created_date = _parse_created_date(data["createdDate"])

    for key, attribute in (("focalX", "focal_x"), ("focalY", "focal_y")):
        if key in data:
            setattr(piece, attribute, _parse_focal(data[key], key))

    if "focalZoom" in data:
        piece.focal_zoom = _parse_focal_zoom(data["focalZoom"])

    if "tags" in data:
        if not isinstance(data["tags"], list):
            raise ApiError("tags must be an array.", details={"tags": "array"})
        # Replaces the whole set, so an omitted tag is a removed tag. Rows in
        # `tags` are left behind on purpose: they are shared, and another
        # piece may still be using one.
        piece.tags = _resolve_tags(session, data["tags"])

    session.commit()
    return jsonify(piece_detail_to_dict(piece))


@bp.delete("/<uuid:piece_id>")
@require_owner
def delete_piece(piece_id):
    session = SessionLocal()
    piece = session.get(Piece, piece_id)
    if piece is None:
        raise ApiError("Piece not found.", status=404)

    # The two-stage rule lives here rather than in the UI: a rule only the
    # frontend enforces is not a rule for anything else holding the token.
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

    Membership is dropped rather than filtered, which makes "a row in
    collection_pieces means the piece is exhibited" an invariant the schema
    keeps. Restore offers to re-curate because of it.
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
    # Same invariant, one step louder: a piece withdrawn from the gallery
    # cannot keep a spotlight slot or a place in the curated order. Restoring
    # takes back neither; the piece returns unplaced, at the top.
    piece.spotlight_order = None
    piece.curated_order = None
    piece.about_order = None
    piece.waived_at = _utcnow()
    session.commit()

    return jsonify(piece_detail_to_dict(piece))


def _append_to(collection: Collection, piece: Piece) -> None:
    """Put a piece at the end of a collection."""
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

    Body: {"collectionIds": [...]} -- absent or empty restores to the gallery
    alone. One transaction, so restore and membership both land or neither.
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

    A set rather than an append, so unchecking means what it looks like.
    Ids already present keep their position. Refused for a waived piece: a
    row in collection_pieces means the piece is exhibited.
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
