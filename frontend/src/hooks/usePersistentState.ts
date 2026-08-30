import { useCallback, useState } from 'react';

/**
 * useState backed by localStorage, for user preferences.
 *
 * `isValid` guards against stale or hand-edited values: anything that
 * fails it is ignored and `fallback` is used instead. Storage access is
 * wrapped because it throws outright in some privacy modes.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed: unknown = JSON.parse(stored);
        if (isValid(parsed)) return parsed;
      }
    } catch {
      // Unreadable or malformed — fall through to the default.
    }
    return fallback;
  });

  const set = useCallback(
    (value: T) => {
      setState(value);
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // The preference just won't survive a reload.
      }
    },
    [key],
  );

  return [state, set];
}
