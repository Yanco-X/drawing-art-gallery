"""Shared request-parsing helpers for the API blueprints."""

import uuid

from flask import current_app, request

from ..errors import ApiError


def parse_uuid(value, field: str) -> uuid.UUID:
    """Turn a client-supplied id into a UUID, or refuse it by name."""
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        raise ApiError(f"{field} is not a valid id.", details={field: value})


def bounded_text(value, field: str, limit: int) -> str:
    """A trimmed string no longer than the column that stores it."""
    text = str(value).strip() if value is not None else ""
    if len(text) > limit:
        raise ApiError(
            f"{field} must be at most {limit} characters.", details={field: "too long"}
        )
    return text


def client_ip() -> str | None:
    # X-Real-IP is the caller only behind Railway's edge, which overwrites
    # it. Anywhere Flask is reachable directly, a client can forge it.
    if current_app.config["TRUST_X_REAL_IP"]:
        return request.headers.get("X-Real-IP") or None
    return request.remote_addr
