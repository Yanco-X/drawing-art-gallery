import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Theme } from '../types';
import { THEME_STORAGE_KEY, ThemeContext } from './theme-context';

const isTheme = (value: unknown): value is Theme =>
  value === 'dark' || value === 'light';

/*
 * The inline script in index.html has already resolved the theme and
 * stamped it on <html> before React mounts, so read it back from there
 * rather than re-deriving it — that keeps the first render in step with
 * what the user is already looking at.
 */
const readStampedTheme = (): Theme => {
  const stamped = document.documentElement.getAttribute('data-theme');
  return isTheme(stamped) ? stamped : 'dark';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(readStampedTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
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
