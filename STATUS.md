# SketchyArt Gallery — Project Status

A personal art gallery. The owner uploads drawings, the gallery exhibits
them, and collections group them into sets. Built to be lived in rather
than shipped to a market.

**Last updated:** 2026-09-02
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
├── backend/               28 .py files
│   ├── docker-compose.yml postgres + minio — note: not at the root
│   ├── app/               config, models, schemas, auth, errors, db
│   │   ├── api/           pieces.py, collections.py, helpers.py
│   │   └── services/      storage adapters, images, slugs
│   ├── migrations/        alembic, 4 revisions
│   ├── scripts/           import_uploads.py, backfill_tiles.py
│   └── tests/             4 suites, 210 checks
├── frontend/              60 .ts/.tsx files
│   └── src/
│       ├── components/    37
│       ├── contexts/      3  (theme, role, ...)
│       ├── hooks/         7  (incl. useAsync)
│       ├── pages/         5  (Landing, Piece, Waived, Collection, Collections)
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
alembic upgrade head          # should report e5b71c94f0a2
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
| `SECRET_KEY` | any 64 hex characters — signs the session cookie |
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

Eight tables: `pieces`, `collections`, `collection_pieces`, `tags`,
`piece_tags`, `users`, `socials`, `alembic_version`.

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

**`socials`** — id, platform, label, url, `display_order`, timestamps. One
row per link in the header menu. `platform` is a key into the frontend's
icon registry, not a display name, and it is free text rather than an enum
so joining a new site is a row instead of a migration. `label` is separate
because two accounts on one platform need different words and the same mark.

There is no visibility flag. A link the owner is not ready to share is
simply not added, and deleting one is a click.

`users` holds exactly one row: the owner, written by `flask --app app
set-owner`. `pieces.user_id` is still null on every row -- authorship was
never the point of the table.

### Migrations

Five revisions, head `e5b71c94f0a2`. History is immutable — add a
revision, never edit one.

```
88c31e2c7d76  initial schema
64c7a2ba6f09  drop pieces.original_filename
c2574bd3ea94  add pieces.waived_at
a7f4d91c3b28  add pieces.tiles_ready
e5b71c94f0a2  add socials
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
| `GET` | `/api/pieces/<id>` | Detail, including `collections` and `tileSource`. **410 and a tombstone** for a waived piece unless owner |
| `POST` | `/api/pieces` `[owner]` | Multipart upload. Derives keys, generates both derivatives and the Deep Zoom pyramid. Repeated `collectionIds` fields join the piece to collections in the same transaction |
| `PATCH` | `/api/pieces/<id>` `[owner]` | Title, description, medium, year, createdDate, tags. Only keys present are touched. Allowed on a waived piece |
| `DELETE` | `/api/pieces/<id>` `[owner]` | **409 unless the piece is waived** |
| `POST` | `/api/pieces/<id>/waive` `[owner]` | 409 if already waived |
| `POST` | `/api/pieces/<id>/restore` `[owner]` | Optional `{"collectionIds": [...]}`, one transaction |
| `PUT` | `/api/pieces/<id>/collections` `[owner]` | Set semantics. 409 for a waived piece |

### Collections

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/collections` | Public only. `?includePrivate=1` `[owner]` for all |
| `GET` | `/api/collections/<slug>` | Detail with pieces in `display_order`. 404 for a private collection unless owner |
| `POST` | `/api/collections` `[owner]` | Optional `pieceIds` in pick order, `coverPieceId` |
| `PATCH` | `/api/collections/<id>` `[owner]` | `name`, `slug`, `description`, `isPublic`, `coverPieceId`. The UI never sends `slug`, so a rename keeps the URL |
| `PUT` | `/api/collections/<id>/pieces` `[owner]` | Replaces membership and rewrites order |
| `DELETE` | `/api/collections/<id>` `[owner]` | Removes the grouping. Pieces are untouched |

### Session

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/session` | Password in, cookie out. Rate limited, and every failure answers the same 401 |
| `DELETE` | `/api/session` `[owner]` | Clears the session and the remember cookie |
| `GET` | `/api/session/me` | `{"role": "owner"}` or `{"role": "visitor"}` |

### Socials

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/socials` | Public. Ordered by `display_order` |
| `PUT` | `/api/socials` `[owner]` | The whole list, replaced. Array position is the order, so nothing sends `displayOrder`. http and https only |

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
| `/piece/:id` | `PiecePage` — the artwork, wall label, owner actions. `?view=1` opens the detail viewer. A waived piece renders its tombstone |
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

