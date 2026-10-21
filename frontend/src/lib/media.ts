import type { Piece } from '../types';

export const DEFAULT_MEDIUM = 'Graphite';

const STARTING_MEDIA = [DEFAULT_MEDIUM, 'Ink'];

// Case-blind, the starting spelling first: a piece saved as "graphite" by hand
// is the same option, not a second one.
export const mediumOptions = (pieces: Piece[]): string[] => {
  const byName = new Map<string, string>();
  for (const medium of [...STARTING_MEDIA, ...pieces.map((piece) => piece.medium)]) {
    const name = medium?.trim();
    if (name && !byName.has(name.toLowerCase())) byName.set(name.toLowerCase(), name);
  }
  return [...byName.values()].sort((a, b) => a.localeCompare(b));
};
