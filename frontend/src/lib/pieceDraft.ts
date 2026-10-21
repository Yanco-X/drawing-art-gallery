import type { Piece } from '../types';

export interface PieceFields {
  title: string;
  description: string;
  medium: string;
  year: string;
  createdDate: string;
  tags: string[];
  focal: { x: number | null; y: number | null; zoom: number | null };
}

export const savedFields = (piece: Piece): PieceFields => ({
  title: piece.title,
  description: piece.description,
  medium: piece.medium ?? '',
  year: piece.year === null ? '' : String(piece.year),
  createdDate: piece.createdDate ?? '',
  tags: piece.tags.map((tag) => tag.name),
  focal: { x: piece.focalX, y: piece.focalY, zoom: piece.focalZoom },
});

const draftKey = (pieceId: string) => `piece-draft:${pieceId}`;

// Session storage survives a reload but not the tab, so a draft cannot
// surface weeks later over a piece edited since. Any access can throw -- a
// private window, blocked site data -- and then there is simply no draft.
export const readDraft = (pieceId: string): PieceFields | null => {
  try {
    const held = sessionStorage.getItem(draftKey(pieceId));
    return held ? (JSON.parse(held) as PieceFields) : null;
  } catch {
    return null;
  }
};

export const keepDraft = (pieceId: string, fields: PieceFields, saved: PieceFields) => {
  try {
    if (JSON.stringify(fields) === JSON.stringify(saved)) {
      sessionStorage.removeItem(draftKey(pieceId));
    } else {
      sessionStorage.setItem(draftKey(pieceId), JSON.stringify(fields));
    }
  } catch {
    // Nowhere to keep it.
  }
};

export const dropDraft = (pieceId: string) => {
  try {
    sessionStorage.removeItem(draftKey(pieceId));
  } catch {
    // Nothing was kept.
  }
};
