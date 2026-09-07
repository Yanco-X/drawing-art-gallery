import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * The element's width divided by its height, kept current as it resizes.
 *
 * Zero until the first measurement, and zero where `ResizeObserver` is
 * missing, so a caller can tell "not measured" from any real ratio and fall
 * back rather than draw something wrong.
 *
 * The observer fires once on `observe()` with the current size, which is why
 * nothing is read synchronously here: the initial value arrives through the
 * same callback as every later one, before the frame is painted.
 */
export const useFrameAspect = (ref: RefObject<HTMLElement | null>): number => {
  const [aspect, setAspect] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setAspect(box.height > 0 ? box.width / box.height : 0);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return aspect;
};
