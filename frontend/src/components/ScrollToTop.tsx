import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** A client-side route change leaves the scroll position where it was. */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
