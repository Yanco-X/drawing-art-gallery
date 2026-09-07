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

/** Dead centre: what a browser does with no `object-position` of its own. */
export const CENTRE_FOCAL = 50;

/**
 * A piece's `object-position`, from its stored focal point.
 *
 * Null falls back to centre rather than being stored as 50, so a piece the
 * owner has never placed stays distinguishable from one they deliberately
 * centred. Nothing reads that difference today; it is free to keep and
 * impossible to recover once every row says 50.
 */
export const focalPosition = (
  piece: Pick<Piece, 'focalX' | 'focalY'>,
): string =>
  `${piece.focalX ?? CENTRE_FOCAL}% ${piece.focalY ?? CENTRE_FOCAL}%`;

/** Filling the frame exactly: what `object-fit: cover` does unasked. */
export const FILL_ZOOM = 100;

/**
 * The bounds the API will accept. Below the floor a piece is an island in
 * the hatch; above the ceiling the rendition is being upscaled past what
 * it can hold.
 */
export const ZOOM_MIN = 40;
export const ZOOM_MAX = 250;

/**
 * The scale that turns `contain` into `cover` for one piece in one frame.
 *
 * `cover` and `contain` pick the largest and the smallest scale that touch
 * the frame, so the ratio between them is decided entirely by the two
 * aspect ratios. It is what lets a stored number mean `fill` at any size
 * the band happens to be.
 */
export const fillRatio = (imageAspect: number, frameAspect: number): number =>
  Math.max(frameAspect / imageAspect, imageAspect / frameAspect);

export interface Framing {
  fit: 'cover' | 'contain';
  scale: number;
  position: string;
}

/**
 * How to draw one piece in a frame of a given shape.
 *
 * `object-fit` crops at layout time and `transform` only scales what came
 * out, so a scale over `cover` cannot reveal anything `cover` had already
 * thrown away -- it just draws the same crop smaller. Measured, not
 * assumed: a test image of numbered bands showed the same bands at every
 * scale. So the zoom is spent over `contain`, which starts with the whole
 * piece in frame and has something left to give back.
 *
 * `fillRatio` is where `contain` and `cover` coincide, so a stored 100
 * renders exactly what the band did before any of this existed.
 *
 * A piece with no zoom, or a frame not yet measured, takes plain `cover`.
 * That needs no arithmetic and is exactly right for every piece the owner
 * has never sized, which is the landing page's first paint.
 */
export const framePiece = (
  piece: Pick<Piece, 'focalX' | 'focalY' | 'focalZoom' | 'aspectRatio'>,
  frameAspect: number,
): Framing => {
  const position = focalPosition(piece);
  if (piece.focalZoom === null || !frameAspect || !piece.aspectRatio) {
    return { fit: 'cover', scale: 1, position };
  }
  return {
    fit: 'contain',
    scale:
      fillRatio(piece.aspectRatio, frameAspect) * (piece.focalZoom / 100),
    position,
  };
};
