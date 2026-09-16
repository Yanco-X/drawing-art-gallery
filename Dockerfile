# The frontend is built once here and served by the Flask process that
# answers /api, so the site and the API share an origin in production.

FROM node:22-alpine AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.14-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY backend/requirements.lock backend/requirements.lock
RUN pip install --no-cache-dir -r backend/requirements.lock
COPY backend/ backend/
COPY --from=frontend /build/dist frontend/dist
WORKDIR /app/backend

# One worker keeps the sign-in and visit limits exact, since both count per
# process. The threads carry browsing while an upload builds its tiles.
CMD ["sh", "-c", "alembic upgrade head && gunicorn --bind 0.0.0.0:${PORT:-8080} --workers 1 --threads 4 --timeout 120 'app:create_app()'"]
