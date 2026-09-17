"""
Off-site backup: the database, and the originals the site could delete.

Every derivative is computed from an archival original, and a deleted piece
takes its original with it, so those two are what cannot be recovered from
anything else. Tiles and renditions are left out deliberately: they are
rebuilt from the originals.

    .venv/Scripts/python.exe scripts/backup.py --dry-run
    .venv/Scripts/python.exe scripts/backup.py

On Railway this runs as a scheduled service from the same image, on its own
credentials: a database account that may only read, and an R2 token the web
service never holds. Age is handled by a lifecycle rule on the bucket.
"""

import argparse
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

import boto3

REQUIRED = (
    "BACKUP_DATABASE_URL",
    "BACKUP_S3_BUCKET",
    "BACKUP_S3_ENDPOINT",
    "BACKUP_S3_ACCESS_KEY",
    "BACKUP_S3_SECRET_KEY",
    "S3_PRIVATE_BUCKET",
)


def backup_client():
    return boto3.client(
        "s3",
        endpoint_url=os.environ["BACKUP_S3_ENDPOINT"],
        aws_access_key_id=os.environ["BACKUP_S3_ACCESS_KEY"],
        aws_secret_access_key=os.environ["BACKUP_S3_SECRET_KEY"],
        region_name=os.getenv("BACKUP_S3_REGION", "auto"),
    )


def dump_database(destination: str) -> None:
    # --no-owner and --no-acl let the dump restore into a database whose roles
    # are named differently, which a scratch database always is.
    subprocess.run(
        [
            "pg_dump",
            "--format=custom",
            "--no-owner",
            "--no-acl",
            "--file",
            destination,
            os.environ["BACKUP_DATABASE_URL"],
        ],
        check=True,
    )


def keys_in(client, bucket: str, prefix: str) -> set[str]:
    found = set()
    for page in client.get_paginator("list_objects_v2").paginate(
        Bucket=bucket, Prefix=prefix
    ):
        for item in page.get("Contents") or []:
            found.add(item["Key"])
    return found


def copy_new_originals(client, dry_run: bool) -> int:
    source = os.environ["S3_PRIVATE_BUCKET"]
    destination = os.environ["BACKUP_S3_BUCKET"]
    already = {k[len("originals/") :] for k in keys_in(client, destination, "originals/")}
    copied = 0
    for key in sorted(keys_in(client, source, "") - already):
        print(f"originals/{key}")
        if not dry_run:
            # An original is written once and never rewritten, so a key the
            # backup already holds needs no comparison.
            client.copy_object(
                Bucket=destination,
                Key=f"originals/{key}",
                CopySource={"Bucket": source, "Key": key},
            )
        copied += 1
    return copied


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Dump to a temporary file and list what would be copied, uploading nothing.",
    )
    args = parser.parse_args()

    missing = [name for name in REQUIRED if not os.getenv(name)]
    if missing:
        print(f"Not configured: {', '.join(missing)}", file=sys.stderr)
        return 2

    client = backup_client()
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    with tempfile.TemporaryDirectory() as workspace:
        dump = os.path.join(workspace, f"{stamp}.dump")
        dump_database(dump)
        size = os.path.getsize(dump)
        key = f"postgres/{stamp}.dump"
        print(f"{key} ({size / 1024 / 1024:.1f} MB)")
        if not args.dry_run:
            client.upload_file(dump, os.environ["BACKUP_S3_BUCKET"], key)

    copied = copy_new_originals(client, args.dry_run)
    verb = "would copy" if args.dry_run else "copied"
    print(f"Database dumped, {verb} {copied} original(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
