import type { Piece, Tag } from '../types';

export const tagsInUse = (pieces: Piece[]): Tag[] => {
  const present = new Map<string, Tag>();
  for (const piece of pieces) {
    for (const tag of piece.tags) present.set(tag.id, tag);
  }
  return [...present.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
};
