import re
import unicodedata

from sqlalchemy import select
from sqlalchemy.orm import Session

_NON_WORD = re.compile(r"[^a-z0-9]+")


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii").lower()
    return _NON_WORD.sub("-", ascii_only).strip("-")


def unique_slug(session: Session, model, desired: str, exclude_id=None) -> str:
    """
    Resolve collisions with a numeric suffix.

    A slug is minted once, on create, and left alone when the name changes
    afterwards -- renaming a collection should not break a link someone
    already shared. Rename the slug explicitly if you want it moved.
    """
    base = slugify(desired) or "untitled"
    candidate = base
    suffix = 2
    while True:
        stmt = select(model.id).where(model.slug == candidate)
        if exclude_id is not None:
            stmt = stmt.where(model.id != exclude_id)
        if session.execute(stmt).first() is None:
            return candidate
        candidate = f"{base}-{suffix}"
        suffix += 1
