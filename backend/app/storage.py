"""
Storage backends.

Every write of image bytes goes through this interface, so swapping local
disk for object storage is a config change rather than surgery. The surface
is deliberately tiny -- the less it exposes, the less can diverge between
backends.
"""

import logging
import os
import shutil
import tempfile
import time
from typing import Protocol

logger = logging.getLogger(__name__)


class Storage(Protocol):
    def save(self, key: str, data: bytes, content_type: str) -> None: ...

    def delete_prefix(self, prefix: str) -> None: ...

    def url_for(self, key: str) -> str: ...

    def exists(self, key: str) -> bool: ...


class LocalStorage:
    """Files under a directory, served by Flask at /media/<key>."""

    def __init__(self, root: str, base_url: str = "/media"):
        self.root = root
        self.base_url = base_url.rstrip("/")

    def _path(self, key: str) -> str:
        # Refuse anything that would climb out of the root.
        full = os.path.normpath(os.path.join(self.root, key))
        if not full.startswith(os.path.normpath(self.root)):
            raise ValueError(f"key escapes storage root: {key!r}")
        return full

    def save(self, key: str, data: bytes, content_type: str) -> None:
        path = self._path(key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        # Write beside the target and rename: a rename within one filesystem
        # is atomic, so a crash cannot leave a half-written file where a
        # complete one should be.
        fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path))
        try:
            with os.fdopen(fd, "wb") as handle:
                handle.write(data)
            os.replace(tmp, path)
        except BaseException:
            if os.path.exists(tmp):
                os.unlink(tmp)
            raise

    def delete_prefix(self, prefix: str) -> None:
        path = self._path(prefix.rstrip("/"))
        if not os.path.exists(path):
            return
        # Windows refuses to unlink a file another handle still has open,
        # and Flask's static file serving can hold one until the response is
        # fully written. POSIX has no such restriction. Retry briefly, then
        # report -- never swallow the failure, or orphaned bytes accumulate
        # with nothing to point at them.
        for attempt in range(3):
            try:
                shutil.rmtree(path)
                return
            except OSError:
                if attempt < 2:
                    time.sleep(0.1 * (attempt + 1))
        try:
            shutil.rmtree(path)
        except OSError as exc:
            logger.warning("orphaned files left at %s: %s", path, exc)

    def url_for(self, key: str) -> str:
        return f"{self.base_url}/{key}"

    def exists(self, key: str) -> bool:
        return os.path.exists(self._path(key))


class S3Storage:
    """
    Any S3-compatible bucket: AWS S3, Cloudflare R2, Backblaze, MinIO.

    Two buckets, split by access. Derivatives are world-readable because
    this is a public gallery; originals are not, and are reached through a
    presigned URL when the owner wants one.

    The split has to be per-bucket rather than per-prefix because bucket
    policies match on a key prefix, and the variant lives in the suffix
    (`<id>/original.jpg` vs `<id>/thumb.webp`). Routing on the key is the
    only thing that keeps the layout derivable from the piece id.
    """

    PUBLIC_READ_POLICY = (
        '{"Version":"2012-10-17","Statement":[{"Effect":"Allow",'
        '"Principal":{"AWS":["*"]},"Action":["s3:GetObject"],'
        '"Resource":["arn:aws:s3:::%s/*"]}]}'
    )

    def __init__(
        self,
        bucket: str,
        private_bucket: str | None = None,
        endpoint_url: str | None = None,
        access_key: str | None = None,
        secret_key: str | None = None,
        region: str = "us-east-1",
        public_base_url: str | None = None,
    ):
        import boto3

        self.bucket = bucket
        self.private_bucket = private_bucket or f"{bucket}-private"
        # Falls back to the bucket URL on the endpoint; set this to a CDN
        # domain in production.
        self.public_base_url = (
            public_base_url or f"{endpoint_url}/{bucket}"
        ).rstrip("/")
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )

    def _bucket_for(self, key: str) -> str:
        return self.private_bucket if "/original." in key else self.bucket

    def ensure_buckets(self) -> None:
        from botocore.exceptions import ClientError

        for name in (self.bucket, self.private_bucket):
            try:
                self.client.head_bucket(Bucket=name)
            except ClientError:
                self.client.create_bucket(Bucket=name)
        # Only the derivative bucket is readable without credentials.
        self.client.put_bucket_policy(
            Bucket=self.bucket, Policy=self.PUBLIC_READ_POLICY % self.bucket
        )

    def save(self, key: str, data: bytes, content_type: str) -> None:
        # Content type must be set explicitly: S3 stores whatever it is told
        # and defaults to binary/octet-stream, which makes browsers download
        # instead of display.
        self.client.put_object(
            Bucket=self._bucket_for(key),
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    def delete_prefix(self, prefix: str) -> None:
        # There are no directories in S3 -- only keys sharing a prefix, which
        # have to be listed and deleted in batches, in both buckets.
        paginator = self.client.get_paginator("list_objects_v2")
        for bucket in (self.bucket, self.private_bucket):
            for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
                contents = page.get("Contents") or []
                if not contents:
                    continue
                self.client.delete_objects(
                    Bucket=bucket,
                    Delete={"Objects": [{"Key": i["Key"]} for i in contents]},
                )

    def url_for(self, key: str) -> str:
        if self._bucket_for(key) != self.bucket:
            # Originals have no stable public URL by design.
            return self.presigned_url(key)
        return f"{self.public_base_url}/{key}"

    def presigned_url(self, key: str, expires_in: int = 300) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self._bucket_for(key), "Key": key},
            ExpiresIn=expires_in,
        )

    def exists(self, key: str) -> bool:
        from botocore.exceptions import ClientError

        try:
            self.client.head_object(Bucket=self._bucket_for(key), Key=key)
            return True
        except ClientError:
            return False


class MemoryStorage:
    """In-process, for tests."""

    def __init__(self, base_url: str = "/media"):
        self.objects: dict[str, bytes] = {}
        self.base_url = base_url.rstrip("/")

    def save(self, key: str, data: bytes, content_type: str) -> None:
        self.objects[key] = data

    def delete_prefix(self, prefix: str) -> None:
        for key in [k for k in self.objects if k.startswith(prefix)]:
            del self.objects[key]

    def url_for(self, key: str) -> str:
        return f"{self.base_url}/{key}"

    def exists(self, key: str) -> bool:
        return key in self.objects


def build_storage(config) -> Storage:
    backend = getattr(config, "STORAGE_BACKEND", "local")
    if backend == "s3":
        storage = S3Storage(
            bucket=config.S3_BUCKET,
            private_bucket=config.S3_PRIVATE_BUCKET,
            endpoint_url=config.S3_ENDPOINT,
            access_key=config.S3_ACCESS_KEY,
            secret_key=config.S3_SECRET_KEY,
            region=config.S3_REGION,
            public_base_url=config.S3_PUBLIC_BASE_URL,
        )
        storage.ensure_buckets()
        return storage
    if backend == "memory":
        return MemoryStorage()
    return LocalStorage(config.UPLOAD_DIR)
