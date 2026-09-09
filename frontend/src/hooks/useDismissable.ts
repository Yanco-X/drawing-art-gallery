import { useEffect, useRef } from 'react';

/**
 * Closing a floating surface the way people expect: a click outside it, or
 * Escape.
 *
 * Returns the ref to put on the element that counts as "inside" -- the
 * trigger and its menu together, so clicking the trigger to close does not
 * also register as an outside click and fight the toggle.
 *
 * `mousedown` rather than `click`, so the menu is gone before whatever was
 * clicked underneath receives its own event.
 *
 * The callback is held in a ref, so a caller passing an inline arrow does
 * not tear down and rebuild the listeners on every render. Written in an
 * effect rather than during render, which React forbids: a render can be
 * thrown away and re-run, and a ref mutated on the way through survives it.
 */
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
