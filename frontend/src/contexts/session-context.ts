import { createContext } from 'react';
import type { Role } from '../types';

export interface SessionContextValue {
  role: Role;
  /**
   * Whether the API has answered. A visitor is known from the first paint
   * and never asks; only a returning owner is briefly unresolved.
   */
  known: boolean;
  /** The dialog, opened by the gesture, the spare path, or a lapsed session. */
  keyholeOpen: boolean;
  openKeyhole: () => void;
  closeKeyhole: () => void;
  /** Told by the dialog once the API has accepted a key. */
  signedIn: () => void;
  signOut: () => Promise<void>;
}

/* Lives apart from SessionProvider so that file can export only a
   component, which keeps react-refresh happy. */
export const SessionContext = createContext<SessionContextValue | null>(null);
