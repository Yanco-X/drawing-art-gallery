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
├── backend/               20 .py files
│   ├── docker-compose.yml postgres + minio — note: not at the root
│   ├── app/               config, models, schemas, auth, errors, db
│   │   ├── api/           pieces.py, collections.py, helpers.py
│   │   └── services/      storage adapters, images, slugs
│   ├── migrations/        alembic, 3 revisions
│   ├── scripts/           import_uploads.py, backfill_tiles.py
│   └── tests/             4 suites, 210 checks
├── frontend/              57 .ts/.tsx files
│   └── src/
│       ├── components/    35
│       ├── contexts/      3  (theme, role, ...)
│       ├── hooks/         7  (incl. useAsync)
│       ├── pages/         6  (Landing, Piece, Waived, Collection, Collections, Tags)
│       ├── services/      pieces.ts — the whole API client
│       └── types/         the shared shapes
└── context/               design and specification documents
```

---

## 2. Running it

Four things, in this order.

**1. Infrastructure** — from `backend/`, where the compose file lives

```bash
docker compose up -d          # postgres:5432, minio:9000, console:9001
```

> Run this from `backend/`, not the repository root. From the root it fails
> with "no configuration file provided: not found". The volumes are named
> after that directory — `backend_sketchyart-pgdata` and
> `backend_sketchyart-minio` — so bringing the stack up from elsewhere would
> create a second, empty pair rather than reusing the data already there.

**2. Backend** — also from `backend/`

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

**`pieces`** — id (UUID), title, description, `original_ext`, `byte_size`,
medium, year, width, height, `created_date`, `user_id`, `created_at`,
`updated_at`, `waived_at`, `tiles_ready`.

**A piece has no slug.** It is addressed by id everywhere — the route is
`/piece/:id`, and object keys derive from the id. Worth stating because
collections do have one, and the rule that protects a collection's URL
across a rename has no equivalent here: there is no address to protect.

**`collections`** — id, name, slug, description, `cover_piece_id`,
`is_public`, `created_at`, `updated_at`.

**`collection_pieces`** — the join, carrying `display_order`. This is the
curation: a collection's order lives here and nowhere else.

`users` exists in the schema and is unused. It is scaffolding for the
authentication that has not been built.

### Migrations

Four revisions, head `a7f4d91c3b28`. History is immutable — add a
revision, never edit one.

```
88c31e2c7d76  initial schema
64c7a2ba6f09  drop pieces.original_filename
c2574bd3ea94  add pieces.waived_at
a7f4d91c3b28  add pieces.tiles_ready
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

### Limits, or the lack of them

**Nothing is capped.** Neither container sets a memory, CPU or PID limit;
the volumes are plain `local` Docker volumes with no size option; and both
buckets report a MinIO quota of `0 B`, meaning none. The only ceiling
anywhere is `MAX_UPLOAD_MB`, default 40, which is per upload rather than
cumulative.

Storage is therefore bounded by the Docker VM's disk — roughly 950 GB free
against 62 MB of objects and 49 MB of database as of 2026-09-01. Disk will
not be the constraint for a long time.

Deep Zoom tiling multiplied the **object count** rather than the size: the
public bucket holds 2,633 objects, of which 2,605 are tiles, for 16.6 MB —
less than half what the 14 originals occupy. Object stores are built for
this and MinIO does not notice, but it is worth knowing before reading a
bucket listing and assuming something has gone wrong.

**MinIO runs single-drive**, one `/data` mount, so there is no erasure
coding and no redundancy. That matters more than the size: the private
bucket holds the only archival originals, and the derivatives could be
regenerated from them while they could not be regenerated from anything.
Losing that volume loses the originals. There is no backup of it.

Full rationale in [`context/STORAGE.md`](context/STORAGE.md).

---

## 5. API

16 routes. Everything under `/api`. `[owner]` means the route requires the
owner token in `X-Owner-Token`.

### Pieces

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/pieces` | Exhibited only. `?waived=true` `[owner]` returns the reserve, newest waived first |
| `GET` | `/api/pieces/<id>` | Detail, including `collections` and `tileSource`. 404 for a waived piece unless owner |
| `POST` | `/api/pieces` `[owner]` | Multipart upload. Derives keys, generates both derivatives and the Deep Zoom pyramid. Repeated `collectionIds` fields join the piece to collections in the same transaction |
| `PATCH` | `/api/pieces/<id>` `[owner]` | Title, description, medium, year, createdDate, tags. Only keys present are touched. Allowed on a waived piece |
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

Six routes:

| Route | Page |
|---|---|
| `/home` | `LandingPage` — intro, collections, all work. `/` redirects here |
| `/piece/:id` | `PiecePage` — the artwork, wall label, owner actions |
| `/collections` | `CollectionsIndexPage` — every collection the caller may see |
| `/collections/:slug` | `CollectionPage` — the set's label, then its pieces |
| `/tags` | `TagsPage` — a placeholder, per §10 |
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

Four suites, 210 checks, no test framework — each is a script that prints
its results and exits non-zero on failure.

```bash
cd backend
.venv/Scripts/python.exe tests/smoke_collections.py    # 54
.venv/Scripts/python.exe tests/smoke_uploads.py        # 90
.venv/Scripts/python.exe tests/smoke_waived.py         # 38
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
| Piece editing — the wall label, after upload | Done |

