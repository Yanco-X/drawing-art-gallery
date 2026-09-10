import { useCallback, useEffect, useState } from 'react';

const INTERVAL_MS = 8000;
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// Subscribed rather than read once: turning motion down while the page is
// open should stop the band now, not on next load.
const useReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () => window.matchMedia(REDUCED_MOTION).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION);
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
};

// Three stops, deliberately separate. `held` is a hover or focus, `playing`
// is the visitor's own answer through the pause control, and `suspended` is
// for while a dialog covers the band -- opening one fires the mouse-leave
// that would otherwise release `held` and set it advancing behind the cover.
export const useSpotlight = (count: number, suspended = false) => {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);

  // A count that shrinks under the current position leaves it out of range:
  // the owner waives the piece being shown.
  const safeIndex = index < count ? index : 0;
  const running = playing && !held && !suspended && !reducedMotion && count > 1;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setIndex((at) => (at + 1) % count),
      INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [running, count]);

  const go = useCallback(
    (to: number) => {
      setPlaying(false);
      setIndex(((to % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => go(safeIndex + 1), [go, safeIndex]);
  const previous = useCallback(() => go(safeIndex - 1), [go, safeIndex]);

  return {
    index: safeIndex,
    playing,
    running,
    reducedMotion,
    go,
    next,
    previous,
    toggle: () => setPlaying((on) => !on),
    hold: () => setHeld(true),
    release: () => setHeld(false),
  };
};
