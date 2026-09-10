import { createContext } from 'react';
import type { Social } from '../types';

export interface SocialsContextValue {
  socials: Social[];
  loaded: boolean;
  replace: (socials: Social[]) => void;
}

export const SocialsContext = createContext<SocialsContextValue | null>(null);