**Waived pieces** is specified in full in
[`context/WAIVED-PIECES.md`](context/WAIVED-PIECES.md) — 12 sections, and
the best single document to read for how decisions get made on this project.
The state machine is `exhibited → waived → gone`, reversible at the first
arrow, and the delete guard lives in the API rather than the UI.

**Collection creation** happens in one near-full-screen dialog: a dense grid
of the gallery on the left at 80%, the name, filters and actions on the
right at 20%. Cards carry numbered badges and the pick order becomes the
display order.

It began as a mode on the landing page — the gallery went into a picking
state and the controls lived in a bar above the grid. That meant scrolling
the length of the gallery to choose and scrolling back to the top to name it
or cancel. The dialog puts the work and the controls on screen together, and
the title and year filters usually remove the scroll entirely. The mode is
gone: `PieceCard`, `MasonryGrid` and `AllWorkSection` no longer know what a
selection is.

`PiecePickerGrid`, `PieceFilters` and `usePieceFilter` are shared with the
Add work dialog in arrange mode, which had the same unfiltered scroll.

**Collection view** is specified in
[`context/COLLECTIONS.md`](context/COLLECTIONS.md). A collection has a page
and an index, and the three `InertLink` sites that named a collection are
real links. It also enforced the private-collection rules for the first
time: a draft 404s for a visitor on the detail route and is visible to the
owner in the list, on the index, and on a piece's page, marked with a
`Private` eyebrow. Nothing had ever exercised those rules, because no
private collection had ever existed.

**Piece editing** closed the oldest open gap, pinned on 2026-08-30 and
carried in §11 ever since. `PATCH /api/pieces/<id>` takes title,
description, medium, year, createdDate and tags; only keys actually present
are touched, so a partial body cannot blank the rest, while null or an empty
string does clear a field. The dialog on the piece page collects exactly
what the upload form collects — the owner's own framing — so `TagInput` was
extracted and both now share it. The image is deliberately not replaceable:
swapping the bytes behind an id would mean re-deriving both renditions and
invalidating every URL already handed out. A waived piece can be edited,
since the reserve is where a label would be tidied up before going back.

**Collection edition** followed, same document, §9. Details — name,
description, visibility — go through a dialog and one `PATCH` that never
sends `slug`, so a rename keeps the URL. Order, membership and cover are one
array to the API, so they share one **arrange mode** with one Save: drag or
arrow-key to reorder, `x` to remove, a thumbnail dialog to add, a pill to
pick the cover. Nothing is written until Save. Arrange uses a plain ordered
grid rather than the masonry, because the masonry reads down columns and the
thing being edited is the sequence.

**Curating on the way in**, 2026-09-01. The upload form now offers the
collections a new piece should join, under the drop zone. Membership had
only ever been settable after the fact, so every upload meant a second trip
through the piece page to put the work where it belonged. `POST /api/pieces`
takes repeated `collectionIds` fields and joins them inside the same
transaction that writes the row, reusing the helpers restore already had; a
refused id rolls the whole upload back and takes the stored objects with it,
so there is no half-applied upload. The response moved to the detail shape,
so the caller sees the memberships rather than assuming them. Drafts are
offered too — gathering new work is most of what a private collection is
for. The checkbox list came out of `PieceOwnerActions` into
`CollectionPicker`, since restore, edit and upload are now three callers of
one control.

**Detailed View, pass 1**, 2026-09-01, and the current feature — see
[`context/DETAILED-VIEW.md`](context/DETAILED-VIEW.md). A full-window viewer
with zoom, pan and a minimap, opened from a button on the piece page, which
otherwise stays exactly as it is. Pass 1 is entirely groundwork: `imageUrl`
serves a 1600px rendition and the originals run to 4999 × 5001, so there
were no pixels worth zooming into. Every piece now has a Deep Zoom pyramid
under `<id>/tiles/`, generated by Pillow at upload and backfilled from the
archived originals for the 14 that predate it. The pyramid is public and the
original is not — a tile answers an anonymous request, the original still
returns 403 — so the viewer reaches full original resolution without the
archival file ever leaving the private bucket. Tiling runs after the commit
and cannot fail an upload; a piece without a pyramid falls back to the
display rendition, which is what the fallback for the backfill window needed
to be anyway.

### Live data

| | |
|---|---|
| Pieces | 14 rows — 13 exhibited, 1 waived (*Untitled Study VII*) |
| Tags | 2 — *Charcoal* and *Portrait*, both attached to nothing |
| Collections | 2 — **Testing** (public, 6) and **Yankito** (public, 4) |

