import os

from dotenv import load_dotenv

load_dotenv()

DEFAULT_DATABASE_URL = (
    "postgresql+psycopg://sketchyart:sketchyart@localhost:5432/sketchyart"
)


class Config:
    """Runtime settings, read once from the environment."""

    DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
    OWNER_API_TOKEN = os.getenv("OWNER_API_TOKEN", "")
    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"

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
