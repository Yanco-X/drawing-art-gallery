import { useMemo, useState } from 'react';
import type { Piece } from '../types';

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
