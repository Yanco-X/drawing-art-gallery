"""
The curated order: replaced whole by the owner, new and restored pieces
waiting above it. Against in-memory SQLite and MemoryStorage.

    .venv/Scripts/python.exe tests/smoke_curation.py
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
from app.db import Base  # noqa: E402
from app.storage import MemoryStorage  # noqa: E402

OWNER = {"X-Owner-Token": "test-token"}
checks = []


def check(label, condition, detail=""):
    checks.append((label, bool(condition), detail))
    print(f"  [{'PASS' if condition else 'FAIL'}] {label}" + (f" -- {detail}" if detail else ""))


def make_image(width=200, height=150):
    buffer = io.BytesIO()
    Image.new("RGB", (width, height), (120, 90, 60)).save(buffer, format="JPEG")
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


def post_piece(title, position=None):
    data = {"title": title, "image": (io.BytesIO(make_image()), "a.jpg")}
    if position is not None:
        data["position"] = position
    return client.post(
        "/api/pieces", headers=OWNER, content_type="multipart/form-data", data=data
    )


def upload(title, position=None):
    res = post_piece(title, position)
    assert res.status_code == 201, res.get_data(as_text=True)
    return res.get_json()["id"]


def put(ids, headers=OWNER):
    return client.put("/api/curation/pieces", json={"pieceIds": ids}, headers=headers)


def gallery():
    return [p["title"] for p in client.get("/api/pieces").get_json()]


def places(headers=OWNER):
    rows = client.get("/api/pieces", headers=headers).get_json()
    return {p["title"]: p["curatedOrder"] for p in rows}


a = upload("Alpha")
b = upload("Beta")
c = upload("Gamma")
d = upload("Delta")


print("== before any curation ==")
check("every piece carries the key and none is placed",
      set(places().values()) == {None}, str(places()))
check("the gallery is newest first", gallery() == ["Delta", "Gamma", "Beta", "Alpha"],
      str(gallery()))
check("a visitor cannot write the order", put([a], headers={}).status_code == 401)


print("\n== the owner's order ==")
res = put([a, c, b, d])
check("the owner replaces the order", res.status_code == 200, str(res.status_code))
check("the response is the gallery in that order",
      [p["title"] for p in res.get_json()] == ["Alpha", "Gamma", "Beta", "Delta"],
      str([p["title"] for p in res.get_json()]))
check("places count from zero", places() == {"Alpha": 0, "Gamma": 1, "Beta": 2, "Delta": 3},
      str(places()))
check("the gallery follows it", gallery() == ["Alpha", "Gamma", "Beta", "Delta"], str(gallery()))
check("a visitor gets the order but not the numbers",
      set(places(headers={}).values()) == {None}, str(places(headers={})))
put([d, c, b, a])
check("a full reversal applies without collisions",
      gallery() == ["Delta", "Gamma", "Beta", "Alpha"], str(gallery()))


print("\n== a new upload waits at the top ==")
put([a, b, c, d])
e = upload("Epsilon")
check("unplaced", places()["Epsilon"] is None, str(places()))
check("above the curated order", gallery() == ["Epsilon", "Alpha", "Beta", "Gamma", "Delta"],
      str(gallery()))


print("\n== a piece left out loses its place ==")
put([a, b])
check("Gamma, Delta and Epsilon are unplaced",
      [places()[t] for t in ("Gamma", "Delta", "Epsilon")] == [None, None, None], str(places()))
check("and wait above, newest first",
      gallery() == ["Epsilon", "Delta", "Gamma", "Alpha", "Beta"], str(gallery()))


print("\n== refusals leave the order alone ==")
put([a, b, c, d, e])
before = gallery()
check("a duplicate is refused", put([a, a]).status_code == 400)
check("a malformed id is refused", put(["not-a-uuid"]).status_code == 400)
check("an unknown id is 404", put(["00000000-0000-0000-0000-000000000000"]).status_code == 404)
check("a bare list is refused",
      client.put("/api/curation/pieces", json=[a], headers=OWNER).status_code == 400)
check("more ids than pieces is refused", put([a] * 6).status_code == 400)
check("the order survived every refusal", gallery() == before, str(gallery()))


print("\n== waiving and restoring ==")
res = client.post(f"/api/pieces/{c}/waive", headers=OWNER)
check("the waive succeeds", res.status_code == 200, str(res.status_code))
waived = client.get("/api/pieces?waived=true", headers=OWNER).get_json()
check("the waived piece keeps no place", waived[0]["curatedOrder"] is None, str(waived[0]))
res = put([a, c])
check("a waived piece cannot be placed", res.status_code == 409, str(res.status_code))
check("and it is named", c in str(res.get_json().get("details")), str(res.get_json()))
client.post(f"/api/pieces/{c}/restore", headers=OWNER)
check("restored, it returns at the top", gallery()[0] == "Gamma", str(gallery()))
check("unplaced", places()["Gamma"] is None, str(places()))


print("\n== a position chosen at upload ==")
put([a, b, d, e])
upload("Zeta")
check("no position waits at the top, unplaced",
      gallery()[0] == "Zeta" and places()["Zeta"] is None, str(places()))
upload("Eta", "3")
check("position 3 hangs it third", gallery()[2] == "Eta", str(gallery()))
check("and numbers the gallery as it stood, the waiting ones included",
      gallery() == ["Zeta", "Gamma", "Eta", "Alpha", "Beta", "Delta", "Epsilon"]
      and [places()[t] for t in gallery()] == list(range(7)), str(places()))
upload("Theta", "999")
check("past the end is the end", gallery()[-1] == "Theta", str(gallery()))
for bad in ("0", "-2", "two", "1.5"):
    res = post_piece("Nope", bad)
    check(f"position {bad!r} is refused", res.status_code == 400, str(res.status_code))
check("and a refused upload leaves nothing behind", "Nope" not in gallery(), str(gallery()))


print("\n== the empty list unplaces everything ==")
res = put([])
check("an empty list is accepted", res.status_code == 200, str(res.status_code))
check("every place cleared", set(places().values()) == {None}, str(places()))
check("and the gallery is newest first again",
      gallery() == ["Theta", "Eta", "Zeta", "Epsilon", "Delta", "Gamma", "Beta", "Alpha"],
      str(gallery()))


print("\n== the order of the collections ==")


def make_collection(name, is_public=True):
    res = client.post(
        "/api/collections", json={"name": name, "isPublic": is_public}, headers=OWNER
    )
    assert res.status_code == 201, res.get_data(as_text=True)
    return res.get_json()["id"]


def shelves():
    rows = client.get("/api/collections?includePrivate=1", headers=OWNER).get_json()
    return [(r["name"], r["curatedOrder"]) for r in rows]


def put_collections(ids, headers=OWNER):
    return client.put(
        "/api/curation/collections", json={"collectionIds": ids}, headers=headers
    )


x = make_collection("Sketches")
y = make_collection("Portraits")
z = make_collection("Drafts", is_public=False)
check("newest first to begin with, none placed",
      shelves() == [("Drafts", None), ("Portraits", None), ("Sketches", None)], str(shelves()))
check("a visitor cannot write it", put_collections([x], headers={}).status_code == 401)

res = put_collections([x, z, y])
check("the owner orders them", res.status_code == 200, str(res.status_code))
check("the response is the list in that order",
      [r["name"] for r in res.get_json()] == ["Sketches", "Drafts", "Portraits"],
      str([r["name"] for r in res.get_json()]))
check("places count from zero, drafts included",
      shelves() == [("Sketches", 0), ("Drafts", 1), ("Portraits", 2)], str(shelves()))
seen = [(r["name"], r["curatedOrder"]) for r in client.get("/api/collections").get_json()]
check("a visitor gets the public ones in that order, without numbers",
      seen == [("Sketches", None), ("Portraits", None)], str(seen))

make_collection("Studies")
check("a new collection waits at the top", shelves()[0] == ("Studies", None), str(shelves()))

before = shelves()
check("a duplicate is refused", put_collections([x, x]).status_code == 400)
check("an unknown id is 404",
      put_collections(["00000000-0000-0000-0000-000000000000"]).status_code == 404)
check("more ids than collections is refused", put_collections([x] * 5).status_code == 400)
check("a bare list is refused",
      client.put("/api/curation/collections", json=[x], headers=OWNER).status_code == 400)
check("the order survived every refusal", shelves() == before, str(shelves()))


failed = [c for c in checks if not c[1]]
print(f"\n{len(checks) - len(failed)}/{len(checks)} checks passed")
if failed:
    for label, _, detail in failed:
        print(f"  FAILED: {label} {detail}")
    sys.exit(1)
