"""
Where the artist can be found.

Two routes, not five. The owner edits a list and saves it once, so the API
takes a list and writes it once -- the same call that sets membership on a
collection. Reordering comes free with it, and a half-finished edit cannot
half-apply.
"""

import re
from urllib.parse import urlparse

from flask import Blueprint, jsonify, request
from sqlalchemy import select

from ..auth import require_owner
from ..db import SessionLocal
from ..errors import ApiError
from ..models import Social
from ..schemas import social_to_dict

bp = Blueprint("socials", __name__, url_prefix="/socials")

MAX_SOCIALS = 20


def _clean_url(raw, index: int) -> str:
    """
    http and https only.

    A stored `javascript:` url would run on click. The owner is the only
    writer, so this is not a live threat -- it is a footgun that costs three
    lines to take out of the database. A bare domain is assumed to be https,
    which is what pasting one from a browser bar usually means.
    """
    url = (raw or "").strip()
    if not url:
        raise ApiError("A social needs a url.", details={f"socials[{index}]": "url"})

    # The scheme is judged before anything is prepended. Testing for "://"
    # instead would let `javascript:alert(1)` through: it has no "://", so it
    # would be rewritten to `https://javascript:alert(1)`, which parses as a
    # perfectly good https url with an odd host.
    scheme = re.match(r"^([a-zA-Z][a-zA-Z0-9+.\-]*):", url)
    if scheme:
        if scheme.group(1).lower() not in ("http", "https"):
            raise ApiError(
                "A social's url must be http or https.",
                details={f"socials[{index}]": url},
            )
    else:
        url = "https://" + url

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ApiError(
            "A social's url must be http or https.",
            details={f"socials[{index}]": url},
        )
    return url


def _required(value, field: str, index: int, limit: int) -> str:
    text = (value or "").strip()
    if not text:
        raise ApiError(f"A social needs a {field}.", details={f"socials[{index}]": field})
    if len(text) > limit:
        raise ApiError(
            f"That {field} is too long.", details={f"socials[{index}]": field}
        )
    return text


@bp.get("")
def list_socials():
    """Public. There is nothing here a visitor may not see."""
    session = SessionLocal()
    rows = session.scalars(
        select(Social).order_by(Social.display_order, Social.label)
    ).all()
    return jsonify([social_to_dict(s) for s in rows])


@bp.put("")
@require_owner
def replace_socials():
    """
    The whole list, in the order it should appear.

    Rows are matched by id so an existing link keeps its row rather than
    being deleted and recreated; anything absent from the body is gone. The
    position in the array is the order, which is why nothing sends
    displayOrder.
    """
    body = request.get_json(silent=True)
    if not isinstance(body, list):
        raise ApiError("Send a list of socials.", details={"socials": "list required"})
    if len(body) > MAX_SOCIALS:
        raise ApiError(
            f"That is more than {MAX_SOCIALS} socials.",
            details={"socials": str(len(body))},
        )

    session = SessionLocal()
    existing = {
        str(s.id): s for s in session.scalars(select(Social)).all()
    }
    kept: set[str] = set()

    for index, entry in enumerate(body):
        if not isinstance(entry, dict):
            raise ApiError("Each social must be an object.", details={f"socials[{index}]": "object"})

        platform = _required(entry.get("platform"), "platform", index, 40).lower()
        label = _required(entry.get("label"), "label", index, 80)
        url = _clean_url(entry.get("url"), index)

        row = existing.get(str(entry.get("id") or ""))
        if row is None:
            row = Social(platform=platform, label=label, url=url, display_order=index)
            session.add(row)
        else:
            row.platform, row.label, row.url = platform, label, url
            row.display_order = index
            kept.add(str(row.id))

    for social_id, row in existing.items():
        if social_id not in kept:
            session.delete(row)

    session.commit()
    return jsonify(
        [
            social_to_dict(s)
            for s in session.scalars(
                select(Social).order_by(Social.display_order, Social.label)
            ).all()
        ]
    )
