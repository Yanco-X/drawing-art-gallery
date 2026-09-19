"""
Visit events: what is counted, what is dropped, the limits, the cascade, and
the owner's summary -- context/METRICS.md.

    .venv/Scripts/python.exe tests/smoke_visits.py
"""

import io
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["OWNER_API_TOKEN"] = "test-token"

from PIL import Image  # noqa: E402
from sqlalchemy import delete, event, func, select  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app import create_app  # noqa: E402
from app.config import Config  # noqa: E402
from app.db import Base, SessionLocal  # noqa: E402
from app.api.visits import EVENT_RETENTION, purge_expired_events  # noqa: E402
from app.models import VisitEvent  # noqa: E402
from app.ratelimit import AttemptLimiter, WindowCounter  # noqa: E402
from app.storage import MemoryStorage  # noqa: E402

OWNER = {"X-Owner-Token": "test-token"}
DESKTOP = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0 Safari/537.36"
}
PHONE = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1"
}
BOT = {"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"}
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


@event.listens_for(db_module.engine, "connect")
def enforce_foreign_keys(connection, _record):
    # SQLite ignores ON DELETE CASCADE unless asked, and the cascade is under test.
    connection.execute("PRAGMA foreign_keys=ON")


Base.metadata.create_all(db_module.engine)
client = app.test_client()


def upload(title):
    data = {"title": title, "image": (io.BytesIO(make_image()), "a.jpg")}
    res = client.post(
        "/api/pieces", headers=OWNER, content_type="multipart/form-data", data=data
    )
    assert res.status_code == 201, res.get_data(as_text=True)
    return res.get_json()["id"]


def make_collection(name, is_public=True):
    res = client.post(
        "/api/collections", headers=OWNER, json={"name": name, "isPublic": is_public}
    )
    assert res.status_code == 201, res.get_data(as_text=True)
    return res.get_json()["id"]


def send(body, headers=DESKTOP, **kwargs):
    return client.post("/api/visits", json=body, headers=headers, **kwargs)


def stored(**where):
    stmt = select(func.count()).select_from(VisitEvent)
    for column, value in where.items():
        stmt = stmt.where(getattr(VisitEvent, column) == value)
    return SessionLocal().scalar(stmt)


def fresh_limits():
    app.extensions["visits_per_client"] = AttemptLimiter(
        app.config["VISITS_PER_CLIENT_PER_MINUTE"], timedelta(minutes=1)
    )


print("== fixtures, as the owner ==")
hung = upload("Hung")
second = upload("Second")
taken_down = upload("Taken Down")
shown = make_collection("Shown")
draft = make_collection("Draft", is_public=False)
client.post(f"/api/pieces/{taken_down}/waive", headers=OWNER)
visitor = str(uuid.uuid4())
visit = {"kind": "visit", "visitorId": visitor}
check("three pieces, two collections, one waived", True)


print("\n== malformed events are refused ==")
fresh_limits()
malformed = [
    ("a list instead of an object", ["visit"]),
    ("an unknown kind", {"kind": "click", "visitorId": visitor}),
    ("a missing visitor id", {"kind": "visit"}),
    ("a visitor id that is not a uuid", {"kind": "visit", "visitorId": "nope"}),
    ("a piece view with no piece", {"kind": "piece_view", "visitorId": visitor}),
    ("a piece view with a bad piece id",
     {"kind": "piece_view", "visitorId": visitor, "pieceId": "nope"}),
    ("a visit naming a piece", {**visit, "pieceId": hung}),
    ("a collection view naming a piece",
     {"kind": "collection_view", "visitorId": visitor, "pieceId": hung}),
]
for label, body in malformed:
    status = send(body).status_code
    check(f"{label} answers 400", status == 400, str(status))

res = send({**visit, "padding": "x" * 2000})
check("a body over 1 KB answers 413", res.status_code == 413, str(res.status_code))
check("and nothing was stored", stored() == 0, str(stored()))


print("\n== the four kinds are counted ==")
res = send(visit)
check("a visit answers 204 with no body",
      res.status_code == 204 and res.get_data() == b"", str(res.status_code))
send({"kind": "piece_view", "visitorId": visitor, "pieceId": hung}, headers=PHONE)
send({"kind": "detailed_view", "visitorId": visitor, "pieceId": hung})
send({"kind": "collection_view", "visitorId": visitor, "collectionId": shown})
check("all four are stored", stored() == 4, str(stored()))

