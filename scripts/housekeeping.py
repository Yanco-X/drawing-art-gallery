"""Mechanical repository checks. Judgment lives in the skill, not here.

    python scripts/housekeeping.py

Prints a report and exits 0 always -- these are observations for a human or
an agent to weigh, not a gate. Nothing tracked is modified: the knowledge
graph in graphify-out/ is rebuilt, and that directory is git-ignored.
"""

from __future__ import annotations

import pathlib
import re
import shutil
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


def graph_freshness() -> None:
    rule("1. Knowledge graph")
    exe = shutil.which("graphify")
    if exe is None:
        print("graphify is not installed -- `uv tool install graphifyy`.")
        return
    result = subprocess.run([exe, "update", "."], capture_output=True, text=True,
                            encoding="utf-8", errors="replace", cwd=ROOT)
    lines = [l for l in result.stdout.splitlines() if "nodes" in l]
    if result.returncode != 0 or not lines:
        print("rebuild failed:")
        print((result.stderr or result.stdout).strip()[-400:])
        return
    print(lines[-1].strip())


def unmapped() -> None:
    rule("2. Modules the hand-written map does not name")
    hand = (ROOT / "context" / "MAP.md").read_text(encoding="utf-8")
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
              "\n     against `graphify affected` before deleting.")


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


IMPORT = re.compile(r"(?<![\w`/])@([\w][\w./-]*\.md)")


def autoload_budget() -> None:
    rule("6. What every session loads before the first message")
    loaded: list[pathlib.Path] = []

    def follow(path: pathlib.Path, depth: int) -> None:
        if depth > 5 or path in loaded or not path.exists():
            return
        loaded.append(path)
        for m in IMPORT.finditer(path.read_text(encoding="utf-8")):
            follow((path.parent / m.group(1)).resolve(), depth + 1)

    for entry in (ROOT / "CLAUDE.md", ROOT / ".claude" / "CLAUDE.md"):
        follow(entry.resolve(), 0)
    total = 0
    for p in loaded:
        tok = len(p.read_text(encoding="utf-8")) // 4
        total += tok
        print(f"  {tok:>6} tok  {p.relative_to(ROOT).as_posix()}")
    print(f"  {total:>6} tok  total")
    if total > 8000:
        print("\n  -> An @path inside a file that is itself imported is another"
              "\n     import. Make reading lists plain links: that is how"
              "\n     AGENTS.md section 8 once loaded every doc, ~45k tokens.")


def main() -> None:
    print("Housekeeping\n============")
    graph_freshness()
    unmapped()
    orphans()
    comment_budget()
    loose_ends()
    autoload_budget()
    print("\nBuild and lint are not run here -- see the skill.")


if __name__ == "__main__":
    main()
