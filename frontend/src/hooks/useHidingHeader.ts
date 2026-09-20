import { useCallback, useEffect, useRef, useState } from 'react';

// The `phone` variant's query: a phone either way up.
const PHONE =
  '(width < 40rem), (width >= 40rem) and (height < 32rem) and (orientation: landscape)';
// --spacing-header: above this the reader is at the top, and it stays.
const HEADER_HEIGHT = 77;
// Travel that counts as a direction, so a finger's tremor does not flicker it.
const TRAVEL = 8;
// Stillness after which it goes anyway, reading rather than scrolling.
const STILL_MS = 2000;

/**
 * On a phone the header gives its height back while the reader scrolls down,
 * and again once they have been still for a moment. It returns when they
 * scroll up, or reach the top.
 */
export const useHidingHeader = (held = false) => {
  const [hidden, setHidden] = useState(false);
  const heldRef = useRef(held);

  useEffect(() => {
    heldRef.current = held;
  }, [held]);

  useEffect(() => {
    let last = window.scrollY;
    let still = 0;
    const onScroll = () => {
      const y = window.scrollY;
      window.clearTimeout(still);
      if (y < HEADER_HEIGHT || !window.matchMedia(PHONE).matches) {
        setHidden(false);
        last = y;
        return;
      }
      if (Math.abs(y - last) >= TRAVEL) {
        setHidden(y > last);
        last = y;
      }
      still = window.setTimeout(() => {
        if (!heldRef.current) setHidden(true);
      }, STILL_MS);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(still);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const reveal = useCallback(() => setHidden(false), []);
  return { hidden, reveal };
};
