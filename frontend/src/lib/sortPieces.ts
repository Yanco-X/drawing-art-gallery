import type { Piece } from '../types';

export type SortKey = 'year' | 'title' | 'added';
export type SortDirection = 'asc' | 'desc';

/** The direction each key opens on, which is the one people mean first. */
export const OPENS: Record<SortKey, SortDirection> = {
  year: 'desc',
  title: 'asc',
  added: 'desc',
};

/*
 * What each key reads off a piece. Null means the piece cannot answer, which
 * is not the same as answering with a low value: an untitled year sorts out
 * of the way rather than to one end.
 */
const valueOf = (piece: Piece, key: SortKey): number | string | null => {
  if (key === 'year') return piece.year;
  if (key === 'title') return piece.title.trim() || null;
  return piece.createdAt ? Date.parse(piece.createdAt) : null;
};

const compare = (a: Piece, b: Piece, key: SortKey): number => {
  if (key === 'title') {
    // `localeCompare` so accents and case sort where a reader expects, not
    // where their code points fall.
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  }
  return (valueOf(a, key) as number) - (valueOf(b, key) as number);
};

/**
 * Ordering the wall.
 *
 * No key is the default, and that default is not "newest" -- it is whatever
 * order the list arrived in. On the gallery that is newest first, which the
 * API already does; in a collection it is the order the owner dragged the
 * pieces into, and replacing that with a sort nobody asked for would throw
 * away the curation. So sorting is an override, and `clear` puts the
 * curation back.
 *
 * Pieces that cannot answer the question go last in both directions.
 * Reversing them with everything else would park the unknowns at the top
 * half the time, which reads as broken rather than as sorted.
 */
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
  // Negating the comparator rather than reversing after the fact, so ties
  // keep the order they arrived in instead of being flipped among
  // themselves.
  known.sort((a, b) =>
    direction === 'desc' ? -compare(a, b, key) : compare(a, b, key),
  );
  return [...known, ...unknown];
};
