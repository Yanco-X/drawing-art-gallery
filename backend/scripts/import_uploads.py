"""
One-off backfill for artwork that predates the upload pipeline.

The files in backend/uploads were dropped there by hand: no rows, no
derivatives, no recorded dimensions. This runs each through the same
process_upload the API uses, so imported work is indistinguishable from
uploaded work.

    .venv/Scripts/python.exe scripts/import_uploads.py --dry-run
    .venv/Scripts/python.exe scripts/import_uploads.py
    .venv/Scripts/python.exe scripts/import_uploads.py --replace

Metadata comes from scripts/import-manifest.json when it exists, and from
the filename otherwise. A dry run writes the manifest if it is missing, so
the intended workflow is: dry run, edit the manifest, import. That matters
more than it should, because there is no PATCH endpoint yet -- re-running
with --replace is currently the only way to correct a title.
"""

import argparse
import json
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select  # noqa: E402

from app import create_app  # noqa: E402
from app.db import SessionLocal  # noqa: E402
from app.models import Piece, Tag  # noqa: E402
from app.services.images import InvalidImage, process_upload  # noqa: E402
from app.services.slugs import slugify  # noqa: E402

MANIFEST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "import-manifest.json")

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".tiff", ".bmp"}

# Titles carried over from frontend/src/lib/mock-data.ts, which is what the
# gallery has been showing. Only these three were real; every other title
# there was invented, along with all of the media and years, so none of that
# is imported. An empty medium renders as nothing rather than as a guess.
KNOWN_TITLES = {
    "1000013215.jpg": "Yankito Night Calls",
    "Night Calls V.jpg": "Night Calls V",
    "Night_Calls_IX.jpeg": "Night Calls IX",
    # Not from mock-data, which marked this one a placeholder -- taken from
    # the filename, which is the owner's own naming and so is real.
    "savy.jpeg": "Savy",
}

ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]


def is_image(name: str) -> bool:
    return os.path.splitext(name)[1].lower() in IMAGE_SUFFIXES


def source_files(directory: str) -> list[str]:
    """Loose files only. Piece directories are storage output, not input."""
    return sorted(
        name
        for name in os.listdir(directory)
        if is_image(name) and os.path.isfile(os.path.join(directory, name))
    )


def build_manifest(names: list[str]) -> dict:
    """Seeded so an import reproduces the titles the gallery already shows."""
    manifest = {}
    untitled = 0
    for name in names:
        title = KNOWN_TITLES.get(name)
        if title is None:
            untitled += 1
            suffix = ROMAN[untitled - 1] if untitled <= len(ROMAN) else str(untitled)
            title = f"Untitled Study {suffix}"
        manifest[name] = {
            "title": title,
            "description": "",
            "medium": "",
            "year": None,
            "tags": [],
        }
    return manifest


def resolve_tags(session, names: list[str]) -> list[Tag]:
    tags = []
    for raw in names:
        name = raw.strip()
        if not name:
            continue
        slug = slugify(name)
        tag = session.scalar(select(Tag).where(Tag.slug == slug))
        if tag is None:
            tag = Tag(name=name, slug=slug)
            session.add(tag)
        tags.append(tag)
    return tags


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="report only; write the manifest if absent")
    parser.add_argument("--replace", action="store_true", help="delete an existing piece with the same title first")
    args = parser.parse_args()

    app = create_app()
    directory = app.config["UPLOAD_DIR"]
    storage = app.extensions["storage"]

    names = source_files(directory)
    if not names:
        print(f"No image files in {directory}")
        return 0

    if os.path.exists(MANIFEST):
        with open(MANIFEST, encoding="utf-8") as handle:
            manifest = json.load(handle)
        print(f"manifest : {MANIFEST}")
    else:
        manifest = build_manifest(names)
        if args.dry_run:
            with open(MANIFEST, "w", encoding="utf-8") as handle:
                json.dump(manifest, handle, indent=2, ensure_ascii=False)
            print(f"manifest : written to {MANIFEST} -- edit it, then import")
        else:
            print("manifest : none, deriving from filenames")

    print(f"source   : {directory}")
    print(f"storage  : {type(storage).__name__}")
    print(f"files    : {len(names)}\n")

    with app.app_context():
        session = SessionLocal()
        existing = {title for (title,) in session.execute(select(Piece.title))}

        imported = skipped = failed = 0
        for name in names:
            entry = manifest.get(name) or build_manifest([name])[name]
            title = (entry.get("title") or os.path.splitext(name)[0]).strip()

            if title in existing:
                if not args.replace:
                    print(f"  skip    {name}  -- '{title}' already imported")
                    skipped += 1
                    continue
                for row in session.scalars(select(Piece).where(Piece.title == title)):
                    storage.delete_prefix(row.storage_prefix)
                    session.delete(row)
                session.commit()

            path = os.path.join(directory, name)
            with open(path, "rb") as handle:
                raw = handle.read()

            try:
                processed = process_upload(raw)
            except InvalidImage as exc:
                print(f"  FAIL    {name}  -- {exc}")
                failed += 1
                continue

            if args.dry_run:
                print(
                    f"  would   {name}  -> '{title}'  "
                    f"{processed.width}x{processed.height}  "
                    f"{len(raw) / 1024 / 1024:.1f} MB"
                )
                imported += 1
                continue

            # Same ordering as the API: id first, objects next, row last, so
            # a failure leaves sweepable orphans rather than a broken row.
            piece = Piece(
                id=uuid.uuid4(),
                title=title,
                description=(entry.get("description") or "").strip() or None,
                original_ext=processed.original_ext,
                byte_size=processed.byte_size,
                medium=(entry.get("medium") or "").strip() or None,
                year=entry.get("year"),
                width=processed.width,
                height=processed.height,
            )

            for rendition in processed.renditions:
                storage.save(piece.key(rendition.variant), rendition.data, rendition.content_type)

            try:
                piece.tags = resolve_tags(session, entry.get("tags") or [])
                session.add(piece)
                session.commit()
            except Exception as exc:
                session.rollback()
                storage.delete_prefix(piece.storage_prefix)
                print(f"  FAIL    {name}  -- {exc}")
                failed += 1
                continue

            thumb = next(r for r in processed.renditions if r.variant == "thumb")
            print(
                f"  import  {name}  -> '{title}'  "
                f"{processed.width}x{processed.height}  "
                f"{len(raw) / 1024 / 1024:.1f} MB -> {len(thumb.data) / 1024:.0f} KB thumb"
            )
            existing.add(title)
            imported += 1

        session.close()

    verb = "would import" if args.dry_run else "imported"
    print(f"\n{verb} {imported}, skipped {skipped}, failed {failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
