import { useContext } from 'react';
import { SessionContext } from '../contexts/session-context';
import type { SessionContextValue } from '../contexts/session-context';

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
