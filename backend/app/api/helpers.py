"""Shared request-parsing helpers for the API blueprints."""

import uuid

from ..errors import ApiError


def parse_uuid(value, field: str) -> uuid.UUID:
    """Turn a client-supplied id into a UUID, or refuse it by name."""
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        raise ApiError(f"{field} is not a valid id.", details={field: value})
