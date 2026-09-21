import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Theme } from '../types';
import { THEME_STORAGE_KEY, ThemeContext } from './theme-context';

const isTheme = (value: unknown): value is Theme =>
  value === 'dark' || value === 'light';

/** Matches the 300ms the rule in index.css eases over. */
const TURN_MS = 200;

/*
 * The inline script in index.html has already resolved the theme and stamped it
 * on <html> before React mounts, so read it back rather than re-deriving it.
 */
const readStampedTheme = (): Theme => {
  const stamped = document.documentElement.getAttribute('data-theme');
  return isTheme(stamped) ? stamped : 'dark';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(readStampedTheme);

  // The first run only re-stamps what the inline script already set, so no
  // colour changes and there is nothing to ease.
  const stamped = useRef(true);

  useEffect(() => {
    const root = document.documentElement;
    if (stamped.current) {
      stamped.current = false;
      root.setAttribute('data-theme', theme);
      return;
    }
    root.classList.add('theme-turning');
    root.setAttribute('data-theme', theme);
    const timer = window.setTimeout(
      () => root.classList.remove('theme-turning'),
      TURN_MS,
    );
    return () => window.clearTimeout(timer);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    // Only an explicit choice is persisted. Writing on mount would freeze
    // the OS-derived default in place for visitors who never picked one.
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing or blocked storage — the choice just won't persist.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