devices = dict(SessionLocal().execute(select(VisitEvent.kind, VisitEvent.device)).all())
check("a desktop browser is desktop", devices["visit"] == "desktop", str(devices))
check("an iPhone is mobile", devices["piece_view"] == "mobile", str(devices))


print("\n== dropped events look exactly like counted ones ==")
before = stored()
dropped = [
    ("the owner", visit, {**DESKTOP, **OWNER}),
    ("a crawler", visit, BOT),
    ("a client with no user agent", visit, {"User-Agent": ""}),
    ("an unknown piece",
     {"kind": "piece_view", "visitorId": visitor, "pieceId": str(uuid.uuid4())}, DESKTOP),
    ("a waived piece",
     {"kind": "piece_view", "visitorId": visitor, "pieceId": taken_down}, DESKTOP),
    ("a draft collection",
     {"kind": "collection_view", "visitorId": visitor, "collectionId": draft}, DESKTOP),
    ("an unknown collection",
     {"kind": "collection_view", "visitorId": visitor, "collectionId": str(uuid.uuid4())},
     DESKTOP),
]
for label, body, headers in dropped:
    res = send(body, headers=headers)
    check(f"{label} answers 204", res.status_code == 204 and res.get_data() == b"",
          str(res.status_code))
check("and none of them was stored", stored() == before, f"{before} -> {stored()}")


print("\n== one client is limited to sixty a minute ==")
fresh_limits()
statuses = [send(visit).status_code for _ in range(61)]
check("sixty are accepted", statuses[:60] == [204] * 60, str(set(statuses[:60])))
check("the sixty-first answers 429", statuses[60] == 429, str(statuses[60]))
check("another client is unaffected",
      send(visit, environ_base={"REMOTE_ADDR": "10.0.0.2"}).status_code == 204)
check("a forged X-Real-IP is ignored while untrusted",
      send(visit, headers={**DESKTOP, "X-Real-IP": "10.9.9.9"}).status_code == 429)
app.config["TRUST_X_REAL_IP"] = True
check("trusted, X-Real-IP is the client",
      send(visit, headers={**DESKTOP, "X-Real-IP": "10.9.9.9"}).status_code == 204)
app.config["TRUST_X_REAL_IP"] = False


print("\n== every client together is limited per hour ==")
fresh_limits()
app.extensions["visits_budget"] = WindowCounter(2, timedelta(hours=1))
before = stored()
statuses = [send(visit).status_code for _ in range(3)]
check("past the budget still answers 204", statuses == [204] * 3, str(statuses))
check("but only the budget is stored", stored() == before + 2, f"{before} -> {stored()}")
app.extensions["visits_budget"] = WindowCounter(
    app.config["VISITS_PER_HOUR"], timedelta(hours=1)
)

limiter = AttemptLimiter(5, timedelta(minutes=1), max_keys=100)
for _ in range(5):
    limiter.record("10.0.0.1")
for n in range(1000):
    limiter.record(f"10.1.{n // 256}.{n % 256}")
check("a thousand clients cannot grow the limiter past its bound",
      len(limiter._windows) <= 101, str(len(limiter._windows)))
check("and a blocked client stays blocked through the flood",
      limiter.is_blocked("10.0.0.1"))


print("\n== the summary ==")
session = SessionLocal()
session.execute(delete(VisitEvent))
session.commit()
a, b, c, d, e = (uuid.uuid4() for _ in range(5))


def seed(who, kind, day, hour, piece=None, collection=None, device="desktop"):
    session = SessionLocal()
    session.add(
        VisitEvent(
            visitor_id=who,
            kind=kind,
            piece_id=uuid.UUID(piece) if piece else None,
            collection_id=uuid.UUID(collection) if collection else None,
            device=device,
            created_at=datetime(2026, 9, day, hour, tzinfo=timezone.utc),
        )
    )
    session.commit()


seed(a, "visit", 10, 10)
seed(a, "piece_view", 10, 10, piece=hung)
seed(a, "piece_view", 11, 9, piece=hung)
seed(a, "detailed_view", 11, 9, piece=hung)
seed(b, "visit", 11, 12, device="mobile")
seed(b, "piece_view", 11, 12, piece=hung, device="mobile")
seed(b, "piece_view", 11, 12, piece=second, device="mobile")
seed(b, "collection_view", 11, 12, collection=shown, device="mobile")
seed(c, "visit", 9, 8)
seed(d, "visit", 1, 8)
seed(e, "visit", 12, 3)


def summary(query, headers=OWNER):
    return client.get(f"/api/visits/summary?{query}", headers=headers)


