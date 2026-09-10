import type { Piece } from '../types';

// The API refuses a sixth pick.
export const SPOTLIGHT_COUNT = 5;

export const pickedIds = (pieces: Piece[]): string[] =>
  pieces
    .filter((piece) => piece.spotlightOrder !== null)
    .sort((a, b) => (a.spotlightOrder ?? 0) - (b.spotlightOrder ?? 0))
    .map((piece) => piece.id);

// Filling from the top of `pieces` relies on `GET /api/pieces` being
// newest-first. `override` is what the owner has just saved, ahead of a refetch.
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

export const CENTRE_FOCAL = 50;

export const focalPosition = (
  piece: Pick<Piece, 'focalX' | 'focalY'>,
): string =>
  `${piece.focalX ?? CENTRE_FOCAL}% ${piece.focalY ?? CENTRE_FOCAL}%`;

export const FIT_ZOOM = 100;

export const ZOOM_MIN = 100;
export const ZOOM_MAX = 500;

// The scale that turns `contain` into `cover` for one piece in one frame.
export const fillRatio = (imageAspect: number, frameAspect: number): number =>
  Math.max(frameAspect / imageAspect, imageAspect / frameAspect);

export interface Framing {
  fit: 'cover' | 'contain';
  scale: number;
  position: string;
}

// The zoom is spent over `contain`, not `cover`: `object-fit` crops at
// layout time and a transform only scales what came out, so a scale over
// `cover` draws the same crop smaller instead of revealing more.
export const framePiece = (
  piece: Pick<Piece, 'focalX' | 'focalY' | 'focalZoom'>,
): Framing => {
  const position = focalPosition(piece);
  return piece.focalZoom === null
    ? { fit: 'cover', scale: 1, position }
    : { fit: 'contain', scale: piece.focalZoom / 100, position };
};
