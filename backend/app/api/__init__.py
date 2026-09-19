from flask import Blueprint

from .about import bp as about_bp
from .collections import bp as collections_bp
from .curation import bp as curation_bp
from .pieces import bp as pieces_bp
from .session import bp as session_bp
from .socials import bp as socials_bp
from .spotlight import bp as spotlight_bp
from .visits import bp as visits_bp

api_bp = Blueprint("api", __name__, url_prefix="/api")
api_bp.register_blueprint(about_bp)
api_bp.register_blueprint(collections_bp)
api_bp.register_blueprint(curation_bp)
api_bp.register_blueprint(pieces_bp)
api_bp.register_blueprint(session_bp)
api_bp.register_blueprint(socials_bp)
api_bp.register_blueprint(spotlight_bp)
api_bp.register_blueprint(visits_bp)

__all__ = ["api_bp"]
