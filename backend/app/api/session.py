"""
The owner's session.

Named for the resource rather than for the act, so no shipped string says
login or auth -- context/AUTH.md section 5.
"""

from flask import Blueprint, current_app, jsonify, request
from flask_login import login_user, logout_user
from sqlalchemy import select
from werkzeug.security import check_password_hash

from ..auth import is_owner, require_owner
from ..db import SessionLocal
from ..errors import ApiError
from ..models import User

bp = Blueprint("session", __name__, url_prefix="/session")


def _attempts():
    return current_app.extensions["login_attempts"]


def _client() -> str | None:
    return request.remote_addr


@bp.post("")
def sign_in():
    """
    One password, one owner.

    Every failure answers the same 401. Distinguishing "no owner exists"
    from "wrong password" would tell a stranger which half to work on.
    """
    limiter = _attempts()
    client = _client()
    if limiter.is_blocked(client):
        raise ApiError("Too many attempts. Try again later.", status=429)

    password = (request.get_json(silent=True) or {}).get("password") or ""
    owner = SessionLocal().scalars(
        select(User).where(User.role == "owner")
    ).first()

    if owner is None or not check_password_hash(owner.password_hash, password):
        limiter.record_failure(client)
        raise ApiError("Those credentials were not accepted.", status=401)

    limiter.clear(client)
    # remember: closing the tab must not sign the owner out. The gallery is
    # edited from a phone, where signing in is a deliberate gesture rather
    # than something to repeat.
    login_user(owner, remember=True)
    return jsonify({"role": "owner"})


@bp.delete("")
@require_owner
def sign_out():
    logout_user()
    return jsonify({"role": "visitor"})


@bp.get("/me")
def whoami():
    return jsonify({"role": "owner" if is_owner() else "visitor"})
