# Project Structure

This project follows a modularized monolith architecture. The frontend and backend codebases are separated into their own respective directories within the root.

## Root Directory

```text
/
├── frontend/       # React + TypeScript frontend application
├── backend/        # Python + Flask + PostgreSQL backend API
├── README.md       # Project overview and roadmap
├── AGENTS.md       # Agentic workflow rules
└── PROJECT.md      # This file, outlining the project structure
```

## Frontend Structure (`/frontend`)

The frontend is a React + TypeScript application built with custom components rather than relying on a complex component library, ensuring a simple, clean design and interface. Major entities are grouped into their own dedicated folders.

```text
/frontend/src/
├── components/     # Reusable UI components (e.g., buttons, inputs, cards)
├── pages/          # Page-level components representing routes (e.g., Home, Gallery, Upload)
├── hooks/          # Custom React hooks containing reusable logic
├── contexts/       # React Context API files for global state management
├── lib/            # Local data and standalone modules (e.g., mock-data.ts)
├── services/       # API interaction logic and network requests to the backend
├── utils/          # Helper functions and utility scripts
├── assets/         # Static assets like images, icons, and global CSS
├── types/          # TypeScript interface and type definition files
└── index.css       # Tailwind entry point and the design system token layer
```

### Component Guidelines
- We create our own UI components to keep the application lightweight.
- Components should be modular, isolated, and highly reusable.
- Styling follows `context/DESIGN.md`. Colours, spacing and tracking come from
  tokens defined in `index.css` -- components should not carry raw hex values.

### Context Split
A React context is defined across two files so that fast refresh keeps working:
the context object and its types in a plain `.ts` file (e.g. `theme-context.ts`),
the provider component in a `.tsx` file (e.g. `ThemeProvider.tsx`), and the
consumer hook in `hooks/`. A file that exports both a component and a
non-component breaks fast refresh.

## Backend Structure (`/backend`)

Flask REST API over PostgreSQL, using plain SQLAlchemy 2.0 rather than
Flask-SQLAlchemy -- fewer moving parts, and the models stay importable
outside a Flask app context (which is what lets the smoke test run them
against SQLite).

```text
/backend/
├── app/
│   ├── __init__.py     # create_app factory, session teardown
│   ├── config.py       # environment-backed settings
│   ├── db.py           # engine, Base, scoped session
│   ├── models.py       # SQLAlchemy models
│   ├── schemas.py      # hand-written camelCase serializers
│   ├── errors.py       # ApiError and JSON error handlers
│   ├── auth.py         # placeholder owner guard (X-Owner-Token)
│   ├── api/            # one blueprint per resource
│   └── services/       # domain helpers (slug generation)
├── migrations/         # Alembic; versions/ holds the revisions
├── tests/              # runnable smoke scripts
├── uploads/            # artwork on disk (phase 1 storage)
├── docker-compose.yml  # local PostgreSQL
├── requirements.txt
└── run.py              # entrypoint
```

### API Conventions
- JSON keys are **camelCase**, matching the TypeScript interfaces in
  `frontend/src/types` so payloads need no translation layer.
- Errors return `{ "error": "message" }` with an appropriate status.
- Endpoints that change data are owner-only and **fail closed** when no
  owner token is configured.
