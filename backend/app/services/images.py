"""
Turning an uploaded file into stored renditions.

Pure image work -- no database, no Flask. Everything here is deterministic
given bytes in, which keeps it testable on its own.
"""

import io
from dataclasses import dataclass

from PIL import Image, ImageOps

# Long-edge caps. The masonry renders thumbnails around 300px wide, so 600
# covers retina without shipping the original; display covers the piece page.
THUMB_MAX_EDGE = 600
DISPLAY_MAX_EDGE = 1600
WEBP_QUALITY = 82

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
