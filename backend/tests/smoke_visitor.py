"""
The visitor contract, asserted with no credentials at all.

Every other suite tests a feature and checks the visitor case in passing.
This one tests "visitor" as a thing, line by line against context/AUTH.md
section 1 -- which is how the includePrivate leak survived for a month
inside a comment that said the opposite.

    .venv/Scripts/python.exe tests/smoke_visitor.py
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


def upload(title, collection_ids=()):
    data = {"title": title, "image": (io.BytesIO(make_image()), "a.jpg")}
    if collection_ids:
        data["collectionIds"] = list(collection_ids)
    res = client.post(
        "/api/pieces", headers=OWNER, content_type="multipart/form-data", data=data
    )
    assert res.status_code == 201, res.get_data(as_text=True)
    return res.get_json()["id"]


def make_collection(name, piece_ids=(), is_public=True):
    res = client.post(
        "/api/collections",
        headers=OWNER,
        json={"name": name, "pieceIds": list(piece_ids), "isPublic": is_public},
    )
    assert res.status_code == 201, res.get_data(as_text=True)
    return res.get_json()


print("== fixtures, as the owner ==")
hung = upload("__contract__ On The Wall")
second = upload("__contract__ Beside It")
taken_down = upload("__contract__ Taken Down")

shown = make_collection("__contract__ Shown", [hung, second])
draft = make_collection("__contract__ Draft", [hung], is_public=False)
client.post(f"/api/pieces/{taken_down}/waive", headers=OWNER)
check("three pieces, two collections, one waived", True)


print("\n== a visitor may see the gallery ==")
res = client.get("/api/pieces")
titles = [p["title"] for p in res.get_json()]
check("the gallery lists exhibited work", res.status_code == 200 and len(titles) == 2,
      str(titles))
check("the waived piece is not in it", "__contract__ Taken Down" not in titles)

res = client.get(f"/api/pieces/{hung}")
piece = res.get_json()
check("a piece resolves", res.status_code == 200, str(res.status_code))
check(
    "the wall label is complete",
    {"title", "description", "medium", "year", "createdDate", "width", "height", "tags"}
    <= set(piece),
    str(sorted(set(piece))),
)
check("the detail view has a tile source key", "tileSource" in piece)
check("and a display rendition", bool(piece.get("imageUrl")))


print("\n== a visitor may browse public collections ==")
res = client.get("/api/collections")
names = [c["name"] for c in res.get_json()]
check("the index lists public collections", res.status_code == 200, str(res.status_code))
check("__contract__ Shown is on it", "__contract__ Shown" in names, str(names))
check("__contract__ Draft is not", "__contract__ Draft" not in names, str(names))

res = client.get(f"/api/collections/{shown['slug']}")
check("a public collection resolves", res.status_code == 200)
check(
    "with its pieces in curated order",
    [p["id"] for p in res.get_json()["pieces"]] == [hung, second],
)

check(
    "a piece reports its public memberships only",
    [c["name"] for c in piece["collections"]] == ["__contract__ Shown"],
    str([c["name"] for c in piece["collections"]]),
)


print("\n== a visitor is not told what is withheld ==")
res = client.get(f"/api/collections/{draft['slug']}")
check("a draft collection 404s by slug", res.status_code == 404, str(res.status_code))

res = client.get(f"/api/pieces/{taken_down}")
body = res.get_json()
check("a waived piece answers 410", res.status_code == 410, str(res.status_code))
check("the tombstone names it", body.get("title") == "__contract__ Taken Down")
check("and says nothing else about it", set(body) == {"error", "title"},
      str(sorted(body)))

check(
    "an unknown id 404s, with no tombstone",
    client.get("/api/pieces/00000000-0000-0000-0000-000000000000").status_code == 404,
)
check(
    "the reserve needs the owner",
    client.get("/api/pieces?waived=true").status_code == 401,
)
check(
    "so does listing drafts",
    client.get("/api/collections?includePrivate=1").status_code == 401,
)


print("\n== a visitor may not write ==")
# Walked from the url map rather than listed by hand: a mutation added
# later is covered by this suite the day it is written, without anyone
# remembering to come back here.
SAMPLE = {"uuid": "00000000-0000-0000-0000-000000000000", "string": "x", "path": "x"}
skipped = {("/api/session", "POST")}
mutations = []
for rule in app.url_map.iter_rules():
    path = str(rule)
    for argument in rule.arguments:
        converter = type(rule._converters[argument]).__name__.replace("Converter", "").lower()
        path = path.replace(f"<{argument}>", SAMPLE["string"])
        for name in ("uuid", "string", "path", "int"):
            path = path.replace(f"<{name}:{argument}>", SAMPLE.get(converter, "x"))
    for method in sorted(rule.methods - {"GET", "HEAD", "OPTIONS"}):
        if (path, method) not in skipped:
            mutations.append((path, method))

refused = [
    (path, method)
    for path, method in mutations
    if client.open(path, method=method).status_code != 401
]
check(
    f"all {len(mutations)} mutations answer 401 without credentials",
    not refused,
    str(refused),
)


print("\n== the site itself ==")
check("health is public", client.get("/api/health").status_code == 200)
res = client.get("/api/session/me")
check("and the caller is told they are a visitor",
      res.status_code == 200 and res.get_json()["role"] == "visitor",
      str(res.get_json()))


passed = sum(1 for _, ok, _ in checks if ok)
print(f"\n{passed}/{len(checks)} checks passed")
for label, ok, detail in checks:
    if not ok:
        print(f"  FAILED: {label}" + (f" -- {detail}" if detail else ""))
sys.exit(0 if passed == len(checks) else 1)
