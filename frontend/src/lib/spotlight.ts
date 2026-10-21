import type { CSSProperties } from 'react';
import type { CollectionSummary, Piece } from '../types';

// The API refuses a sixth pick.
export const SPOTLIGHT_COUNT = 5;

export const pickedIds = (pieces: Piece[]): string[] =>
  pieces
    .filter((piece) => piece.spotlightOrder !== null)
    .sort((a, b) => (a.spotlightOrder ?? 0) - (b.spotlightOrder ?? 0))
    .map((piece) => piece.id);

// Filling from the top of `pieces` makes the empty slots follow the curated
// order, which `GET /api/pieces` arrives in. `override` is what the owner has
// just saved, ahead of a refetch.
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
  const curated = pieces.filter((piece) => !taken.has(piece.id));

  return [...chosen, ...curated].slice(0, SPOTLIGHT_COUNT);
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

// Continuous per-piece values, so they cannot be static classes. See the
// inline-style exceptions in DESIGN.md.
export const framingStyle = (framing: Framing): CSSProperties => ({
  objectFit: framing.fit,
  objectPosition: framing.position,
  transformOrigin: framing.position,
  transform: `scale(${framing.scale})`,
});

export const coverStyle = (collection: CollectionSummary): CSSProperties =>
  framingStyle(
    framePiece({
      focalX: collection.coverFocalX,
      focalY: collection.coverFocalY,
      focalZoom: collection.coverZoom,
    }),
  );

export interface FramePreview {
  label: string;
  aspect: number;
}

// The stacked band is the full width over `clamp(320px, 52vh, 500px)`, which
// lands near 8:9 on any phone held upright.
export const BAND_PREVIEWS: FramePreview[] = [
  { label: 'Desktop', aspect: 3 / 2 },
  { label: 'Phone', aspect: 8 / 9 },
];

// A card's cover is 90px tall and as wide as its card: about 2:1 in the
// narrowest grid column, about 4:1 alone in a column on a phone.
export const COVER_PREVIEWS: FramePreview[] = [
  { label: 'Narrowest card', aspect: 2 },
  { label: 'Widest card', aspect: 4 },
];

// The API's ceiling. A portrait piece takes about 600% to fill the widest card.
export const COVER_ZOOM_MAX = 1500;
