"""
The sketchbook against in-memory SQLite: the split between the gallery and
the sketchbook, moving a piece between them, and what each refuses. Plain
asserts, as the other smoke files.

    .venv/Scripts/python.exe tests/smoke_sketchbook.py
"""

import io
import os
import sys
import uuid
from datetime import datetime, timezone

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


def make_image():
    buffer = io.BytesIO()
    Image.new("RGB", (200, 150), (120, 90, 60)).save(buffer, format="JPEG")
    return buffer.getvalue()


class TestConfig(Config):
    OWNER_API_TOKEN = "test-token"
    DEBUG = False
    STORAGE_BACKEND = "memory"


app = create_app(
    TestConfig,
    database_url="sqlite+pysqlite:///:memory:",
    engine_options={
        "connect_args": {"check_same_thread": False},
        "poolclass": StaticPool,
    },
    storage=MemoryStorage(),
)

from app import db as db_module  # noqa: E402

Base.metadata.create_all(db_module.engine)
client = app.test_client()


def upload(title, **fields):
    data = {"title": title, "image": (io.BytesIO(make_image()), "a.jpg"), **fields}
    return client.post(
        "/api/pieces", headers=OWNER, content_type="multipart/form-data", data=data
    )


def titles(path, headers=None):
    return [piece["title"] for piece in client.get(path, headers=headers or {}).get_json()]


def move(piece_id, value):
    return client.patch(f"/api/pieces/{piece_id}", headers=OWNER, json={"inSketchbook": value})


print("== uploading into the sketchbook ==")
wall = upload("Wall").get_json()["id"]
res = upload("Older sketch", inSketchbook="true")
older = res.get_json()
check("an upload can go straight into the sketchbook", res.status_code == 201, str(res.status_code))
check("and says so", older["inSketchbook"] is True, str(older["inSketchbook"]))
check("with no place in the gallery", older["curatedOrder"] is None, str(older["curatedOrder"]))
newer = upload("Newer sketch", inSketchbook="true").get_json()

session = SessionLocal()
session.get(Piece, uuid.UUID(older["id"])).created_at = datetime(2020, 1, 1, tzinfo=timezone.utc)
session.commit()
session.close()

res = upload("Placed sketch", inSketchbook="true", position="1")
check("a sketchbook upload with a position is refused", res.status_code == 400, str(res.status_code))
res = upload("Unsure", inSketchbook="maybe")
check("an inSketchbook that is not true or false is refused", res.status_code == 400,
      str(res.status_code))

print("\n== two lists ==")
check("the gallery holds no sketch", titles("/api/pieces") == ["Wall"], str(titles("/api/pieces")))
check(
    "the sketchbook holds only sketches, newest first",
    titles("/api/pieces?sketchbook=true") == ["Newer sketch", "Older sketch"],
    str(titles("/api/pieces?sketchbook=true")),
)

client.post(f"/api/pieces/{newer['id']}/waive", headers=OWNER)
check("a waived sketch leaves the sketchbook",
      titles("/api/pieces?sketchbook=true") == ["Older sketch"])
check("and joins the one reserve",
      "Newer sketch" in titles("/api/pieces?waived=true", OWNER))
client.post(f"/api/pieces/{newer['id']}/restore", headers=OWNER, json={})
check(
    "restoring it returns it to the sketchbook, not the gallery",
    "Newer sketch" in titles("/api/pieces?sketchbook=true")
    and "Newer sketch" not in titles("/api/pieces"),
)

print("\n== moving a piece into the sketchbook ==")
client.put("/api/spotlight", headers=OWNER, json=[wall])
client.put("/api/curation/pieces", headers=OWNER, json={"pieceIds": [wall]})
client.put("/api/about/pieces", headers=OWNER, json={"pieceIds": [wall]})
held_by = client.post(
    "/api/collections", headers=OWNER, json={"name": "Studies", "pieceIds": [wall]}
).get_json()

res = move(wall, True)
moved = res.get_json()
check("a piece moves into the sketchbook", res.status_code == 200 and moved["inSketchbook"] is True,
      str(res.status_code))
check("giving up its spotlight slot", moved["spotlightOrder"] is None, str(moved["spotlightOrder"]))
check("and its place in the gallery", moved["curatedOrder"] is None, str(moved["curatedOrder"]))
check("keeping its collection", [c["id"] for c in moved["collections"]] == [held_by["id"]],
      str(moved["collections"]))
about = client.get("/api/about").get_json()
check("and its place on the about page", [p["id"] for p in about["pieces"]] == [wall],
      str([p["title"] for p in about["pieces"]]))
check("the gallery no longer holds it", "Wall" not in titles("/api/pieces"))

res = move(wall, "yes")
check("an inSketchbook that is not a boolean is refused", res.status_code == 400,
      str(res.status_code))

print("\n== what the gallery refuses ==")
other = upload("Other wall").get_json()["id"]
res = client.put("/api/spotlight", headers=OWNER, json=[wall])
check("the spotlight refuses a sketch", res.status_code == 409, str(res.status_code))
res = client.put("/api/curation/pieces", headers=OWNER, json={"pieceIds": [wall]})
check("curation refuses a sketch", res.status_code == 409, str(res.status_code))
res = client.put("/api/about/pieces", headers=OWNER, json={"pieceIds": [wall, older["id"]]})
check("the about page takes sketches", res.status_code == 200, str(res.status_code))

print("\n== moving it back ==")
client.put("/api/curation/pieces", headers=OWNER, json={"pieceIds": [other]})
res = move(wall, False)
back = res.get_json()
check("a piece moves back into the gallery", res.status_code == 200 and back["inSketchbook"] is False,
      str(res.status_code))
check("waiting above the placed pieces for a place of its own",
      back["curatedOrder"] is None and titles("/api/pieces") == ["Wall", "Other wall"],
      str(titles("/api/pieces")))
check("moving to where it already is keeps its place",
      move(other, False).get_json()["curatedOrder"] == 0)


failed = [c for c in checks if not c[1]]
print(f"\n{len(checks) - len(failed)}/{len(checks)} checks passed")
if failed:
    for label, _, detail in failed:
        print(f"  FAILED: {label} {detail}")
    sys.exit(1)
