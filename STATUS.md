# SketchyArt Gallery — Project Status

A personal art gallery. The owner uploads drawings, the gallery exhibits
them, and collections group them into sets. Built to be lived in rather
than shipped to a market.

**Last updated:** 2026-08-31
**Purpose of this file:** a handoff. It is the current state of the project,
what has been built, and what comes next.

---

## 1. Stack and layout

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind v4, React Router |
| Backend | Python 3.14, Flask, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL 16 (Docker) |
| Objects | MinIO, S3 API (Docker) |

```
drawing-art-gallery/
├── AGENTS.md              working agreement — read this first
├── STATUS.md              this file
├── docker-compose.yml     postgres + minio
├── backend/               20 .py files
│   ├── app/               config, models, schemas, auth, errors, db
│   │   ├── api/           pieces.py, collections.py, helpers.py
│   │   └── services/      storage adapters, images, slugs
│   ├── migrations/        alembic, 3 revisions
│   ├── scripts/           import_uploads.py
│   └── tests/             4 suites, 146 checks
├── frontend/              44 .ts/.tsx files
│   └── src/
│       ├── components/    23
│       ├── contexts/      3  (theme, role, ...)
│       ├── hooks/         6  (incl. useAsync)
│       ├── pages/         5  (Landing, Piece, Waived, Collection, Collections)
│       ├── services/      pieces.ts — the whole API client
│       └── types/         the shared shapes
└── context/               design and specification documents
```

---

## 2. Running it

Four things, in this order.

**1. Infrastructure**

```bash
docker compose up -d          # postgres:5432, minio:9000, console:9001
```

**2. Backend** — from `backend/`

```bash
.venv/Scripts/activate        # Windows
alembic upgrade head          # should report c2574bd3ea94
flask --app app run --port 5000
```

**3. Frontend** — from `frontend/`

```bash
npm run dev                   # :5173, proxies /api and /media to 127.0.0.1:5000
```

**4. Verify**

```bash
curl http://127.0.0.1:5000/api/health
```

### Environment

Two files, both git-ignored, both already present on the owner's machine.
Recreate them from this table if they are missing.

`backend/.env`

| Key | Local value |
|---|---|
| `DATABASE_URL` | `postgresql+psycopg://sketchyart:sketchyart@localhost:5432/sketchyart` |
| `STORAGE_BACKEND` | `s3` |
| `OWNER_API_TOKEN` | `dev-owner-token` |
| `FLASK_DEBUG` | `1` |

`frontend/.env.local`

| Key | Local value |
|---|---|
| `VITE_OWNER_TOKEN` | `dev-owner-token` |

S3 settings fall back to working defaults in `app/config.py` — bucket
`sketchyart`, private bucket `sketchyart-private`, endpoint
`http://localhost:9000`, key and secret both `sketchyart`. MinIO console
credentials are the same pair.

> The proxy targets `127.0.0.1`, not `localhost`. Windows resolves
> `localhost` to `::1` first and Flask binds IPv4 — using the name gives a
> connection refused that looks like a dead backend.

---

## 3. Data model

Seven tables: `pieces`, `collections`, `collection_pieces`, `tags`,
`piece_tags`, `users`, `alembic_version`.

**`pieces`** — id (UUID), title, slug, description, medium, year,
`width_px`, `height_px`, `content_type`, `file_size`, `created_at`,
`waived_at`.

**`collections`** — id, name, slug, description, `is_public`,
`cover_piece_id`, `created_at`.

**`collection_pieces`** — the join, carrying `display_order`. This is the
curation: a collection's order lives here and nowhere else.

`users` exists in the schema and is unused. It is scaffolding for the
authentication that has not been built.

### Migrations

Three revisions, head `c2574bd3ea94`. History is immutable — add a
revision, never edit one.

```
88c31e2c7d76  initial schema
64c7a2ba6f09  drop pieces.original_filename
c2574bd3ea94  add pieces.waived_at
```

### Two model notes worth carrying

**There is no path or URL column.** Keys are derived from the piece id, and
URLs are composed at read time. See §4.

**The session is `expire_on_commit=False`.** After a commit, objects keep
their in-memory state rather than refreshing from the database. This has
already caused one real bug: assigning `piece_id=` instead of `piece=` left
the reverse relationship stale, so a correct database returned an empty
`collections` array. Assign the relationship, not the foreign key, when the
response needs both directions.

---

## 4. Storage

Every piece owns a prefix named by its id, holding three derived keys:

