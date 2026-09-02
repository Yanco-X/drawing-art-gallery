# Data and Image Storage

How records reach PostgreSQL and how image files are stored, for phase 1
(local disk) and phase 2 (object storage).

**Status:** Implemented 2026-08-26. Verified against real PostgreSQL and
MinIO (23 live checks) plus 60 checks against SQLite and in-memory storage.

The database schema itself lives in
[`project-overview.md`](./project-overview.md) under Data Model -- this
document covers only the storage-related parts of it, the write pipeline,
and the storage layer. It does not duplicate the model definitions.

---

## 1. The split

Two stores, one link between them.

| Store | Holds | Never holds |
|---|---|---|
| PostgreSQL | Metadata rows: titles, dimensions, tags, collection membership | Image bytes |
| File / object storage | The image files and their derivatives | Anything queryable |

The link is a **derived key**, not a URL. Nothing in the database records
where a file can be reached from -- the API composes public URLs at
serialization time. That single decision is what makes phase 2 a config
change rather than a data migration.

---

## 2. Schema

`pieces.image_url` was dropped. It stored a URL, which baked the host and
route into every row, and it was singular, so there was nowhere to record
that derivatives exist.

**Replaced on `pieces` with:**

| Column | Type | Purpose |
|---|---|---|
| `original_ext` | `String(10)` | `"jpg"` -- the only varying part of the path |
| `byte_size` | `Integer`, nullable | Size of the original, for reporting |

**The uploaded filename is not kept.** It was carried briefly as a label,
then dropped: object keys derive from the piece id, so nothing ever read it
to find a file, and no download path exposes originals to name one. A
user-supplied string with no reader is a liability rather than a record --
it is the sort of column that outlives its purpose and quietly becomes
something to keep escaping. The title is the human name for a piece.

`width`, `height`, `medium`, `year` stay as they are. `aspect_ratio`
remains a computed property, not a column -- the database keeps facts, the
ratio is derived from them.

**There is no path column.** Every path derives from the piece's UUID, so
there is nothing to keep in sync and nothing to migrate when the backend
changes.

**Migration approach:** no rows had been written, so the initial revision
was regenerated rather than amended with a second one. Now that a database
exists this stops being an option -- further changes need their own
revision. Dropping `original_filename` was the first of them
(`64c7a2ba6f09`), and it follows the rule even though `pieces` was still
empty: a schema whose history is rewritten whenever it happens to be
convenient is one nobody can trust to replay.

---

## 3. Key layout

```
<piece-id>/original.<ext>     archival, never served to the grid
<piece-id>/display.webp       long edge ~1600px, piece page
<piece-id>/thumb.webp         long edge ~600px, masonry grid
<piece-id>/tiles/<l>/<c>_<r>.webp   Deep Zoom pyramid, the detail view
```

**The pyramid** was added 2026-09-01 for the detail view. Levels are
successive halvings from a single pixel up to the original's own resolution,
cut into 254px tiles with 1px of overlap. It is many objects -- 547 for the
largest piece, 2,605 across the gallery -- but it costs 16.6 MB in total,
less than half what the originals occupy, and a viewer only ever fetches the
handful of tiles it is looking at.

It needed no changes to this layout. Tiles sit under the piece's own prefix,
so `delete_prefix` already removes them with everything else, and the bucket
routing below already sends them to the public bucket because it diverts on
`/original.` alone. See [`DETAILED-VIEW.md`](./DETAILED-VIEW.md).

Derivatives are WebP; the original is kept untouched in its uploaded
format. Filenames are generated, never taken from the upload -- the current
files show why (`Night Calls V.jpg` has spaces, `IMG_20231016_171622.jpg.png`
has a double extension, several are 60-character social exports). Generated
names avoid URL encoding issues, collisions, and leaking the original name
publicly.

**The UUID is generated in Python before anything is written.** Paths
depend on it, so it cannot wait for the INSERT to assign it.

### Why derivatives matter

Eleven images total roughly 32 MB, the largest being 13.65 MB at 5000x5001.
The masonry renders those thumbnails around 300px wide -- a 50x overshoot
the browser pays for on every page load.

Measured on that largest file: **13.65 MB becomes an 85 KB thumbnail, 99.4
per cent smaller.**

---

## 4. Storage adapter

Every filesystem call sits behind one narrow interface. The narrowness is
deliberate: the smaller the surface, the less can diverge between backends.

```python
class Storage(Protocol):
    def save(self, key: str, data: bytes, content_type: str) -> None: ...
    def delete_prefix(self, prefix: str) -> None: ...
    def url_for(self, key: str) -> str: ...
```

| Implementation | Writes to | `url_for` returns |
|---|---|---|
| `LocalStorage` | `backend/uploads` | `/media/<key>`, served by Flask |
| `S3Storage` | Two S3-compatible buckets via boto3 | Public URL, or presigned for originals |
| `MemoryStorage` | A dict | Used by the smoke tests |

