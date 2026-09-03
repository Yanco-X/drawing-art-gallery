import os

from flask import Flask, jsonify, send_from_directory

from .api import api_bp
from .auth import init_auth
from .cli import register_cli
from .config import Config
from .db import SessionLocal, init_engine
from .errors import register_error_handlers
from .ratelimit import AttemptLimiter
from .storage import LocalStorage, build_storage


def create_app(
    config_object=Config,
    database_url: str | None = None,
    engine_options: dict | None = None,
    storage=None,
) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_object)

    init_engine(database_url or app.config["DATABASE_URL"], **(engine_options or {}))

    app.extensions["storage"] = storage or build_storage(config_object)
    app.extensions["login_attempts"] = AttemptLimiter(
        app.config["LOGIN_MAX_ATTEMPTS"], app.config["LOGIN_ATTEMPT_WINDOW"]
    )

    init_auth(app)
    register_cli(app)
    register_error_handlers(app)
    app.register_blueprint(api_bp)

    @app.get("/api/health")
    def health():
        return jsonify(
            {"status": "ok", "storage": app.config.get("STORAGE_BACKEND", "local")}
        )

    # Phase 1 only. Serving bytes from Flask is fine for development and
    # wrong for production, where a reverse proxy or CDN should do it. With
    # the s3 backend this route is not registered at all -- objects are
    # fetched straight from the bucket.
    if isinstance(app.extensions["storage"], LocalStorage):
        upload_dir = app.config["UPLOAD_DIR"]

        @app.get("/media/<path:key>")
        def media(key: str):
            os.makedirs(upload_dir, exist_ok=True)
            return send_from_directory(upload_dir, key)

    @app.teardown_appcontext
    def remove_session(exception=None):
        # scoped_session keeps one session per thread; drop it at the end of
        # every request so a failed request cannot leak state into the next.
        if exception is not None:
            SessionLocal.rollback()
        SessionLocal.remove()

    return app
