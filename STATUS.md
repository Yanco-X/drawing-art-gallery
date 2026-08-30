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
* **Piece page**: Artwork with a wall-label metadata rail, tags, collections, prev/next, and a not-found state.
* **Components** (`src/components/`):
  * `Header.tsx` - Wordmark, nav, theme toggle, owner/visitor action, mobile menu.
  * `ThemeToggle.tsx` - Dark/light switch, labels the active theme.
  * `IntroSection.tsx` - Eyebrow and display headline.
  * `SectionHeader.tsx` - Shared "Collections" / "All work" heading row.
  * `CollectionsSection.tsx`, `CollectionCard.tsx` - Collections row.
  * `AllWorkSection.tsx`, `MasonryGrid.tsx`, `PieceCard.tsx` - Artwork grid.
  * `DensityControl.tsx` - Airy / Comfortable / Dense preference.
  * `SiteFooter.tsx`, `InertLink.tsx` - Footer, and a placeholder link for routes that do not exist yet.
* **State** (`src/contexts/`, `src/hooks/`):
  * `ThemeProvider` with `useTheme`, persisted and stamped before first paint.
  * `useGridDensity` on a generic `usePersistentState`.
  * `useFlipReflow` - animates the masonry when density changes.
* **Data Layer**:
  * `frontend/src/lib/mock-data.ts` - Local mock dataset. Images and aspect ratios are real; titles, media and years are placeholders pending real metadata.

### Backend (`/backend`)
* **Framework**: Flask app factory with plain SQLAlchemy 2.0 and a scoped session.
* **Database**: PostgreSQL 17 via `docker-compose.yml`. Schema created by the initial Alembic revision.
* **Models**: `User`, `Piece`, `Collection`, `CollectionPiece`, `Tag`. Uses the generic `Uuid` type so the API can be exercised against SQLite.
* **Endpoints**: Read routes for pieces and collections; owner-gated create, update, delete, and membership replacement for collections.
* **Auth**: Placeholder `X-Owner-Token` shared secret that fails closed. Real sessions pending.
* **Verification**: `tests/smoke_collections.py` runs the real app end to end against in-memory SQLite -- 27 checks.
* **Storage**: `backend/uploads` holds artwork on disk (phase 1).

---

## 5. Active Feature & Next Steps

### Completed: Landing Page UI Rebuild
The landing page was rebuilt against the new design system in `context/DESIGN.md`, followed by the piece detail view.

### Completed: Collections Schema & API
Backend schema and REST API for collections -- create, curate, reorder, publish. Not yet wired to the frontend, which still reads mock data.

### Known Gaps
* Collection cards, "View all", "Tags" nav and "Owner sign in" are inert pending routes. Piece cards now navigate.
* Piece descriptions are empty in mock data; the block renders as soon as copy exists.
* Tag filtering is not wired up; pieces carry tags but no filter UI is shown.
* No loading or skeleton state for the grid.
* Mock piece metadata (medium, year, most titles) is placeholder.
* Uploaded images are served at full resolution -- roughly 30MB for one page load, with a 14MB single file. Thumbnail generation is needed.

### Upcoming Milestones
1. Real owner authentication, replacing the shared-secret guard.
2. Upload endpoint: store the file, record width/height, generate thumbnails.
3. Point the frontend at the API, replacing `frontend/src/lib/mock-data.ts`.
4. Collection detail route and the owner curation UI.
5. Tag filtering, restoring the chip row.
