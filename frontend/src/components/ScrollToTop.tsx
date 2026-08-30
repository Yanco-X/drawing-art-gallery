import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A client-side route change leaves the scroll position where it was, so
 * following a piece from far down the grid would open its page mid-way.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
