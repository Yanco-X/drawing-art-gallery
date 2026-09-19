import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { flushSync } from 'react-dom';
import { whenDecoded } from '../lib/decode';
import { comeBack, turnIn, turnsWhole } from '../lib/swipe';
import { takeStep } from '../lib/traverse';
import type { Piece } from '../types';

// The piece on the wall. The next one is held back until its image has
// decoded, then the two are swapped inside a view transition, so moving
// between pieces is one crossfade rather than a label that changes, a frame
// that resizes and a drawing that lands, each in its own frame. An edit to
// the piece already up goes straight through. `instant` skips all of it.
// On a phone the page slides instead: a swipe sends it off one edge, and the
// next comes in from the other as soon as it is ready.
export const useArrivingPiece = (
  target: Piece | null,
  instant: boolean,
  page: RefObject<HTMLElement | null>,
) => {
  const [shown, setShown] = useState<Piece | null>(null);

  useEffect(() => {
    if (!target) return;
    // Back, before the piece a swipe asked for arrived.
    if (target.id === shown?.id) {
      comeBack(page.current);
      return;
    }
    let superseded = false;
    const hang = () => setShown(target);
    const ready = instant ? Promise.resolve() : whenDecoded(target.imageUrl);
    ready.then(() => {
      if (superseded) return;
      const step = takeStep(target.id);
      const body = page.current;
      if (!instant && step && body && turnsWhole()) {
        flushSync(hang);
        turnIn(body, step);
        return;
      }
      comeBack(body);
      if (instant || !('startViewTransition' in document)) {
        hang();
        return;
      }
      // The direction rides on the root for the length of the transition,
      // which is where the CSS can see it.
      const root = document.documentElement;
      if (step) root.dataset.traverse = step > 0 ? 'next' : 'previous';
      const clear = () => delete root.dataset.traverse;
      document.startViewTransition(() => flushSync(hang)).finished.then(clear, clear);
    });
    return () => {
      superseded = true;
    };
  }, [target, shown, instant, page]);

  return target && target.id === shown?.id ? target : shown;
};
