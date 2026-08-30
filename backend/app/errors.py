from flask import jsonify


class ApiError(Exception):
    def __init__(self, message: str, status: int = 400, details: dict | None = None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.details = details or {}


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(error: ApiError):
        payload = {"error": error.message}
        if error.details:
            payload["details"] = error.details
        return jsonify(payload), error.status

    @app.errorhandler(404)
    def handle_not_found(_error):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(_error):
        return jsonify({"error": "Method not allowed"}), 405
