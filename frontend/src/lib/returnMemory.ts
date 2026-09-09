/**
 * Where the reader was when they opened a piece, so going back returns them
 * to it rather than to the top.
 *
 * Recorded when a piece is opened, not on every scroll. That distinction is
 * the whole behaviour: arriving at the gallery from the header should start
 * at the top, and arriving back from a piece should not. Storing the
 * position continuously cannot tell those apart, so the record is written
 * by the act of leaving for a piece and spent by the act of coming back.
 *
 * Keyed by pathname, so the gallery and each collection remember
 * separately. The search string is deliberately excluded -- the filter is
 * local state and not in the URL, and `?from=` describes where the reader
 * came from rather than which list this is.
 *
 * In memory rather than `sessionStorage`: a reload is a fresh visit, and
 * restoring a scroll position onto a page whose contents may have changed
 * since is a worse answer than starting at the top.
 */

/*
 * The scroll is spent once; the marker is not.
 *
 * They have different lifetimes and one record would have to pick. Coming
 * back a second time should start where the reader left off only once --
 * after that they have chosen where to be -- while "which one was I looking
 * at" stays worth answering for as long as the list is on screen. So the
 * position is nulled when it is used and the piece id stays.
 *
 * Splitting them this way also keeps the read pure. A record consumed by
 * deleting it cannot be read during render, because React may render twice
 * and the second read would find nothing; nulling one field means every
 * render reads the same answer and only the effect mutates.
 */
type Visit = { pendingScroll: number | null; pieceId: string };

const visits = new Map<string, Visit>();

/** Called as a piece is opened, from the card that opens it. */
export const rememberVisit = (key: string, pieceId: string) => {
  visits.set(key, { pendingScroll: window.scrollY, pieceId });
};

/** A pure read, safe to call while rendering. */
export const readVisit = (key: string): Visit | undefined => visits.get(key);

/** Spend the position, keeping the marker. */
export const consumeScroll = (key: string) => {
  const held = visits.get(key);
  if (held) held.pendingScroll = null;
};

/*
 * How long to keep trying, in frames at 60fps. The page is not necessarily
 * its final height when the grid first renders -- on the landing page the
 * collections row resolves on its own request and adds a band above the
 * grid after the fact, which would leave a one-shot restore pointing at the
 * wrong work.
 *
 * So it re-asserts until the position sticks. Half a second is far past
 * anything observed and short enough that a failure is a scroll, not a
 * hang.
 */
const MAX_FRAMES = 30;

/**
 * Scroll to `top`, and keep insisting until the document is tall enough to
 * allow it.
 *
 * Abandoned the moment the reader scrolls, wheels or types. A restoration
 * that fights someone who has already started reading is worse than one
 * that gives up: they have said where they want to be, and they outrank a
 * remembered position.
 */
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
