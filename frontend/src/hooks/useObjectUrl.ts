import { useEffect, useMemo } from 'react';

export const useObjectUrl = (file: File | null): string | null => {
  // Derived from the file rather than stored: computing it in an effect would
  // render once with no image and again with it.
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  // Revoking is the one part that is a real side effect. Leaking an object
  // URL pins the entire file in memory for the life of the page.
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return url;
};
