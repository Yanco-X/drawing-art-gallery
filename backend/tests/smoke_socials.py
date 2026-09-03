"""
The socials list: public to read, replaced whole by the owner.

    .venv/Scripts/python.exe tests/smoke_socials.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["OWNER_API_TOKEN"] = "test-token"

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


def put(body, headers=OWNER):
    return client.put("/api/socials", json=body, headers=headers)


def listed():
    return client.get("/api/socials").get_json()


print("== an empty gallery has no socials ==")
res = client.get("/api/socials")
check("the list is public", res.status_code == 200, str(res.status_code))
check("and starts empty", res.get_json() == [], str(res.get_json()))
check("a visitor cannot write it", put([], headers={}).status_code == 401)


print("\n== adding ==")
res = put(
    [
        {"platform": "Instagram", "label": "Instagram", "url": "instagram.com/x"},
        {"platform": "artstation", "label": "ArtStation", "url": "https://artstation.com/x"},
    ]
)
check("the owner replaces the list", res.status_code == 200, str(res.status_code))
rows = res.get_json()
check("both come back", len(rows) == 2, str(len(rows)))
check("in the order they were sent",
      [r["label"] for r in rows] == ["Instagram", "ArtStation"],
      str([r["label"] for r in rows]))
check("platform is lowercased into a key", rows[0]["platform"] == "instagram",
      rows[0]["platform"])
check("a bare domain gains https", rows[0]["url"] == "https://instagram.com/x",
      rows[0]["url"])
check("displayOrder is not in the shape", "displayOrder" not in rows[0],
      str(sorted(rows[0])))

instagram, artstation = rows[0]["id"], rows[1]["id"]


print("\n== reordering keeps the rows ==")
res = put(
    [
        {"id": artstation, "platform": "artstation", "label": "ArtStation", "url": "https://artstation.com/x"},
        {"id": instagram, "platform": "instagram", "label": "Instagram", "url": "https://instagram.com/x"},
    ]
)
rows = res.get_json()
check("the order swapped", [r["label"] for r in rows] == ["ArtStation", "Instagram"],
      str([r["label"] for r in rows]))
check("and the ids survived, so this was an edit not a rebuild",
      {r["id"] for r in rows} == {instagram, artstation})


print("\n== editing and removing ==")
res = put([{"id": instagram, "platform": "instagram", "label": "IG", "url": "https://instagram.com/y"}])
rows = res.get_json()
check("what is absent is deleted", len(rows) == 1, str(len(rows)))
check("what is present is updated in place",
      rows[0]["id"] == instagram and rows[0]["label"] == "IG",
      str(rows[0]))
check("the public list agrees", listed() == rows)


print("\n== what is refused ==")
cases = [
    ("a javascript url", [{"platform": "x", "label": "X", "url": "javascript:alert(1)"}]),
    ("a data url", [{"platform": "x", "label": "X", "url": "data:text/html,<script>"}]),
    ("an uppercased javascript url",
     [{"platform": "x", "label": "X", "url": "JavaScript:alert(1)"}]),
    ("a url with no host", [{"platform": "x", "label": "X", "url": "https://"}]),
    ("a missing label", [{"platform": "x", "label": "  ", "url": "https://x.com"}]),
    ("a missing platform", [{"platform": "", "label": "X", "url": "https://x.com"}]),
    ("a missing url", [{"platform": "x", "label": "X", "url": ""}]),
    ("an object instead of a list", {"platform": "x"}),
    ("a list of strings", ["https://x.com"]),
    ("more than the cap", [
        {"platform": "x", "label": f"X{i}", "url": "https://x.com"} for i in range(21)
    ]),
]
for label, body in cases:
    status = put(body).status_code
    check(f"{label} is refused", status == 400, str(status))

check("and none of it changed the list", [r["label"] for r in listed()] == ["IG"],
      str([r["label"] for r in listed()]))

check("an unknown platform is accepted, since the icon falls back",
      put([{"platform": "somewhere-new", "label": "Somewhere", "url": "https://example.com"}])
      .status_code == 200)
check("emptying the list is allowed", put([]).status_code == 200 and listed() == [])


passed = sum(1 for _, ok, _ in checks if ok)
print(f"\n{passed}/{len(checks)} checks passed")
for label, ok, detail in checks:
    if not ok:
        print(f"  FAILED: {label}" + (f" -- {detail}" if detail else ""))
sys.exit(0 if passed == len(checks) else 1)
