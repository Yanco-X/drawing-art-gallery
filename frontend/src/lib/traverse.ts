export type Step = -1 | 1;

// Set by the control that starts a move, taken once by the swap that lands
// it. Keyed by the piece it points at, so a move abandoned for another --
// Back pressed before the piece arrived -- lends it no direction.
let intended: { id: string; step: Step } | null = null;

export const intendStep = (id: string, step: Step) => {
  intended = { id, step };
};

export const takeStep = (id: string): Step | 0 => {
  const step = intended?.id === id ? intended.step : 0;
  intended = null;
  return step;
};

// Where a keypress is already spoken for: a field takes the caret, a dialog
// its own keys, and the viewer's canvas pans.
const KEYS_TAKEN = 'dialog, input, textarea, select, [contenteditable]';

export const keyTaken = (event: KeyboardEvent) =>
  Boolean((event.target as Element | null)?.closest(KEYS_TAKEN));

// The step a bare arrow key asks for, or none. Alt, Ctrl and Cmd are left to
// the browser -- Alt+Left is Back -- and a held key is one step, not a run.
export const arrowStep = (event: KeyboardEvent): Step | 0 => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return 0;
  if (keyTaken(event)) return 0;
  return event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
};
