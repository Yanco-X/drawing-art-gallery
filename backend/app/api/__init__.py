from flask import Blueprint

from .collections import bp as collections_bp
from .pieces import bp as pieces_bp
from .session import bp as session_bp
from .socials import bp as socials_bp

api_bp = Blueprint("api", __name__, url_prefix="/api")
api_bp.register_blueprint(collections_bp)
api_bp.register_blueprint(pieces_bp)
api_bp.register_blueprint(session_bp)
api_bp.register_blueprint(socials_bp)

__all__ = ["api_bp"]
