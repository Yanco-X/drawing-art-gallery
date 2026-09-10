import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchSocials } from '../services';
import type { Social } from '../types';
import { SocialsContext } from './socials-context';

/*
 * Fetched once, above the router: `PageShell` remounts on every navigation, so
 * a `useAsync` in there would refetch the same short list on every click. A
 * failure is silent -- an empty list hides the menu.
 */
export const SocialsProvider = ({ children }: { children: ReactNode }) => {
  const [socials, setSocials] = useState<Social[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    fetchSocials().then(
      (list) => {
        if (!live) return;
        setSocials(list);
        setLoaded(true);
      },
      () => {
        if (live) setLoaded(true);
      },
    );
    return () => {
      live = false;
    };
  }, []);

  const replace = useCallback((next: Social[]) => setSocials(next), []);

  const value = useMemo(
    () => ({ socials, loaded, replace }),
    [socials, loaded, replace],
  );

  return (
    <SocialsContext.Provider value={value}>{children}</SocialsContext.Provider>
  );
};
