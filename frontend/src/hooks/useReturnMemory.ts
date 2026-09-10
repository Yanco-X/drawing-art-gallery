import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { consumeScroll, readVisit, restoreScroll } from '../lib/returnMemory';

// `ready` gates it: the grid reserves its height from each piece's stored
// aspect ratio, so scrolling before the pieces render does nothing at all.
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
