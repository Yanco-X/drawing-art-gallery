import type { SortDirection, SortKey } from './sortPieces';

// `pendingScroll` is nulled when spent rather than the record deleted, so
// reads stay pure: React may render twice and the second would find nothing.
type Visit = { pendingScroll: number | null; pieceId: string };

const visits = new Map<string, Visit>();

export const rememberVisit = (key: string, pieceId: string) => {
  visits.set(key, { pendingScroll: window.scrollY, pieceId });
};

export const readVisit = (key: string): Visit | undefined => visits.get(key);

export const consumeScroll = (key: string) => {
  const held = visits.get(key);
  if (held) held.pendingScroll = null;
};

export type ListState = {
  query: string;
  years: number[];
  collectionIds: string[];
  sortKey: SortKey | null;
  sortDirection: SortDirection;
  filterOpen: boolean;
  sortOpen: boolean;
};

const lists = new Map<string, ListState>();

export const readListState = (key: string): ListState | undefined =>
  lists.get(key);

export const rememberListState = (key: string, state: ListState) => {
  lists.set(key, state);
};

// Frames at 60fps. The page is not its final height when the grid first
// renders, so the scroll re-asserts until it sticks.
const MAX_FRAMES = 30;

export const restoreScroll = (top: number) => {
  let frames = 0;
  let cancelled = false;

  const stop = () => {
    cancelled = true;
    for (const event of ['wheel', 'touchstart', 'keydown'] as const) {
      window.removeEventListener(event, stop);
    }
  };

  for (const event of ['wheel', 'touchstart', 'keydown'] as const) {
    window.addEventListener(event, stop, { once: true, passive: true });
  }

  const tick = () => {
    if (cancelled) return;
    window.scrollTo({ top, behavior: 'instant' });
    // Landed, or out of patience. `scrollTo` past the end of a short
    // document silently lands short, which is what is being waited out.
    if (Math.abs(window.scrollY - top) <= 1 || ++frames >= MAX_FRAMES) {
      stop();
      return;
    }
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
  return stop;
};
