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

/** The whole piece in frame. Every zoom is a percent of this. */
export const FIT_ZOOM = 100;

/**
 * The bounds the API will accept. There is nothing below 100: a piece
 * smaller than the frame in both directions only shrinks into the hatch.
 * At 500 a fifth of the piece is in frame.
 */
export const ZOOM_MIN = 100;
export const ZOOM_MAX = 500;

/**
 * The scale that turns `contain` into `cover` for one piece in one frame.
 *
 * `cover` and `contain` pick the largest and the smallest scale that touch
 * the frame, so the ratio between them is decided entirely by the two
 * aspect ratios.
 *
 * Nothing stored depends on this any more -- it is what a zoom used to be
 * a percentage of, and anchoring to it made one number frame a piece
 * differently in every window. The picker still asks for it to place the
 * slider where an unsized piece already sits, which is a question about
 * one frame and has an honest answer.
 */
export const fillRatio = (imageAspect: number, frameAspect: number): number =>
  Math.max(frameAspect / imageAspect, imageAspect / frameAspect);

export interface Framing {
  fit: 'cover' | 'contain';
  scale: number;
  position: string;
}

/**
 * How to draw one piece, in any frame.
 *
 * `object-fit` crops at layout time and `transform` only scales what came
 * out, so a scale over `cover` cannot reveal anything `cover` had already
 * thrown away -- it just draws the same crop smaller. Measured, not
 * assumed: a test image of numbered bands showed the same bands at every
 * scale. So the zoom is spent over `contain`, which starts with the whole
 * piece in frame and has something left to give back.
 *
 * The frame is not an argument, and that is the point. `contain` fits the
 * whole piece whatever the shape, so a scale over it means the same amount
 * of artwork in every window -- only the hatch beside it varies. Anchoring
 * to `fill` instead made the band and the picker disagree by a third on
 * the same piece, because they are not the same shape.
 *
 * A piece with no zoom takes plain `cover`: no arithmetic, and an exact
 * fill at every breakpoint. That is every piece the owner has never sized,
 * which is the landing page's first paint.
 */
export const framePiece = (
  piece: Pick<Piece, 'focalX' | 'focalY' | 'focalZoom'>,
): Framing => {
  const position = focalPosition(piece);
  return piece.focalZoom === null
    ? { fit: 'cover', scale: 1, position }
    : { fit: 'contain', scale: piece.focalZoom / 100, position };
};
