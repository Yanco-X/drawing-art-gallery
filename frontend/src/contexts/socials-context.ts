import { createContext } from 'react';
import type { Social } from '../types';

export interface SocialsContextValue {
  socials: Social[];
  /** False until the first answer, so the menu can stay out of the way. */
  loaded: boolean;
  /** Handed the saved list by the dialog, so nothing refetches. */
  replace: (socials: Social[]) => void;
}

export const SocialsContext = createContext<SocialsContextValue | null>(null);
