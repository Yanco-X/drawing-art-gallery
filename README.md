# YanCurations

A personal art gallery for one artist's pencil drawings — a quiet room to hang
them in, rather than a feed to scroll.

It is built and maintained as a learning project. There is nothing for sale, no
advertising, and no account to create: visitors read, and a single owner curates.

---

## What it does

**For a visitor.** The landing page opens on a spotlight band of pinned pieces,
then the collections, then the whole wall as a masonry grid. Pieces can be
filtered by text, year, tag or collection, and sorted, all in the browser. Any
drawing opens to a gallery-style wall label, and again into a full-window
viewer backed by pre-cut zoom tiles, so a detail holds up at full resolution.
The grid remembers where you were when you come back from a piece.

**For the owner.** Everything above plus upload, editing, collections, a
drag-and-drop curation board that sets the gallery's order, a two-stage removal
flow (a piece is *waived* out of the gallery before it can be deleted), and a
visit dashboard. There is no login screen and no sign-in link — the owner's way
in is deliberately not advertised, and a visitor sees no trace that an owner
exists.

**Throughout.** Two themes of equal standing, light and dark. An English and
Spanish about page and privacy page. The page's structural rules are the
owner's own pencil strokes, photographed and masked over the text colour, so
they carry the theme.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind v4, React Router 7 |
| Backend | Python 3.14, Flask, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL 17 |
| Objects | S3-compatible — MinIO locally, Cloudflare R2 planned for production |
| Viewer | OpenSeadragon over Deep Zoom tiles cut at upload |

No UI component library and no CSS framework beyond Tailwind's utilities. The
design system is written down in `context/DESIGN.md` and lives in one stylesheet.

## Running it locally

Three steps, in order. Postgres and MinIO must be up before the backend is
useful: SQLAlchemy's engine is lazy, so `flask run` starts happily without them
and the first request touching the database is what fails.

```bash
# 1. Infrastructure — from backend/, where the compose file lives
cd backend
docker compose up -d          # postgres:5432, minio:9000, console:9001

# 2. Backend — with the virtual environment active
source .venv/Scripts/activate # PowerShell: .\.venv\Scripts\Activate.ps1
alembic upgrade head
flask --app app run --port 5000

# 3. Frontend — from frontend/
cd ../frontend
npm install
npm run dev                   # :5173, proxying /api and /media to :5000
```

Check the backend with `curl http://127.0.0.1:5000/api/health`.

Configuration lives in `backend/.env`; `backend/.env.example` names the
variables and holds no values. Nothing in `frontend/` is secret — Vite inlines
every `VITE_*` variable into the bundle every visitor downloads.

## Tests

Eleven suites, no test framework — each is a script that runs against a live
development server, prints its results and exits non-zero on failure.

```bash
cd backend
.venv/Scripts/python.exe tests/smoke_visitor.py
```

`smoke_visitor.py` is the one that keeps the project honest: it asserts the
visitor contract, that nothing an owner can see leaks to someone who is not
signed in. `STATUS.md` section 8 lists the rest with their counts.

## Where the documentation is

The reasoning behind decisions is recorded in `context/`, not in commit
messages, and not in comments above the code they explain.

| File | What it holds |
|---|---|
| [`AGENTS.md`](AGENTS.md) | The working agreement for humans and agents. Read first |
| [`context/MAP.md`](context/MAP.md) | Which files hold which feature. Read before searching |
| [`STATUS.md`](STATUS.md) | What is built, what is broken, how to run it |
| [`context/DESIGN.md`](context/DESIGN.md) | Tokens, type, spacing, motion, every component pattern |
| [`context/AUTH.md`](context/AUTH.md) | Sessions, the visitor contract, the invisible way in |
| [`context/STORAGE.md`](context/STORAGE.md) | Keys, buckets, adapters, derivatives |
| [`context/METRICS.md`](context/METRICS.md) | Visit counting, and how to read the numbers |

## Status

The gallery is feature-complete and running locally. The first public
deployment — Railway for the app and Postgres, Cloudflare R2 for the images —
is planned and currently paused for a round of design work; `context/current-feature.md`
carries the plan.

## A note on security

This repository is public, and the site will be. Its security rests on the
password, the session and the server's checks — never on the code being
secret. Credentials live only in `backend/.env`, which is not tracked.

## Licence

The code is MIT — see [`LICENSE`](LICENSE).

That covers the code only. **The drawings are the artist's own work and are not
licensed for reuse**, nor is the hand-drawn logo and stroke set in `logos/` and
`pencil-lines/`. The fonts carry their own licences, both in
`frontend/public/fonts/`: Instrument Sans under the SIL Open Font License,
Satoshi under the ITF Free Font License.
