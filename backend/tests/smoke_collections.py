"""
End-to-end exercise of the collections API against in-memory SQLite.

Runs the real Flask app and the real models -- only the database URL
differs, which is why the models use SQLAlchemy's generic Uuid type rather
than the Postgres dialect one. Plain asserts, no pytest, to avoid adding a
dependency for a single file.

    .venv/Scripts/python.exe tests/smoke_collections.py
"""

import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["OWNER_API_TOKEN"] = "test-token"

from sqlalchemy import event, select  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app import create_app  # noqa: E402
from app.config import Config  # noqa: E402
from app.storage import MemoryStorage  # noqa: E402
from app.db import Base, SessionLocal, engine as _engine, init_engine  # noqa: E402
from app.models import Collection, Piece, Tag  # noqa: E402

OWNER = {"X-Owner-Token": "test-token"}
checks = []


def check(label, condition, detail=""):
    checks.append((label, bool(condition), detail))
    mark = "PASS" if condition else "FAIL"
    print(f"  [{mark}] {label}" + (f" -- {detail}" if detail else ""))


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


@event.listens_for(db_module.engine, "connect")
def _enable_sqlite_fks(dbapi_connection, _record):
    # SQLite ignores FK constraints unless asked, and we want the ON DELETE
    # CASCADE behaviour exercised here, not just assumed for Postgres.
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


Base.metadata.create_all(db_module.engine)

session = SessionLocal()
tag = Tag(name="Charcoal", slug="charcoal")
pieces = [
    Piece(
        title=f"Piece {i}",
        original_ext="jpg",
        medium="Charcoal",
        year=2020 + i,
        width=1000,
        height=1000 + i * 100,
        tags=[tag] if i == 1 else [],
    )
    for i in range(1, 5)
]
session.add_all([tag, *pieces])
session.commit()
ids = [str(p.id) for p in pieces]
session.close()

client = app.test_client()

print("\n== health & auth ==")
check("health responds ok", client.get("/api/health").get_json()["status"] == "ok")
check(
    "create without token is rejected",
    client.post("/api/collections", json={"name": "X"}).status_code == 401,
)
check(
    "delete without token is rejected",
    client.delete(f"/api/collections/{uuid.uuid4()}").status_code == 401,
)

print("\n== create ==")
res = client.post(
    "/api/collections",
    json={"name": "Night Calls", "description": "The series.", "pieceIds": ids[:3]},
    headers=OWNER,
)
check("create returns 201", res.status_code == 201, str(res.status_code))
created = res.get_json()
cid = created["id"]
check("slug derived from name", created["slug"] == "night-calls", created["slug"])
check("pieceCount is 3", created["pieceCount"] == 3, str(created["pieceCount"]))
check("pieces come back in given order", [p["id"] for p in created["pieces"]] == ids[:3])
check(
    "cover falls back to first piece",
    created["coverImageUrl"] == f"/media/{ids[0]}/thumb.webp",
    str(created["coverImageUrl"]),
)
check(
    "but no cover was chosen, so coverPieceId stays null",
    created["coverPieceId"] is None,
    str(created["coverPieceId"]),
)
check("aspectRatio computed from stored dims", created["pieces"][0]["aspectRatio"] == 1000 / 1100)
check("tags serialized", created["pieces"][0]["tags"][0]["slug"] == "charcoal")

dupe = client.post("/api/collections", json={"name": "Night Calls"}, headers=OWNER)
check(
    "duplicate name gets a suffixed slug",
    dupe.get_json()["slug"] == "night-calls-2",
    dupe.get_json()["slug"],
)

print("\n== validation ==")
check(
    "blank name refused",
    client.post("/api/collections", json={"name": "  "}, headers=OWNER).status_code == 400,
)
bad = client.put(
    f"/api/collections/{cid}/pieces",
    json={"pieceIds": [ids[0], ids[0]]},
    headers=OWNER,
)
check("duplicate pieceIds refused", bad.status_code == 400, bad.get_json().get("error", ""))
missing = client.put(
    f"/api/collections/{cid}/pieces",
    json={"pieceIds": [str(uuid.uuid4())]},
    headers=OWNER,
)
check("unknown piece id refused with 404", missing.status_code == 404)
check(
    "membership unchanged after failed write",
    client.get("/api/collections/night-calls").get_json()["pieceCount"] == 3,
)

