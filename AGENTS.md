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
- You are probably not the only agent in this repository. Touch only the files
  your task needs, and run `git status` before you start rather than assuming
  a clean tree is yours to interpret. See section 7.
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
- For an agent that means the typecheck and `npm run build`, not the browser.
- **The owner does the UI testing.** Do not drive a browser to check that a
  visual change works unless the owner asks for it. Finish the change, prove
  it builds, say what changed, and hand it over. The scaffolding costs more
  than most changes are worth: a one-line change to a form field once cost a
  dozen tool calls of stubbing sessions and fighting hit testing to verify
  something the owner checked himself in seconds.
- **When the owner does ask, go ahead and use it properly.** Launch Chrome
  over CDP with whatever it needs, and drive it with real input events --
  `document.elementFromPoint` or `Input.dispatchMouseEvent`, never
  `element.click()`, which dispatches straight to the node and skips hit
  testing. That mistake once reported a button working while an invisible
  panel covered it.
- **Expect not to have the owner's session.** The owner tests in Brave and
  an agent opens its own Chrome, so the agent lands as a visitor: no Upload
  button, no owner controls, and the owner surface simply absent. Say so and
  ask rather than working around it -- the owner can intervene and enable
  what is needed. Do not treat a missing owner control as a bug in the code.

## 6. Clear Communication
- Keep the user updated on what steps are being taken and why.
- Provide clear summaries of the changes made during a session.
- The owner makes every commit. Never run `git commit`, and do not write a
  commit message unless they ask for one. Finish the work, say what changed,
  and stop -- an unasked-for message is noise at the end of every report, and
  the owner writes their own history.

## 7. When Something Changed That You Did Not Change

**Ask first. Do not look.** This rule overrides the instinct to investigate,
and it applies the moment you notice, not after you have formed a theory.

### What triggers it

Anything that is not how you left it, whether it moved mid-task or between
one prompt and the next:

- Live gallery data -- the spotlight order, a piece's details, a collection's
  contents, anything in the running app.
- Files modified in the working tree that you did not touch.
- A file, route or component that is there now and was not before, or gone now
  and was there before.
- Behavior that contradicts what you established earlier in the session.

This fires when you happen to notice something. It is not an instruction to
poll `git status` while you work.

### What to do

1. **Do not look.** Do not open the changed file, do not read the diff, do not
   run `git log`, do not grep for a cause, do not reload the app to confirm,
   and do not build a hypothesis. Reading the code *is* investigating.
2. **Say exactly what you noticed, straight away.** Name the file, the value,
   the field -- "`PiecePage.tsx` and `PieceWallLabel.tsx` are modified and I
   did not touch them", not "something seems to have changed". Report only
   what you already saw in passing; do not go looking in order to describe it
   better. Raising it is cheap, so it is never deferred to the end.
3. **Ask whether the owner made the change, and what they did.** Both halves.
   Knowing it was them is not enough to continue safely -- what they changed
   decides whether your work still stands.
4. **Then decide whether to wait**, by the test below.
5. **Never restore, revert or "tidy" it.** Not even if it looks like a mistake.

Only investigate if they tell you it was not them.

### Does it block you?

Raising it is always immediate. *Waiting* is not: the owner runs other agents
here, so most foreign changes have nothing to do with your task, and blocking
on each one would stall work for no reason.

Decide from **file paths and `context/MAP.md` alone**. You know which files
your task touches; `git status` told you which changed. Comparing the two is
not investigating -- opening them is.

**Stop and wait** when the change is:

- a file your task is going to edit, or has already edited;
- a file your current step read or depends on;
- in the same `MAP.md` feature row as your task;
- the live data your current step is working against.

**Keep going** otherwise -- on the parts that do not depend on the answer.
Do not touch the changed files meanwhile, even in passing. If you run out of
independent work before they reply, stop there rather than starting the part
that depends on it, and say what you are holding.

**If you cannot tell which case it is without opening the file, treat it as
blocking.** Waiting costs a round trip; guessing wrong costs their work.

### Why

The owner uses the gallery while you work and often runs a second agent in
this repository at the same time, so a surprising state is nearly always
theirs and deliberate. Investigating first has already cost a long hunt that
proved something they knew instantly, and a "restore" that silently undid a
change they meant to make. One question is cheaper than either.

## 8. Context & References
- @context/MAP.md is the index: the project's vocabulary, every feature and the
  files that hold it, the fixed points, and where new code goes. Answer any
  "where is X" from it before searching. Run `python scripts/build_map.py`
  after adding, moving or deleting a file so its generated half stays true.
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