Selected by `STORAGE_BACKEND=local|s3|memory` in `app/config.py`. The upload
pipeline never learns which one it is holding.

---

## 5. MinIO

Phase 2 is developed against **MinIO**, an S3-compatible object server
running in Docker. It speaks the real S3 wire protocol -- buckets, keys,
`PutObject`, presigned URLs, policies -- so boto3 code written against it
runs unchanged against AWS S3, Cloudflare R2, or Backblaze.

Bytes still land on this machine, in a Docker volume rather than
`backend/uploads`, but every line of code between the request and the
storage is the code that will run in production.

```yaml
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: sketchyart
      MINIO_ROOT_PASSWORD: sketchyart
    ports: ["9000:9000", "9001:9001"]   # API, web console
    volumes: [sketchyart-minio:/data]
```

Going live later means pointing `S3_ENDPOINT` at the real provider and
running a one-off re-upload. The application code is already proven.

### Buckets

| Bucket | Contents | Access |
|---|---|---|
| public | `thumb.webp`, `display.webp`, `tiles/**` | Public read -- this is a public gallery |
| private | `original.<ext>` | Presigned URL on demand, owner only |

The pyramid being public is what lets the detail view reach the original's
full resolution **without the original ever leaving the private bucket** --
the tiles carry every pixel, the archival file stays where it is. Verified
live: a tile returns 200 to an anonymous request, the original returns 403.

Building it this way from the start avoids retrofitting presigned URLs
later, and keeps full-resolution originals from being served by accident.

**Two buckets, not two prefixes.** Bucket policies match on a key *prefix*,
but the variant lives in the suffix (`<id>/original.jpg` against
`<id>/thumb.webp`), so no single-bucket policy can separate them without
giving up the id-derived layout. `S3Storage` routes on the key: anything
matching `/original.` goes to the private bucket, everything else to the
public one. `url_for` returns a plain URL for public objects and a
presigned one for originals, so a caller cannot accidentally leak a
full-resolution file by asking for its URL.

---

## 6. Upload pipeline

The load-bearing fact: **PostgreSQL transactions do not cover the
filesystem.** A row can be rolled back; a written file cannot. Everything
below is arranged around that.

1. **Generate the id.** `uuid.uuid4()` in Python, before touching storage
   or the database.
2. **Validate.** Cap the body with Flask's `MAX_CONTENT_LENGTH`, then
   confirm it is genuinely an image by opening it with Pillow -- never by
   trusting the file extension or `Content-Type`, both client-controlled.
3. **Normalise.** Apply the EXIF orientation flag so phone photos are not
   sideways, then re-encode without metadata. This strips GPS coordinates,
   which matters for anything public.
4. **Measure.** `img.size` gives `width` and `height`. This is the only
   moment the masonry's layout data is captured.
5. **Derive.** Resize to `display` and `thumb`, encode as WebP.
6. **Store.** `storage.save()` for each of the three objects. The local
   backend writes to a temp path and renames into place, so a crash cannot
   leave a half-written file where a complete one should be.
7. **Insert the row and commit.**
8. **On commit failure, delete the prefix.**

### Why files are written before the row

Files-then-database can leave **orphaned bytes** -- invisible to users and
cleanable by a sweep. Database-then-files can leave **a row pointing at
nothing** -- a broken image on the page. Orphans are cheap; broken rows are
not. The commit is the point of truth.

---

## 7. Writing rows

The session machinery already exists from the collections work and uploads
inherit it unchanged.

- **One session per request, one commit.** `app/db.py` holds a
  `scoped_session`; `app/__init__.py` tears it down on
  `teardown_appcontext`, rolling back if the request raised. A failed
  request cannot leak half-applied state into the next one.
- **Inserting is constructing an object.** `session.add(piece)` stages it;
  `commit()` emits the INSERT. Updating is attribute assignment on a loaded
  object -- SQLAlchemy diffs it and emits the UPDATE.
- **Tags need get-or-create.** Attaching tags means finding rows by slug and
  creating the missing ones. Two simultaneous uploads introducing the same
  new tag race; the `unique` constraint on `tags.slug` catches it and the
  handler retries. Near-theoretical for a single-owner gallery, but the
  constraint is what makes it safe rather than lucky.
- **Join tables are written through relationships**, not raw SQL. See
  `_set_membership` in `app/api/collections.py`.

---

## 8. Deletion

Deleting a piece must remove both halves:

1. Database cascades clear `collection_pieces` and `piece_tags`.
2. The handler calls `storage.delete_prefix(<piece-id>/)`.

Both halves are implemented. Two details worth knowing:

- **Objects are removed after the row is gone**, mirroring the write order.
  An orphaned object is recoverable; a row pointing at deleted bytes is a
  broken image.
