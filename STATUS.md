# Project Status and Architecture Summary

## 1. Project Overview

SketchyArt Gallery is a personal web application built to store, organize, and showcase original artwork and drawings. It provides a centralized digital portfolio replacing scattered cloud folders and social media uploads.

* **Primary Purpose**: Single curated home for personal artwork.
* **Access Model**: Private uploading and curation for the owner; public viewing and browsing for visitors.
* **Monetization**: None. Developed strictly for learning, practice, and skill development.

---

## 2. Tech Stack

### Frontend
* **Framework**: React (SPA with TypeScript)
* **Build Tool**: Vite
* **Styling**: Tailwind CSS (custom components, CSS variables, dark mode first)
* **Routing**: React Router (`react-router-dom`)

### Backend
* **Language**: Python
* **Web Framework**: Flask (REST API)
* **Database**: PostgreSQL
* **ORM & Migrations**: SQLAlchemy 2.0 / Alembic

### Storage
* **Phase 1 (Development / MVP)**: Local filesystem storage (`backend/uploads`)
* **Phase 2 (Production)**: Cloud object storage (e.g., S3, Cloudflare R2, or Cloudinary)

---

## 3. UI/UX Design Direction

Full system in `context/DESIGN.md`.

* **Design Concept**: "The Silent Curator" -- quiet, editorial, restrained.
* **Themes**: Two of equal standing. Dark (`#0e0e10`) reads as a dim viewing room; light (`#f6f4ef`) as warm gallery paper. Swapped at runtime via `data-theme` on `<html>`, persisted to `localStorage`.
* **Accent**: A single muted gold (`#c9a86a`), shared by both themes and used sparingly.
* **Typography**: Instrument Serif for display and titles, Instrument Sans for UI.
* **Grid & Layout**: Fluid, no media queries in content. Regions capped at 1400px with `clamp()` gutters. Artwork sits in a CSS multi-column masonry with user-selectable density.
* **Elevation**: None. No shadows anywhere -- depth is a 1px border and the `surface`/`bg` split.
* **Shapes**: Border radius 0 everywhere, deliberately.

---

## 4. Current Implementation Status

### Frontend (`/frontend`)
* **Initialized**: React + TypeScript + Vite scaffolding, Tailwind CSS v4.
* **Routing**: `App.tsx` redirects `/` to `/home`, serves `/piece/:id`, and sends unknown paths back to `/home`. `ScrollToTop` resets scroll on navigation.
* **Landing page**: Rebuilt against the design system. Header, optional intro, collections row, and the "All work" masonry, in both themes.
* **Piece page**: Artwork with a wall-label metadata rail, tags, collections, prev/next, and a not-found state. Owners get a delete affordance at the foot of the rail, behind a confirmation that names the piece.
* **Components** (`src/components/`):
  * `Header.tsx` - Wordmark, nav, theme toggle, owner/visitor action, mobile menu.
  * `ThemeToggle.tsx` - Dark/light switch, labels the active theme.
  * `IntroSection.tsx` - Eyebrow and display headline.
  * `SectionHeader.tsx` - Shared "Collections" / "All work" heading row.
  * `CollectionsSection.tsx`, `CollectionCard.tsx` - Collections row.
  * `AllWorkSection.tsx`, `MasonryGrid.tsx`, `PieceCard.tsx` - Artwork grid.
  * `DensityControl.tsx` - Airy / Comfortable / Dense preference.
  * `UploadModal.tsx` - Owner upload: drag and drop, metadata fields, tag chips.
  * `ConfirmDialog.tsx` - Reusable confirmation, `tone="danger"` for actions with no undo.
  * `PieceOwnerActions.tsx` - Collections, waive, restore with a collection picker, and delete.
  * `NewCollectionDialog.tsx` - Names a collection once its pieces are picked.
  * `SectionState.tsx` - The quiet line a section shows while loading, on failure, or when empty.
  * `SiteFooter.tsx`, `InertLink.tsx` - Footer, and a placeholder link for routes that do not exist yet.
* **State** (`src/contexts/`, `src/hooks/`):
  * `ThemeProvider` with `useTheme`, persisted and stamped before first paint.
  * `useGridDensity` on a generic `usePersistentState`.
  * `useFlipReflow` - animates the masonry when density changes.
* **Data Layer**: No mock data. Every view reads the API.
  * `frontend/src/services/pieces.ts` - `fetchPieces`, `fetchPiece`, `fetchCollections`, `createPiece`. Vite proxies `/api` and `/media` to Flask, so the frontend stays same-origin and no CORS is configured.
  * `frontend/src/hooks/useAsync.ts` - One remote read with loading and error states. Not a cache: the gallery makes two requests on load.
  * `frontend/src/lib/session.ts` - Role derived from `VITE_OWNER_TOKEN`, so the Upload button appears only when uploading would succeed.

