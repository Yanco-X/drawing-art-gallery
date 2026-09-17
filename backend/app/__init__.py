import os
from urllib.parse import urlsplit
from datetime import timedelta

from flask import Flask, abort, jsonify, request, send_file, send_from_directory
from werkzeug.utils import safe_join

from .api import api_bp
from .auth import init_auth
from .cli import register_cli
from .config import Config, production_setting_problems
from .db import SessionLocal, init_engine
from .errors import register_error_handlers
from .ratelimit import AttemptLimiter, WindowCounter
from .storage import LocalStorage, build_storage


def create_app(
    config_object=Config,
    database_url: str | None = None,
    engine_options: dict | None = None,
    storage=None,
) -> Flask:
    if config_object is Config:
        # Built from the environment, so the environment is what is checked.
        # The suites pass subclasses, which set exactly what they test.
        problems = production_setting_problems(os.environ)
        if problems:
            raise RuntimeError(
                "Refusing to start with development settings: " + "; ".join(problems)
            )

    app = Flask(__name__)
    app.config.from_object(config_object)

    init_engine(database_url or app.config["DATABASE_URL"], **(engine_options or {}))

    app.extensions["storage"] = storage or build_storage(config_object)
    app.extensions["login_attempts"] = AttemptLimiter(
        app.config["LOGIN_MAX_ATTEMPTS"], app.config["LOGIN_ATTEMPT_WINDOW"]
    )
    app.extensions["visits_per_client"] = AttemptLimiter(
        app.config["VISITS_PER_CLIENT_PER_MINUTE"], timedelta(minutes=1)
    )
    app.extensions["visits_budget"] = WindowCounter(
        app.config["VISITS_PER_HOUR"], timedelta(hours=1)
    )

    init_auth(app)
    register_cli(app)
    register_error_handlers(app)
    app.register_blueprint(api_bp)

    @app.after_request
    def never_cache_api(response):
        # Owner and visitor get different answers from one address, so
        # nothing between them may keep a copy.
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "private, no-store"
        return response

    policy = content_security_policy(app.config)

    @app.after_request
    def security_headers(response):
        response.headers["Content-Security-Policy"] = policy
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        # An outside link followed from the unlisted sign-in path must not
        # hand that path to the destination.
        response.headers["Referrer-Policy"] = "same-origin"
        if app.config["SESSION_COOKIE_SECURE"]:
            response.headers["Strict-Transport-Security"] = "max-age=31536000"
        return response

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    # Phase 1 only. Serving bytes from Flask is fine for development and
    # wrong for production, where a reverse proxy or CDN should do it. With
    # the s3 backend this route is not registered at all -- objects are
    # fetched straight from the bucket.
    if isinstance(app.extensions["storage"], LocalStorage):
        upload_dir = app.config["UPLOAD_DIR"]

        @app.get("/media/<path:key>")
        def media(key: str):
            # Only the derivatives are public, as the s3 bucket split has it.
            # The archival original never leaves storage by URL.
            if "/original." in key:
                abort(404)
            os.makedirs(upload_dir, exist_ok=True)
            return send_from_directory(upload_dir, key)

    if os.path.isdir(app.config["FRONTEND_DIST"]):
        serve_built_site(app)

    @app.teardown_appcontext
    def remove_session(exception=None):
        # scoped_session keeps one session per thread; drop it at the end of
        # every request so a failed request cannot leak state into the next.
        if exception is not None:
            SessionLocal.rollback()
        SessionLocal.remove()

    return app


def serve_built_site(app: Flask) -> None:
    """
    Serve the built frontend from this app, so the site and the API answer on
    one origin. Registered only where a build exists: in development Vite
    serves the site and proxies /api here.
    """
    dist = app.config["FRONTEND_DIST"]

    @app.get("/")
    def home():
        return site("")

    @app.get("/<path:path>")
    def site(path: str):
        # Unknown API paths keep the API's own JSON 404. Everything else
        # falls back to index.html, which is what a client-side router needs
        # to answer a deep link like /piece/<id>.
        if path.startswith(("api/", "media/")):
            abort(404)

        target = safe_join(dist, path) if path else None
        if target and os.path.isfile(target):
            response = send_from_directory(dist, path)
            if path.startswith("assets/"):
                response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            return response

        response = send_file(os.path.join(dist, "index.html"))
        response.headers["Cache-Control"] = "no-cache"
        return response


def content_security_policy(config) -> str:
    # Images come from the object store's own origin; everything else is this
    # site. React writes style attributes, which need 'unsafe-inline'.
    images = ["'self'", "blob:", "data:"]
    if config["STORAGE_BACKEND"] == "s3":
        base = urlsplit(config["S3_PUBLIC_BASE_URL"] or config["S3_ENDPOINT"])
        images.append(f"{base.scheme}://{base.netloc}")
    return (
        "default-src 'self'; "
        f"img-src {' '.join(images)}; "
        "style-src 'self' 'unsafe-inline'; "
        "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"
    )
