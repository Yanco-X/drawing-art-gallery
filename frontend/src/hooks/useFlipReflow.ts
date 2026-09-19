import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

const DURATION_MS = 300;
const EASING = 'cubic-bezier(0.2, 0, 0, 1)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const FLIP_SELECTOR = '[data-flip-id]';

interface Placement {
  element: HTMLElement;
  x: number;
  y: number;
  /** The layout width, which a transform playing does not change. */
  width: number;
  /** How far a transform still playing carries it from `x`, `y`. */
  driftX: number;
  driftY: number;
  /** And how much it is scaling it. */
  drawn: number;
}

// A density change reflows in one frame, and a sort or a filter reorders the
// cards in one too. This plays each card back from its old offset and size on
// `transform` alone; a card that has just arrived fades in, and one that has
// just left fades out where it stood. Offsets are measured against the
// container, not the viewport, so a scroll during the reflow cannot skew them.
//
// One scale for both axes, taken from the width: a caption's height does not
// follow its image's, and text squeezed on one axis reads worse than text
// briefly the wrong size.
export const useFlipReflow = (
  containerRef: RefObject<HTMLElement | null>,
  changeKey: string,
) => {
  const placementsRef = useRef<Map<string, Placement>>(new Map());
  const previousKeyRef = useRef(changeKey);
  const animationsRef = useRef<Animation[]>([]);

  // Layout positions: a rect includes whatever transform is mid-flight, so
  // that is read back off the element and taken out -- unless the question
  // is where the card is drawn, transform and all.
  const measure = useCallback(
    (asDrawn = false): Map<string, Placement> => {
      const placements = new Map<string, Placement>();
      const container = containerRef.current;
      if (!container) return placements;

      const base = container.getBoundingClientRect();
      for (const element of container.querySelectorAll<HTMLElement>(
        FLIP_SELECTOR,
      )) {
        const id = element.dataset.flipId;
        if (!id) continue;
        const rect = element.getBoundingClientRect();
        const transform = getComputedStyle(element).transform;
        // The animations scale from the top-left corner, so the translation is
        // still where that corner has been carried.
        const {
          a: drawn,
          e: driftX,
          f: driftY,
        } = asDrawn || transform === 'none'
          ? { a: 1, e: 0, f: 0 }
          : new DOMMatrix(transform);
        placements.set(id, {
          element,
          x: rect.left - base.left - driftX,
          y: rect.top - base.top - driftY,
          width: element.offsetWidth,
          driftX,
          driftY,
          drawn,
        });
      }
      return placements;
    },
    [containerRef],
  );

  // No dependency array: the cache is refreshed after every render, or a
  // change of layout that came without a key change would animate cards in
  // from wherever they used to be.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const keyChanged = previousKeyRef.current !== changeKey;
    previousKeyRef.current = changeKey;

    const last = measure();
    const first = placementsRef.current;
    placementsRef.current = last;

    if (!keyChanged) return;

    // Drop anything still in flight so rapid changes don't stack up. Measured
    // first, so a card retargeted mid-flight sets off from where it is.
    for (const animation of animationsRef.current) animation.cancel();
    animationsRef.current = [];

    // A grid that had nothing on it is arriving, not changing.
    if (first.size === 0) return;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    const play = (element: HTMLElement, keyframes: Keyframe[]) => {
      const animation = element.animate(keyframes, {
        duration: DURATION_MS,
        easing: EASING,
      });
      animationsRef.current.push(animation);
      return animation;
    };

    for (const [id, to] of last) {
      const from = first.get(id);
      if (!from) {
        play(to.element, [{ opacity: 0 }, { opacity: 1 }]);
        continue;
      }

      const dx = from.x + to.driftX - to.x;
      const dy = from.y + to.driftY - to.y;
      // The size it is drawn at now, over the size it is settling into.
      const scale = to.width > 0 ? (from.width * to.drawn) / to.width : 1;
      // Sub-pixel moves aren't worth an animation. Two densities resolving
      // to the same column count land here and animate nothing, correctly.
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(scale - 1) < 0.01)
        continue;

      play(to.element, [
        {
          transformOrigin: '0 0',
          transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        },
        { transformOrigin: '0 0', transform: 'translate(0, 0) scale(1)' },
      ]);
    }

    // React has already taken a departed card out of the tree and is done
    // with it, so it can be put back where it was for the length of a fade.
    // `inert`, or its link would still take a click.
    for (const [id, gone] of first) {
      if (last.has(id)) continue;
      const ghost = gone.element;
      ghost.removeAttribute('data-flip-id');
      ghost.setAttribute('inert', '');
      Object.assign(ghost.style, {
        position: 'absolute',
        left: `${gone.x}px`,
        top: `${gone.y}px`,
        width: `${gone.width}px`,
        zIndex: '-1',
      });
      container.appendChild(ghost);
      // Not in the cancel list: a change while it fades is no reason to
      // cut the fade short.
      const fade = ghost.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: DURATION_MS,
        easing: EASING,
      });
      const remove = () => ghost.remove();
      fade.finished.then(remove, remove);
    }
  });

  // Resizing reflows the grid without re-rendering, which would leave the
  // cache stale for the next change.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      placementsRef.current = measure();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, measure]);

  useEffect(
    () => () => {
      for (const animation of animationsRef.current) animation.cancel();
    },
    [],
  );

  // Called just before a change that takes away a transform this hook did
  // not set -- a drag library's slides. The cards then set off from where
  // they are drawn, not from their old slots, so one already in place stays.
  return useCallback(() => {
    placementsRef.current = measure(true);
  }, [measure]);
};
