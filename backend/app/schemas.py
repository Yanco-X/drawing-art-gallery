"""
Hand-written serializers.

Keys are camelCase so the payloads drop straight into the existing
TypeScript interfaces in frontend/src/types without a translation layer.

URLs are composed here, at read time, from the storage backend in play.
Nothing in the database records where a file can be reached from, which is
what lets local disk and object storage swap without touching the data.
"""

from flask import current_app

from .auth import is_owner
from .models import Collection, Piece, Tag
from .services.images import TILE_OVERLAP, TILE_SIZE, tile_level_count


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
        # The detail view quotes these to the visitor -- "2609 x 2609" is a
        # more honest invitation to open it than any button styling.
        "width": piece.width,
        "height": piece.height,
        "aspectRatio": piece.aspect_ratio,
        "createdDate": piece.created_date.isoformat() if piece.created_date else None,
        # When the piece was uploaded, as distinct from when it was drawn.
        # The gallery's sort offers both, and the list order alone cannot
        # stand in for this one: a collection arrives in curated order, so
        # its array position says nothing about when anything arrived.
        "createdAt": piece.created_at.isoformat() if piece.created_at else None,
        # Null for an exhibited piece. Drives which actions the owner is
        # offered, and is harmless to a visitor, who never sees a waived one.
        "waivedAt": piece.waived_at.isoformat() if piece.waived_at else None,
        # The slot the owner gave this piece in the spotlight, or null. Sent
        # to everyone: it costs one integer and saves the landing page a
        # second request, since the band can then work out its own five from
        # the list it already has.
        "spotlightOrder": piece.spotlight_order,
        # Where a crop should be aimed, in percent. Null is centre, which is
        # what the browser does unasked -- so the pair is only ever set on a
        # piece the owner has actually placed.
        "focalX": piece.focal_x,
        "focalY": piece.focal_y,
        "focalZoom": piece.focal_zoom,
        "tags": [tag_to_dict(tag) for tag in piece.tags],
    }


def _tile_source(piece: Piece) -> dict | None:
    """
    What OpenSeadragon needs to address the pyramid, or null if there is none.

    No `.dzi` descriptor is written. The format's descriptor carries exactly
    the numbers already on the row -- dimensions, tile size, overlap -- so
    storing one would be a second copy of the truth, plus a fetch before the
    first tile could be requested.

    Null means the viewer falls back to the display rendition: a piece
    uploaded before tiling existed, or one whose pyramid failed to build.
    """
    if not piece.tiles_ready or not piece.width or not piece.height:
        return None
    return {
        # A base rather than a URL template: every backend composes public
        # URLs by joining a prefix, so this stays one string join and the
        # caller appends "/<level>/<column>_<row>.webp".
        "base": _storage().url_for(piece.tile_prefix),
        "width": piece.width,
        "height": piece.height,
        "tileSize": TILE_SIZE,
        "overlap": TILE_OVERLAP,
        "maxLevel": tile_level_count(piece.width, piece.height) - 1,
    }


def piece_detail_to_dict(piece: Piece) -> dict:
    """
    The single-piece shape: everything in the list, plus the collections it
    appears in and the tile source the detail view zooms into.

    Kept out of the list shape deliberately -- `collection_links` is lazily
    loaded, so composing this for every row would be a query per piece to
    render a block the grid does not show.
    """
    # A private collection is a draft. The owner needs to see that a piece
    # already sits in one; a visitor is not told the draft exists at all.
    owner = is_owner()
    return {
        **piece_to_dict(piece),
        "tileSource": _tile_source(piece),
        "collections": [
            {
                "id": str(link.collection.id),
                "name": link.collection.name,
                "slug": link.collection.slug,
            }
            for link in piece.collection_links
            if link.collection.is_public or owner
        ],
    }


def collection_summary_to_dict(collection: Collection) -> dict:
    """
    Shape for the collections row: counts, a cover, and who is in it.

    `pieceIds` and not the pieces themselves. It is membership, not
    content -- enough for a caller holding the piece list to work out
    which collections a piece belongs to without asking again, which is
    what lets the spotlight name them without a request of its own.

    Free to send: `piece_links` is `lazy="selectin"` and the list route
    eager-loads it besides, so these ids are already in memory -- the same
    rows `piece_count` is the length of.

    Membership stays as private as the collection: a draft is filtered out
    of this route entirely for a visitor, so its ids never reach one.
    """
    cover = collection.resolved_cover
    return {
        "id": str(collection.id),
        "name": collection.name,
        "slug": collection.slug,
        "description": collection.description or "",
        "pieceCount": collection.piece_count,
        "pieceIds": [str(link.piece_id) for link in collection.piece_links],
        "coverImageUrl": (
            _storage().url_for(cover.key("thumb")) if cover else None
        ),
        # The chosen cover, not the resolved one. Null means nothing was
        # chosen and coverImageUrl is showing the first member instead --
        # a distinction the arrange UI has to render, and which
        # resolved_cover.id would flatten into a choice that was never made.
        "coverPieceId": (
            str(collection.cover_piece_id) if collection.cover_piece_id else None
        ),
        "isPublic": collection.is_public,
    }


def collection_to_dict(collection: Collection) -> dict:
    """Detail shape: the summary plus its pieces in curated order."""
    return {
        **collection_summary_to_dict(collection),
        "pieces": [piece_to_dict(link.piece) for link in collection.piece_links],
    }


def social_to_dict(social) -> dict:
    """
    The menu's shape. `displayOrder` is not sent: the array order is the
    order, and returning both would invite a caller to disagree with itself.
    """
    return {
        "id": str(social.id),
        "platform": social.platform,
        "label": social.label,
        "url": social.url,
    }