### Backend (`/backend`)
* **Framework**: Flask app factory with plain SQLAlchemy 2.0 and a scoped session.
* **Database**: PostgreSQL 17 via `docker-compose.yml`. Schema created by the initial Alembic revision.
* **Models**: `User`, `Piece`, `Collection`, `CollectionPiece`, `Tag`. Uses the generic `Uuid` type so the API can be exercised against SQLite.
* **Endpoints**: Read routes for pieces and collections; owner-gated create, waive, restore and delete for pieces, and create, update, delete, and membership replacement for collections. `GET /api/pieces/<id>` also carries the collections a piece appears in; the list route does not, since resolving them per row would be a query per piece.
* **Import**: `scripts/import_uploads.py` backfills artwork that predates the pipeline, through the same processing the API uses. Metadata comes from an editable `scripts/import-manifest.json`.
* **Auth**: Placeholder `X-Owner-Token` shared secret that fails closed. Real sessions pending.
* **Verification**: 146 checks total. `tests/smoke_collections.py` (46), `tests/smoke_uploads.py` (35) and `tests/smoke_waived.py` (37) run against SQLite and in-memory storage; `tests/integration_live.py` (28) runs against real PostgreSQL and MinIO with real artwork.
* **Storage**: Pluggable via `STORAGE_BACKEND`. `LocalStorage` writes to `backend/uploads` and Flask serves `/media/<key>`; `S3Storage` targets any S3-compatible bucket. Full design in `context/STORAGE.md`.
* **Uploads**: `POST /api/pieces` validates by decoding, applies EXIF orientation, strips metadata, records width/height, and derives WebP thumb and display renditions. `DELETE` clears the row and the objects.
* **Object storage**: MinIO in `docker-compose.yml` runs the phase 2 code path locally. Public bucket for derivatives, private bucket for originals via presigned URL.

---

## 5. Active Feature & Next Steps

### Completed: Landing Page UI Rebuild
The landing page was rebuilt against the new design system in `context/DESIGN.md`, followed by the piece detail view.

### Completed: Collections Schema & API
Backend schema and REST API for collections -- create, curate, reorder, publish.

### Completed: Upload UI
Owner-only "+ Upload" opens a modal with drag and drop, a preview, title, description, medium, year, date made, and tag chips. Uploads POST to the live API and appear at the head of the grid.

### Completed: Storage & Uploads
Storage adapter, image pipeline, and upload/delete endpoints. Runs against local disk or S3-compatible object storage. Development runs on MinIO (`STORAGE_BACKEND=s3`).

### Completed: Collection Creation
Two ways in. From the gallery, "+ New collection" enters a picking mode -- cards carry a numbered badge, and pick order becomes display order -- then a dialog names it and `POST /api/collections` creates it with its membership in one transaction. From a piece, "Collections" opens a checkbox list of every collection, published or not, with a field to start a new one; unticking removes. `PUT /api/pieces/<id>/collections` sets the whole list, preserving the position of memberships that stay.

### Completed: Waived Pieces
Two-stage removal. A piece is waived out of the gallery -- reversibly, but dropping its collection membership -- before it can be deleted, and `DELETE` refuses an exhibited piece with a 409 so the rule holds outside the UI. Waived work lives at `/waived`, owner-only, and 404s for anyone else. Restoring offers a multi-select collection picker so curation can be rebuilt at the moment there is context for it. Full design in `context/WAIVED-PIECES.md`.

### Completed: Real Data End to End
The eleven existing images were imported and `mock-data.ts` deleted. The gallery, the piece page, and prev/next all read PostgreSQL, and the browser fetches artwork from the MinIO bucket. Only titles were carried over from mock data -- its media, years and tags were invented, and are not in the database.

### Known Gaps
* Collection cards and "View all" are still inert: collections can be created and curated, but there is no `/collections/<slug>` route to open one. "Tags" nav and "Owner sign in" are likewise inert.
* **No `PATCH /api/pieces/<id>`.** A piece cannot be edited after upload; correcting a title means delete and re-upload, which mints a new id and changes its URL. Imported work can be corrected by editing the manifest and re-running with `--replace`. Pinned by the owner on 2026-08-30.
* Imported pieces have no medium, year, description or tags. The card and wall label omit what is absent rather than guessing.
* Tag filtering is not wired up; pieces carry tags but no filter UI is shown.
* The grid has a text loading state, not a skeleton.
* Under StrictMode the two landing-page reads are issued twice in development. React's intentional double-invoke; the fetch cleanup discards the first response, and a production build issues one each.

### Upcoming Milestones
1. Collection detail route at `/collections/<slug>`, so a collection can be opened.
2. `PATCH /api/pieces/<id>` and an edit affordance, so an upload can be corrected.
3. Real owner authentication, replacing the shared-secret guard.
4. Tag filtering, restoring the chip row.
