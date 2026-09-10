import type { Piece } from '../types';

export type SortKey = 'year' | 'title' | 'added';
export type SortDirection = 'asc' | 'desc';

export const OPENS: Record<SortKey, SortDirection> = {
  year: 'desc',
  title: 'asc',
  added: 'desc',
};

// Null means the piece cannot answer, which the sort partitions on.
const valueOf = (piece: Piece, key: SortKey): number | string | null => {
  if (key === 'year') return piece.year;
  if (key === 'title') return piece.title.trim() || null;
  return piece.createdAt ? Date.parse(piece.createdAt) : null;
};

const compare = (a: Piece, b: Piece, key: SortKey): number => {
  if (key === 'title') {
    // `localeCompare` so accents and case sort where a reader expects.
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  }
  return (valueOf(a, key) as number) - (valueOf(b, key) as number);
};

export const sortPieces = (
  pieces: Piece[],
  key: SortKey,
  direction: SortDirection,
): Piece[] => {
  const known: Piece[] = [];
  const unknown: Piece[] = [];
  for (const piece of pieces) {
    (valueOf(piece, key) === null ? unknown : known).push(piece);
  }
  // Negated rather than reversed after the fact, so ties keep the order
  // they arrived in.
  known.sort((a, b) =>
    direction === 'desc' ? -compare(a, b, key) : compare(a, b, key),
  );
  return [...known, ...unknown];
};
