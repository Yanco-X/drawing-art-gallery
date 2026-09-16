import os
import secrets
from collections.abc import Mapping
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def _with_psycopg(url: str | None) -> str | None:
    # Railway hands out postgresql://; SQLAlchemy wants the driver named.
    if url and url.startswith(("postgres://", "postgresql://")):
        return "postgresql+psycopg://" + url.split("://", 1)[1]
    return url


class Config:
    """Runtime settings, read once from the environment."""

    # Credentials have no default: a fallback here is a password published
    # in a public repository. Unset, the app fails at startup.
    DATABASE_URL = _with_psycopg(os.getenv("DATABASE_URL"))
    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"

    # Signs the session cookie. Absent, a new key is minted per process --
    # fine for one development process, and refused with debug off, where
    # every worker would mint its own: see production_setting_problems.
    SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_hex(32)

    # Development and test credential, kept so the smoke suites run against
    # the owner endpoints without driving a login. It must be unset in
    # production: see context/AUTH.md section 7.
    OWNER_API_TOKEN = os.getenv("OWNER_API_TOKEN", "")

# Lax, not Strict: Strict withholds the cookie on inbound links, so arriving
# from a message would show the owner a logged-out gallery. Every mutation is
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

    # 1 in production, behind Railway's edge, which sets X-Real-IP to the
    # caller. Left at 0 there, every visitor shares the proxy's address; set
    # to 1 anywhere Flask is reachable directly, a client picks its own.
    TRUST_X_REAL_IP = os.getenv("TRUST_X_REAL_IP", "0") == "1"

    VISITS_PER_CLIENT_PER_MINUTE = 60
    VISITS_PER_HOUR = 10_000

    # Largest upload accepted, before any processing.
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_UPLOAD_MB", "40")) * 1024 * 1024

# "local" writes to UPLOAD_DIR and lets Flask serve /media/<key>; "s3" targets
# any S3-compatible bucket.
    STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local")

    # Uploaded artwork on disk during phase 1.
    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

    # The built frontend. Served by this app in production so the site and the
    # API share an origin; absent in development, where Vite serves it.
    FRONTEND_DIST = os.getenv("FRONTEND_DIST") or os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist"
    )

    S3_BUCKET = os.getenv("S3_BUCKET", "sketchyart")
    S3_PRIVATE_BUCKET = os.getenv("S3_PRIVATE_BUCKET", "sketchyart-private")
    S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
    S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
    S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
    S3_REGION = os.getenv("S3_REGION", "us-east-1")
    # Set to a CDN domain in production; defaults to the bucket on the endpoint.
    S3_PUBLIC_BASE_URL = os.getenv("S3_PUBLIC_BASE_URL") or None


def production_setting_problems(env: Mapping[str, str]) -> list[str]:
    """
    What stops the app starting with debug off. Debug on means a development
    machine, where every one of these is allowed.
    """
    if env.get("FLASK_DEBUG", "0") == "1":
        return []
    problems = []
    if not env.get("SECRET_KEY"):
        problems.append("SECRET_KEY is not set")
    if env.get("OWNER_API_TOKEN"):
        problems.append("OWNER_API_TOKEN is set, and it is a development credential")
    if env.get("COOKIE_SECURE", "0") != "1":
        problems.append("COOKIE_SECURE is not 1")
    if not env.get("STORAGE_BACKEND"):
        problems.append("STORAGE_BACKEND is not set")
    return problems