```
<piece-id>/original.<ext>     the upload, untouched      → private bucket
<piece-id>/display.webp       long edge 1600             → public bucket
<piece-id>/thumb.webp         long edge 640              → public bucket
```

Routing is by key suffix: `_bucket_for` sends anything matching `/original.`
to the private bucket and everything else to the public one. The public
bucket policy is bucket-wide (`arn:aws:s3:::sketchyart/*`), which matters
for §11.

Deleting a piece deletes its whole prefix, which is why the layout is a
prefix and not three loose keys.

`app/services/storage.py` defines a Protocol — `save`, `delete_prefix`,
`url_for`, `exists` — with Local, S3 and Memory implementations. Tests run
against Memory; the app runs against S3.

Measured: 32 MB of originals reduce to 3.4 MB of derivatives, and the
landing page pulls 0.60 MB.

Full rationale in [`context/STORAGE.md`](context/STORAGE.md).

---

## 5. API

15 routes. Everything under `/api`. `[owner]` means the route requires the
owner token in `X-Owner-Token`.

### Pieces

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/pieces` | Exhibited only. `?waived=true` `[owner]` returns the reserve, newest waived first |
| `GET` | `/api/pieces/<id>` | Detail, including `collections`. 404 for a waived piece unless owner |
| `POST` | `/api/pieces` `[owner]` | Multipart upload. Derives keys, generates both derivatives |
| `DELETE` | `/api/pieces/<id>` `[owner]` | **409 unless the piece is waived** |
| `POST` | `/api/pieces/<id>/waive` `[owner]` | 409 if already waived |
| `POST` | `/api/pieces/<id>/restore` `[owner]` | Optional `{"collectionIds": [...]}`, one transaction |
| `PUT` | `/api/pieces/<id>/collections` `[owner]` | Set semantics. 409 for a waived piece |

### Collections

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/collections` | Public only. `?includePrivate=1` for all |
| `GET` | `/api/collections/<slug>` | Detail with pieces in `display_order`. 404 for a private collection unless owner |
| `POST` | `/api/collections` `[owner]` | Optional `pieceIds` in pick order, `coverPieceId` |
| `PATCH` | `/api/collections/<id>` `[owner]` | `name`, `slug`, `description`, `isPublic`, `coverPieceId`. The UI never sends `slug`, so a rename keeps the URL |
| `PUT` | `/api/collections/<id>/pieces` `[owner]` | Replaces membership and rewrites order |
| `DELETE` | `/api/collections/<id>` `[owner]` | Removes the grouping. Pieces are untouched |

