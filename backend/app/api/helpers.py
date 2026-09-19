"""Shared request-parsing helpers for the API blueprints."""

import uuid

from flask import current_app, request
from sqlalchemy import select

from ..errors import ApiError


def parse_uuid(value, field: str) -> uuid.UUID:
    """Turn a client-supplied id into a UUID, or refuse it by name."""
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        raise ApiError(f"{field} is not a valid id.", details={field: value})


def ordered_ids(field: str, limit: int, too_many: str) -> list[uuid.UUID]:
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


def load_all(session, model, ids: list) -> dict:
    """The named rows by id, or 404 naming the ones that do not exist."""
    found = {
        row.id: row for row in session.scalars(select(model).where(model.id.in_(ids)))
    } if ids else {}
    missing = [str(row_id) for row_id in ids if row_id not in found]
    if missing:
        raise ApiError("Some do not exist.", status=404, details={"missing": missing})
    return found


def _storable(text: str) -> bool:
    # Postgres keeps neither a NUL nor half a surrogate pair. Left to the
    # commit, either is a 500 instead of the 400 below.
    try:
        text.encode("utf-8")
    except UnicodeEncodeError:
        return False
    return "\x00" not in text


def bounded_text(value, field: str, limit: int) -> str:
    """A trimmed string no longer than the column that stores it."""
    text = str(value).strip() if value is not None else ""
    if len(text) > limit:
        raise ApiError(
            f"{field} must be at most {limit} characters.", details={field: "too long"}
        )
    if not _storable(text):
        raise ApiError(
            f"{field} contains characters that cannot be stored.",
            details={field: "invalid characters"},
        )
    return text


def client_ip() -> str | None:
    # X-Real-IP is the caller only behind Railway's edge, which overwrites
    # it. Anywhere Flask is reachable directly, a client can forge it.
    if current_app.config["TRUST_X_REAL_IP"]:
        return request.headers.get("X-Real-IP") or None
    return request.remote_addr
