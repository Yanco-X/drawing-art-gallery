"""
The about page: public words and pieces, each half replaced whole by the
owner, a waive taking a piece off it. Against in-memory SQLite and
MemoryStorage.

    .venv/Scripts/python.exe tests/smoke_about.py
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
from app.models import Piece  # noqa: E402

Base.metadata.create_all(db_module.engine)
client = app.test_client()


def upload(title):
    res = client.post(
        "/api/pieces", headers=OWNER, content_type="multipart/form-data",
        data={"title": title, "image": (io.BytesIO(make_image()), "a.jpg")},
    )
    assert res.status_code == 201, res.get_data(as_text=True)
    return res.get_json()["id"]


def page():
    return client.get("/api/about").get_json()


def titles():
    return [p["title"] for p in page()["pieces"]]


def put_text(body, headers=OWNER):
    return client.put("/api/about/text", json=body, headers=headers)


def put_pieces(ids, headers=OWNER):
    return client.put("/api/about/pieces", json={"pieceIds": ids}, headers=headers)


a = upload("Alpha")
b = upload("Beta")
c = upload("Gamma")


print("== an unwritten page ==")
res = client.get("/api/about")
check("a visitor may read it", res.status_code == 200, str(res.status_code))
check("with no words yet", res.get_json()["body"] == "", str(res.get_json()))
check("in either language", res.get_json()["bodyEs"] == "", str(res.get_json()))
check("and no pieces", res.get_json()["pieces"] == [])


print("\n== the words ==")
check("a visitor cannot write them", put_text({"body": "x"}, headers={}).status_code == 401)
res = put_text({"body": "  First.\r\n\r\nSecond.  "})
check("the owner writes them, with no row to begin with",
      res.status_code == 200, str(res.status_code))
check("trimmed, with line endings made plain",
      res.get_json()["body"] == "First.\n\nSecond.", repr(res.get_json()["body"]))
put_text({"body": "Rewritten."})
check("a second write replaces the first", page()["body"] == "Rewritten.", page()["body"])
check("a missing body is refused", put_text({}).status_code == 400)
check("a number is refused", put_text({"body": 5}).status_code == 400)
check("a bare string body is refused", put_text("words").status_code == 400)
long = put_text({"body": "x" * 6001})
check("past 6000 characters is refused", long.status_code == 400, str(long.status_code))
check("and names the limit", "6000" in long.get_json()["error"], str(long.get_json()))
check("6000 exactly is taken", put_text({"body": "y" * 6000}).status_code == 200)
check("the words survived every refusal", len(page()["body"]) == 6000)
check("a NUL is refused here, not at the database",
      put_text({"body": "a\x00b"}).status_code == 400)
check("half a surrogate pair is refused", put_text({"body": "\ud800"}).status_code == 400)
check("an empty page is allowed", put_text({"body": ""}).status_code == 200)


print("\n== the words in Spanish ==")
put_text({"body": "English."})
res = put_text({"bodyEs": "Español."})
check("Spanish is written on its own", res.status_code == 200, str(res.status_code))
check("and leaves the English as it was",
      (page()["body"], page()["bodyEs"]) == ("English.", "Español."), str(page()))
put_text({"body": "Both.", "bodyEs": "Ambos."})
check("both in one write", (page()["body"], page()["bodyEs"]) == ("Both.", "Ambos."))
check("a number in Spanish is refused", put_text({"bodyEs": 5}).status_code == 400)
check("past 6000 in Spanish is refused", put_text({"bodyEs": "x" * 6001}).status_code == 400)
check("an unknown language alone is refused", put_text({"bodyFr": "x"}).status_code == 400)
check("the words survived", (page()["body"], page()["bodyEs"]) == ("Both.", "Ambos."))


print("\n== the pieces, the cover first ==")
check("a visitor cannot pick them", put_pieces([a], headers={}).status_code == 401)
res = put_pieces([c, a])
check("the owner picks them", res.status_code == 200, str(res.status_code))
check("the response is the page, in the order given",
      [p["title"] for p in res.get_json()["pieces"]] == ["Gamma", "Alpha"])
check("which a visitor reads the same", titles() == ["Gamma", "Alpha"], str(titles()))
put_pieces([b])
check("replacing drops what is absent", titles() == ["Beta"], str(titles()))
put_pieces([a, b])
put_pieces([b, a])
check("a swap applies", titles() == ["Beta", "Alpha"], str(titles()))


print("\n== refusals ==")
check("a duplicate is refused", put_pieces([a, a]).status_code == 400)
check("a malformed id is refused", put_pieces(["not-a-uuid"]).status_code == 400)
check("an unknown id is 404",
      put_pieces(["00000000-0000-0000-0000-000000000000"]).status_code == 404)
check("a bare list is refused",
      client.put("/api/about/pieces", json=[a], headers=OWNER).status_code == 400)
many = [upload(f"Extra {n}") for n in range(10)]
res = put_pieces([a, b, c] + many)
check("more than twelve is refused", res.status_code == 400, str(res.status_code))
check("and names the count", "12" in res.get_json()["error"], str(res.get_json()))
check("twelve exactly is taken", put_pieces([a, b] + many).status_code == 200)
put_pieces([b, a])
check("the pieces survived every refusal", titles() == ["Beta", "Alpha"], str(titles()))


print("\n== a waive takes a piece off the page ==")
client.post(f"/api/pieces/{b}/waive", headers=OWNER)
check("the cover is gone, the next piece is the cover", titles() == ["Alpha"], str(titles()))
res = put_pieces([b, a])
check("a waived piece cannot be put back", res.status_code == 409, str(res.status_code))
client.post(f"/api/pieces/{b}/restore", headers=OWNER)
check("and restoring does not return it", titles() == ["Alpha"], str(titles()))
# The waive clears the place. Set one on a waived piece by hand, so the
# read's own filter is the only thing keeping it off the public page.
client.post(f"/api/pieces/{c}/waive", headers=OWNER)
with db_module.SessionLocal() as session:
    session.get(Piece, uuid.UUID(c)).about_order = 1
    session.commit()
check("a waived piece with a place is still not shown", titles() == ["Alpha"], str(titles()))
check("the owner can empty the list", put_pieces([]).status_code == 200)
check("which empties the page", titles() == [], str(titles()))


passed = sum(1 for _, ok, _ in checks if ok)
print(f"\n{passed}/{len(checks)} checks passed")
for label, ok, detail in checks:
    if not ok:
        print(f"  FAILED: {label}" + (f" -- {detail}" if detail else ""))
sys.exit(0 if passed == len(checks) else 1)