**`fetchCollections` is what a visitor sees.** `collectionsFor(role)`
returns it or `fetchAllCollections`, so the owner's drafts survive a reload.
It returns the loader rather than calling it, so a page can memoise on the
role and hand the result to `useAsync` with a stable dependency.

**The role is runtime state.** `useSession()` carries `role`, `known`, and
the dialog. There is no `CURRENT_ROLE` constant any more, and no owner token
in the bundle -- the session is an `HttpOnly` cookie the page cannot read.

**Tailwind v4 with `@theme inline`.** Semantic tokens only — `text-dim`,
`border-line`, `bg-surface` — swapped per theme via `data-theme`. Never a
raw hex in a component.

**One accent, one exception.** `danger` is the single sanctioned second
colour, and it is spent. Contrast verified AA in every theme. Filled accent
marks the one action a surface exists for, at most one per screen; outlined
accent is the interface pointing at something and may repeat.

**Two runtime dependencies, and one is lazy.** React and React Router are
the bundle. OpenSeadragon is imported dynamically inside `DetailedView`, so
it builds as a 348 KB chunk that only downloads when the viewer opens —
`@types/openseadragon` is a devDependency and never ships. `AGENTS.md` §2
means nothing else gets added without asking: the icons, the masonry, the
drag-and-drop and the modals are all hand-rolled, deliberately.

Full vocabulary in [`context/DESIGN.md`](context/DESIGN.md).

---

## 7. Ownership, stated plainly

**The gate holds.** Sessions landed on 2026-09-02. `is_owner()` and
`require_owner` in `app/auth.py` are still the only place identity is
decided — they now ask Flask-Login, and nothing else in the backend changed
to make that true, which was the point of writing them that way.

The credential is a password on one owner row, hashed by Werkzeug and seeded
by `flask --app app set-owner`. The session is an `HttpOnly` cookie with a
remember cookie behind it, so closing the tab does not sign the owner out
and JavaScript never reads the credential.

**The gallery shows no way in.** No sign-in link, no login route. Five
clicks on the footer's `© 2026` opens a lazily-loaded dialog. That hiding is
cosmetic and is not what holds the door — see
[`context/AUTH.md`](context/AUTH.md) §5.

**`OWNER_API_TOKEN` still works, as a development and test credential.** It
must be unset in production. `AUTH.md` §7 carries the condition; this line
is the reminder.

What a visitor may do is written down for the first time, in `AUTH.md` §1,
and `tests/smoke_visitor.py` is named after it.

---

## 8. Verification

Seven suites, 287 checks, no test framework — each is a script that prints
its results and exits non-zero on failure.

```bash
cd backend
.venv/Scripts/python.exe tests/smoke_collections.py    # 55
.venv/Scripts/python.exe tests/smoke_uploads.py        # 90
.venv/Scripts/python.exe tests/smoke_waived.py         # 40
.venv/Scripts/python.exe tests/smoke_visitor.py        # 26
.venv/Scripts/python.exe tests/smoke_session.py        # 21
.venv/Scripts/python.exe tests/integration_live.py     # 28
```

`smoke_visitor.py` asserts the contract in
[`context/AUTH.md`](context/AUTH.md) §1 with no credentials at all, and
walks the mutations from the url map rather than a hand-written list, so one
added later is covered the day it is written. `smoke_session.py` runs with
`OWNER_API_TOKEN` empty — the one place that proves the gallery does not
depend on the development credential.

The first six run against an in-memory store and a throwaway database.
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
| Detailed View — tiles, the viewer, the minimap | Done |
| Authentication — sessions, the visitor contract, the invisible way in | Done |
| Socials — a header menu the owner curates | Done |

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

**Detailed View, passes 2 and 3**, 2026-09-01 and 2026-09-02. The viewer
itself: a `<dialog>` overlay carrying OpenSeadragon, opened from a filled
accent button beneath the artwork that quotes the piece's own dimensions,
and addressed by `?view=1` so Back closes it and the view can be linked.
OpenSeadragon loads as a lazy chunk — 348 KB that only downloads when
someone opens the viewer, against 8 KB added to the bundle everyone pays
for. The chrome and the minimap hide themselves on separate idle clocks,
3s and 2s, the minimap sooner because it sits on the drawing rather than at
the edges.

