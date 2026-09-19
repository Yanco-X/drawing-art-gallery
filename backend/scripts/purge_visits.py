"""
Delete visit events older than 25 months -- context/METRICS.md section 7.

    .venv/Scripts/python.exe scripts/purge_visits.py

Meant for a daily Railway cron. Safe to re-run: it only ever removes rows
past the retention the privacy page promises.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402
from app.api.visits import purge_expired_events  # noqa: E402
from app.db import SessionLocal  # noqa: E402


def main() -> int:
    app = create_app()
    with app.app_context():
        session = SessionLocal()
        removed = purge_expired_events(session)
        session.commit()
    print(f"Removed {removed} visit events past retention.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
