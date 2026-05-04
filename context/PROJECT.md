# Project Planning & Pillars

## 1. The Problem
**What problem are we solving?**
This is a personal project app designed for storing, organizing, and showcasing personal drawings.

## 2. Users
**Who is this for?**
Initially, the app is for myself as the sole creator. Eventually, it will be open for the public to view—anyone who appreciates drawing and art.

## 3. Features (MVP)
**What does the MVP need?**
- **View content:** Everyone can view the gallery.
- **Upload content:** Restricted to myself (the owner).

## 4. Data
**What are we storing? (Relational DB - PostgreSQL)**
- **piece**: Metadata of each drawing/piece.
- **user**: User data, roles, and permissions.
- **collection**: Curated groups of manually selected and customized pieces.
- **collection_piece**: Join table mapping pieces to collections.
- **tag**: Categorization tags for pieces.

## 5. Tech Stack
**What stack are we using?**
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Python + Flask + PostgreSQL (REST API)

## 6. Monetization
**How will this make money?**
It won't. This is purely a personal gallery and learning project.

## 7. UI/UX
**How should this look and feel?**
Outlined in `DESIGN.md`. A "Silent Curator" approach utilizing a Modern Minimalist Dark aesthetic, keeping the focus strictly on the artwork.

## 8. Documentation
**Docs & Context**
Managed via Markdown files (`README.md`, `PROJECT.md`, `AGENTS.md`, `DESIGN.md`) to maintain clear AI context and agentic workflow rules.