# SketchyArt Gallery

React + TypeScript frontend, Flask + PostgreSQL backend, in `frontend/` and
`backend/`. The two documents below are loaded with this one, every session.

@AGENTS.md

@context/MAP.md

## Before you search

`context/MAP.md` is above, in your context already. Answer *where is X* from
it. Search the codebase only when the map does not name the file, and say so
when that happens -- a miss means the map needs a row.

`STATUS.md` is 856 lines and holds project *state*, not locations. Read a
section of it (`rg -n "^## " STATUS.md`, then `sed -n`), never the whole file.
