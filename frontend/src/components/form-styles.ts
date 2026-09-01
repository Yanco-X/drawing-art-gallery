/*
 * The form vocabulary, in one place.
 *
 * These strings were being copied between dialogs, which is how two forms
 * that should look identical start to drift by a padding step. The older
 * modals still carry their own copies; new work reads from here.
 */

export const LABEL = 'text-[12px] uppercase tracking-eyebrow text-muted';

export const FIELD =
  'w-full border border-line bg-bg px-3 py-2.5 text-[14px] text-text ' +
  'placeholder:text-faint transition-colors duration-200 ' +
  'focus:border-accent focus:outline-1 focus:outline-accent';

export const PRIMARY_BUTTON =
  'cursor-pointer border-none bg-accent px-5 py-2.5 text-[13px] uppercase ' +
  'tracking-btn text-on-accent transition-opacity duration-200 ' +
  'hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';

export const GHOST_BUTTON =
  'cursor-pointer border border-line bg-transparent px-5 py-2.5 text-[13px] ' +
  'uppercase tracking-btn text-muted transition-colors duration-200 ' +
  'hover:border-accent hover:text-accent disabled:cursor-not-allowed ' +
  'disabled:opacity-40';

/** A bare text action, as used in the wall label and the section headers. */
export const ACTION =
  'cursor-pointer border-none bg-transparent p-0 text-[13px] uppercase ' +
  'tracking-btn transition-colors duration-200';
