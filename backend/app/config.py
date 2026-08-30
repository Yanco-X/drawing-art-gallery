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

    # Uploaded artwork lives on disk during phase 1; cloud storage later.
    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
