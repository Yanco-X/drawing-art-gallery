"""
The spotlight: hand-picked slots, replaced whole by the owner, cleared by a
waive. Against in-memory SQLite and MemoryStorage.

    .venv/Scripts/python.exe tests/smoke_spotlight.py
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


def upload(title):
    res = client.post(
        "/api/pieces", headers=OWNER, content_type="multipart/form-data",
        data={"title": title, "image": (io.BytesIO(make_image()), "a.jpg")},
    )
    assert res.status_code == 201, res.get_data(as_text=True)
    return res.get_json()["id"]


def put(body, headers=OWNER):
    return client.put("/api/spotlight", json=body, headers=headers)


def orders():
    """title -> spotlightOrder, for every exhibited piece."""
    res = client.get("/api/pieces", headers=OWNER)
    return {p["title"]: p["spotlightOrder"] for p in res.get_json()}


a = upload("Alpha")
b = upload("Beta")
c = upload("Gamma")
d = upload("Delta")


print("== nothing is picked to begin with ==")
check("every piece carries the key", all("spotlightOrder" in p
      for p in client.get("/api/pieces").get_json()))
check("and every one is null", set(orders().values()) == {None}, str(orders()))
check("a visitor cannot write the spotlight", put([], headers={}).status_code == 401)


print("\n== picking, in the order given ==")
res = put([c, a])
check("the owner replaces the list", res.status_code == 200, str(res.status_code))
rows = res.get_json()
check("the response is the picked pieces in order",
      [r["title"] for r in rows] == ["Gamma", "Alpha"], str([r["title"] for r in rows]))
check("slots count from zero", [r["spotlightOrder"] for r in rows] == [0, 1],
      str([r["spotlightOrder"] for r in rows]))
now = orders()
check("Gamma holds slot 0", now["Gamma"] == 0, str(now))
check("Alpha holds slot 1", now["Alpha"] == 1, str(now))
check("Beta is unpicked", now["Beta"] is None, str(now))

print("\n== the order is the owner's, not the gallery's ==")
listed = [p["title"] for p in client.get("/api/pieces").get_json()]
check("the gallery is still newest-first", listed[0] == "Delta", str(listed))
check("which is not the spotlight order", listed[:2] != ["Gamma", "Alpha"], str(listed))


print("\n== replacing drops what is absent ==")
put([b])
now = orders()
check("Beta took slot 0", now["Beta"] == 0, str(now))
check("Gamma lost its slot", now["Gamma"] is None, str(now))
check("Alpha lost its slot", now["Alpha"] is None, str(now))

print("\n== reordering the same pieces ==")
put([a, b])
check("no unique-constraint collision on a swap", orders()["Alpha"] == 0, str(orders()))
put([b, a])
now = orders()
check("the swap applies", (now["Beta"], now["Alpha"]) == (0, 1), str(now))


print("\n== refusals ==")
res = put([a, a])
check("a duplicate is refused", res.status_code == 400, str(res.status_code))
check("and the list is unchanged", orders()["Beta"] == 0, str(orders()))
res = put([a, b, c, d, a, b])
check("more than five is refused", res.status_code == 400, str(res.status_code))
check("and names the count", "5" in res.get_json()["error"], str(res.get_json()))
check("a malformed id is refused", put(["not-a-uuid"]).status_code == 400)
check("an unknown id is 404",
      put(["00000000-0000-0000-0000-000000000000"]).status_code == 404)
check("an object body is refused", put({"pieceIds": []}).status_code == 400)
check("the list survived every refusal", orders()["Beta"] == 0, str(orders()))


print("\n== waiving clears the slot ==")
put([b, a])
res = client.post(f"/api/pieces/{b}/waive", headers=OWNER)
check("the waive succeeds", res.status_code == 200, str(res.status_code))
now = orders()
check("the waived piece is gone from the gallery", "Beta" not in now, str(now))
check("Alpha keeps its own slot", now["Alpha"] == 1, str(now))
waived = client.get("/api/pieces?waived=true", headers=OWNER).get_json()
beta = next(p for p in waived if p["title"] == "Beta")
check("and the waived row carries no slot", beta["spotlightOrder"] is None, str(beta["spotlightOrder"]))

print("\n== restoring does not take the slot back ==")
client.post(f"/api/pieces/{b}/restore", headers=OWNER)
check("Beta is exhibited again", "Beta" in orders(), str(orders()))
check("but unpicked", orders()["Beta"] is None, str(orders()))

print("\n== a waived piece cannot be picked ==")
client.post(f"/api/pieces/{c}/waive", headers=OWNER)
res = put([c])
check("picking a waived piece is refused", res.status_code == 409, str(res.status_code))
check("and it is named", c in str(res.get_json().get("details")), str(res.get_json()))


print("\n== the empty list is the way back to the default ==")
res = put([])
check("an empty list is accepted", res.status_code == 200, str(res.status_code))
check("and returns nothing", res.get_json() == [], str(res.get_json()))
check("with every slot cleared", set(orders().values()) == {None}, str(orders()))


failed = [c for c in checks if not c[1]]
print(f"\n{len(checks) - len(failed)}/{len(checks)} checks passed")
if failed:
    for label, _, detail in failed:
        print(f"  FAILED: {label} {detail}")
    sys.exit(1)
