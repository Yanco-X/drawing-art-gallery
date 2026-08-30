# Current Feature

Collections -- schema and REST API.

## Status

Backend complete and verified. Frontend not yet wired to it.

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

### Phase 3: Frontend integration -- not started
- Replace `frontend/src/lib/mock-data.ts` with API calls in `services/`.
- Split `Collection` into summary and detail types so the collections row
  stops over-fetching every piece.
- Collection detail route at `/collections/<slug>`, replacing `InertLink`.
- Owner curation UI: pick pieces, arrange, save.

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
