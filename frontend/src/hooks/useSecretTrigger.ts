import { useCallback, useRef } from 'react';

const TAPS = 5;
const WINDOW_MS = 3000;

/**
 * Five clicks in three seconds on one inconspicuous mark.
 *
 * A click, not a keystroke: it fires the same for a mouse and for a finger,
 * and the gallery is edited from a phone where a hotkey does not exist.
 */
export const useSecretTrigger = (onTrigger: () => void) => {
  const taps = useRef<number[]>([]);

  return useCallback(() => {
    const now = Date.now();
    taps.current = [...taps.current.filter((at) => now - at < WINDOW_MS), now];
    if (taps.current.length >= TAPS) {
      taps.current = [];
      onTrigger();
    }
  }, [onTrigger]);
};
