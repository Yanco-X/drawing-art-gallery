import { createContext } from 'react';
import type { Role } from '../types';

export interface SessionContextValue {
  role: Role;
  known: boolean;
  keyholeOpen: boolean;
  openKeyhole: () => void;
  closeKeyhole: () => void;
  signedIn: () => void;
  signOut: () => Promise<void>;
}

/* Lives apart from SessionProvider so that file can export only a
   component, which keeps react-refresh happy. */
export const SessionContext = createContext<SessionContextValue | null>(null);
