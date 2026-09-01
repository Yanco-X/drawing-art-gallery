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
  /** Display rendition — the piece page. */
  imageUrl: string;
  /**
   * Grid rendition, roughly 600px on its long edge. Optional because mock
   * data has a single file per piece; the card falls back to `imageUrl`.
   */
  thumbnailUrl?: string;
  /** e.g. "Ink", "Charcoal", "Pen & wash" — rendered as "{medium} · {year}". */
  medium: string | null;
  year: number | null;
  /**
   * width / height, taken from the stored image dimensions.
   *
   * Must be persisted at upload time rather than measured in the browser:
   * the masonry reserves each card's height from this value, so deriving it
   * after load would make the whole grid reflow once images arrive.
   */
  aspectRatio: number;
  createdDate: string | null;
  tags: Tag[];
  /**
   * ISO timestamp when the piece was withdrawn from the gallery, or null
   * while it is exhibited. Drives which owner actions the piece page offers.
   */
  waivedAt: string | null;
  /** Present on GET /api/pieces/<id> only, not in the list payload. */
  collections?: CollectionRef[];
}

/** Just enough to name a collection: what the wall label links to. */
export interface CollectionRef {
  id: string;
  name: string;
  slug: string;
}

/** The collections row shape — counts and a cover, no pieces. */
export interface CollectionSummary extends CollectionRef {
  description: string;
  /** Authoritative count from the backend; may exceed `pieces.length`. */
  pieceCount: number;
  /** Falls back to a gradient swatch when absent. */
  coverImageUrl: string | null;
  isPublic: boolean;
}

/** The detail shape, with members in curated order. */
export interface Collection extends CollectionSummary {
  pieces: Piece[];
}

/**
 * What the upload form collects, before it becomes multipart form data.
 *
 * Mirrors the fields `POST /api/pieces` accepts. `year` stays a string
 * because that is what an input yields; the backend parses it.
 */
export interface NewPiece {
  file: File;
  title: string;
  description: string;
  medium: string;
  year: string;
  createdDate: string;
  tags: string[];
}

/** What the collection form collects. Mirrors POST /api/collections. */
export interface NewCollection {
  name: string;
  description: string;
  isPublic: boolean;
  /** In pick order, which becomes the collection's display order. */
  pieceIds: string[];
}