- **Local deletion retries, then reports.** Windows refuses to unlink a file
  another handle still holds open, and Flask's static serving can hold one
  until the response is fully written -- POSIX has no such restriction. The
  local backend retries briefly and logs a warning if it still cannot
  delete. It never swallows the failure, because silently ignoring it is
  how orphaned bytes accumulate with nothing pointing at them. The S3
  backend has no equivalent problem.

A collection deletion removes only membership rows -- never artwork.

---

## 9. Read path

The serializer composes URLs at read time, so the frontend never sees a
storage key:

```json
{
  "imageUrl":     "/media/<piece-id>/display.webp",
  "thumbnailUrl": "/media/<piece-id>/thumb.webp"
}
```

`PieceCard` uses `thumbnailUrl`; `PiecePage` uses `imageUrl`. The original
is not exposed in the public payload.

---

## 10. Local and S3 are not identical

MinIO is faithful, but it does not simulate everything. These are the gaps
that will still bite:

- **URLs.** Local returns a Flask route. S3 returns either a public bucket
  URL or a **presigned URL that expires** -- which cannot be cached in HTML
  and returns 403 once stale. The public/private bucket split above exists
  to keep this manageable.
- **No directories.** `<piece-id>/` is a *prefix*, not a folder. Deleting
  means listing by prefix and issuing a batch delete, not `rmtree`.
- **No atomic rename.** Each `PutObject` is individually atomic, but writing
  three derivatives is three independent operations. A failure partway
  leaves a partial set -- which is exactly why the row is committed last.
- **Content-Type must be set explicitly.** Flask sniffs it from the
  extension; S3 stores whatever it is told and defaults to
  `binary/octet-stream`, which makes browsers download instead of display.
  A classic first-deploy bug, and one MinIO will catch.
- **Latency.** Local writes are microseconds, S3 is tens of milliseconds per
  object. MinIO on localhost is too fast to reveal this; only real cloud
  will.

---

## 11. Decisions made

| Decision | Rationale |
|---|---|
| Store a derived key, not a URL | Phase 2 becomes a config change, not a data migration |
| Filenames generated from the piece UUID | Current filenames have spaces, tildes, double extensions |
| Do not keep the uploaded filename | Nothing reads it; every key derives from the piece id |
| Three derivatives: original, display, thumb | The grid currently loads 30 MB of full-resolution originals |
| WebP for derivatives | Substantially smaller at equivalent quality |
| Strip EXIF after applying orientation | Correct rotation; removes GPS from public files |
| Files written before the row commits | Orphan bytes are cheap, broken rows are user-visible |
| Storage behind a three-method adapter | Backend becomes a config value |
| MinIO for phase 2 development | Real S3 protocol without a cloud account |
| Public bucket for derivatives, private for originals | Public gallery, protected full-resolution work |

---

## 12. Open questions

None outstanding. The two that were open here are closed:

- **Backfilling the existing files -- done 2026-08-30.**
  `backend/scripts/import_uploads.py` runs the eleven images through the
  same `process_upload` the API uses. Metadata comes from
  `scripts/import-manifest.json`, which a dry run writes for editing. Only
  titles were carried over from mock data; the media, years and tags there
  were invented, and inventing facts about the artwork in a store with no
  edit path is worse than leaving them null. This also retired the
  `fs.allow: ['..']` hack in `frontend/vite.config.ts`.
- **Frontend integration -- done 2026-08-30.** `mock-data.ts` is deleted.
  The grid reads `GET /api/pieces` and renders `thumbnailUrl`; the piece
  page renders `imageUrl`. Development now runs against MinIO
  (`STORAGE_BACKEND=s3`), so the browser fetches artwork from the bucket
  rather than from Flask. Measured: 32 MB of originals, 3.4 MB of
  derivatives, and a 2.4 MB landing page.

Settled during implementation:

- **Resizing is synchronous.** A 13.65 MB image processes in about a second.
  A background queue is the answer only if that becomes annoying.
- **Flask serves `/media/<key>` under the local backend only.** Fine for
  development, wrong for production. The route is not registered at all when
  `STORAGE_BACKEND=s3`, where objects come straight from the bucket.
- **Backup.** `project-overview.md` answers this "not for now". The artwork
  is git-ignored and unbacked; it exists only on this machine. Not
  architectural, but worth a copy somewhere.

---

## 13. Dependencies this adds

| Package | For | Status |
|---|---|---|
| `Pillow` | Decoding, EXIF handling, resizing, WebP encoding | Anticipated in `project-overview.md` |
| `boto3` | S3-compatible object storage | New. Works against AWS, R2, MinIO, Backblaze |

`moto` was considered for mocking boto3 in tests, but it cannot run the
application against object storage. MinIO covers that better. LocalStack
does the same job while emulating all of AWS, and is much heavier.
