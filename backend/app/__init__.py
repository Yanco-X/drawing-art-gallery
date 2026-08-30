from flask import Flask, jsonify

from .api import api_bp
from .config import Config
from .db import SessionLocal, init_engine
from .errors import register_error_handlers


def create_app(
    config_object=Config,
    database_url: str | None = None,
    engine_options: dict | None = None,
) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_object)

    init_engine(database_url or app.config["DATABASE_URL"], **(engine_options or {}))

    register_error_handlers(app)
    app.register_blueprint(api_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    @app.teardown_appcontext
    def remove_session(exception=None):
        # scoped_session keeps one session per thread; drop it at the end of
        # every request so a failed request cannot leak state into the next.
        if exception is not None:
            SessionLocal.rollback()
        SessionLocal.remove()

    return app
