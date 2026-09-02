"""
End-to-end exercise of the upload pipeline against in-memory SQLite and
MemoryStorage. Runs the real app, real Pillow processing, real routes.

    .venv/Scripts/python.exe tests/smoke_uploads.py
"""

import io
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["OWNER_API_TOKEN"] = "test-token"

from PIL import Image  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app import create_app  # noqa: E402
from app.config import Config  # noqa: E402
from app.db import Base, SessionLocal  # noqa: E402
from app.models import Piece, Tag  # noqa: E402
from app.services.images import tile_level_count, tile_pyramid  # noqa: E402
from sqlalchemy import select  # noqa: E402
from app.storage import MemoryStorage  # noqa: E402

OWNER = {"X-Owner-Token": "test-token"}
checks = []


def check(label, condition, detail=""):
    checks.append((label, bool(condition), detail))
    print(f"  [{'PASS' if condition else 'FAIL'}] {label}" + (f" -- {detail}" if detail else ""))


def renditions_of(piece_id):
    """
    A piece's stored renditions, without its Deep Zoom pyramid.

    The tiles live under the same prefix and there are hundreds of them, so
    every assertion about "the three files" has to say which three it means.
    """
    return sorted(
        k
        for k in storage.objects
        if k.startswith(f"{piece_id}/") and "/tiles/" not in k
    )


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
keys = renditions_of(pid)
check("three renditions stored", len(keys) == 3, str(keys))
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

print("\n== editing a piece ==")
check("edit without a token is refused",
      client.patch(f"/api/pieces/{pid}", json={"title": "X"}).status_code == 401)
check("editing an unknown piece 404s",
      client.patch(f"/api/pieces/{uuid.uuid4()}", headers=OWNER,
                   json={"title": "X"}).status_code == 404)
check("a blank title is refused",
      client.patch(f"/api/pieces/{pid}", headers=OWNER,
                   json={"title": "   "}).status_code == 400)
check("a non-numeric year is refused",
      client.patch(f"/api/pieces/{pid}", headers=OWNER,
                   json={"year": "soon"}).status_code == 400)
check("a malformed date is refused",
      client.patch(f"/api/pieces/{pid}", headers=OWNER,
                   json={"createdDate": "04-03-2026"}).status_code == 400)

edited = client.patch(f"/api/pieces/{pid}", headers=OWNER,
                      json={"title": "Night Calls XI, corrected",
                            "medium": "Graphite", "year": 2025}).get_json()
check("title updated", edited["title"] == "Night Calls XI, corrected", edited["title"])
check("medium updated", edited["medium"] == "Graphite", str(edited["medium"]))
check("year updated", edited["year"] == 2025, str(edited["year"]))
check("fields left out of the body are untouched",
      edited["createdDate"] == "2026-03-04"
      and sorted(t["slug"] for t in edited["tags"]) == ["charcoal", "portrait"],
      f"{edited['createdDate']} {[t['slug'] for t in edited['tags']]}")

cleared = client.patch(f"/api/pieces/{pid}", headers=OWNER,
                       json={"year": None, "description": ""}).get_json()
check("null clears the year", cleared["year"] is None, str(cleared["year"]))
check("an empty string clears the description",
      cleared["description"] == "", repr(cleared["description"]))

retagged = client.patch(f"/api/pieces/{pid}", headers=OWNER,
                        json={"tags": ["Ink", "Study"]}).get_json()
check("tags replaced wholesale, not merged",
      sorted(t["slug"] for t in retagged["tags"]) == ["ink", "study"],
      str([t["slug"] for t in retagged["tags"]]))
session = SessionLocal()
check("dropped tags survive as rows, since other pieces may use them",
      {"charcoal", "portrait"} <= {t.slug for t in session.scalars(select(Tag)).all()})
session.close()
check("an empty array removes every tag",
      client.patch(f"/api/pieces/{pid}", headers=OWNER,
                   json={"tags": []}).get_json()["tags"] == [])
check("editing leaves the renditions alone",
      len(renditions_of(pid)) == 3, str(renditions_of(pid)))
# Stronger than it looks: correcting a title must not invalidate a pyramid
# that took seconds to build, so the tile count has to be stable across an
# edit as well.
tiles_before_edit = len([k for k in storage.objects if f"{pid}/tiles/" in k])
client.patch(f"/api/pieces/{pid}", headers=OWNER, json={"medium": "Ink wash"})
check("and leaves the pyramid alone",
      len([k for k in storage.objects if f"{pid}/tiles/" in k]) == tiles_before_edit,
      str(tiles_before_edit))

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
# Correcting a label has nothing to do with whether the work is on the wall,
# and the reserve is where it would be tidied up before going back.
check("a waived piece can still be corrected",
      client.patch(f"/api/pieces/{pid}", headers=OWNER,
                   json={"title": "Tidied in the reserve"}).status_code == 200)
