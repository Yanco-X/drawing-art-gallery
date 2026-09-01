"""
End-to-end exercise of the upload pipeline against in-memory SQLite and
MemoryStorage. Runs the real app, real Pillow processing, real routes.

    .venv/Scripts/python.exe tests/smoke_uploads.py
"""

import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["OWNER_API_TOKEN"] = "test-token"

from PIL import Image  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app import create_app  # noqa: E402
from app.config import Config  # noqa: E402
from app.db import Base, SessionLocal  # noqa: E402
from app.models import Piece  # noqa: E402
from app.storage import MemoryStorage  # noqa: E402

OWNER = {"X-Owner-Token": "test-token"}
checks = []


def check(label, condition, detail=""):
    checks.append((label, bool(condition), detail))
    print(f"  [{'PASS' if condition else 'FAIL'}] {label}" + (f" -- {detail}" if detail else ""))


def make_image(width, height, fmt="JPEG", exif=None):
    image = Image.new("RGB", (width, height), (120, 90, 60))
    buffer = io.BytesIO()
    if exif is not None:
        image.save(buffer, format=fmt, exif=exif)
    else:
        image.save(buffer, format=fmt)
    return buffer.getvalue()


class TestConfig(Config):
    OWNER_API_TOKEN = "test-token"
    DEBUG = False
    STORAGE_BACKEND = "memory"


storage = MemoryStorage()
app = create_app(
    TestConfig,
    database_url="sqlite+pysqlite:///:memory:",
    engine_options={
        "connect_args": {"check_same_thread": False},
        "poolclass": StaticPool,
    },
    storage=storage,
)

from app import db as db_module  # noqa: E402

Base.metadata.create_all(db_module.engine)
client = app.test_client()

print("\n== auth ==")
check(
    "upload without token is rejected",
    client.post("/api/pieces", data={}, content_type="multipart/form-data").status_code == 401,
)

print("\n== validation ==")
check(
    "missing file refused",
    client.post("/api/pieces", data={"title": "X"}, headers=OWNER,
                content_type="multipart/form-data").status_code == 400,
)
check(
    "missing title refused",
    client.post("/api/pieces", headers=OWNER, content_type="multipart/form-data",
                data={"image": (io.BytesIO(make_image(10, 10)), "a.jpg")}).status_code == 400,
)
notimage = client.post(
    "/api/pieces", headers=OWNER, content_type="multipart/form-data",
    data={"title": "X", "image": (io.BytesIO(b"this is not an image"), "evil.jpg")},
)
check("non-image with image extension refused", notimage.status_code == 400,
      notimage.get_json().get("error", ""))
check("nothing stored after a refused upload", len(storage.objects) == 0,
      f"{len(storage.objects)} objects")

print("\n== upload ==")
res = client.post(
    "/api/pieces", headers=OWNER, content_type="multipart/form-data",
    data={
        "title": "Night Calls XI",
        "description": "A study.",
        "medium": "Charcoal",
        "year": "2026",
        "createdDate": "2026-03-04",
        "tags": ["Charcoal", "Portrait"],
        "image": (io.BytesIO(make_image(3000, 2000)), "Night Calls XI.jpg"),
    },
)
check("upload returns 201", res.status_code == 201, str(res.status_code))
piece = res.get_json()
pid = piece["id"]
check("title round-trips", piece["title"] == "Night Calls XI")
check("dimensions measured from the file", piece["aspectRatio"] == 3000 / 2000,
      str(piece["aspectRatio"]))
check("medium and year stored", piece["medium"] == "Charcoal" and piece["year"] == 2026)
check("createdDate stored", piece["createdDate"] == "2026-03-04")
check("tags created and attached",
      sorted(t["slug"] for t in piece["tags"]) == ["charcoal", "portrait"],
      str([t["slug"] for t in piece["tags"]]))
check("imageUrl points at the display rendition",
      piece["imageUrl"] == f"/media/{pid}/display.webp", piece["imageUrl"])
check("thumbnailUrl points at the thumb", piece["thumbnailUrl"] == f"/media/{pid}/thumb.webp")
check("original is not exposed in the payload",
      not any("original" in str(v) for v in piece.values()))

