# Current Feature

Real data end to end -- uploads, storage, and a gallery that reads the API.

## Status

The gallery runs on PostgreSQL and MinIO. Mock data is gone.
Collections have a backend but no data and no UI.

## Goals

### Phase 1: Schema -- done
- `Collection` with name, slug, description, cover, visibility, timestamps.
- `CollectionPiece` join table carrying curated `display_order`.
- Backfilled `Piece` with `medium`, `year`, `width`, `height` -- fields the
  UI already renders but the schema draft never had.
- Initial Alembic revision; upgrade and downgrade both verified.

### Phase 2: API -- done
- Read: `GET /api/collections`, `/api/collections/<slug>`, `/api/pieces`.
- Owner: create, patch, delete, and `PUT .../pieces` to replace membership
  and order in one idempotent write.
- Cover rules: must be a member; resets to the first-piece fallback when the
  chosen piece leaves the collection.
- Owner guard on a shared secret that fails closed, pending real auth.

### Phase 3: Storage and uploads -- done
Specification and outcome in `@context/STORAGE.md`. Derived keys instead of
`pieces.image_url`, storage behind a four-method adapter, MinIO for the S3
path, and an upload pipeline that validates, strips EXIF, measures, derives
thumb and display, stores, then commits.

### Phase 4: Frontend integration -- done, except collections
- `mock-data.ts` deleted. `services/pieces.ts` reads the API; `useAsync`
  carries the loading and error states.
- Owner upload modal with drag and drop, wired to `POST /api/pieces`.
- `Collection` split into `CollectionRef`, `CollectionSummary`, and
  `Collection`, so the row no longer implies fetching every piece.
- Collections can be created from the grid by picking pieces, or from a
  piece's own page. `PUT /api/pieces/<id>/collections` sets membership
  from the piece side.
- Still open: collection detail route at `/collections/<slug>` replacing
  `InertLink`, and reordering an existing collection from the UI.

### Phase 5: Waived pieces -- specified, not started
Two-stage removal: a piece is waived out of the gallery before it can be
deleted, and waiving is reversible. Full specification in
`@context/WAIVED-PIECES.md`.

### Phase 6: Editing -- not started
No `PATCH /api/pieces/<id>`. A piece cannot be corrected after upload, and
re-uploading mints a new id, so its URL changes. The import manifest is the
only workaround for imported work. Pinned by the owner on 2026-08-30.

## Notes

- **Run it**: see `backend/README.md`. Needs Docker Desktop running for
  PostgreSQL, or use the SQLite smoke test to exercise the API without it.
- **Decisions**: recorded in `context/project-overview.md` under Data Model.
- **Blocked on**: real authentication, before any owner UI can ship.

## History

- **2026-05-05**: Feature goals initialized based on the 3-phase landing spec.
- **2026-08-25**: Landing page rebuilt against the `new_UI` design system.
- **2026-08-26**: Piece detail view designed and built. Collections schema
  and API implemented; PostgreSQL confirmed as the database, resolving the
  MongoDB reference that had been sitting in `AGENTS.md`.
- **2026-08-26**: Storage adapter, image pipeline, and upload endpoints.
- **2026-08-30**: `pieces.original_filename` dropped. Upload modal built.
  The eleven existing images imported, and the gallery switched off mock
  data onto PostgreSQL and MinIO.
- **2026-08-31**: Waived pieces implemented. Collection creation added,
  from the grid and from a piece.
