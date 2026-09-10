// A marker, not a credential: the session is an HttpOnly cookie this code
// cannot read. All this records is whether asking the API is worth a request.
export const OWNER_MARKER_KEY = 'sketchyart-owner';

export const hasOwnerMarker = (): boolean => {
  try {
    return localStorage.getItem(OWNER_MARKER_KEY) === '1';
  } catch {
    // Private browsing or blocked storage: ask every time.
    return false;
  }
};

export const rememberOwner = (remembered: boolean): void => {
  try {
    if (remembered) localStorage.setItem(OWNER_MARKER_KEY, '1');
    else localStorage.removeItem(OWNER_MARKER_KEY);
  } catch {
    // Nothing to persist to; the session cookie still works for this tab.
  }
};