check("delete returns 204", client.delete(f"/api/pieces/{pid}", headers=OWNER).status_code == 204)
check("objects removed", not any(k.startswith(f"{pid}/") for k in storage.objects),
      str([k for k in storage.objects if k.startswith(f"{pid}/")]))
session = SessionLocal()
check("row removed", session.get(Piece, __import__("uuid").UUID(pid)) is None)
session.close()
check("other pieces untouched", len(client.get("/api/pieces").get_json()) == 3)
check("deleting an unknown piece 404s",
      client.delete(f"/api/pieces/{pid}", headers=OWNER).status_code == 404)

print("\n== uploading into collections ==")
# Curation chosen at upload time is joined in the same transaction as the
# row, so the interesting cases are the failing ones: a refused id must
# leave behind neither a piece nor the objects already written for it.
target = client.post("/api/collections", headers=OWNER,
                     json={"name": "Upload Target"}).get_json()
draft = client.post("/api/collections", headers=OWNER,
                    json={"name": "Upload Draft", "isPublic": False}).get_json()


def upload(title, collection_ids=None):
    data = {"image": (io.BytesIO(make_image(40, 30)), "x.jpg"), "title": title}
    if collection_ids is not None:
        # A list value is sent as repeated fields, which is what getlist reads.
        data["collectionIds"] = collection_ids
    return client.post("/api/pieces", headers=OWNER, data=data,
                       content_type="multipart/form-data")


plain = upload("Uncollected")
check("upload without collectionIds still works", plain.status_code == 201,
      str(plain.status_code))
check("an uncollected upload reports no collections",
      plain.get_json()["collections"] == [], str(plain.get_json()["collections"]))

joined = upload("Collected", [target["id"], draft["id"]])
check("upload into collections returns 201", joined.status_code == 201,
      str(joined.status_code))
check("the response names both collections",
      sorted(c["id"] for c in joined.get_json()["collections"])
      == sorted([target["id"], draft["id"]]),
      str(joined.get_json()["collections"]))
# The draft is only in there because the uploader holds the owner token.
check("a private collection can be uploaded into",
      draft["id"] in [c["id"] for c in joined.get_json()["collections"]])
check("the collection counts the new piece",
      client.get(f"/api/collections/{target['slug']}",
                 headers=OWNER).get_json()["pieceCount"] == 1)

second = upload("Collected Later", [target["id"]])
members = client.get(f"/api/collections/{target['slug']}",
                     headers=OWNER).get_json()["pieces"]
check("a second upload lands at the end, not the front",
      [m["id"] for m in members]
      == [joined.get_json()["id"], second.get_json()["id"]],
      str([m["title"] for m in members]))

before_objects = len(storage.objects)
before_pieces = len(client.get("/api/pieces").get_json())
unknown = upload("Doomed", [str(uuid.uuid4())])
check("an unknown collection id is refused", unknown.status_code == 404,
      str(unknown.status_code))
check("the refused upload stored nothing", len(storage.objects) == before_objects,
      f"{before_objects} -> {len(storage.objects)}")
check("the refused upload created no piece",
      len(client.get("/api/pieces").get_json()) == before_pieces)
check("a malformed collection id is refused",
      upload("Doomed", ["not-a-uuid"]).status_code == 400)
check("the same collection twice is refused",
      upload("Doomed", [target["id"], target["id"]]).status_code == 400)
check("nothing was stored by any refused upload",
      len(storage.objects) == before_objects,
      f"{before_objects} -> {len(storage.objects)}")

print("\n== deep zoom tiles ==")
# Level maths first, with no image involved: the top level is the first
# power of two that covers the long edge, and everything below it halves.
check("a 1px image has one level", tile_level_count(1, 1) == 1,
      str(tile_level_count(1, 1)))
check("256 tops out at level 8", tile_level_count(256, 256) == 9,
      str(tile_level_count(256, 256)))
check("2609 tops out at level 12", tile_level_count(2609, 2609) == 13,
      str(tile_level_count(2609, 2609)))
check("the long edge decides", tile_level_count(100, 4999) == 14,
      str(tile_level_count(100, 4999)))

