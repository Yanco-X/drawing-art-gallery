import type { SortDirection, SortKey } from './sortPieces';

// `pendingScroll` is nulled when spent rather than the record deleted, so
// reads stay pure: React may render twice and the second would find nothing.
// 'list' lands on the list itself, for a reader who has no place on it yet.
type Visit = { pendingScroll: number | 'list' | null; pieceId: string };

const visits = new Map<string, Visit>();

export const rememberVisit = (key: string, pieceId: string) => {
  visits.set(key, { pendingScroll: window.scrollY, pieceId });
};

export const readVisit = (key: string): Visit | undefined => visits.get(key);

export const consumeScroll = (key: string) => {
  const held = visits.get(key);
  if (held) held.pendingScroll = null;
};

// Kept apart from `visits`: the grid remembers its own piece and scroll under
// the same key, and one would overwrite the other.
const spotlightSlides = new Map<string, string>();

export const rememberSpotlightSlide = (key: string, pieceId: string) => {
  spotlightSlides.set(key, pieceId);
};

export const readSpotlightSlide = (key: string) => spotlightSlides.get(key);

export type ListState = {
  query: string;
  years: number[];
  collectionIds: string[];
  tagIds: string[];
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

// A reader handed on from a piece page's tag shelf: the list narrowed to the
// tag alone, so it shows what the shelf showed, the sort kept, and the piece
// they came from marked on it.
export const narrowToTag = (key: string, tagId: string, pieceId: string) => {
  const held = lists.get(key);
  lists.set(key, {
    query: '',
    years: [],
    collectionIds: [],
    tagIds: [tagId],
    sortKey: held?.sortKey ?? null,
    sortDirection: held?.sortDirection ?? 'desc',
    filterOpen: true,
    sortOpen: held?.sortOpen ?? false,
  });
  visits.set(key, { pendingScroll: 'list', pieceId });
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
