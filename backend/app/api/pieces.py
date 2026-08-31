import uuid
from datetime import date

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import select

from ..auth import require_owner
from ..db import SessionLocal
from ..errors import ApiError
from ..models import Piece, Tag
from ..schemas import piece_detail_to_dict, piece_to_dict
from ..services.images import InvalidImage, process_upload
from ..services.slugs import slugify

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

    prefix = piece.storage_prefix
    # Cascades clear collection membership and tag links. Collections that
    # used this piece as their cover fall back to their first member.
    session.delete(piece)
    session.commit()

    # Only once the row is gone: an orphaned object is recoverable, a row
    # pointing at deleted bytes is a broken image.
    current_app.extensions["storage"].delete_prefix(prefix)
    return "", 204
