import { useCallback, useRef } from 'react';

const TAPS = 5;
const WINDOW_MS = 3000;

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
