"""Shared request-parsing helpers for the API blueprints."""

import ipaddress
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


def json_object(optional: bool = False) -> dict:
    """The request's JSON body, which must be an object; {} when optional and absent."""
    data = request.get_json(silent=True)
    if data is None and optional:
        return {}
    if not isinstance(data, dict):
        raise ApiError("Expected a JSON object body.")
    return data


def flag(data: dict, field: str) -> bool:
    """A JSON boolean. bool() would read the string "false" as true."""
    value = data[field]
    if not isinstance(value, bool):
        raise ApiError(f"{field} must be true or false.", details={field: str(value)})
    return value


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


FOCAL_ZOOM_MIN = 100


def parse_focal(raw, field: str):
    """A focal coordinate: a whole percent from 0 to 100, or null for centre."""
    if raw is None or raw == "":
        return None
    try:
        value = int(raw)
    # OverflowError: JSON's 1e400 arrives as infinity.
    except (TypeError, ValueError, OverflowError):
        raise ApiError(
            "A focal point is a percentage.", details={field: str(raw)}
        )
    if not 0 <= value <= 100:
        raise ApiError(
            "A focal point is between 0 and 100.", details={field: str(raw)}
        )
    return value


def parse_focal_zoom(raw, field: str, most: int):
    """
    How close a crop is, as a percent of the size at which the whole piece
    fits. 100 is all of it; 200 is twice as close. Null fills the frame.
    """
    if raw is None or raw == "":
        return None
    try:
        value = int(raw)
    except (TypeError, ValueError, OverflowError):
        raise ApiError("A zoom is a percentage.", details={field: str(raw)})
    if not FOCAL_ZOOM_MIN <= value <= most:
        raise ApiError(
            f"A zoom is between {FOCAL_ZOOM_MIN} and {most}.",
            details={field: str(raw)},
        )
    return value


def client_ip() -> str | None:
    # X-Real-IP is the caller only behind Railway's edge, which overwrites
    # it. Anywhere Flask is reachable directly, a client can forge it.
    if current_app.config["TRUST_X_REAL_IP"]:
        # No usable header means the request did not come through the edge,
        # so the socket is the caller. Treating it as unattributable would
        # leave it uncounted: unlimited guesses at the password.
        forwarded = _client_key(request.headers.get("X-Real-IP"))
        if forwarded and _is_address(forwarded):
            return forwarded
    return _client_key(request.remote_addr)


def _is_address(key: str) -> bool:
    try:
        ipaddress.ip_network(key, strict=False)
    except ValueError:
        return False
    return True


def _client_key(address: str | None) -> str | None:
    # One IPv6 host is handed a whole /64; keyed per address, it would step
    # around every per-client limit by rotating through it.
    try:
        ip = ipaddress.ip_address(address)
    except ValueError:
        return address or None
    if ip.version == 6 and ip.ipv4_mapped is None:
        return str(ipaddress.ip_network(f"{ip}/64", strict=False))
    return address
