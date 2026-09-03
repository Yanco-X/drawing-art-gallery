import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cameThroughSparePath } from '../lib/keyhole';
import { hasOwnerMarker, rememberOwner } from '../lib/session';
import { fetchRole, signOut as deleteSession, whenSessionLapses } from '../services';
import type { Role } from '../types';
import { SessionContext } from './session-context';

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  /*
   * The marker is trusted on first paint and corrected a moment later.
   * Waiting for the API instead would blank every owner control on every
   * load; trusting it early costs nothing, because the marker is on the
   * owner's own machine and the backend refuses regardless of what is
   * drawn here.
   */
  const [role, setRole] = useState<Role>(() =>
    hasOwnerMarker() ? 'owner' : 'visitor',
  );
  const [known, setKnown] = useState(() => !hasOwnerMarker());
  const [keyholeOpen, setKeyholeOpen] = useState(false);

  // A 401 leaves the interface alone and opens the dialog over it, so an
  // edit in progress keeps what was typed. Only dismissing without signing
  // in gives up the role.
  const lapsed = useRef(false);

  useEffect(() => {
    if (!hasOwnerMarker()) return;
    let live = true;
    fetchRole().then(
      (answer) => {
        if (!live) return;
        setRole(answer);
        setKnown(true);
        rememberOwner(answer === 'owner');
      },
      () => {
        if (live) setKnown(true);
      },
    );
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    whenSessionLapses(() => {
      lapsed.current = true;
      setKeyholeOpen(true);
    });
    return () => whenSessionLapses(null);
  }, []);

  useEffect(() => {
    cameThroughSparePath().then((yes) => {
      if (yes) setKeyholeOpen(true);
    });
  }, []);

  const openKeyhole = useCallback(() => setKeyholeOpen(true), []);

  const closeKeyhole = useCallback(() => {
    setKeyholeOpen(false);
    if (lapsed.current) {
      lapsed.current = false;
      setRole('visitor');
      rememberOwner(false);
    }
  }, []);

  // The dialog makes the request itself and reports back, so the call that
  // carries a password stays inside its lazy chunk.
  const signedIn = useCallback(() => {
    lapsed.current = false;
    rememberOwner(true);
    setRole('owner');
    setKnown(true);
    setKeyholeOpen(false);
  }, []);

  const signOut = useCallback(async () => {
    await deleteSession();
    rememberOwner(false);
    setRole('visitor');
    setKeyholeOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      role,
      known,
      keyholeOpen,
      openKeyhole,
      closeKeyhole,
      signedIn,
      signOut,
    }),
    [role, known, keyholeOpen, openKeyhole, closeKeyhole, signedIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
