from flask import Blueprint

from .collections import bp as collections_bp
from .pieces import bp as pieces_bp

api_bp = Blueprint("api", __name__, url_prefix="/api")
api_bp.register_blueprint(collections_bp)
api_bp.register_blueprint(pieces_bp)

__all__ = ["api_bp"]