print("\n== reorder & membership replace ==")
reordered = client.put(
    f"/api/collections/{cid}/pieces",
    json={"pieceIds": [ids[2], ids[0], ids[3]]},
    headers=OWNER,
).get_json()
check(
    "order replaced exactly",
    [p["id"] for p in reordered["pieces"]] == [ids[2], ids[0], ids[3]],
)
check("dropped piece is gone", ids[1] not in [p["id"] for p in reordered["pieces"]])
session = SessionLocal()
orders = session.scalars(
    select(Collection).where(Collection.id == uuid.UUID(cid))
).unique().first().piece_links
check(
    "display_order rewritten contiguously from 0",
    [link.display_order for link in orders] == [0, 1, 2],
    str([link.display_order for link in orders]),
)
session.close()

print("\n== cover rules ==")
rejected = client.patch(
    f"/api/collections/{cid}", json={"coverPieceId": ids[1]}, headers=OWNER
)
check("cover outside the collection refused", rejected.status_code == 400)
ok = client.patch(
    f"/api/collections/{cid}", json={"coverPieceId": ids[3]}, headers=OWNER
).get_json()
check(
    "explicit cover applied",
    ok["coverImageUrl"] == f"/media/{ids[3]}/thumb.webp",
    str(ok["coverImageUrl"]),
)
check(
    "and coverPieceId names the chosen piece",
    ok["coverPieceId"] == ids[3],
    str(ok["coverPieceId"]),
)
after = client.put(
    f"/api/collections/{cid}/pieces", json={"pieceIds": [ids[0], ids[2]]}, headers=OWNER
).get_json()
check(
    "cover reset when it leaves the collection",
    after["coverImageUrl"] == f"/media/{ids[0]}/thumb.webp",
    str(after["coverImageUrl"]),
)
check(
    "and coverPieceId is null again, not the fallback's id",
    after["coverPieceId"] is None,
    str(after["coverPieceId"]),
)

print("\n== visibility ==")
client.patch(f"/api/collections/{cid}", json={"isPublic": False}, headers=OWNER)
public = client.get("/api/collections").get_json()
check("private hidden from the default list", cid not in [c["id"] for c in public])
withprivate = client.get("/api/collections?includePrivate=1", headers=OWNER).get_json()
check("private visible with includePrivate=1", cid in [c["id"] for c in withprivate])
check(
    "includePrivate=1 needs the owner, like ?waived=true does",
    client.get("/api/collections?includePrivate=1").status_code == 401,
)

# 404 rather than 403 on the detail route: the response must not confirm
# that a draft sits at this slug. Same reasoning as a waived piece.
check(
    "private 404s on the detail route for a visitor",
    client.get("/api/collections/night-calls").status_code == 404,
)
check(
    "private resolves on the detail route for the owner",
    client.get("/api/collections/night-calls", headers=OWNER).status_code == 200,
)

visitor_view = client.get(f"/api/pieces/{ids[0]}").get_json()
check(
    "a visitor is not told the piece sits in a draft",
    "night-calls" not in [c["slug"] for c in visitor_view["collections"]],
    str([c["slug"] for c in visitor_view["collections"]]),
)
owner_view = client.get(f"/api/pieces/{ids[0]}", headers=OWNER).get_json()
check(
    "the owner sees the draft on the piece",
    "night-calls" in [c["slug"] for c in owner_view["collections"]],
    str([c["slug"] for c in owner_view["collections"]]),
)

client.patch(f"/api/collections/{cid}", json={"isPublic": True}, headers=OWNER)
check(
    "a public collection resolves without a token",
    client.get("/api/collections/night-calls").status_code == 200,
)

print("\n== cascade safety ==")
session = SessionLocal()
session.delete(session.get(Piece, uuid.UUID(ids[0])))
session.commit()
session.close()
survived = client.get("/api/collections/night-calls").get_json()
check(
    "deleting a piece removes only its membership",
    [p["id"] for p in survived["pieces"]] == [ids[2]],
    str([p["id"] for p in survived["pieces"]]),
)

check("delete collection returns 204", client.delete(f"/api/collections/{cid}", headers=OWNER).status_code == 204)
check("collection is gone", client.get("/api/collections/night-calls").status_code == 404)
session = SessionLocal()
remaining = session.scalars(select(Piece.id)).all()
check(
    "pieces survive their collection being deleted",
    len(remaining) == 3,
    f"{len(remaining)} pieces left",
)
session.close()

print("\n== create a collection with its pieces in one request ==")
made = client.post(
    "/api/collections", headers=OWNER,
    json={"name": "Picked From The Grid", "description": "Chosen in order.",
          "pieceIds": [ids[3], ids[1]]},
)
check("create with pieceIds returns 201", made.status_code == 201, str(made.status_code))
body = made.get_json()
check("membership applied", body["pieceCount"] == 2, str(body["pieceCount"]))
check("selection order is the display order",
      [p["id"] for p in body["pieces"]] == [ids[3], ids[1]],
      str([p["id"] for p in body["pieces"]]))
