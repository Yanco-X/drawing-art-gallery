"""
Build Deep Zoom pyramids for artwork that predates the detail view.

Every piece uploaded before tiling existed has `tiles_ready = false` and no
tiles in storage, so the detail view falls back to the display rendition for
it. This re-derives the pyramid from the archived original -- the first thing
in the project to read the private bucket back, which is what it has been
holding those files for.

    .venv/Scripts/python.exe scripts/backfill_tiles.py --dry-run
    .venv/Scripts/python.exe scripts/backfill_tiles.py
    .venv/Scripts/python.exe scripts/backfill_tiles.py --force

Safe to interrupt and safe to re-run. Each piece is committed on its own, so
stopping halfway leaves the pieces already done marked ready and the rest
untouched; existing tiles are cleared before writing, so a piece that was
interrupted mid-pyramid is rebuilt cleanly rather than patched.

Only pieces missing tiles are touched, unless --force is given.
"""

import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select  # noqa: E402

from app import create_app  # noqa: E402
from app.db import SessionLocal  # noqa: E402
from app.models import Piece  # noqa: E402
from app.services.images import tile_level_count  # noqa: E402
from app.services.tiles import clear_tiles, write_tiles  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List what would be built, and the tile counts, without writing.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Rebuild pyramids for pieces that already have one.",
    )
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        storage = app.extensions["storage"]
        session = SessionLocal()

        stmt = select(Piece).order_by(Piece.created_at)
        if not args.force:
            stmt = stmt.where(Piece.tiles_ready.is_(False))
        pieces = list(session.scalars(stmt))

        if not pieces:
            print("Every piece already has a pyramid. Nothing to do.")
            return 0

        print(f"{len(pieces)} piece(s) to tile.\n")
        done = 0
        failed = []

        for piece in pieces:
            size = (
                f"{piece.width}x{piece.height}"
                if piece.width and piece.height
                else "unknown"
            )
            levels = (
                tile_level_count(piece.width, piece.height)
                if piece.width and piece.height
                else 0
            )
            label = f"  {piece.title[:38]:<40}{size:>12}{levels:>4} levels"

            if args.dry_run:
                print(label + "   (dry run)")
                continue

            started = time.perf_counter()
            try:
                # Waived pieces are tiled too. The reserve is still the
                # owner's to look at, and a restored piece should not have to
                # wait for a second backfill to become zoomable.
                raw = storage.read(piece.key("original"))
                clear_tiles(storage, piece)
                written = write_tiles(storage, piece, raw)
                piece.tiles_ready = True
                # One commit per piece, so an interrupted run keeps the work
                # it has already finished.
                session.commit()
                done += 1
                elapsed = time.perf_counter() - started
                print(f"{label}{written:>6} tiles{elapsed:>7.1f}s")
            except Exception as exc:  # noqa: BLE001
                session.rollback()
                # Leave the flag false and remove the partial pyramid, so a
                # re-run picks this piece up again from a clean slate.
                try:
                    clear_tiles(storage, piece)
                except Exception:  # noqa: BLE001
                    pass
                failed.append((piece.title, exc))
                print(f"{label}   FAILED: {exc}")

        if args.dry_run:
            print("\nDry run. Nothing was written.")
            return 0

        print(f"\n{done} tiled, {len(failed)} failed.")
        for title, exc in failed:
            print(f"  {title}: {exc}")
        return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
