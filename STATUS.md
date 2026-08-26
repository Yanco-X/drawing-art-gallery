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

* **Design Concept**: "The Silent Curator" (Modern Minimalist Dark).
* **Color Palette**: Deep Ink / Charcoal surfaces (`#141311`), Muted Olive and Taupe accents.
* **Typography**: Manrope for all headings, body, and label text.
* **Grid & Layout**: 12-column fixed grid with generous negative space to emphasize artwork.
* **Elevation**: Tonal layers and subtle ambient glows instead of heavy drop shadows.

---

## 4. Current Implementation Status

### Frontend (`/frontend`)
* **Initialized**: React + TypeScript + Vite scaffolding.
* **Routing**: Configured in `App.tsx` redirecting root `/` to `/home`.
* **Components**:
  * `Navbar.tsx` - Top navigation bar with branding, search input, and action button.
  * `HeroSection.tsx` - Header banner section.
  * `ArtworkCard.tsx` - Reusable image card for grid display.
  * `Footer.tsx` - Bottom layout footer.
* **Pages**:
  * `LandingPage.tsx` - Base home view consuming layout components.
* **Data Layer**:
  * `src/lib/mock-data.ts` - Local mock dataset for collections and artwork pieces.

### Backend (`/backend`)
* **Directory Structure**: Initialized with `backend/uploads` holding initial artwork assets.
* **API & Database**: Models, endpoints, and migration scripts planned and documented, pending implementation.

---

## 5. Active Feature & Next Steps

### Active Track: Landing Page UI Layout & Refinement
* **Phase 1**: Base layout, grid view, header search bar, dark theme integration, and `/home` route.
* **Phase 2**: Dynamic integration of uploaded assets from `backend/uploads` into the mock data structure and collection linking.
* **Phase 3**: Recent collections section and 10 most recent artwork items display.

### Upcoming Milestones
1. Complete landing page UI phases with mock data.
2. Initialize Flask REST API structure and endpoints.
3. Configure PostgreSQL database, SQLAlchemy models, and Alembic migrations.
4. Integrate frontend services to communicate with the Flask API.
