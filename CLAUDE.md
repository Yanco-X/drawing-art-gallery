# SketchyArt Gallery

React + TypeScript frontend, Flask + PostgreSQL backend, in `frontend/` and
`backend/`. The two documents below are loaded with this one, every session.

@AGENTS.md

@context/MAP.md

## Before you investigate

If anything changed that you did not change, `AGENTS.md` section 7 applies:
name the change and ask the owner immediately, without opening the files.
Wait only if it touches what your task needs; otherwise keep going on the
rest. They use the app and run other agents here while you work.

## Before you search

`context/MAP.md` is above, in your context already. Answer *where is X* from
it. Search the codebase only when the map does not name the file, and say so
when that happens -- a miss means the map needs a row.

`STATUS.md` is 856 lines and holds project *state*, not locations. Read a
section of it (`rg -n "^## " STATUS.md`, then `sed -n`), never the whole file.
