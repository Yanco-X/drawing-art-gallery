"""
Hand-written serializers.

Keys are camelCase so the payloads drop straight into the existing
TypeScript interfaces in frontend/src/types without a translation layer.
"""

from .models import Collection, Piece, Tag


def tag_to_dict(tag: Tag) -> dict:
    return {"id": str(tag.id), "name": tag.name, "slug": tag.slug}


def piece_to_dict(piece: Piece) -> dict:
    return {
        "id": str(piece.id),
        "title": piece.title,
        "description": piece.description or "",
        "imageUrl": piece.image_url,
        "medium": piece.medium,
        "year": piece.year,
        "aspectRatio": piece.aspect_ratio,
        "createdDate": piece.created_date.isoformat() if piece.created_date else None,
        "tags": [tag_to_dict(tag) for tag in piece.tags],
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
        "coverImageUrl": cover.image_url if cover else None,
        "isPublic": collection.is_public,
    }


def collection_to_dict(collection: Collection) -> dict:
    """Detail shape: the summary plus its pieces in curated order."""
    return {
        **collection_summary_to_dict(collection),
        "pieces": [piece_to_dict(link.piece) for link in collection.piece_links],
    }
