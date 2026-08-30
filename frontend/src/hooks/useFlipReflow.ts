import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

/** Matches the design's 300ms theme swap — the slowest motion in the UI. */
const DURATION_MS = 300;
const EASING = 'cubic-bezier(0.2, 0, 0, 1)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const FLIP_SELECTOR = '[data-flip-id]';

interface Placement {
  element: HTMLElement;
  x: number;
  y: number;
}

/**
 * Animates a layout change that CSS cannot transition.
 *
 * The masonry is a CSS multi-column layout, and `columns` is not an
 * animatable property — switching density reflows instantly. So this does
 * FLIP: cache where every card sits, let React apply the new column rule,
 * then measure again and play each card from its old offset back to zero.
 * The reflow still happens in one frame; only `transform` is animated, so
 * nothing here feeds back into layout.
 *
 * Positions are measured relative to the container rather than the
 * viewport, so a scroll shift during the reflow can't skew the deltas.
 */
export const useFlipReflow = (
  containerRef: RefObject<HTMLElement | null>,
  changeKey: string,
) => {
  const placementsRef = useRef<Map<string, Placement>>(new Map());
  const previousKeyRef = useRef(changeKey);
  const animationsRef = useRef<Animation[]>([]);

  const measure = useCallback((): Map<string, Placement> => {
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
      placements.set(id, {
        element,
        x: rect.left - base.left,
        y: rect.top - base.top,
      });
    }
    return placements;
  }, [containerRef]);

  // No dependency array: the cache has to be refreshed after every render
  // (tag filtering reflows the grid too), or the next density change would
  // animate cards in from wherever they used to be.
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const keyChanged = previousKeyRef.current !== changeKey;
    previousKeyRef.current = changeKey;

    const last = measure();
    const first = placementsRef.current;
    placementsRef.current = last;

    if (!keyChanged) return;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

    // Drop anything still in flight so rapid clicks don't stack up.
    for (const animation of animationsRef.current) animation.cancel();
    animationsRef.current = [];

    for (const [id, to] of last) {
      const from = first.get(id);
      if (!from) continue;

      const dx = from.x - to.x;
      const dy = from.y - to.y;
      // Sub-pixel moves aren't worth an animation. When the viewport is
      // narrow enough that two densities resolve to the same column count,
      // every delta lands here and nothing animates — which is correct.
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;

      animationsRef.current.push(
        to.element.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: 'translate(0, 0)' },
          ],
          { duration: DURATION_MS, easing: EASING },
        ),
      );
    }
  });

  // Resizing reflows the grid without re-rendering, which would leave the
  // cache stale for the next density change.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      const settled = animationsRef.current.every(
        (animation) => animation.playState !== 'running',
      );
      if (settled) placementsRef.current = measure();
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
};