Counted against the live database on 2026-09-01. It moves whenever the owner
uploads, so treat it as a sketch of the shape rather than a number to trust.

**The owner created both collections, curated them, and waived that piece.**
This is real data. It confirms the flows work end to end, and it must not be
cleaned up.

Eleven of them were imported by `scripts/import_uploads.py` from the owner's
local folder, and arrived as *Savy Relax*, *Night Calls V*, *Night Calls IX*,
*Yankito Night Calls* and *Untitled Study {roman}*, I through VII. Several of
the placeholder titles have since been corrected by hand — *Determined Eyes*,
*Eyes on the Price*, *Night Calls I&II* — and *Pawly* and *khyunee* were
uploaded through the form. The gallery is being used, not just tested.

Anything named `__like_this__` is a test fixture and is not real data. Every
suite and every by-hand check creates one, cleans up only that, and asserts
the rest of the gallery is untouched. Keep the discipline.

---

## 10. In flight, and next

### In flight: Detailed View

**This is the feature being built.** Full spec and decisions in
[`context/DETAILED-VIEW.md`](context/DETAILED-VIEW.md).

Passes 1 and 2 are done. The pyramid, the backfill and `tileSource` on the
payload; then the full-window viewer itself — a `<dialog>` overlay carrying
OpenSeadragon in a lazy chunk, opened from a filled-accent button beneath the
artwork, addressed by `?view=1` so Back closes it and the view is linkable.

**Pass 3, the minimap, is done too** — OpenSeadragon's navigator mounted
into our own element, a hairline frame with an accent wash on the viewport
rectangle, and visibility driven by zoom rather than by the idle timer that
hides the rail. All three sub-features are built.

The visual has never been checked by automation — there is no browser driver
on this machine. Every pass was verified by geometry, network and build,
then looked at by hand.

### Next: tags that do something

Tags can now be entered on upload and
corrected afterwards, they are stored, and they render on the wall label.
They still do nothing else: there is no way to see the other work sharing a
tag.

That gap got sharper with piece editing: there is now a control for curating
tags and no consequence to curating them well.

`/tags` exists as a **placeholder**, added 2026-09-01 — an intro that says
plainly what tags do and do not do, over the same hatch that stands in for
unloaded artwork. It replaced a nav item pointing at `#`, which swallowed
the click and read as a bug rather than as unfinished work. What belongs on
the page has not been decided; the owner has it open.

### What to build

**Fill the placeholder** — `/tags` listing what exists with counts, and
`/tags/:slug` showing the work carrying one. The pieces payload already
includes `tags`, so the grid needs no new shape.

**`GET /api/pieces?tag=<slug>`**, or a tags blueprint — does not exist yet.
`tags` and `piece_tags` are populated and correct; nothing reads them.

**The chip row on the gallery.** `AllWorkSection` carries a standing comment
that tag filtering is deliberately not wired up and the chip row was removed
pending this work. Restoring it is a UI-only change.

**Nothing left inert in the nav.** Every item is a route, so `NavItem` no
longer carries an in-page-anchor fallback.

### Decisions to make

**Whether filtering is a route or a filter on the gallery.** A route gives
a tag a URL worth sharing; an in-place filter keeps one page. The gallery
already shows everything and the density control already lives there.

**What a tag with no pieces should do.** Editing a piece's tags can orphan a
tag row — the rows are shared, so they are deliberately left behind rather
than deleted with the last piece using them. Two orphans exist right now,
*Charcoal* and *Portrait*. Decide whether an unused tag is listed, hidden,
or swept.

## 11. Known gaps

Carried forward deliberately. None of these block §10.

- **"Owner sign in" is inert**, per §7.
- **Waived derivatives stay anonymously fetchable by URL.** The public
  bucket policy matches `sketchyart/*` rather than a prefix, so anyone who
  saw a piece while it was exhibited keeps a working link. A storage-layout
  gap that outlives authentication — revisit when sessions land, since
  fixing it now is a lock on an open door.
- **`import-manifest.json` left `medium` and `year` empty** for all 11
  imported pieces, which is why most wall labels are sparse. No longer a
  blocker — `PATCH /api/pieces/<id>` and the Edit details dialog can fill
  them in — but it is data entry nobody has done yet.
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
| [`context/DETAILED-VIEW.md`](context/DETAILED-VIEW.md) | The full-window viewer: tiles, zoom, minimap. **In flight** |
| [`context/coding-preferences.md`](context/coding-preferences.md) | How code should read |
| [`context/current-feature.md`](context/current-feature.md) | Scratch space for the feature in flight |

### How this project works

Decisions are argued before they are written, and the reasoning is recorded
next to the code rather than in a commit message. Comments explain *why*,
never *what*. Features are specified in `context/` first, then built, then
verified, then marked implemented in the document that specified them.

The owner tests by hand and likes doing it. Build the thing, prove it with
the suites, and hand it over for the owner to try.
