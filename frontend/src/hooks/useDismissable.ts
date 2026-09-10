import { useEffect, useRef } from 'react';

// `mousedown` rather than `click`, so the surface is gone before whatever
// was underneath receives its own event. The callback is held in a ref so an
// inline arrow does not rebuild the listeners on every render.
export const useDismissable = <T extends HTMLElement>(
  open: boolean,
  close: () => void,
) => {
  const root = useRef<T>(null);
  const latest = useRef(close);

  useEffect(() => {
    latest.current = close;
  });

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) latest.current();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') latest.current();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return root;
};