check("slug derived from the name", body["slug"] == "picked-from-the-grid", body["slug"])

print("\n== set a piece's collections from the piece side ==")
target = client.post("/api/collections", headers=OWNER, json={"name": "Side A"}).get_json()
other = client.post("/api/collections", headers=OWNER, json={"name": "Side B"}).get_json()

res = client.put(f"/api/pieces/{ids[2]}/collections", headers=OWNER,
                 json={"collectionIds": [target["id"], other["id"]]})
check("put returns 200", res.status_code == 200, str(res.status_code))
check("the piece reports both",
      sorted(c["name"] for c in res.get_json()["collections"]) == ["Side A", "Side B"],
      str([c["name"] for c in res.get_json()["collections"]]))
check("and both collections count it",
      client.get(f"/api/collections/{target['slug']}").get_json()["pieceCount"] == 1
      and client.get(f"/api/collections/{other['slug']}").get_json()["pieceCount"] == 1)

print("\n== unchecking removes ==")
res = client.put(f"/api/pieces/{ids[2]}/collections", headers=OWNER,
                 json={"collectionIds": [target["id"]]})
check("dropped from the one left out",
      [c["name"] for c in res.get_json()["collections"]] == ["Side A"],
      str([c["name"] for c in res.get_json()["collections"]]))
check("that collection is now empty",
      client.get(f"/api/collections/{other['slug']}").get_json()["pieceCount"] == 0)

res = client.put(f"/api/pieces/{ids[2]}/collections", headers=OWNER,
                 json={"collectionIds": []})
check("an empty list leaves every collection", res.get_json()["collections"] == [])

print("\n== re-saving an unchanged list does not shuffle curation ==")
client.put(f"/api/collections/{target['id']}/pieces", headers=OWNER,
           json={"pieceIds": [ids[1], ids[2], ids[3]]})
before = [p["id"] for p in client.get(f"/api/collections/{target['slug']}").get_json()["pieces"]]
client.put(f"/api/pieces/{ids[2]}/collections", headers=OWNER,
           json={"collectionIds": [target["id"]]})
after = [p["id"] for p in client.get(f"/api/collections/{target['slug']}").get_json()["pieces"]]
check("order preserved", before == after, f"{before} -> {after}")

print("\n== a cover that leaves loses the cover ==")
client.patch(f"/api/collections/{target['id']}", headers=OWNER, json={"coverPieceId": ids[2]})
check("cover set",
      client.get(f"/api/collections/{target['slug']}").get_json()["coverImageUrl"] is not None)
client.put(f"/api/pieces/{ids[2]}/collections", headers=OWNER, json={"collectionIds": []})
detail = client.get(f"/api/collections/{target['slug']}").get_json()
check("cover fell back to a remaining member",
      detail["coverImageUrl"] is not None and ids[2] not in detail["coverImageUrl"],
      str(detail["coverImageUrl"]))

print("\n== validation ==")
check("without the field, refused",
      client.put(f"/api/pieces/{ids[1]}/collections", headers=OWNER, json={}).status_code == 400)
check("unknown collection 404s",
      client.put(f"/api/pieces/{ids[1]}/collections", headers=OWNER,
                 json={"collectionIds": ["00000000-0000-0000-0000-000000000000"]}
                 ).status_code == 404)
check("duplicates refused",
      client.put(f"/api/pieces/{ids[1]}/collections", headers=OWNER,
                 json={"collectionIds": [target["id"], target["id"]]}).status_code == 400)
check("without the owner token, refused",
      client.put(f"/api/pieces/{ids[1]}/collections",
                 json={"collectionIds": []}).status_code == 401)

print("\n== a waived piece cannot be curated ==")
client.post(f"/api/pieces/{ids[1]}/waive", headers=OWNER)
res = client.put(f"/api/pieces/{ids[1]}/collections", headers=OWNER,
                 json={"collectionIds": [target["id"]]})
check("refused with 409", res.status_code == 409, str(res.status_code))
check("and says to restore first", "estore" in res.get_json()["error"],
      res.get_json()["error"])
client.post(f"/api/pieces/{ids[1]}/restore", headers=OWNER)


failed = [c for c in checks if not c[1]]
print(f"\n{len(checks) - len(failed)}/{len(checks)} checks passed")
if failed:
    for label, _, detail in failed:
        print(f"  FAILED: {label} {detail}")
    sys.exit(1)
