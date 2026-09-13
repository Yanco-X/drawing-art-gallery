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

## Knowledge graph

graphify is installed, and it answers a different question from the map.
Asked the map's question it costs more and finds less -- measured 2026-09-12:
asked for the spotlight code it missed the backend route, and "archived
pieces" never reached `waived`, at up to ~7.8k tokens a query.

- **Where is X** -- `MAP.md`, already above. No tool call.
- **What depends on X, what calls it, how A reaches B** -- the graph:
  `graphify affected "X"`, `graphify path "A" "B"`, `graphify explain "X"`.
  Here it is exact: `affected "is_owner"` lists every call site by `file:line`.
- The graph lives in git-ignored `graphify-out/`. If it is missing or stale,
  `graphify update .` rebuilds the code graph locally in seconds, with no
  model calls.

Upgrading is `uv tool upgrade graphifyy`. Refreshing the project skill means
rerunning `graphify install --project`, which re-adds the PreToolUse hooks this
project removed and appends graphify's default section, contradicting this
one -- remove both afterwards.