Two things in it were wrong first and are worth knowing about. The minimap
shipped blank: `Navigator` sets `_resizeWithViewer = false` when its control
anchor is `NONE`, which is exactly what mounting it through `navigatorId`
does, and that flag gates the only call it makes to `updateSize()` — the
method that actually draws its world. And the minimap originally never
faded, on the argument that it is feedback needed while panning; that
confused "zoomed in" with "panning", and the owner corrected it in use.
Both are recorded in `context/DETAILED-VIEW.md` with the reasoning, because
the second one was a design mistake rather than a bug.

**`DESIGN.md` §accent was rewritten** in the same pass. It had enumerated
six places the accent may appear and declared the list closed, which went
out of date within a fortnight — a closed list cannot survive a new page,
and each addition then reads as a violation rather than as the rule working.
It now states the rule instead, split by shape: filled accent marks the one
action a surface exists for, at most one per screen; outlined or hairline
accent is the interface pointing at something, and may repeat.

**Authentication**, 2026-09-02, specified in
[`context/AUTH.md`](context/AUTH.md). Flask-Login replaced the shared secret
inside `is_owner()` and `require_owner`, and nothing else in the backend
changed to make that work. One owner, a password only, seeded by a prompted
CLI command; a remember cookie, so closing the tab does not sign out.

The half worth reading the document for is the other one: **the visitor
contract**. What a visitor may do had only ever been defined by subtraction,
and writing it down positively immediately found a leak —
`?includePrivate=1` was never owner-gated and exposed every draft's name,
slug, description, count and cover, from under a comment that said visitors
never see unpublished collections. `tests/smoke_visitor.py` is named after
the contract and walks the mutations from the url map, so the next one is
covered the day it is written.

A waived piece now answers **410 with its title** rather than 404. Someone
returning to a bookmark saw the piece while it hung, so withholding its
existence protects nothing and only looks broken — the one deliberate
exception to the rule that a withheld thing is simply not there.

The gallery shows no way in: no sign-in link, no login route, `OwnerSignIn`
and `InertLink` both deleted. Five clicks on the footer's `© 2026` opens a
lazily-loaded dialog, and an unlinked path whose hash is the only thing in
the bundle is the spare key. That hiding is cosmetic, is documented as
cosmetic, and is not what holds the door.

**Socials**, 2026-09-02, in two passes. A dropdown in the nav listing where
the artist can be found, each row carrying the platform's mark and a
leaving-arrow. Pass 1 was the menu against a hard-coded array, so the shape
was on screen before there was anywhere to store it; pass 2 replaced the
array with a table and gave the owner a dialog.

**Two routes, not five.** The dialog edits a list and saves it once, so
`PUT /api/socials` takes a list and writes it once -- the same call
`PUT /api/collections/<id>/pieces` already makes for membership. Reordering
comes free with it and needs no endpoint of its own, and a half-finished
edit cannot half-apply. Rows are matched by id, so an edit keeps its row
rather than being deleted and recreated.

**Marks are code, not data.** The database stores a key -- `instagram`,
`artstation` -- and `components/platform-icons.tsx` maps it to a drawing.
Accepting an uploaded SVG instead would mean taking a file format that can
carry script, sanitising it, storing it and serving it, all to avoid a
one-line addition to that file. A platform with no mark still works and
shows a generic link icon, which is what lets the dialog accept a site
nobody has drawn yet.

That one registry does three jobs: the mark in the menu, the choices in the
dialog's picker, and the hostnames that let a pasted url name its own
platform. Pasting `artstation.com/…` fills in the platform and the label,
so most rows are one field rather than three.

**A `javascript:` url was accepted at first**, and the suite caught it. The
check tested for `://` before prepending `https://`, so `javascript:alert(1)`
became `https://javascript:alert(1)` -- a perfectly good https url with an
odd host. The scheme is now judged before anything is rewritten.

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

## 10. Next: tags that do something

**Authentication is done**, in two passes on 2026-09-02, and specified in
full in [`context/AUTH.md`](context/AUTH.md) — the visitor contract, the
session design, the tombstone, and the reasoning behind each. Read that
rather than a summary here.

