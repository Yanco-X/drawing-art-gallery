import hmac
import uuid
from functools import wraps

from flask import current_app, request
from flask_login import LoginManager, current_user

from .db import SessionLocal
from .errors import ApiError
from .models import User

login_manager = LoginManager()


def init_auth(app) -> None:
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id: str):
        try:
            return SessionLocal().get(User, uuid.UUID(user_id))
        except (ValueError, AttributeError, TypeError):
            return None


def _token_matches() -> bool:
    """
    The development and test credential.

    Kept so the smoke suites exercise owner endpoints without driving a
    login. It must be unset in production, where the session is the only way
    in -- context/AUTH.md section 7.
    """
    expected = current_app.config.get("OWNER_API_TOKEN") or ""
    if not expected:
        return False
    return hmac.compare_digest(request.headers.get("X-Owner-Token", ""), expected)


def is_owner() -> bool:
    """
    Whether this request carries owner credentials.

    Read paths need to ask rather than be told: a waived piece resolves for
    the owner and answers 410 for everyone else, which is a branch, not a
    refusal.
    """
    if current_user.is_authenticated and current_user.role == "owner":
        return True
    return _token_matches()


def require_owner(view):
    """
    Guard for owner-only endpoints.

    The single place identity is enforced. Nothing else in the backend knows
    how it is established, which is what made replacing the shared secret
    with a session a change to this file alone.
    """

    @wraps(view)
    def wrapper(*args, **kwargs):
        if not is_owner():
            raise ApiError("Owner credentials required.", status=401)
        return view(*args, **kwargs)

    return wrapper
