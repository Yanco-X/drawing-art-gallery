# SketchyArt Gallery -- Backend

Flask REST API over PostgreSQL. Serves pieces and collections to the React
frontend in `../frontend`.

## Requirements

- Python 3.11+ (developed on 3.14)
- PostgreSQL 17, most easily via the bundled `docker-compose.yml`

## Setup

```bash
cd backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt  # macOS/Linux

cp .env.example .env        # then set OWNER_API_TOKEN
```

Start the database (needs Docker Desktop running):

```bash
docker compose up -d db
```

Apply migrations:

```bash
.venv/Scripts/alembic.exe upgrade head
```

Run the API:

```bash
.venv/Scripts/python.exe run.py     # http://localhost:5000
```

## Verifying without PostgreSQL

The models use SQLAlchemy's generic `Uuid` type rather than the Postgres
dialect one, so the whole API can be exercised against in-memory SQLite:

```bash
.venv/Scripts/python.exe tests/smoke_collections.py
```

That runs the real app and real models end to end -- only the database URL
differs. Useful before the database container is up.

## Auth

Real authentication does not exist yet. Owner-only endpoints are gated on a
shared secret sent as `X-Owner-Token`, checked against `OWNER_API_TOKEN`.

It **fails closed**: with `OWNER_API_TOKEN` unset, every write endpoint
returns 503 rather than allowing anonymous writes. Replace `app/auth.py`
wholesale when sessions land; nothing else depends on how it works.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | - | Liveness |
| GET | `/api/pieces` | - | All pieces, newest first |
| GET | `/api/pieces/<id>` | - | One piece |
| GET | `/api/collections` | - | Summaries; `?includePrivate=1` for drafts |
| GET | `/api/collections/<slug>` | - | Detail with pieces in curated order |
| POST | `/api/collections` | owner | Create |
| PATCH | `/api/collections/<id>` | owner | Name, slug, description, cover, visibility |
| PUT | `/api/collections/<id>/pieces` | owner | Replace membership and order |
| DELETE | `/api/collections/<id>` | owner | Delete the grouping, never the pieces |

### Curation

`PUT /api/collections/<id>/pieces` takes the entire membership list in the
order it should appear:

```json
{ "pieceIds": ["uuid-a", "uuid-b", "uuid-c"], "coverPieceId": "uuid-b" }
```

One idempotent write for "pick the pieces, arrange them, save", rather than
a sequence of add/remove calls that could half-apply. `display_order` is
rewritten contiguously from 0. A cover that is not a member is rejected, and
a cover that stops being a member is reset to the first-piece fallback.

## Migrations

```bash
.venv/Scripts/alembic.exe revision --autogenerate -m "what changed"
.venv/Scripts/alembic.exe upgrade head
.venv/Scripts/alembic.exe downgrade -1
```

The URL comes from `DATABASE_URL`; `alembic.ini` holds no credentials.
Set `ALEMBIC_DATABASE_URL` to point a migration run somewhere else.
