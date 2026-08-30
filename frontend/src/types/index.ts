export type Theme = 'dark' | 'light';

/** Comes from auth in production; drives Upload vs. Owner sign in. */
export type Role = 'visitor' | 'owner';

/** User preference controlling masonry column count. */
export type GridDensity = 'airy' | 'comfortable' | 'dense';

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Piece {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  /** e.g. "Ink", "Charcoal", "Pen & wash" — rendered as "{medium} · {year}". */
  medium: string;
  year: number;
  /**
   * width / height, taken from the stored image dimensions.
   *
   * Must be persisted at upload time rather than measured in the browser:
   * the masonry reserves each card's height from this value, so deriving it
   * after load would make the whole grid reflow once images arrive.
   */
  aspectRatio: number;
  createdDate: string;
  tags: Tag[];
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Authoritative count from the backend; may exceed `pieces.length`. */
  pieceCount: number;
  /** Falls back to a gradient swatch when absent. */
  coverImageUrl: string | null;
  pieces: Piece[];
}