Two things it deliberately did not do, either of which could be the next
feature instead:

- **Waived derivatives are still anonymously fetchable.** §11. A
  storage-layout problem; it needs its own decision about buckets and
  presigned URLs, and it was never going to be fixed by adding a login.
- **The owner surface still ships to every visitor.** §11. Worth doing as a
  performance pass.

### The feature itself

Deferred since the beginning, not dropped. Tags can be entered on upload and
corrected afterwards, they are stored, and they render on the wall label.
Nothing reads them: no filtering, and no view of the work sharing a tag.

**They are a filter, not a place.** `/tags` existed as a placeholder page and
was removed on 2026-09-02, before anything was built on it. A gallery this
size does not need a directory of its own tags — what it needs is a way to
narrow the wall to the work carrying one. A page would have been a second
route to maintain, a second empty state to design, and a second place a
visitor can end up with nothing on screen.

That gap sharpened twice. Piece editing gave the owner a control for curating
tags with no consequence to curating them well. And the tombstone now wants a
"similar works" panel, which needs *something* to compare on — tags are the
only candidate the data model has, so this feature is what unblocks that one.

**To build it:** `GET /api/pieces?tag=<slug>` does not exist yet. On the
front, the chips on a wall label become controls that narrow `AllWorkSection`
rather than links that navigate, and the gallery grows a way to clear the
filter. The pieces payload already includes `tags`, so the grid needs no new
shape, and `AllWorkSection` carries a standing comment saying exactly this.

Whether the filter lives in the URL is the one open question. A query string
makes a filtered view shareable and survives a reload; local state is less
machinery. The collections work already argued that a set worth looking at is
worth linking to, which points the same way here.

**Live data note:** both existing tags — *Charcoal* and *Portrait* — are
attached to nothing, so filtering by either shows an empty gallery until some
work is tagged.

---

## 11. Known gaps

Carried forward deliberately.

- **Waived derivatives stay anonymously fetchable.** The public bucket
  policy matches `sketchyart/*` rather than a prefix, so a link to a waived
  piece's `display.webp`, `thumb.webp` or tiles keeps working. Sessions did
  not fix this and were never going to — it is a storage-layout problem, and
  it is the most obvious thing to pick up next.
- **The owner surface still ships to every visitor.** The upload modal,
  arrange mode, the dialogs, `CollectionPicker` and `TagInput` are all
  statically imported, so the main bundle says plainly that an owner exists.
  Only the sign-in dialog is lazy. Worth fixing as a **performance** pass —
  lazy chunks hide nothing from anyone looking — and `AUTH.md` §5 is explicit
  that the bundle claim is narrow until it lands.
- **`import-manifest.json` left `medium` and `year` empty** for all 11
  imported pieces, which is why most wall labels are sparse. No longer a
  blocker — `PATCH /api/pieces/<id>` and the Edit details dialog can fill
  them in — but it is data entry nobody has done yet.
- **`-sketchy-art-gallery--project-overview.md`** in the repository root is
  stale and superseded by `context/project-overview.md`. Safe to delete.
- **No suite looks at the UI.** The 257 checks cover the API, storage and
  the image pipeline; nothing asserts that a page renders. Detailed View was
  verified by geometry, network and build, and its blank minimap was then
  found by the owner in use. Authentication was the first feature driven
  through Chrome over CDP before being handed over — by hand, not by a
  suite, so it is a habit rather than a guarantee. Use it before saying a
  visual change works.

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
| [`context/AUTH.md`](context/AUTH.md) | Sessions, the visitor contract, the invisible way in |
| [`context/DETAILED-VIEW.md`](context/DETAILED-VIEW.md) | The full-window viewer: tiles, zoom, minimap |
| [`context/coding-preferences.md`](context/coding-preferences.md) | How code should read |
| [`context/current-feature.md`](context/current-feature.md) | Scratch space for the feature in flight |

### How this project works

Decisions are argued before they are written, and the reasoning is recorded
next to the code rather than in a commit message. Comments explain *why*,
never *what*. Features are specified in `context/` first, then built, then
verified, then marked implemented in the document that specified them.

The owner tests by hand and likes doing it. Build the thing, prove it with
the suites, and hand it over for the owner to try.

**The owner makes every commit.** Do not run `git commit`. Finish the work
and hand over a message they can paste — a subject line and a few lines on
what changed and why.
