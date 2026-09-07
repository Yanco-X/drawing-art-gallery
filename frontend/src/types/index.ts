export type Theme = 'dark' | 'light';

/** Answered by the session; drives every owner control on the site. */
export type Role = 'visitor' | 'owner';

/**
 * One place the artist can be found. `platform` picks the icon and is the
 * stable key; `label` is what the menu says, so a second Instagram account
 * can be named apart from the first.
 */
export interface Social {
  id: string;
  platform: string;
  label: string;
  url: string;
}

/**
 * A row on its way to the API. `id` is absent for one being added, which is
 * how the server tells an edit from an insert.
 */
export interface SocialDraft {
  id?: string;
  platform: string;
  label: string;
  url: string;
}

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
   * The original's pixel dimensions. Quoted to the visitor beneath the
   * Detailed View button -- "4999 x 5001" is a more honest invitation to
   * open it than any amount of button styling.
   *
   * Nullable because a piece imported before dimensions were recorded has
   * none; `aspectRatio` is null in the same case.
   */
  width: number | null;
  height: number | null;
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
  /**
   * The slot the owner gave this piece in the landing page spotlight,
   * counting from zero, or null for a piece that was never picked.
   *
   * Carried on every piece rather than fetched as a list of its own: the
   * band works its five out from the payload the page already has, which is
   * what keeps it free of a second request.
   */
  spotlightOrder: number | null;
  /**
   * Where a crop should be aimed, as percentages across and down the image.
   * Null on both is dead centre, which is the browser's own default.
   *
   * The spotlight fills its half with `object-fit: cover`, so something is
   * always cut; this is what says which part survives. Two numbers rather
   * than a second cropped rendition -- the browser is drawing the image
   * anyway, and `object-position` costs nothing to honour.
   */
  focalX: number | null;
  focalY: number | null;
  /**
   * How large the piece is drawn inside that crop, as a percent of the
   * size that just fills the frame. Null is 100 -- fill it exactly.
   *
   * Under 100 the piece stops filling its half and the hatch shows
   * around it. A multiple of fill rather than an absolute scale, so it
   * means the same thing at every breakpoint the band is sized to.
   */
  focalZoom: number | null;
  /** Present on GET /api/pieces/<id> only, not in the list payload. */
  collections?: CollectionRef[];
  /**
   * The Deep Zoom pyramid the detail view zooms into. Detail payload only.
   *
   * Null when the piece has no pyramid -- uploaded before tiling existed and
   * not yet backfilled, or a build that failed. The viewer falls back to
   * `imageUrl` in that case rather than refusing to open.
   */
  tileSource?: TileSource | null;
}

/**
 * Everything OpenSeadragon needs to address a piece's tiles.
 *
 * No `.dzi` descriptor is fetched: the numbers a descriptor would carry are
 * already on the piece row, so the API composes this instead of storing a
 * second copy of them.
 */
export interface TileSource {
  /** Tiles live at `${base}/${level}/${column}_${row}.webp`. */
  base: string;
  /** The original's dimensions, which the pyramid's top level matches. */
  width: number;
  height: number;
  tileSize: number;
  overlap: number;
  /** The top level: the first power of two covering the long edge. */
  maxLevel: number;
}

/** Just enough to name a collection: what the wall label links to. */
/**
 * The three answers to asking for a piece: it is here, it was here, or it
 * never was. "Gone" carries only the title, which is all the API says about
 * a piece taken off the wall.
 */
export type PieceResult =
  | { state: 'found'; piece: Piece }
  | { state: 'gone'; title: string }
  | { state: 'missing' };

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
  /**
   * Who is in it, in curated order. Membership rather than content, so a
   * caller that already holds the pieces can work out which collections
   * one belongs to without a second request.
   */
  pieceIds: string[];
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
  /** Collections the piece joins on the way in. Appended, in this order. */
  collectionIds: string[];
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
  /** 0-100, or null to go back to centre. */
  focalX?: number | null;
  focalY?: number | null;
  /** 40-250, or null to go back to filling the frame. */
  focalZoom?: number | null;
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
