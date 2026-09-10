export type Theme = 'dark' | 'light';

export type Role = 'visitor' | 'owner';

export interface Social {
  id: string;
  platform: string;
  label: string;
  url: string;
}

export interface SocialDraft {
  // Absent for a row being added, which is how the server tells an insert
  // from an edit.
  id?: string;
  platform: string;
  label: string;
  url: string;
}

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
  thumbnailUrl?: string;
  medium: string | null;
  year: number | null;
  // When the piece was uploaded, as against `createdDate`, when it was drawn.
  createdAt: string | null;
  width: number | null;
  height: number | null;
  // Persisted at upload, never measured in the browser: the masonry reserves
  // each card's height from it, so deriving it after load reflows the grid.
  aspectRatio: number;
  createdDate: string | null;
  tags: Tag[];
  waivedAt: string | null;
  spotlightOrder: number | null;
  // Percentages across and down. Null on both is centre.
  focalX: number | null;
  focalY: number | null;
  focalZoom: number | null;
  // Detail payload only, absent from the list.
  collections?: CollectionRef[];
  // Detail payload only. Null when the piece has no pyramid, and the viewer
  // falls back to `imageUrl`.
  tileSource?: TileSource | null;
}

export interface TileSource {
  // Tiles live at `${base}/${level}/${column}_${row}.webp`.
  base: string;
  width: number;
  height: number;
  tileSize: number;
  overlap: number;
  maxLevel: number;
}

export type PieceResult =
  | { state: 'found'; piece: Piece }
  | { state: 'gone'; title: string }
  | { state: 'missing' };

export interface CollectionRef {
  id: string;
  name: string;
  slug: string;
}

export interface CollectionSummary extends CollectionRef {
  description: string;
  // Authoritative count from the backend; may exceed `pieceIds.length`.
  pieceCount: number;
  pieceIds: string[];
  coverImageUrl: string | null;
  // The cover the owner chose, or null when `coverImageUrl` is showing the
  // first member as a fallback. The arrange grid has to tell those apart.
  coverPieceId: string | null;
  isPublic: boolean;
}

export interface Collection extends CollectionSummary {
  pieces: Piece[];
}

export interface NewPiece {
  file: File;
  title: string;
  description: string;
  medium: string;
  year: string;
  createdDate: string;
  tags: string[];
  collectionIds: string[];
}

export interface PiecePatch {
  title?: string;
  description?: string;
  medium?: string;
  // The raw input string, not a number: `Number('abc')` is NaN and
  // `JSON.stringify` turns that into null, erasing a mistyped year.
  year?: string | number | null;
  // YYYY-MM-DD, or null to clear.
  createdDate?: string | null;
  focalX?: number | null;
  focalY?: number | null;
  focalZoom?: number | null;
  // The whole list -- an omitted tag is a removed one.
  tags?: string[];
}

// `slug` is deliberately absent: the API only re-slugs when it is sent, which
// is what keeps a collection's URL stable across a rename.
export interface CollectionPatch {
  name?: string;
  description?: string;
  isPublic?: boolean;
  // null clears the cover, falling back to the first member.
  coverPieceId?: string | null;
}

export interface NewCollection {
  name: string;
  description: string;
  isPublic: boolean;
  pieceIds: string[];
}
