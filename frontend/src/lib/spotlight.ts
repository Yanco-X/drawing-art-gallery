import type { Piece } from '../types';

/** How many slots the band has. The API refuses a sixth pick. */
export const SPOTLIGHT_COUNT = 5;

/**
 * The pieces the owner hand-picked, in the order they were picked.
 *
 * Read off the pieces the page already has rather than fetched: every piece
 * carries its own `spotlightOrder`, which is what lets the band cost no
 * request of its own.
 */
export const pickedIds = (pieces: Piece[]): string[] =>
  pieces
    .filter((piece) => piece.spotlightOrder !== null)
    .sort((a, b) => (a.spotlightOrder ?? 0) - (b.spotlightOrder ?? 0))
    .map((piece) => piece.id);

/**
 * The five the band shows: hand-picked first, then the newest work that has
 * not been picked.
 *
 * Filling from the top of `pieces` works because `GET /api/pieces` is
 * already newest-first, so the default -- nothing picked at all -- is the
 * newest five and needs no stored state behind it.
 *
 * `override` is the list the owner has just saved, before a refetch would
 * have told us about it.
 */
export const spotlightSlots = (
  pieces: Piece[],
  override?: string[] | null,
): Piece[] => {
  const byId = new Map(pieces.map((piece) => [piece.id, piece]));
  const chosen = (override ?? pickedIds(pieces))
    .map((id) => byId.get(id))
    // A picked piece can vanish from under the list -- waived in another
    // tab, or deleted. The slot is not held open for it.
    .filter((piece): piece is Piece => piece !== undefined);

  const taken = new Set(chosen.map((piece) => piece.id));
  const newest = pieces.filter((piece) => !taken.has(piece.id));

  return [...chosen, ...newest].slice(0, SPOTLIGHT_COUNT);
};
