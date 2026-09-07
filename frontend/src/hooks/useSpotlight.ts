import { useCallback, useEffect, useState } from 'react';

const INTERVAL_MS = 8000;
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Subscribed rather than read once: someone who turns motion down while the
 * page is open has asked for the band to stop, not to stop on next load.
 */
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

/**
 * Position within the spotlight, and the timer that moves it.
 *
 * `held` is the transient pause taken by a hover or by focus landing inside
 * the band; `playing` is the visitor's own answer, given through the pause
 * control. They are separate because releasing a hover must not restart a
 * band someone deliberately stopped.
 *
 * `suspended` is a third and blunter stop, for while something covers the
 * band entirely. A hover cannot serve here: opening a dialog takes the
 * pointer off the band, which fires the mouse-leave that would release the
 * hold and set the thing advancing behind the cover.
 */
export const useSpotlight = (count: number, suspended = false) => {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);

  // A count that shrinks under the current position leaves it out of range
  // -- the owner waives the piece being shown, and the band is looking at
  // nothing.
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

  /*
   * Every deliberate advance ends the automatic one. A band that moves on
   * eight seconds after someone chose a slide is taking the choice back,
   * and the pause control is right there to start it again.
   */
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
    /* What the visitor asked for, which is what the pause control names. */
    playing,
    /* Whether the timer is actually ticking -- a hover suspends it without
       changing the answer above. */
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
