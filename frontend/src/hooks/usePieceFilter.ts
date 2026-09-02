import { useMemo, useState } from 'react';
import type { Piece } from '../types';

/**
 * Narrowing a list of pieces by title and year.
 *
 * Filtering happens in the browser over a list already fetched. The gallery
 * is small enough that a round trip per keystroke would be slower than
 * scanning what is already here, and it keeps the picker usable while the
 * API is not.
 *
 * `years` is derived from the pieces themselves rather than a range, so the
 * control never offers a year with nothing behind it.
 */
export const usePieceFilter = (pieces: Piece[]) => {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');

  const years = useMemo(() => {
    const present = new Set<number>();
    for (const piece of pieces) {
      if (piece.year !== null) present.add(piece.year);
    }
    return [...present].sort((a, b) => b - a);
  }, [pieces]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return pieces.filter((piece) => {
      if (year && String(piece.year) !== year) return false;
      if (needle && !piece.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [pieces, query, year]);

  const active = query.trim() !== '' || year !== '';

  const clear = () => {
    setQuery('');
    setYear('');
  };

  return { query, setQuery, year, setYear, years, filtered, active, clear };
};
