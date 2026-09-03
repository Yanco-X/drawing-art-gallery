/**
 * What this browser remembers about being the owner.
 *
 * A marker, not a credential. The session itself lives in an HttpOnly
 * cookie that this code cannot read, so all this records is whether asking
 * the API who we are is worth a request. A visitor has never signed in
 * here, so they make no auth request at all and leave no trace of the
 * system in their network tab.
 */
export const OWNER_MARKER_KEY = 'sketchyart-owner';

export const hasOwnerMarker = (): boolean => {
  try {
    return localStorage.getItem(OWNER_MARKER_KEY) === '1';
  } catch {
    // Private browsing or blocked storage: we simply ask every time.
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
