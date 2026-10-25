"""
The backup job keeps its database password out of argv and out of its log.
pg_dump is stood in for, so nothing touches a database or the network.

    .venv/Scripts/python.exe tests/smoke_backup.py
"""

import os
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))

import backup  # noqa: E402

checks = []


def check(label, condition, detail=""):
    checks.append((label, bool(condition), detail))
    print(f"  [{'PASS' if condition else 'FAIL'}] {label}" + (f" -- {detail}" if detail else ""))


SECRET = "dummy-s3cret"
os.environ["BACKUP_DATABASE_URL"] = f"postgresql://backup_test:{SECRET}@127.0.0.1:5432/gallery?sslmode=require"
seen = {}


def failing_pg_dump(command, env, check):
    seen["command"], seen["env"] = command, env
    raise subprocess.CalledProcessError(1, command)


backup.subprocess.run = failing_pg_dump

print("== a failing pg_dump ==")
try:
    backup.dump_database("unused.dump")
    message = ""
except SystemExit as stop:
    message = str(stop.code)

check("the password is not in argv", not any(SECRET in part for part in seen["command"]))
check("the URL keeps everything else",
      seen["command"][-1] == "postgresql://backup_test@127.0.0.1:5432/gallery?sslmode=require",
      seen["command"][-1])
check("the password reaches pg_dump through PGPASSWORD", seen["env"].get("PGPASSWORD") == SECRET)
check("the failure names only the exit status",
      message == "pg_dump failed with exit status 1." and SECRET not in message, message)

print("\n== a URL with no password ==")
url, env = backup.without_password("postgresql://backup_test@db/gallery")
check("is passed through untouched", url == "postgresql://backup_test@db/gallery", url)

passed = sum(1 for _, ok, _ in checks if ok)
print(f"\n{passed}/{len(checks)} checks passed")
sys.exit(0 if passed == len(checks) else 1)
