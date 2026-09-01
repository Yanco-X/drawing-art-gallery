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
  /**
   * The cover the owner chose, or null when none was — in which case
   * `coverImageUrl` is showing the first member instead. The two differ,
   * and the arrange grid has to tell a choice from a fallback.
   */
  coverPieceId: string | null;
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

/**
 * A correction to a piece's wall label. Omitted keys are left alone.
 *
 * `year` carries the raw input string rather than a number: `Number('abc')`
 * is NaN, and `JSON.stringify` turns NaN into null, which would quietly
 * erase a year the owner mistyped. Sent as typed, the API validates it and
 * says so.
 */
export interface PiecePatch {
  title?: string;
  description?: string;
  medium?: string;
  year?: string | number | null;
  /** YYYY-MM-DD, or null to clear. */
  createdDate?: string | null;
  /** The whole list — an omitted tag is a removed one. */
  tags?: string[];
}

/**
 * A partial update. Omitted keys are left alone by the API.
 *
 * `slug` is deliberately absent: the API only re-slugs when it is sent, so
 * leaving it out is what keeps a collection's URL stable across a rename.
 */
export interface CollectionPatch {
  name?: string;
  description?: string;
  isPublic?: boolean;
  /** null clears the cover, falling back to the first member. */
  coverPieceId?: string | null;
}

/** What the collection form collects. Mirrors POST /api/collections. */
export interface NewCollection {
  name: string;
  description: string;
  isPublic: boolean;
  /** In pick order, which becomes the collection's display order. */
  pieceIds: string[];
}
