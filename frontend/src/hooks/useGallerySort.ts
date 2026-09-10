import { useMemo, useState } from 'react';
import { OPENS, sortPieces } from '../lib/sortPieces';
import type { SortDirection, SortKey } from '../lib/sortPieces';
import type { Piece } from '../types';

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
