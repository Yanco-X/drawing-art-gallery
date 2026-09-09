import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { consumeScroll, readVisit, restoreScroll } from '../lib/returnMemory';

/**
 * Puts the reader back where they were, and says which piece they had open.
 *
 * `ready` is what gates it: the grid reserves its height from each piece's
 * stored aspect ratio, so the page is its full height as soon as the pieces
 * render -- but not before, and scrolling to 4000px on a page still showing
 * "Loading work" does nothing at all.
 *
 * The marker is derived rather than held in state. Reading the record is a
 * pure map lookup, so it can happen during render; only the scroll, which
 * is genuinely a side effect, happens in the effect. Copying it into state
 * would mean setting state from an effect on every arrival, and an extra
 * render to say something the render already had in hand.
 */
export const useReturnMemory = (ready: boolean) => {
  const { pathname } = useLocation();
  const visit = ready ? readVisit(pathname) : undefined;
  const pending = visit?.pendingScroll ?? null;

  useEffect(() => {
    if (pending === null) return;
    consumeScroll(pathname);
    return restoreScroll(pending);
  }, [pending, pathname]);

  return visit?.pieceId ?? null;
};