res = summary("from=2026-09-10&to=2026-09-11&tz=UTC")
body = res.get_json()
check("the owner reads it", res.status_code == 200, str(res.status_code))
check("unique visitors and visits, beside the previous period",
      body["visitors"] == {"unique": 2, "visits": 2, "previousUnique": 1, "previousVisits": 1},
      str(body["visitors"]))
check("devices are counted per visitor", body["devices"] == {"mobile": 1, "desktop": 1},
      str(body["devices"]))
check(
    "every day in the range has a row",
    body["daily"] == [
        {"date": "2026-09-10", "unique": 1, "visits": 1},
        {"date": "2026-09-11", "unique": 2, "visits": 1},
    ],
    str(body["daily"]),
)
pieces = {p["title"]: (p["viewers"], p["detailedViewers"]) for p in body["pieces"]}
check("a piece seen twice by one visitor counts them once",
      pieces == {"Hung": (2, 1), "Second": (1, 0)}, str(pieces))
check("most viewed first", [p["title"] for p in body["pieces"]] == ["Hung", "Second"])
check("collections carry their viewers",
      [(col["name"], col["viewers"]) for col in body["collections"]] == [("Shown", 1)],
      str(body["collections"]))

res = summary("from=2026-09-10&to=2026-09-11&tz=America/New_York")
check("days are the owner's days, not UTC's",
      res.get_json()["visitors"]["unique"] == 3, str(res.get_json()["visitors"]))

check("a visitor cannot read it",
      summary("from=2026-09-10&to=2026-09-11", headers={}).status_code == 401)
refused = [
    ("no range", "tz=UTC"),
    ("a range running backwards", "from=2026-09-11&to=2026-09-10"),
    ("367 days", "from=2025-09-01&to=2026-09-02"),
    ("a year before 2000", "from=0001-01-01&to=0001-01-05"),
    ("a year past 2999", "from=9999-12-27&to=9999-12-31"),
    ("an unknown zone", "from=2026-09-10&to=2026-09-11&tz=Mars/Olympus"),
    ("a path for a zone", "from=2026-09-10&to=2026-09-11&tz=../../etc/passwd"),
    ("an overlong zone", "from=2026-09-10&to=2026-09-11&tz=" + "A" * 65),
]
for label, query in refused:
    status = summary(query).status_code
    check(f"{label} answers 400", status == 400, str(status))
check("366 days is allowed", summary("from=2025-09-01&to=2026-09-01").status_code == 200)


print("\n== deleting takes the stats with it ==")
client.post(f"/api/pieces/{second}/waive", headers=OWNER)
check("waiving keeps them", stored(piece_id=uuid.UUID(second)) == 1,
      str(stored(piece_id=uuid.UUID(second))))
res = client.delete(f"/api/pieces/{second}", headers=OWNER)
check("the piece is deleted", res.status_code in (200, 204), str(res.status_code))
check("and its stats went with it", stored(piece_id=uuid.UUID(second)) == 0,
      str(stored(piece_id=uuid.UUID(second))))
check("another piece's stats did not", stored(piece_id=uuid.UUID(hung)) == 4,
      str(stored(piece_id=uuid.UUID(hung))))

res = client.delete(f"/api/collections/{shown}", headers=OWNER)
check("the collection is deleted", res.status_code in (200, 204), str(res.status_code))
check("and its stats went with it", stored(collection_id=uuid.UUID(shown)) == 0,
      str(stored(collection_id=uuid.UUID(shown))))


print("\n== retention: 25 months, then gone ==")
now = datetime.now(timezone.utc)
session = SessionLocal()
expired, kept = uuid.uuid4(), uuid.uuid4()
session.add_all([
    VisitEvent(visitor_id=expired, kind="visit", device="desktop",
               created_at=now - EVENT_RETENTION - timedelta(days=1)),
    VisitEvent(visitor_id=kept, kind="visit", device="desktop",
               created_at=now - EVENT_RETENTION + timedelta(days=1)),
])
session.commit()
removed = purge_expired_events(session, now)
session.commit()
check("the purge removes only the expired row", removed == 1, str(removed))
check("an event past retention is gone", stored(visitor_id=expired) == 0,
      str(stored(visitor_id=expired)))
check("an event inside retention stays", stored(visitor_id=kept) == 1,
      str(stored(visitor_id=kept)))

passed = sum(1 for _, ok, _ in checks if ok)
print(f"\n{passed}/{len(checks)} checks passed")
for label, ok, detail in checks:
    if not ok:
        print(f"  FAILED: {label}" + (f" -- {detail}" if detail else ""))
sys.exit(0 if passed == len(checks) else 1)
