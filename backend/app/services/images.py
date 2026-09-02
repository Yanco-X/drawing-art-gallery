"""
Turning an uploaded file into stored renditions.

Pure image work -- no database, no Flask. Everything here is deterministic
given bytes in, which keeps it testable on its own.
"""

import io
import math
from collections.abc import Iterator
from dataclasses import dataclass

from PIL import Image, ImageOps

# Long-edge caps. The masonry renders thumbnails around 300px wide, so 600
# covers retina without shipping the original; display covers the piece page.
THUMB_MAX_EDGE = 600
DISPLAY_MAX_EDGE = 1600
WEBP_QUALITY = 82

# Deep Zoom. 254 with a 1px overlap makes a 256px tile, which is the format's
# convention: the overlap gives the viewer a pixel of bleed on each side so
# seams do not show between adjacent tiles while it interpolates.
TILE_SIZE = 254
TILE_OVERLAP = 1
# method=4 rather than the 6 used for the renditions. Six is worth it for two
# images per upload; across the ~550 tiles a 25-megapixel piece produces it
# roughly doubles the wait for a few percent of size.
TILE_METHOD = 4

# Extensions we are willing to store an original as. The check that actually
# matters is whether Pillow can decode it -- this only normalises the suffix.
ALLOWED_FORMATS = {
    "JPEG": "jpg",
    "PNG": "png",
    "WEBP": "webp",
    "GIF": "gif",
    "TIFF": "tiff",
    "BMP": "bmp",
}

CONTENT_TYPES = {
    "jpg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "gif": "image/gif",
    "tiff": "image/tiff",
    "bmp": "image/bmp",
}


class InvalidImage(Exception):
    pass


@dataclass
class Rendition:
    variant: str
    data: bytes
    content_type: str


@dataclass
class ProcessedImage:
    width: int
    height: int
    original_ext: str
    byte_size: int
    renditions: list[Rendition]


def _resize(image: Image.Image, max_edge: int) -> Image.Image:
    if max(image.size) <= max_edge:
        return image.copy()
    resized = image.copy()
    resized.thumbnail((max_edge, max_edge), Image.LANCZOS)
    return resized


def _to_webp(image: Image.Image) -> bytes:
    # WebP has no CMYK mode, and P/LA carry palettes that convert poorly.
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "A" in image.mode else "RGB")
    buffer = io.BytesIO()
    image.save(buffer, format="WEBP", quality=WEBP_QUALITY, method=6)
    return buffer.getvalue()


def process_upload(raw: bytes) -> ProcessedImage:
    """
    Validate, normalise, measure, and derive.

    The format is decided by decoding the bytes, never by the filename or
    the client's Content-Type -- both are attacker-controlled.
    """
    try:
        probe = Image.open(io.BytesIO(raw))
        probe.verify()
    except Exception as exc:
        raise InvalidImage("That file is not a readable image.") from exc

    image = Image.open(io.BytesIO(raw))
    fmt = (image.format or "").upper()
    if fmt not in ALLOWED_FORMATS:
        raise InvalidImage(f"Unsupported image format: {fmt or 'unknown'}.")
    original_ext = ALLOWED_FORMATS[fmt]

    # Apply the EXIF orientation flag and drop the rest of the metadata.
    # Phone photos are otherwise sideways, and EXIF often carries GPS
    # coordinates that should not follow a public image around.
    image = ImageOps.exif_transpose(image)

    width, height = image.size
    if width < 1 or height < 1:
        raise InvalidImage("Image has no dimensions.")

    return ProcessedImage(
        width=width,
        height=height,
        original_ext=original_ext,
        byte_size=len(raw),
        renditions=[
            Rendition("original", raw, CONTENT_TYPES[original_ext]),
            Rendition("display", _to_webp(_resize(image, DISPLAY_MAX_EDGE)), "image/webp"),
            Rendition("thumb", _to_webp(_resize(image, THUMB_MAX_EDGE)), "image/webp"),
        ],
    )


def tile_level_count(width: int, height: int) -> int:
    """
    How many Deep Zoom levels an image of this size has.

    Levels are successive halvings, from a single pixel at level 0 up to the
    full image at the top. The top level is the first power of two that
    covers the long edge, so a 2609px piece tops out at level 12 (4096) and
    has 13 levels in all.
    """
    return math.ceil(math.log2(max(width, height, 1))) + 1


def tile_pyramid(raw: bytes) -> Iterator[tuple[int, int, int, bytes]]:
    """
    Every tile of a Deep Zoom pyramid, as (level, column, row, webp bytes).

    A generator rather than a list: a large piece produces several hundred
    tiles, and the caller writes each one to storage as it arrives instead of
    holding the whole pyramid in memory.

    Each level is resampled from the full-resolution source rather than from
    the level above it. Halving repeatedly would compound the resampling
    error down the pyramid, and these are pencil drawings -- the fine
    graphite texture is the entire reason for zooming in.

    Only called with bytes that have already been through `process_upload`,
    so the format is known good and the checks are not repeated here.
    """
    source = ImageOps.exif_transpose(Image.open(io.BytesIO(raw)))
    if source.mode not in ("RGB", "RGBA"):
        source = source.convert("RGBA" if "A" in source.mode else "RGB")

    width, height = source.size
    top = tile_level_count(width, height) - 1

    for level in range(top + 1):
        scale = 2 ** (top - level)
        level_width = max(1, -(-width // scale))
        level_height = max(1, -(-height // scale))
        image = (
            source
            if scale == 1
            else source.resize((level_width, level_height), Image.LANCZOS)
        )

        for row in range(-(-level_height // TILE_SIZE)):
            for column in range(-(-level_width // TILE_SIZE)):
                # The overlap extends the tile outwards, except at the edges
                # of the level, where there is nothing to bleed into.
                box = (
                    max(0, column * TILE_SIZE - TILE_OVERLAP),
                    max(0, row * TILE_SIZE - TILE_OVERLAP),
                    min(level_width, (column + 1) * TILE_SIZE + TILE_OVERLAP),
                    min(level_height, (row + 1) * TILE_SIZE + TILE_OVERLAP),
                )
                buffer = io.BytesIO()
                image.crop(box).save(
                    buffer,
                    format="WEBP",
                    quality=WEBP_QUALITY,
                    method=TILE_METHOD,
                )
                yield level, column, row, buffer.getvalue()
