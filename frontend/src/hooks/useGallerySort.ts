import { useMemo, useState } from 'react';
import { OPENS, sortPieces } from '../lib/sortPieces';
import type { SortDirection, SortKey } from '../lib/sortPieces';
import type { Piece } from '../types';

/**
 * The sort the gallery is currently under.
 *
 * State only: the ordering itself is `lib/sortPieces`, so it can be tested
 * without a renderer and read by the store that remembers a list between
 * visits.
 *
 * `initial` is what the reader last left this list under. Passed as the
 * initial state rather than applied by an effect, so a return renders once,
 * already sorted, instead of flashing the default order first.
 */
export const useGallerySort = (
  pieces: Piece[],
  initial?: { key: SortKey | null; direction: SortDirection },
) => {
  const [key, setKey] = useState<SortKey | null>(initial?.key ?? null);
  const [direction, setDirection] = useState<SortDirection>(
    initial?.direction ?? 'desc',
  );

  const sorted = useMemo(
    () => (key === null ? pieces : sortPieces(pieces, key, direction)),
    [pieces, key, direction],
  );

  /** Picking the active key again turns it round; picking another starts it. */
  const choose = (next: SortKey) => {
    if (next === key) {
      setDirection((now) => (now === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setKey(next);
    setDirection(OPENS[next]);
  };

  const clear = () => {
    setKey(null);
    setDirection('desc');
  };

  return { key, direction, choose, clear, sorted, active: key !== null };
};
