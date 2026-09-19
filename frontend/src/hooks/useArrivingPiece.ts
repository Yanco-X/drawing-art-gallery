import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { takeStep } from '../lib/traverse';
import type { Piece } from '../types';

// Past this the reader has waited long enough: the piece goes up and its
// image lands when it can.
const IMAGE_WAIT_MS = 800;

const whenDecoded = (url: string) => {
  const image = new Image();
  image.src = url;
  return Promise.race([
    image.decode().catch(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, IMAGE_WAIT_MS)),
  ]);
};

// The piece on the wall. The next one is held back until its image has
// decoded, then the two are swapped inside a view transition, so moving
// between pieces is one crossfade rather than a label that changes, a frame
// that resizes and a drawing that lands, each in its own frame. An edit to
// the piece already up goes straight through. `instant` skips all of it.
export const useArrivingPiece = (target: Piece | null, instant: boolean) => {
  const [shown, setShown] = useState<Piece | null>(null);

  useEffect(() => {
    if (!target || target.id === shown?.id) return;
    let superseded = false;
    const hang = () => setShown(target);
    const ready = instant ? Promise.resolve() : whenDecoded(target.imageUrl);
    ready.then(() => {
      if (superseded) return;
      const step = takeStep(target.id);
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
  }, [target, shown, instant]);

  return target && target.id === shown?.id ? target : shown;
};
