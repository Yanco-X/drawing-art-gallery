# Agentic Workflow Rules

This document establishes the basic rules and guidelines for AI agents working on this repository.

## 1. Plan Before Execution
- Always understand the full context of a request before starting implementation.
- Ask for clarification if requirements are ambiguous.
- Break down complex tasks into smaller, manageable steps.

## 2. Tech Stack Consistency
- Stick to the defined tech stack: **React + TypeScript** for the frontend, and **Python + Flask + PostgreSQL** for the backend.
- Avoid introducing unnecessary third-party libraries without explicit approval.

## 3. Step-by-Step Implementation
- Implement and verify one feature or component at a time.
- Do not make sweeping changes across the entire codebase at once unless absolutely necessary.

## 4. Code Quality & Modularity
- Write clean, readable, and well-documented code.
- Separate concerns appropriately (e.g., separate UI components from business logic).
- Use proper TypeScript types and interfaces to ensure type safety on the frontend.
- Adhere to PEP 8 standards for Python code.
- One function per task, if a task is too big, break it down into smaller tasks.
- No comments unless it is strictly necessary or the function is too complex.
- No need to explain what the code does, as the code itself should be self-explanatory.
- No need to explain the logic or the reason behind a decision, unless it is strictly necessary.
- NO EMOJIS!!!

## 5. Incremental Progress & Testing
- Whenever possible, validate that the local changes work before moving on to the next step.
- Ensure that both the frontend and backend can run without errors after each significant update.

## 6. Clear Communication
- Keep the user updated on what steps are being taken and why.
- Provide clear summaries of the changes made during a session.
- If the live gallery data changes underneath you mid-session -- the
  spotlight order, a piece's details, anything in the running app -- stop
  and ask whether the owner made the change and what they did. Do not
  investigate and do not restore anything until they answer. They are using
  the app while you work, so a surprising state is a question for them
  before it is a bug for you, and one question is cheaper than a hunt.

## 7. Context & References
- Take into account md files for context, these files are meant to be read.
- When mentioned in the user input prompt, take into account the md files that describe the context of the project or task.
- @context/project-overview.md contains full in depth description of the project, its goals, and context.
- @context/DESIGN.md contains the design guidelines and rules.
- @context/STORAGE.md contains how data and image files are stored, the upload pipeline, and the storage adapter.
- @context/WAIVED-PIECES.md contains the two-stage removal flow: waiving a piece out of the gallery, restoring it, and the delete guard.
- @context/AUTH.md contains the session design, the visitor contract, and how the owner signs in without the gallery showing a login.
- @context/gallery-admin-access-handoff.md contains the admin-access strategies that AUTH.md was decided against.
- @context/PROJECT.md contains the project pillars, goals.
- @context/STRUCTURE.md contains the project structure.
- @README.md contains the overall project context and roadmap.
- @context/ai-interactions.md contains the AI interaction guidelines.
- @context/coding-preferences.md contains in depth coding preferences and rules.
- @context/current-feature.md contains the current feature being worked on. This file is meant to be updated as the feature is being worked on. Clean this file before starting a new feature.

# Commands

Three things, in this order. `STATUS.md` section 2 carries the full detail:
the environment files, the migration head to expect, and how to sign in.

## 1. Infrastructure

Postgres and MinIO must be up before the backend is useful. SQLAlchemy's
engine is lazy, so `flask run` starts perfectly happily without them and the
first request touching the database is what fails -- which makes a stopped
container look like a broken API rather than a missing step.

Run this from `backend/`, where the compose file lives -- from the
repository root it fails with "no configuration file provided", and the
named volumes would not be reused.

- `docker compose up -d` - postgres:5432, minio:9000, console:9001.

## 2. Backend

From `backend/`, with the virtual environment active.

- `.\.venv\Scripts\Activate.ps1` - activate, on PowerShell. Bash wants
  `source .venv/Scripts/activate` instead.
- `alembic upgrade head` - apply migrations.
- `flask --app app run --port 5000` - start the development server.

`python run.py` starts the same app, but only once the environment is
active and the containers are already up. Activation is the step most often
missed.

## 3. Frontend

From `frontend/`.

- `npm run dev` - Start the development server on :5173, proxying `/api`
  and `/media` to 127.0.0.1:5000.
- `npm run build` - Build the project for production.

## Verify

- `curl http://127.0.0.1:5000/api/health`
