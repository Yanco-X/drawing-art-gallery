"""
A fixed-window attempt counter, held in memory.

Sized for one password on a one-user site: no dependency, no table, and it
forgets everything on restart. Anything larger would be machinery guarding a
door that only one person ever opens.
"""

from datetime import datetime, timedelta, timezone


class AttemptLimiter:
    def __init__(self, limit: int, window: timedelta):
        self.limit = limit
        self.window = window
        self._attempts: dict[str, list[datetime]] = {}

    def _recent(self, key: str, now: datetime) -> list[datetime]:
        cutoff = now - self.window
        kept = [at for at in self._attempts.get(key, []) if at > cutoff]
        if kept:
            self._attempts[key] = kept
        else:
            self._attempts.pop(key, None)
        return kept

    def is_blocked(self, key: str | None) -> bool:
        # An unattributable client is never refused. Behind a proxy that does
        # not forward the caller, every request shares one key, and refusing
        # on that would let a stranger's typos lock the owner out.
        if not key:
            return False
        return len(self._recent(key, datetime.now(timezone.utc))) >= self.limit

    def record_failure(self, key: str | None) -> None:
        if not key:
            return
        now = datetime.now(timezone.utc)
        self._attempts[key] = self._recent(key, now) + [now]

    def clear(self, key: str | None) -> None:
        if key:
            self._attempts.pop(key, None)
