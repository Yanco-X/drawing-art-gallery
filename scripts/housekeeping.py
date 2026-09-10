"""Mechanical repository checks. Judgment lives in the skill, not here.

    python scripts/housekeeping.py

Prints a report and exits 0 always -- these are observations for a human or
an agent to weigh, not a gate. Nothing is modified except the generated half
of context/MAP.md, which is derived and safe to rewrite.
"""

from __future__ import annotations

import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "frontend" / "src"
APP = ROOT / "backend" / "app"

# Infrastructure the map has no reason to name feature by feature.
GENERIC = {
    "useAsync", "usePersistentState", "useDismissable", "index", "main",
    "App", "vite-env", "config", "db", "errors", "helpers", "cli",
    "session-context", "socials-context", "theme-context",
    "useSession", "useSocials", "useTheme",
}


def rule(title: str) -> None:
    print(f"\n{title}\n{'-' * len(title)}")


def map_freshness() -> None:
    rule("1. Map freshness")
    before = (ROOT / "context" / "MAP.md").read_text(encoding="utf-8")
    subprocess.run([sys.executable, str(ROOT / "scripts" / "build_map.py")],
                   capture_output=True, cwd=ROOT)
    after = (ROOT / "context" / "MAP.md").read_text(encoding="utf-8")
    print("REGENERATED - the map was stale and is now current. Review the diff."
          if before != after else "current.")


def unmapped() -> None:
    rule("2. Modules the hand-written map does not name")
    hand = (ROOT / "context" / "MAP.md").read_text(encoding="utf-8").split(
        "<!-- generated:start -->")[0]
    misses = []
    for p in sorted(SRC.rglob("*.ts*")):
        stem = p.name.rsplit(".", 1)[0]
        if stem in GENERIC:
            continue
        if stem not in hand:
            misses.append(p.relative_to(ROOT).as_posix())
    for p in sorted(APP.rglob("*.py")):
        if p.stem in GENERIC or p.name == "__init__.py":
            continue
        if p.stem not in hand:
            misses.append(p.relative_to(ROOT).as_posix())
    print("\n".join(f"  {m}" for m in misses) if misses
          else "every module is named.")
    if misses:
        print("\n  -> A feature the map cannot answer for is a search an agent"
              "\n     has to do by hand. Add a row, or add the name to GENERIC"
              "\n     in this script if it is plumbing.")


def orphans() -> None:
    rule("3. Modules nothing imports")
    entry = {"App.tsx", "main.tsx", "index.ts", "index.css", "vite-env.d.ts"}
    bodies = {p: p.read_text(encoding="utf-8") for p in SRC.rglob("*.ts*")}
    dead = []
    for p in sorted(bodies):
        if p.name in entry or p.parent.name in {"types", "assets"}:
            continue
        needle = f"/{p.name.rsplit('.', 1)[0]}'"
        if not any(needle in b for q, b in bodies.items()
                   if q != p):
            dead.append(p.relative_to(ROOT).as_posix())
    print("\n".join(f"  {d}" for d in dead) if dead else "none.")
    if dead:
        print("\n  -> Nothing references these, barrels included. Confirm"
              "\n     against the map import graph before deleting.")


def comment_budget() -> None:
    rule("4. Comment budget")
    total = com = 0
    worst = []
    for p in SRC.rglob("*.ts*"):
        lines = [l for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]
        c, block = 0, False
        for l in lines:
            s = l.strip()
            if block:
                c += 1
                block = "*/" not in s
            elif s.startswith("/*"):
                c += 1
                block = "*/" not in s
            elif s.startswith("//") or s.startswith("{/*") or s.startswith("*"):
                c += 1
        total += len(lines)
        com += c
        if lines and c * 100 // len(lines) >= 30:
            worst.append((c * 100 // len(lines), c, p.relative_to(ROOT).as_posix()))
    print(f"frontend: {com} comment lines / {total} = {com * 100 // total}%")
    for pct, c, f in sorted(worst, reverse=True)[:8]:
        print(f"  {pct:>3}%  {c:>4} lines  {f}")
    if worst:
        print("\n  -> AGENTS.md section 4: names explain, comments do not."
              "\n     Design reasoning belongs in context/, not above the code.")


def loose_ends() -> None:
    rule("5. Loose ends")
    hits = []
    for p in list(SRC.rglob("*.ts*")) + list(APP.rglob("*.py")):
        for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
            if re.search(r"\b(TODO|FIXME|XXX|HACK)\b", line):
                hits.append(f"  {p.relative_to(ROOT).as_posix()}:{n}  {line.strip()[:70]}")
    print("\n".join(hits) if hits else "none.")

    cf = ROOT / "context" / "current-feature.md"
    words = len(cf.read_text(encoding="utf-8").split())
    print(f"\ncurrent-feature.md: {words} words")
    if words > 1200:
        print("  -> AGENTS.md section 8 says clear this before a new feature."
              "\n     It is the handoff file between agents; if it describes"
              "\n     shipped work it is history, and history goes to STATUS.md.")


def main() -> None:
    print("Housekeeping\n============")
    map_freshness()
    unmapped()
    orphans()
    comment_budget()
    loose_ends()
    print("\nBuild and lint are not run here -- see the skill.")


if __name__ == "__main__":
    main()