# 600x400: top level 10 (1024 covers 600), so 11 levels. At the top the
# image is 600x400, which is 3 columns and 2 rows of 254px tiles.
pyramid = list(tile_pyramid(make_image(600, 400)))
top_level = tile_level_count(600, 400) - 1
check("every level is present",
      sorted({level for level, _, _, _ in pyramid}) == list(range(top_level + 1)),
      str(sorted({level for level, _, _, _ in pyramid})))
top_tiles = [(c, r) for level, c, r, _ in pyramid if level == top_level]
check("the top level is a 3x2 grid", sorted(top_tiles)
      == [(0, 0), (0, 1), (1, 0), (1, 1), (2, 0), (2, 1)], str(sorted(top_tiles)))
check("the bottom level is a single tile",
      len([1 for level, _, _, _ in pyramid if level == 0]) == 1)
check("every tile is webp",
      all(data[:4] == b"RIFF" for _, _, _, data in pyramid))
# 254 plus one pixel of overlap on each interior edge.
corner = next(d for lv, c, r, d in pyramid if (lv, c, r) == (top_level, 0, 0))
middle = next(d for lv, c, r, d in pyramid if (lv, c, r) == (top_level, 1, 0))
check("an edge tile carries overlap on its inner sides only",
      Image.open(io.BytesIO(corner)).size == (255, 255),
      str(Image.open(io.BytesIO(corner)).size))
check("an interior tile carries overlap on both sides",
      Image.open(io.BytesIO(middle)).size == (256, 255),
      str(Image.open(io.BytesIO(middle)).size))

print("\n== tiles through the upload route ==")
tiled = client.post("/api/pieces", headers=OWNER, data={
    "image": (io.BytesIO(make_image(700, 500)), "tiled.jpg"),
    "title": "Tiled",
}, content_type="multipart/form-data").get_json()
tid = tiled["id"]
check("the piece reports a tile source", tiled["tileSource"] is not None)
check("dimensions are exposed for the detail view",
      tiled["width"] == 700 and tiled["height"] == 500,
      f"{tiled['width']}x{tiled['height']}")
source = tiled["tileSource"]
check("the tile source carries the original dimensions",
      source["width"] == 700 and source["height"] == 500)
check("tile size and overlap are declared",
      source["tileSize"] == 254 and source["overlap"] == 1, str(source))
check("maxLevel matches the level count",
      source["maxLevel"] == tile_level_count(700, 500) - 1, str(source["maxLevel"]))
check("the base points at the piece's tile prefix",
      source["base"] == f"/media/{tid}/tiles", source["base"])

stored_tiles = [k for k in storage.objects if k.startswith(f"{tid}/tiles/")]
check("tiles were written to storage", len(stored_tiles) > 0, str(len(stored_tiles)))
check("the pyramid is complete",
      len(stored_tiles) == len(list(tile_pyramid(make_image(700, 500)))),
      str(len(stored_tiles)))
# The key the frontend will build from `base`, spelled out here so a change
# to either side breaks a test rather than the viewer.
check("a tile sits at base/<level>/<column>_<row>.webp",
      f"{tid}/tiles/{source['maxLevel']}/0_0.webp" in storage.objects)
check("the renditions are still there beside the pyramid",
      all(f"{tid}/{name}" in storage.objects
          for name in ("display.webp", "thumb.webp", "original.jpg")))

print("\n== a piece without tiles still works ==")
session = SessionLocal()
untiled = session.get(Piece, uuid.UUID(tid))
untiled.tiles_ready = False
session.commit()
session.close()
fallback = client.get(f"/api/pieces/{tid}").get_json()
check("tileSource is null when the pyramid is not ready",
      fallback["tileSource"] is None, str(fallback["tileSource"]))
check("and the display rendition is still offered",
      fallback["imageUrl"] == f"/media/{tid}/display.webp")

print("\n== deleting a piece takes its pyramid ==")
check("waived", client.post(f"/api/pieces/{tid}/waive", headers=OWNER).status_code == 200)
check("deleted", client.delete(f"/api/pieces/{tid}", headers=OWNER).status_code == 204)
check("no tiles left behind",
      not any(k.startswith(f"{tid}/") for k in storage.objects),
      str([k for k in storage.objects if k.startswith(f"{tid}/")][:3]))

failed = [c for c in checks if not c[1]]
print(f"\n{len(checks) - len(failed)}/{len(checks)} checks passed")
if failed:
    for label, _, detail in failed:
        print(f"  FAILED: {label} {detail}")
    sys.exit(1)
