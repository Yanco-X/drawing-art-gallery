"""
The waive / restore / delete state machine, against in-memory SQLite and
MemoryStorage. Real app, real routes, real collection membership.

    .venv/Scripts/python.exe tests/smoke_waived.py
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


def upload(title):
    res = client.post(
        "/api/pieces", headers=OWNER, content_type="multipart/form-data",
        data={"title": title, "image": (io.BytesIO(make_image()), "a.jpg")},
    )
    assert res.status_code == 201, res.get_data(as_text=True)
    return res.get_json()["id"]


def titles(**params):
    query = "&".join(f"{k}={v}" for k, v in params.items())
    res = client.get(f"/api/pieces?{query}" if query else "/api/pieces", headers=OWNER)
    return [p["title"] for p in res.get_json()]


a, b, c = upload("Alpha"), upload("Beta"), upload("Gamma")

print("\n== a new piece is exhibited ==")
check("waivedAt is null on upload",
      client.get(f"/api/pieces/{a}").get_json()["waivedAt"] is None)
check("all three in the gallery", sorted(titles()) == ["Alpha", "Beta", "Gamma"],
      str(titles()))
check("the reserve is empty", titles(waived="true") == [], str(titles(waived="true")))

print("\n== delete is refused while exhibited ==")
res = client.delete(f"/api/pieces/{a}", headers=OWNER)
check("delete returns 409", res.status_code == 409, str(res.status_code))
check("and says what to do first", "aive" in res.get_json()["error"],
      res.get_json()["error"])
check("the piece is still there", "Alpha" in titles())

print("\n== waive ==")
check("waive without owner token is refused",
      client.post(f"/api/pieces/{a}/waive").status_code == 401)
res = client.post(f"/api/pieces/{a}/waive", headers=OWNER)
check("waive returns 200", res.status_code == 200, str(res.status_code))
check("waivedAt is now set", res.get_json()["waivedAt"] is not None)
check("gone from the gallery", sorted(titles()) == ["Beta", "Gamma"], str(titles()))
check("present in the reserve", titles(waived="true") == ["Alpha"],
      str(titles(waived="true")))
check("waiving twice is refused",
      client.post(f"/api/pieces/{a}/waive", headers=OWNER).status_code == 409)

print("\n== a waived piece is hidden from visitors, not from the owner ==")
check("visitor gets 404", client.get(f"/api/pieces/{a}").status_code == 404)
check("owner gets 200", client.get(f"/api/pieces/{a}", headers=OWNER).status_code == 200)
check("the reserve list needs the owner token",
      client.get("/api/pieces?waived=true").status_code == 401)

print("\n== objects are untouched by waiving ==")
check("all three renditions still stored",
      len([k for k in storage.objects if k.startswith(f"{a}/")]) == 3,
      str([k for k in storage.objects if k.startswith(f"{a}/")]))

print("\n== collections ==")
collection = client.post(
    "/api/collections", headers=OWNER, json={"name": "Night Calls"},
).get_json()
cid = collection["id"]
client.put(f"/api/collections/{cid}/pieces", headers=OWNER,
           json={"pieceIds": [b, c]})
client.patch(f"/api/collections/{cid}", headers=OWNER, json={"coverPieceId": b})
detail = client.get(f"/api/collections/{collection['slug']}").get_json()
check("two members before waiving", detail["pieceCount"] == 2, str(detail["pieceCount"]))

waived = client.post(f"/api/pieces/{b}/waive", headers=OWNER).get_json()
detail = client.get(f"/api/collections/{collection['slug']}").get_json()
check("membership dropped on waive", detail["pieceCount"] == 1, str(detail["pieceCount"]))
check("the remaining member is the other one",
      [p["title"] for p in detail["pieces"]] == ["Gamma"],
      str([p["title"] for p in detail["pieces"]]))
check("the waived piece reports no collections", waived["collections"] == [],
      str(waived["collections"]))
check("cover fell back to the surviving member",
      detail["coverImageUrl"] is not None and c in detail["coverImageUrl"],
      str(detail["coverImageUrl"]))

print("\n== restore ==")
check("restoring an exhibited piece is refused",
      client.post(f"/api/pieces/{c}/restore", headers=OWNER).status_code == 409)

res = client.post(f"/api/pieces/{b}/restore", headers=OWNER,
                  json={"collectionIds": [cid]})
check("restore returns 200", res.status_code == 200, str(res.status_code))
check("waivedAt cleared", res.get_json()["waivedAt"] is None)
check("back in the gallery", "Beta" in titles(), str(titles()))
check("out of the reserve", "Beta" not in titles(waived="true"))
detail = client.get(f"/api/collections/{collection['slug']}").get_json()
check("re-joined the chosen collection", detail["pieceCount"] == 2,
      str(detail["pieceCount"]))
check("appended to the end, not to its old position",
      [p["title"] for p in detail["pieces"]] == ["Gamma", "Beta"],
      str([p["title"] for p in detail["pieces"]]))

print("\n== restore without collections ==")
client.post(f"/api/pieces/{b}/waive", headers=OWNER)
client.post(f"/api/pieces/{b}/restore", headers=OWNER)
check("restores to the gallery alone", "Beta" in titles())
check("and joins nothing",
      client.get(f"/api/collections/{collection['slug']}").get_json()["pieceCount"] == 1)

print("\n== restore validation ==")
client.post(f"/api/pieces/{b}/waive", headers=OWNER)
unknown = "00000000-0000-0000-0000-000000000000"
res = client.post(f"/api/pieces/{b}/restore", headers=OWNER,
                  json={"collectionIds": [unknown]})
check("unknown collection 404s", res.status_code == 404, str(res.status_code))
check("and names the missing one", unknown in str(res.get_json().get("details")),
      str(res.get_json()))
check("the piece stayed waived after a failed restore",
      "Beta" in titles(waived="true"), str(titles(waived="true")))
res = client.post(f"/api/pieces/{b}/restore", headers=OWNER,
                  json={"collectionIds": [cid, cid]})
check("duplicate collection ids refused", res.status_code == 400, str(res.status_code))

print("\n== delete, once waived ==")
res = client.delete(f"/api/pieces/{a}", headers=OWNER)
check("delete returns 204", res.status_code == 204, str(res.status_code))
check("objects removed", not any(k.startswith(f"{a}/") for k in storage.objects))
check("gone from the reserve", "Alpha" not in titles(waived="true"))

failed = [c for c in checks if not c[1]]
print(f"\n{len(checks) - len(failed)}/{len(checks)} checks passed")
if failed:
    for label, _, detail in failed:
        print(f"  FAILED: {label} {detail}")
    sys.exit(1)
