"""
Hand-written serializers.

Keys are camelCase so the payloads drop straight into the existing
TypeScript interfaces in frontend/src/types without a translation layer.

URLs are composed here, at read time, from the storage backend in play.
Nothing in the database records where a file can be reached from, which is
what lets local disk and object storage swap without touching the data.
"""

from flask import current_app

from .models import Collection, Piece, Tag


def _storage():
    return current_app.extensions["storage"]


def tag_to_dict(tag: Tag) -> dict:
    return {"id": str(tag.id), "name": tag.name, "slug": tag.slug}


def piece_to_dict(piece: Piece) -> dict:
    storage = _storage()
    return {
        "id": str(piece.id),
        "title": piece.title,
        "description": piece.description or "",
        # The original is deliberately absent: it is archival, often tens of
        # megabytes, and never belongs in a public payload.
        "imageUrl": storage.url_for(piece.key("display")),
        "thumbnailUrl": storage.url_for(piece.key("thumb")),
        "medium": piece.medium,
        "year": piece.year,
        "aspectRatio": piece.aspect_ratio,
        "createdDate": piece.created_date.isoformat() if piece.created_date else None,
        # Null for an exhibited piece. Drives which actions the owner is
        # offered, and is harmless to a visitor, who never sees a waived one.
        "waivedAt": piece.waived_at.isoformat() if piece.waived_at else None,
        "tags": [tag_to_dict(tag) for tag in piece.tags],
    }


def piece_detail_to_dict(piece: Piece) -> dict:
    """
    The single-piece shape: everything in the list plus the collections it
    appears in.

    Kept out of the list shape deliberately -- `collection_links` is lazily
    loaded, so composing this for every row would be a query per piece to
    render a block the grid does not show.
    """
    return {
        **piece_to_dict(piece),
        "collections": [
            {
                "id": str(link.collection.id),
                "name": link.collection.name,
                "slug": link.collection.slug,
            }
            for link in piece.collection_links
            if link.collection.is_public
        ],
    }


def collection_summary_to_dict(collection: Collection) -> dict:
    """Shape for the collections row: counts and a cover, but no pieces."""
    cover = collection.resolved_cover
    return {
        "id": str(collection.id),
        "name": collection.name,
        "slug": collection.slug,
        "description": collection.description or "",
        "pieceCount": collection.piece_count,
        "coverImageUrl": (
            _storage().url_for(cover.key("thumb")) if cover else None
        ),
        "isPublic": collection.is_public,
    }


def collection_to_dict(collection: Collection) -> dict:
    """Detail shape: the summary plus its pieces in curated order."""
    return {
        **collection_summary_to_dict(collection),
        "pieces": [piece_to_dict(link.piece) for link in collection.piece_links],
    }