### Other

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/health` | |
| `GET` | `/media/<key>` | Only registered when `STORAGE_BACKEND=local` |

**Renaming does not change the slug.** `PATCH` only re-slugs when `slug` is
sent explicitly, so a URL survives a rename. Deliberate, and load-bearing
for §10.

**A cover must be a member.** `_apply_cover` enforces it, and every path
that ends membership — replacement, waiving, the `PUT` above — clears a
cover pointing at the departing piece.

**A private collection is a draft, and 404s rather than 403s.** The same
reasoning as a waived piece: 403 would confirm that something sits at the
slug. `piece_detail_to_dict` likewise hides a draft from a visitor and shows
it to the owner, so `is_owner()` is now read on two read paths, not one.

**`coverPieceId` is the chosen cover, `coverImageUrl` the resolved one.**
Null `coverPieceId` with a non-null `coverImageUrl` means no cover was
picked and the first member is standing in. Collapsing the two would render
a fallback as though it were a decision, which is precisely what the arrange
grid must not do.

---

## 6. Frontend

Five routes:

| Route | Page |
|---|---|
| `/home` | `LandingPage` — intro, collections, all work. `/` redirects here |
| `/piece/:id` | `PiecePage` — the artwork, wall label, owner actions |
| `/collections` | `CollectionsIndexPage` — every collection the caller may see |
| `/collections/:slug` | `CollectionPage` — the set's label, then its pieces |
| `/waived` | `WaivedPage` — the reserve, owner only |

Anything unmatched redirects to `/home`.

### Conventions in use

**`services/pieces.ts` is the only place that talks to the API.** Components
never call `fetch`. It exports `ApiError` and throws it on a non-2xx.

**`useAsync(load)` takes the loader function as its dependency.** Pass a
module-level function, or wrap it in `useMemo` — an inline arrow refetches
on every render. `PiecePage` shows both patterns.

**States are `loading | ready | error`**, rendered through `SectionState` so
an empty gallery, a slow one and a broken one all look intentional.

**Locally-created things are prepended, not refetched.** Upload and
collection creation both return the created record, and the landing page
puts it straight on screen.

**`fetchCollections` is what a visitor sees.** `fetchVisibleCollections`
picks it or `fetchAllCollections` on `CURRENT_ROLE`, so the owner's drafts
survive a reload. Module-level, so it can be handed to `useAsync` directly.

**Tailwind v4 with `@theme inline`.** Semantic tokens only — `text-dim`,
`border-line`, `bg-surface` — swapped per theme via `data-theme`. Never a
raw hex in a component.

**One accent, one exception.** `danger` is the single sanctioned second
colour, and it is spent. Contrast verified AA in every theme.

Full vocabulary in [`context/DESIGN.md`](context/DESIGN.md).

---

## 7. Ownership, stated plainly

**There is no authentication.** `CURRENT_ROLE` is a constant, and the owner
token ships inside the JavaScript bundle. Whoever opens the gallery is the
owner.

This is a known and accepted state of the project, not an oversight. Owner
gating is written throughout the backend as a *statement of intent* — so
that when real sessions land, the rules already exist and only the identity
check is replaced. `is_owner()` and `require_owner` in `app/auth.py` are
that single replacement point.

Do not build features that depend on the gate actually holding, and do not
detour into auth without being asked.

---

## 8. Verification

Four suites, 154 checks, no test framework — each is a script that prints
its results and exits non-zero on failure.

```bash
cd backend
.venv/Scripts/python.exe tests/smoke_collections.py    # 54
.venv/Scripts/python.exe tests/smoke_uploads.py        # 35
.venv/Scripts/python.exe tests/smoke_waived.py         # 37
.venv/Scripts/python.exe tests/integration_live.py     # 28
```

The first three run against an in-memory store and a throwaway database.
**`integration_live.py` runs against the real stack** — a live Flask,
PostgreSQL and MinIO. It creates a fixture titled `__integration_fixture__`,
cleans up only that, and asserts the rest of the gallery is untouched. It
once deleted the entire imported gallery; keep the marker discipline.

Browser verification has been done by driving Chrome over CDP with Node's
built-in `WebSocket`. Useful, but the owner tests by hand and prefers to.

---

## 9. What is built

| Phase | State |
|---|---|
| UI rebuild against the design vocabulary | Done |
| Piece page with wall label and prev/next | Done |
| Collections schema and full API | Done |
| Storage adapters, two-bucket split, derivative pipeline | Done |
| Upload modal — drag-and-drop, metadata, live preview | Done |
| Cutover from mock data to the real database | Done |
| Delete, including storage prefix removal | Done |
| Waived pieces — the two-stage removal | Done |
| Collection creation — pick, then name | Done |
| Collection view — page, index, real links, private gating | Done |
| Collection edition — details, arrange, cover, delete | Done |

**Waived pieces** is specified in full in
[`context/WAIVED-PIECES.md`](context/WAIVED-PIECES.md) — 12 sections, and
the best single document to read for how decisions get made on this project.
The state machine is `exhibited → waived → gone`, reversible at the first
arrow, and the delete guard lives in the API rather than the UI.

**Collection creation** starts from the grid: `+ New collection` puts the
gallery into picking mode, cards become buttons with numbered badges, and
the pick order becomes the display order. Naming comes second, deliberately
— a collection is defined by what is in it.

**Collection view** is specified in
[`context/COLLECTIONS.md`](context/COLLECTIONS.md). A collection has a page
and an index, and the three `InertLink` sites that named a collection are
real links. It also enforced the private-collection rules for the first
time: a draft 404s for a visitor on the detail route and is visible to the
owner in the list, on the index, and on a piece's page, marked with a
`Private` eyebrow. Nothing had ever exercised those rules, because no
private collection had ever existed.

**Collection edition** followed, same document, §9. Details — name,
description, visibility — go through a dialog and one `PATCH` that never
sends `slug`, so a rename keeps the URL. Order, membership and cover are one
array to the API, so they share one **arrange mode** with one Save: drag or
arrow-key to reorder, `x` to remove, a thumbnail dialog to add, a pill to
pick the cover. Nothing is written until Save. Arrange uses a plain ordered
grid rather than the masonry, because the masonry reads down columns and the
thing being edited is the sequence.

### Live data

| | |
|---|---|
| Pieces | 11 rows — 10 exhibited, 1 waived (*Untitled Study VII*) |
| Tags | 2 |
| Collections | 2 — **Testing** (public, 3) and **Yankito** (public, 4) |

`Testing` holds *Savy Relax*, *Night Calls V*, *Untitled Study V* in that
order. **The owner created both collections, and waived that piece.** This
is real data. It confirms the flows work end to end, and it must not be
cleaned up.

The 11 pieces were imported by `scripts/import_uploads.py` from the
owner's local folder. Four have real titles; the rest are
*Untitled Study {roman}*.

Anything named `__like_this__` is a test fixture and is not real data. Every
suite and every by-hand check creates one, cleans up only that, and asserts
the rest of the gallery is untouched. Keep the discipline.

---

## 10. Next: editing a piece

**This is the feature to build.** Collections can now be created, opened,
curated and deleted. A piece still cannot be corrected after upload.

The owner pinned this on 2026-08-30 and it has been carried in §11 ever
since. It is the oldest open gap in the project, and the one that costs
something every time work is imported: `import-manifest.json` left `medium`
and `year` empty for all eleven pieces, which is why the wall labels are
sparse and cannot be filled in.

Re-uploading is not a workaround. A new upload mints a new id, so the piece
changes address, loses its collection memberships, and any link to it dies.

### What to build

**`PATCH /api/pieces/<id>` `[owner]`** — the endpoint does not exist. It
should accept `title`, `description`, `medium`, `year`, `createdDate`, and
follow the rule collections already set: **only re-slug when `slug` is sent
explicitly**, so correcting a title does not move the piece.

**An "Edit details" dialog on the piece page**, in `PieceOwnerActions`
beside Collections and Waive. The vocabulary is already built — collection
edition uses exactly this shape, and `CollectionDetailsDialog` is the model
to copy.

### Decisions to make

**Whether tags are editable here.** The piece already carries them, the join
table exists, and the upload endpoint accepts them — so `PATCH` could too,
cheaply. But tags are inert everywhere else (§11), and making them editable
without making them do anything builds a control with no consequence.
Editing metadata without tags is coherent; adding tags is a separate
feature. Recommended to leave them out, but the owner's call.

**Whether the image itself can be replaced.** Almost certainly not, and
worth writing down: swapping the file behind an id means re-running the
derivative pipeline and invalidating whatever has cached the old renditions.
A correction to a wall label is not the same act as replacing the artwork.

**What happens to a waived piece.** Editing one is harmless, but the piece
page for a waived piece already carries Restore and Delete. Decide whether
Edit joins them or is only offered on exhibited work.

## 11. Known gaps

Carried forward deliberately. None of these block §10.

- **Tags do nothing.** The tables exist and two tags are stored, but there
  is no filtering and the "Tags" nav entry is inert.
- **"Owner sign in" is inert**, per §7.
- **Waived derivatives stay anonymously fetchable by URL.** The public
  bucket policy matches `sketchyart/*` rather than a prefix, so anyone who
  saw a piece while it was exhibited keeps a working link. A storage-layout
  gap that outlives authentication — revisit when sessions land, since
  fixing it now is a lock on an open door.
- **`import-manifest.json` has empty `medium` and `year`** for all 11
  pieces, which is why the wall labels are sparse.
- **`-sketchy-art-gallery--project-overview.md`** in the repository root is
  stale and superseded by `context/project-overview.md`. Safe to delete.

---

## 12. Where the documentation lives

Read in this order:

| File | What it holds |
|---|---|
| [`AGENTS.md`](AGENTS.md) | The working agreement. **Read first.** |
| [`context/project-overview.md`](context/project-overview.md) | The product and its data model |
| [`context/DESIGN.md`](context/DESIGN.md) | Tokens, type, spacing, component patterns |
| [`context/STORAGE.md`](context/STORAGE.md) | Keys, buckets, adapters, derivatives |
| [`context/WAIVED-PIECES.md`](context/WAIVED-PIECES.md) | The most complete feature spec in the repository |
| [`context/COLLECTIONS.md`](context/COLLECTIONS.md) | Viewing and editing collections; the private-draft rules |
| [`context/coding-preferences.md`](context/coding-preferences.md) | How code should read |
| [`context/current-feature.md`](context/current-feature.md) | Scratch space for the feature in flight |

### How this project works

Decisions are argued before they are written, and the reasoning is recorded
next to the code rather than in a commit message. Comments explain *why*,
never *what*. Features are specified in `context/` first, then built, then
verified, then marked implemented in the document that specified them.

The owner tests by hand and likes doing it. Build the thing, prove it with
the suites, and hand it over for the owner to try.
