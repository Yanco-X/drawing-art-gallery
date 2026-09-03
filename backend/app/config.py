import os
import secrets
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

DEFAULT_DATABASE_URL = (
    "postgresql+psycopg://sketchyart:sketchyart@localhost:5432/sketchyart"
)


class Config:
    """Runtime settings, read once from the environment."""

    DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"

    # Signs the session cookie. Absent, a new key is minted per process, so
    # sessions do not survive a restart -- annoying rather than unsafe, which
    # is the right way round for a missing secret. Production must set it.
    SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_hex(32)

    # Development and test credential, kept so the smoke suites run against
    # the owner endpoints without driving a login. It must be unset in
    # production: see context/AUTH.md section 7.
    OWNER_API_TOKEN = os.getenv("OWNER_API_TOKEN", "")

    # Lax, not Strict: Strict withholds the cookie on inbound links, so
    # arriving from a message or a bookmark would show the owner a
    # logged-out gallery until they navigated internally. Every mutation is
    # POST, PATCH, PUT or DELETE, which Lax already refuses cross-site.
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.getenv("COOKIE_SECURE", "0") == "1"
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = "Lax"
    REMEMBER_COOKIE_SECURE = SESSION_COOKIE_SECURE
    REMEMBER_COOKIE_DURATION = timedelta(days=int(os.getenv("SESSION_DAYS", "60")))

    # Failed sign-ins tolerated from one client before it is refused.
    LOGIN_MAX_ATTEMPTS = int(os.getenv("LOGIN_MAX_ATTEMPTS", "5"))
    LOGIN_ATTEMPT_WINDOW = timedelta(minutes=int(os.getenv("LOGIN_WINDOW_MIN", "15")))

    # Largest upload accepted, before any processing.
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_UPLOAD_MB", "40")) * 1024 * 1024

    # "local" writes to UPLOAD_DIR and lets Flask serve /media/<key>.
    # "s3" targets any S3-compatible bucket -- MinIO locally, R2 or S3 later.
    STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local")

    # Uploaded artwork on disk during phase 1.
    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

    S3_BUCKET = os.getenv("S3_BUCKET", "sketchyart")
    S3_PRIVATE_BUCKET = os.getenv("S3_PRIVATE_BUCKET", "sketchyart-private")
    S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
    S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "sketchyart")
    S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "sketchyart")
    S3_REGION = os.getenv("S3_REGION", "us-east-1")
    # Set to a CDN domain in production; defaults to the bucket on the endpoint.
    S3_PUBLIC_BASE_URL = os.getenv("S3_PUBLIC_BASE_URL") or None
