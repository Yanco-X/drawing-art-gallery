import { createContext } from 'react';
import type { Theme } from '../types';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/* Lives apart from ThemeProvider so that file can export only a
   component, which keeps react-refresh happy. */
export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = 'sketchyart-theme';
