---
name: housekeeping
description: Sweep the repository for drift - a stale map, features missing from it, dead modules, comment creep, a handoff file describing shipped work - then verify the build. Use when asked to tidy up, check repository health, or before starting a new feature.
---

# Housekeeping

Drift is what makes the next agent slow. A map that names the wrong line, a
feature with no row, a handoff file describing work that shipped last week --
each one costs every future session a search it should not have to do.

Run the mechanical part, then use judgment on what it prints. **Report; fix
only what this file says is safe to fix.**

## 1. The sweep

```bash
python scripts/housekeeping.py
```

It regenerates the map, then reports on four things it cannot decide for
itself. Take them in turn:

**Map freshness.** Regenerating is safe and automatic -- the generated half is
derived from source. If it says REGENERATED, look at `git diff context/MAP.md`
and mention what moved. Do not hand-edit anything between the markers.

**Modules the map does not name.** Each is either a feature that needs a row
in section 2, or plumbing that never will. Judge it: `GalleryFilter` is a
feature, `useAsync` is plumbing. Add rows for the former; add names to
`GENERIC` in the script for the latter, so the list stays short enough to read.
This is the one finding worth fixing on the spot -- the map is the thing every
other agent depends on.

**Modules nothing imports.** Barrels count as importers, so a hit here means
genuinely nothing references it. Confirm against the map's import graph before
suggesting a delete, and **never delete without asking** -- `AGENTS.md`
section 8 and `ai-interactions.md` both require it.

**Comment budget.** `AGENTS.md` section 4 is the standard: names explain,
comments do not, and design reasoning lives in `context/`. A file over 30% is
worth a look, not an automatic edit. Report the worst and say what kind of
comment it is -- restating a name, duplicating a document, or genuinely
load-bearing. Only the first two are worth removing.

**Loose ends.** `TODO`/`FIXME` without a reason, and the size of
`context/current-feature.md`. That file is the handoff between agents: if its
History section describes work that shipped, the history belongs in
`STATUS.md` and the file should be cleared for what is next. Say so; clearing
it is the owner's call.

## 2. The build

Not in the script, because it is slow and needs `node_modules`.

```bash
cd frontend && npm run build   # tsc -b && vite build
cd frontend && npm run lint
```

`AGENTS.md` section 5: the typecheck and the build are the agent's proof.
**Do not open a browser** -- the owner does the UI testing.

Backend, if the containers are up:

```bash
cd backend && .venv/Scripts/python.exe -m tests.smoke_visitor
```

## 3. Report

One short section per finding, most consequential first, each with the file
and what it costs. End with what you changed -- which should usually be
nothing beyond the regenerated map and any map rows you added.

Do not write a commit message. The owner commits.
