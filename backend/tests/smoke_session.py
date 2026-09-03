"""
Owner sessions, with the development token switched off.

OWNER_API_TOKEN is empty here on purpose: it is the credential the other
suites use, and this is the one place that proves the gallery does not
depend on it. What holds the door in production is only what passes here.

    .venv/Scripts/python.exe tests/smoke_session.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["OWNER_API_TOKEN"] = ""

from sqlalchemy.pool import StaticPool  # noqa: E402
from werkzeug.security import generate_password_hash  # noqa: E402

from app import create_app  # noqa: E402
from app.config import Config  # noqa: E402
from app.db import Base, SessionLocal  # noqa: E402
from app.models import User  # noqa: E402
from app.storage import MemoryStorage  # noqa: E402

PASSWORD = "__session_fixture__ correct horse"
checks = []


def check(label, condition, detail=""):
    checks.append((label, bool(condition), detail))
    print(f"  [{'PASS' if condition else 'FAIL'}] {label}" + (f" -- {detail}" if detail else ""))


class TestConfig(Config):
    OWNER_API_TOKEN = ""
    SECRET_KEY = "__session_fixture__"
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

with app.app_context():
    session = SessionLocal()
    session.add(
        User(
            email="owner@example.test",
            password_hash=generate_password_hash(PASSWORD),
            role="owner",
        )
    )
    session.commit()


def sign_in(password):
    return client.post("/api/session", json={"password": password})


def role():
    return client.get("/api/session/me").get_json()["role"]


def a_mutation():
    return client.post("/api/collections", json={"name": "__session_fixture__ set"})


print("== before signing in ==")
check("the caller is a visitor", role() == "visitor")
check("and cannot write", a_mutation().status_code == 401)
check(
    "a bogus token buys nothing now that none is configured",
    client.post(
        "/api/collections",
        json={"name": "__session_fixture__ nope"},
        headers={"X-Owner-Token": "test-token"},
    ).status_code == 401,
)

print("\n== a wrong password ==")
res = sign_in("not it")
check("is refused", res.status_code == 401, str(res.status_code))
check(
    "and says nothing about why",
    "password" not in res.get_json()["error"].lower()
    and "owner" not in res.get_json()["error"].lower(),
    res.get_json()["error"],
)
check("no session was started", role() == "visitor")

print("\n== the right password ==")
res = sign_in(PASSWORD)
check("is accepted", res.status_code == 200, str(res.status_code))
check("and answers with the role", res.get_json() == {"role": "owner"})
cookies = " ".join(res.headers.getlist("Set-Cookie"))
check("a remember cookie is issued, so closing the tab does not sign out",
      "remember_token" in cookies, cookies[:80])
check("the caller is now the owner", role() == "owner")

print("\n== what the session unlocks ==")
res = a_mutation()
check("a mutation succeeds", res.status_code == 201, str(res.status_code))
check(
    "drafts can be listed",
    client.get("/api/collections?includePrivate=1").status_code == 200,
)
check(
    "and the reserve",
    client.get("/api/pieces?waived=true").status_code == 200,
)

print("\n== signing out ==")
res = client.delete("/api/session")
check("returns the visitor role", res.get_json() == {"role": "visitor"},
      str(res.get_json()))
check("the caller is a visitor again", role() == "visitor")
check("and cannot write", a_mutation().status_code == 401)
check("signing out twice is refused, like any owner route",
      client.delete("/api/session").status_code == 401)

print("\n== repeated guessing ==")
app.extensions["login_attempts"].clear("127.0.0.1")
attempts = [sign_in("wrong").status_code for _ in range(TestConfig.LOGIN_MAX_ATTEMPTS)]
check(
    f"the first {TestConfig.LOGIN_MAX_ATTEMPTS} wrong guesses are refused as wrong",
    attempts == [401] * TestConfig.LOGIN_MAX_ATTEMPTS,
    str(attempts),
)
check("the next one is refused as too many", sign_in("wrong").status_code == 429)
check(
    "and the right password is refused too, while the window holds",
    sign_in(PASSWORD).status_code == 429,
)
app.extensions["login_attempts"].clear("127.0.0.1")
check("cleared, the owner can sign in again", sign_in(PASSWORD).status_code == 200)


passed = sum(1 for _, ok, _ in checks if ok)
print(f"\n{passed}/{len(checks)} checks passed")
for label, ok, detail in checks:
    if not ok:
        print(f"  FAILED: {label}" + (f" -- {detail}" if detail else ""))
sys.exit(0 if passed == len(checks) else 1)
