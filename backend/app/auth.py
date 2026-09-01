import hmac
from functools import wraps

from flask import current_app, request

from .errors import ApiError


def is_owner() -> bool:
    """
    Whether this request carries owner credentials.

    Read paths need to ask rather than be told: a waived piece resolves for
    the owner and 404s for everyone else, which is a branch, not a refusal.
    Returns False when no token is configured, so an unconfigured deployment
    shows only what a visitor would see.
    """
    expected = current_app.config.get("OWNER_API_TOKEN") or ""
    if not expected:
        return False
    return hmac.compare_digest(request.headers.get("X-Owner-Token", ""), expected)


def require_owner(view):
    """
    Placeholder guard for owner-only endpoints.

    Real auth (Flask-Login or JWT) is not built yet, so mutations are gated
    on a shared secret sent as X-Owner-Token. It fails closed: with no token
    configured the endpoint refuses rather than waving everyone through,
    because the alternative is an unauthenticated write API.

    Replace this decorator wholesale when sessions land -- nothing else
    depends on how it works.
    """

    @wraps(view)
    def wrapper(*args, **kwargs):
        expected = current_app.config.get("OWNER_API_TOKEN") or ""
        if not expected:
            raise ApiError(
                "Owner endpoints are disabled: set OWNER_API_TOKEN in the "
                "environment to enable them.",
                status=503,
            )
        if not is_owner():
            raise ApiError("Owner credentials required.", status=401)
        return view(*args, **kwargs)

    return wrapper
