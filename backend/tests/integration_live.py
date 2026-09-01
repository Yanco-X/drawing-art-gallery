"""
Live integration: real PostgreSQL, real MinIO, real artwork files.

    .venv/Scripts/python.exe tests/integration_live.py
"""

import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import func, select  # noqa: E402

from app import create_app  # noqa: E402
from app.config import Config  # noqa: E402
from app.db import SessionLocal  # noqa: E402
from app.models import Piece  # noqa: E402

# This runs against the development database, which now holds real artwork.
# The fixture is identified by title so teardown can be exact. An earlier
# version cleared every row to make the run repeatable, and quietly
# destroyed an import the first time the database held anything worth
# keeping: a test may only remove what it created.
FIXTURE_TITLE = "__integration_fixture__"

UPLOADS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
OWNER = {"X-Owner-Token": os.environ["OWNER_API_TOKEN"]}
checks = []


def check(label, condition, detail=""):
    checks.append((label, bool(condition), detail))
    print(f"  [{'PASS' if condition else 'FAIL'}] {label}" + (f" -- {detail}" if detail else ""))


class S3Config(Config):
    STORAGE_BACKEND = "s3"


app = create_app(S3Config)
client = app.test_client()

print("\n== live services ==")
health = client.get("/api/health").get_json()
check("app healthy against postgres + minio", health["status"] == "ok", str(health))

# Remove only leftovers from a previous run that died before its teardown.
# Everything else in the database is left alone.
session = SessionLocal()
before = session.scalar(select(func.count()).select_from(Piece))
leftovers = session.scalars(select(Piece).where(Piece.title == FIXTURE_TITLE)).all()
session.close()
for stale in leftovers:
    # Delete now refuses an exhibited piece, so clear the way first. A
    # leftover that is already waived 409s here, harmlessly.
    client.post(f"/api/pieces/{stale.id}/waive", headers=OWNER)
    client.delete(f"/api/pieces/{stale.id}", headers=OWNER)
if leftovers:
    print(f"  cleared {len(leftovers)} leftover fixture piece(s)")
survivors = before - len(leftovers)
print(f"  {survivors} existing piece(s) in the database, left untouched")

print("\n== upload real artwork ==")
source = os.path.join(UPLOADS, "1000013215.jpg")
original_size = os.path.getsize(source)
with open(source, "rb") as handle:
    res = client.post(
        "/api/pieces", headers=OWNER, content_type="multipart/form-data",
        data={
            "title": FIXTURE_TITLE,
            "medium": "Mixed media",
            "year": "2026",
            "tags": ["Charcoal"],
            "image": (handle, "1000013215.jpg"),
        },
    )
check("upload accepted", res.status_code == 201, str(res.status_code))
piece = res.get_json()
pid = piece["id"]
check("dimensions read from the real file", piece["aspectRatio"] == 4999 / 5001,
      str(piece["aspectRatio"]))

print("\n== row landed in postgres ==")
session = SessionLocal()
row = session.get(Piece, __import__("uuid").UUID(pid))
check("row present", row is not None)
check("width/height persisted", (row.width, row.height) == (4999, 5001), f"{row.width}x{row.height}")
check("original_ext persisted", row.original_ext == "jpg", row.original_ext)
check("byte_size recorded", row.byte_size == original_size, f"{row.byte_size} vs {original_size}")
session.close()

print("\n== objects landed in minio ==")
storage = app.extensions["storage"]
check("thumb in public bucket", storage.exists(f"{pid}/thumb.webp"))
check("display in public bucket", storage.exists(f"{pid}/display.webp"))
check("original in private bucket", storage.exists(f"{pid}/original.jpg"))
check("buckets are actually different",
      storage._bucket_for(f"{pid}/original.jpg") != storage._bucket_for(f"{pid}/thumb.webp"),
      f"{storage._bucket_for(f'{pid}/original.jpg')} vs {storage._bucket_for(f'{pid}/thumb.webp')}")

print("\n== public URL works without credentials ==")
thumb_url = piece["thumbnailUrl"]
check("thumbnailUrl is an absolute minio URL", thumb_url.startswith("http://localhost:9000/"), thumb_url)
with urllib.request.urlopen(thumb_url) as response:
    thumb_bytes = response.read()
    content_type = response.headers.get("Content-Type")
check("anonymous GET succeeds", len(thumb_bytes) > 0, f"{len(thumb_bytes)} bytes")
check("content-type set correctly", content_type == "image/webp", str(content_type))
check("thumb is webp", thumb_bytes[:4] == b"RIFF")

print("\n== the 30MB problem ==")
saving = 100 - (len(thumb_bytes) / original_size * 100)
check("thumb is a fraction of the original", len(thumb_bytes) < original_size / 50,
      f"{original_size/1048576:.2f} MB -> {len(thumb_bytes)/1024:.0f} KB ({saving:.1f}% smaller)")

print("\n== original is NOT publicly readable ==")
raw_original_url = f"{storage.public_base_url}/{pid}/original.jpg"
try:
    urllib.request.urlopen(raw_original_url)
    check("anonymous GET of original is refused", False, "it was served!")
except urllib.error.HTTPError as exc:
    check("anonymous GET of original is refused", exc.code in (403, 404), f"HTTP {exc.code}")
presigned = storage.presigned_url(f"{pid}/original.jpg")
with urllib.request.urlopen(presigned) as response:
    check("presigned URL retrieves it", len(response.read()) == original_size)

print("\n== delete requires waiving first ==")
check("delete is refused while exhibited",
      client.delete(f"/api/pieces/{pid}", headers=OWNER).status_code == 409)
check("waive accepted",
      client.post(f"/api/pieces/{pid}/waive", headers=OWNER).status_code == 200)
check("waived piece leaves the gallery",
      pid not in [p["id"] for p in client.get("/api/pieces").get_json()])
check("and appears in the reserve",
      pid in [p["id"] for p in
              client.get("/api/pieces?waived=true", headers=OWNER).get_json()])
check("objects survive waiving", storage.exists(f"{pid}/thumb.webp"))

print("\n== delete clears both stores ==")
check("delete returns 204", client.delete(f"/api/pieces/{pid}", headers=OWNER).status_code == 204)
check("public objects gone", not storage.exists(f"{pid}/thumb.webp"))
check("private original gone", not storage.exists(f"{pid}/original.jpg"))
session = SessionLocal()
check("row gone", session.get(Piece, __import__("uuid").UUID(pid)) is None)
session.close()

session = SessionLocal()
after = session.scalar(select(func.count()).select_from(Piece))
session.close()
check("the rest of the gallery is untouched", after == survivors,
      f"{after} rows, expected {survivors}")

failed = [c for c in checks if not c[1]]
print(f"\n{len(checks) - len(failed)}/{len(checks)} checks passed")
if failed:
    for label, _, detail in failed:
        print(f"  FAILED: {label} {detail}")
    sys.exit(1)
