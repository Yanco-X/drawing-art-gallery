"""
Read dpi, colour mode and capture device from every piece's original.

Pieces uploaded before the owner's file panel existed have nulls there. The
values come from the archived original's header, the same read the upload
does, so a backfilled piece is indistinguishable from a new one.

    .venv/Scripts/python.exe scripts/backfill_file_details.py --dry-run
    .venv/Scripts/python.exe scripts/backfill_file_details.py

Safe to re-run: every piece is read again and overwritten with what its file
says. Each piece is committed on its own.
"""

import argparse
import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from PIL import Image  # noqa: E402
from sqlalchemy import select  # noqa: E402

from app import create_app  # noqa: E402
from app.db import SessionLocal  # noqa: E402
from app.models import Piece  # noqa: E402
from app.services.images import read_file_details  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what each file says without writing it.",
    )
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        storage = app.extensions["storage"]
        session = SessionLocal()
        failed = []

        for piece in session.scalars(select(Piece).order_by(Piece.created_at)):
            try:
                with Image.open(io.BytesIO(storage.read(piece.key("original")))) as image:
                    details = read_file_details(image)
                if not args.dry_run:
                    piece.take_file_details(details)
                    session.commit()
            except Exception as exc:  # noqa: BLE001
                session.rollback()
                failed.append((piece.title, exc))
                print(f"  {piece.title[:38]:<40}FAILED: {exc}")
                continue
            print(
                f"  {piece.title[:38]:<40}{details.dpi or '-':>6} dpi"
                f"  {details.color_mode:<6}{details.capture_device or ''}"
            )

        if args.dry_run:
            print("\nDry run. Nothing was written.")
            return 0

        print(f"\n{len(failed)} failed.")
        return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
