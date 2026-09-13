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
- Write clean, readable code. Readable comes from naming and structure, not from documenting it afterwards.
- Separate concerns appropriately (e.g., separate UI components from business logic).
- Use proper TypeScript types and interfaces to ensure type safety on the frontend.
- Adhere to PEP 8 standards for Python code.
- One function per task, if a task is too big, break it down into smaller tasks.
- NO EMOJIS!!!

### Names do the explaining

A component, function or variable name must say what the thing is for, on its
own, with no comment under it. If you find yourself writing a line that
explains what something does, the name is wrong -- rename it and delete the
line. `sortPieces`, `usePieceFilter`, `PieceWallLabel` are the standard: read
the name, know the job.

### Comments: default to none

Write no comment unless it stops the next person breaking something.

**Never write:**

- What the code does, or a restatement of a name, a type or a signature.
- A heading over an obvious block, or a summary of the function below it.
- Design reasoning copied out of `context/`. That is the document's job, and
  a copy goes stale in one of the two places without anyone noticing.
- Commented-out code.

**The one comment that earns its place** is a short note about something the
code cannot say and a reader would otherwise get wrong: a browser quirk, a
non-obvious constraint, an approach that was tried and does not work. One or
two lines. If it needs a paragraph, it belongs in `context/` -- put it there
and name the file.

### Logic: plain, and cheap enough

- Write the straightforward version. A reader should follow it top to bottom
  without holding state in their head. Clever is a cost, not a saving.
- **Do not optimize speculatively.** No caching, counters, indexes,
  memoisation or extra layers added "for performance" without a measured
  reason. `pieceCount` is derived rather than stored precisely because a
  counter column is "one bug away from drifting for no measurable gain at
  this scale", and that is the standard.
- **Do not write accidentally expensive code either**, which is the other
  half of the same rule: work repeated inside a loop that could be done once,
  a nested scan where a map would do, a request per item where one call
  returns the set.
- `useMemo` and `useCallback` are for a measured cost or for a stable
  dependency something else needs -- not a reflex on every value.
- This gallery holds a couple of hundred pieces. Size the solution to that,
  not to an imagined million.

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

Open these on demand. Only `CLAUDE.md`, this file and `context/MAP.md` are
loaded automatically; everything below is a menu, not a reading list.

- [`context/MAP.md`](context/MAP.md) is loaded for you already. It is the index:
  the project's vocabulary, every feature and the files that hold it, the
  fixed points, and where new code goes. Answer any "where is X" from it
  before searching; for what depends on what, use graphify -- see `CLAUDE.md`.
  A new feature gets a row, and `/housekeeping` reports any module without one.
- Take into account md files for context, these files are meant to be read.
- When mentioned in the user input prompt, take into account the md files that describe the context of the project or task.
- [`context/project-overview.md`](context/project-overview.md) contains full in depth description of the project, its goals, and context.
- [`context/DESIGN.md`](context/DESIGN.md) contains the design guidelines and rules.
- [`context/STORAGE.md`](context/STORAGE.md) contains how data and image files are stored, the upload pipeline, and the storage adapter.
- [`context/WAIVED-PIECES.md`](context/WAIVED-PIECES.md) contains the two-stage removal flow: waiving a piece out of the gallery, restoring it, and the delete guard.
- [`context/AUTH.md`](context/AUTH.md) contains the session design, the visitor contract, and how the owner signs in without the gallery showing a login.
- [`context/gallery-admin-access-handoff.md`](context/gallery-admin-access-handoff.md) contains the admin-access strategies that AUTH.md was decided against.
- [`context/PROJECT.md`](context/PROJECT.md) contains the project pillars, goals.
- [`context/STRUCTURE.md`](context/STRUCTURE.md) contains the project structure.
- [`README.md`](README.md) contains the overall project context and roadmap.
- [`context/ai-interactions.md`](context/ai-interactions.md) contains the AI interaction guidelines.
- [`context/coding-preferences.md`](context/coding-preferences.md) contains in depth coding preferences and rules.
- [`context/current-feature.md`](context/current-feature.md) contains the current feature being worked on. This file is meant to be updated as the feature is being worked on. Clean this file before starting a new feature.
- context/DEPLOYMENT-NOTES.md contains the security findings to close before launch. Deliberately not @-loaded: open it before touching config, cookies, storage or deployment. It is git-ignored and exists only on the owner's machine -- a public list of open weaknesses is a map for an attacker. If it is missing, ask; never recreate it in a tracked file.

