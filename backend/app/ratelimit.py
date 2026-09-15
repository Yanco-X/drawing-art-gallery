"""
Fixed-window counters, held in memory.

Sized for a one-owner gallery: no dependency, no table, and they forget
everything on restart. Anything larger would be machinery guarding doors a
handful of people pass through a day.
"""

import threading
from datetime import datetime, timedelta, timezone


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AttemptLimiter:
    """
    One window per key, opened by its first attempt: a timestamp and a
    count, so memory is bounded by keys rather than by attempts.
    """

    def __init__(self, limit: int, window: timedelta, max_keys: int = 10_000):
        self.limit = limit
        self.window = window
        self.max_keys = max_keys
        self._windows: dict[str, tuple[datetime, int]] = {}
        self._lock = threading.Lock()

    def _open(self, key: str, now: datetime) -> tuple[datetime, int] | None:
        held = self._windows.get(key)
        if held is None or now - held[0] >= self.window:
            return None
        return held

    def is_blocked(self, key: str | None) -> bool:
        # An unattributable client is never refused. Behind a proxy that does
        # not forward the caller, every request shares one key, and refusing
        # on that would let a stranger's typos lock the owner out.
        if not key:
            return False
        with self._lock:
            held = self._open(key, _now())
        return held is not None and held[1] >= self.limit

    def record(self, key: str | None) -> None:
        if not key:
            return
        now = _now()
        with self._lock:
            held = self._open(key, now)
            self._windows[key] = (now, 1) if held is None else (held[0], held[1] + 1)
            if len(self._windows) > self.max_keys:
                self._forget(now)

    def _forget(self, now: datetime) -> None:
        self._windows = {
            key: held for key, held in self._windows.items()
            if now - held[0] < self.window
        }
        excess = len(self._windows) - self.max_keys
        if excess <= 0:
            return
        # Still over the bound is a flood of distinct clients. The ones under
        # the limit go, oldest first; a key that is blocking someone stays,
        # so a flood of fresh addresses cannot lift a block on the password.
        idle = sorted(
            (key for key, held in self._windows.items() if held[1] < self.limit),
            key=lambda key: self._windows[key][0],
        )
        for key in idle[:excess]:
            del self._windows[key]

    def clear(self, key: str | None) -> None:
        if key:
            with self._lock:
                self._windows.pop(key, None)


class WindowCounter:
    """One count shared by every client: a ceiling across all of them."""

    def __init__(self, limit: int, window: timedelta):
        self.limit = limit
        self.window = window
        self._started = _now()
        self._count = 0
        self._lock = threading.Lock()

    def admit(self) -> bool:
        now = _now()
        with self._lock:
            if now - self._started >= self.window:
                self._started = now
                self._count = 0
            if self._count >= self.limit:
                return False
            self._count += 1
            return True
