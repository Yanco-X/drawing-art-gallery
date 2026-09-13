# Project Structure

Why the codebase is shaped the way it is. **For where a given feature lives,
read `context/MAP.md`**; for what depends on what, ask the knowledge graph --
`graphify affected`, `graphify path`. `CLAUDE.md` says which to use when.

A modularized monolith. `frontend/` and `backend/` are separate codebases in
one repository, deployed together.

## Frontend (`/frontend`)

React + TypeScript, with components written here rather than pulled from a
component library. The design is simple enough that a library would cost more
in weight and override-fighting than it saves.

- Components are modular, isolated and reusable. Pages stay thin: they compose
  sections, they do not lay out.
- Styling follows `context/DESIGN.md`. Colours, spacing and tracking come from
  tokens defined in `index.css`; a component should never carry a raw hex value.
- Types are real. `frontend/src/types` is the contract with the backend, and it
  is written to match what the API sends rather than what a component wants.

## Backend (`/backend`)

Flask REST API over PostgreSQL, using plain SQLAlchemy 2.0 rather than
Flask-SQLAlchemy -- fewer moving parts, and the models stay importable outside
a Flask app context, which is what lets the smoke tests run them against
SQLite.

One blueprint per resource under `app/api/`, registered in `app/api/__init__.py`.
Domain helpers that are not HTTP go in `app/services/`.

### API conventions

- JSON keys are **camelCase**, matching the TypeScript interfaces in
  `frontend/src/types` so payloads need no translation layer.
- Errors return `{ "error": "message" }` with an appropriate status.
- Endpoints that change data are owner-only and **fail closed** when no owner
  token is configured.
