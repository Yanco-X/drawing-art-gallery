// Random and derived from nothing: unlinkable is what makes it anonymous.
// context/METRICS.md section 2.
const VISITOR_KEY = 'sketchyart.visitor';
const OFF_KEY = 'sketchyart.visits.off';
const TAB_VISITED_KEY = 'sketchyart.visited';

export const countingOff = (): boolean => {
  try {
    return localStorage.getItem(OFF_KEY) === '1';
  } catch {
    return false;
  }
};

export const setCountingOff = (off: boolean): void => {
  try {
    if (off) {
      localStorage.setItem(OFF_KEY, '1');
      localStorage.removeItem(VISITOR_KEY);
    } else {
      localStorage.removeItem(OFF_KEY);
    }
  } catch {
    // Nothing to persist to, and with no storage nothing is counted anyway.
  }
};

export const currentVisitorId = (): string | null => {
  if (countingOff()) return null;
  try {
    const held = localStorage.getItem(VISITOR_KEY);
    if (held) return held;
    // Absent outside a secure context, where nothing is counted.
    const minted = crypto.randomUUID?.();
    if (!minted) return null;
    localStorage.setItem(VISITOR_KEY, minted);
    return minted;
  } catch {
    return null;
  }
};

// Once per tab: a reload or a navigation inside the app is not a new visit.
export const claimTabVisit = (): boolean => {
  try {
    if (sessionStorage.getItem(TAB_VISITED_KEY)) return false;
    sessionStorage.setItem(TAB_VISITED_KEY, '1');
    return true;
  } catch {
    return false;
  }
};