print("\n== renditions ==")
keys = sorted(storage.objects)
check("three objects stored", len(keys) == 3, str(keys))
check("original kept in its uploaded format", f"{pid}/original.jpg" in storage.objects)
check("display is webp", storage.objects[f"{pid}/display.webp"][:4] == b"RIFF")
check("thumb is webp", storage.objects[f"{pid}/thumb.webp"][:4] == b"RIFF")

thumb = Image.open(io.BytesIO(storage.objects[f"{pid}/thumb.webp"]))
display = Image.open(io.BytesIO(storage.objects[f"{pid}/display.webp"]))
check("thumb capped at 600px long edge", max(thumb.size) == 600, str(thumb.size))
check("display capped at 1600px long edge", max(display.size) == 1600, str(display.size))
check("thumb is far smaller than the original",
      len(storage.objects[f"{pid}/thumb.webp"]) < len(storage.objects[f"{pid}/original.jpg"]),
      f"{len(storage.objects[f'{pid}/thumb.webp'])} vs "
      f"{len(storage.objects[f'{pid}/original.jpg'])} bytes")

print("\n== small images are not upscaled ==")
small = client.post(
    "/api/pieces", headers=OWNER, content_type="multipart/form-data",
    data={"title": "Tiny", "image": (io.BytesIO(make_image(120, 90, fmt="PNG")), "t.png")},
).get_json()
sid = small["id"]
check("png original keeps its extension", f"{sid}/original.png" in storage.objects)
check("thumb not upscaled past the source",
      max(Image.open(io.BytesIO(storage.objects[f"{sid}/thumb.webp"])).size) == 120)

print("\n== extension comes from the bytes, not the filename ==")
liar = client.post(
    "/api/pieces", headers=OWNER, content_type="multipart/form-data",
    data={"title": "Mislabelled", "image": (io.BytesIO(make_image(50, 50, fmt="JPEG")), "lies.png")},
).get_json()
check("jpeg named .png is stored as .jpg",
      f"{liar['id']}/original.jpg" in storage.objects,
      str([k for k in storage.objects if k.startswith(liar["id"])]))

print("\n== EXIF orientation ==")
# Orientation 6 means "rotate 90 degrees": a 400x200 file must report 200x400.
exif = Image.Exif()
exif[274] = 6
rotated = client.post(
    "/api/pieces", headers=OWNER, content_type="multipart/form-data",
    data={"title": "Rotated", "image": (io.BytesIO(make_image(400, 200, exif=exif)), "r.jpg")},
).get_json()
check("orientation applied before measuring", rotated["aspectRatio"] == 200 / 400,
      str(rotated["aspectRatio"]))

print("\n== metadata stripped ==")
stored_original = storage.objects[f"{rotated['id']}/original.jpg"]
derived = Image.open(io.BytesIO(storage.objects[f"{rotated['id']}/display.webp"]))
check("derivative carries no exif", not derived.getexif(), str(dict(derived.getexif())))
check("original archived byte-for-byte", stored_original[:2] == b"\xff\xd8")

print("\n== listing ==")
listed = client.get("/api/pieces").get_json()
check("all four pieces listed", len(listed) == 4, str(len(listed)))

print("\n== delete removes row and objects ==")
# Deletion is two-stage now: a piece has to be waived out of the gallery
# before it can be destroyed. See tests/smoke_waived.py for the rest.
check("delete is refused while exhibited",
      client.delete(f"/api/pieces/{pid}", headers=OWNER).status_code == 409)
check("waive accepted",
      client.post(f"/api/pieces/{pid}/waive", headers=OWNER).status_code == 200)
check("delete returns 204", client.delete(f"/api/pieces/{pid}", headers=OWNER).status_code == 204)
check("objects removed", not any(k.startswith(f"{pid}/") for k in storage.objects),
      str([k for k in storage.objects if k.startswith(f"{pid}/")]))
session = SessionLocal()
check("row removed", session.get(Piece, __import__("uuid").UUID(pid)) is None)
session.close()
check("other pieces untouched", len(client.get("/api/pieces").get_json()) == 3)
check("deleting an unknown piece 404s",
      client.delete(f"/api/pieces/{pid}", headers=OWNER).status_code == 404)

failed = [c for c in checks if not c[1]]
print(f"\n{len(checks) - len(failed)}/{len(checks)} checks passed")
if failed:
    for label, _, detail in failed:
        print(f"  FAILED: {label} {detail}")
    sys.exit(1)