## 9. Security

The repository is public, and the gallery will be. Anything committed is
published, and deleting it later does not unpublish it -- git history keeps
every version. The site's security rests on the password, the session and
the server's checks, never on the code being secret. These rules are what
make a security sweep unnecessary for routine work: follow them while
writing, not afterwards.

### Secrets

- **Credentials live in `backend/.env` and nowhere else.** Passwords,
  tokens, keys, and any URL with a password in it. Tracked files name the
  variable -- `${POSTGRES_PASSWORD}`, `os.getenv("S3_SECRET_KEY")` -- never
  the value. That covers code, docs, examples, comments and commit messages.
- **A template holds blanks.** `.env.example` is public, so not even a local
  development value goes in it. A "dev only" password in a public file is a
  published password.
- **No working fallback.** `os.getenv("X", "real-password")` ships the
  password in the source. A secret with no value defaults to nothing, and the
  app fails at startup.
- **Nothing in `frontend/` is secret.** Vite inlines every `VITE_*` variable
  into the bundle every visitor downloads. The browser never holds a
  credential; the session is an `HttpOnly` cookie it cannot read.
- **Test fixtures look fake**: `"test-token"`, never a value someone could
  reuse against a real service.
- **A secret already committed is burned.** Removing it from the file does
  not help; say so, and say it must be rotated. Never repeat a secret's value
  in chat, a document or a commit message -- name the file and line.

The root `.gitignore` catches key files and stray `.env` copies. It is a net,
not the rule: it cannot see a password typed into a tracked file.

### The boundary

`context/AUTH.md` section 1 is the visitor contract. New code keeps it:

- A mutating route is `POST`, `PUT`, `PATCH` or `DELETE`, never `GET` --
  `SameSite=Lax` does not protect a `GET` -- and carries `@require_owner`.
- A read path or query parameter that can return more than a visitor sees
  checks `is_owner()`, and gets a case in `tests/smoke_visitor.py`.
  `?includePrivate=1` shipped ungated for weeks because this rule lived in a
  comment.
- What a visitor may not have answers 404, not 403. A 403 confirms it exists.
- A new serialized field is one the contract allows: never a user, email,
  hash, storage key or file path.

### Input

- Client input never becomes a file path or a storage key. Keys derive from
  server-generated ids.
- Uploads are validated by decoding the bytes, never by extension or
  `Content-Type`.
- Every field is bounded -- length, range, type -- and a bad one gets the
  API's own 400. Leaving the database to refuse it is a 500.
- Queries go through SQLAlchemy with bound parameters. No SQL built from
  strings.

### Development-only settings

`FLASK_DEBUG=1`, `COOKIE_SECURE=0`, `OWNER_API_TOKEN` and the ports
`docker-compose.yml` publishes are safe only on this machine. A new setting
of that kind is marked development-only where it is defined, and added to the
blocking list in `context/DEPLOYMENT-NOTES.md` -- so it is flipped before
launch rather than found after.

### When to call the security agent

For changes to the boundary itself: `auth.py`, the session or keyhole code, a
new route, a new visibility parameter, the upload pipeline, `storage.py`, or
anything else that changes what a visitor can see. Run it on the change, not
the repository. Routine work under the rules above does not need it.

Hand it the graph first. It is read-only and cannot run graphify, so the
caller does: `graphify update .` if the graph is missing, then
`graphify affected "require_owner"` and `graphify affected "is_owner"`, and
both outputs go in the prompt. Together they list the routes and read paths on
the boundary by `file:line` -- the set the agent checks against.

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
