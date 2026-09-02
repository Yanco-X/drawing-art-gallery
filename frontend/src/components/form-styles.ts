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

/**
 * The quietest action there is: a 12px text button that undoes something
 * small. Clearing a filter, dropping a selection. Sits beside the label of
 * whatever it undoes, and is only rendered when there is something to undo.
 */
export const SUBTLE_ACTION =
  'cursor-pointer border-none bg-transparent p-0 text-[12px] text-faint ' +
  'transition-colors duration-200 hover:text-accent';

/** A bare text action, as used in the wall label and the section headers. */
export const ACTION =
  'cursor-pointer border-none bg-transparent p-0 text-[13px] uppercase ' +
  'tracking-btn transition-colors duration-200';

/*
 * An action that carries an icon and reads as a button.
 *
 * The theme toggle's treatment, per DESIGN.md — 1px `line` border,
 * transparent fill, glyph plus label. Used where an action needs to look
 * like one rather than like a link.
 */
/* Shape only — no cursor and no colour, so the inert variant can reuse it. */
const ICON_BUTTON_SHELL =
  'flex items-center justify-center gap-2 border bg-transparent px-3 py-2 ' +
  'text-[12px] uppercase tracking-btn transition-colors duration-200';

const ICON_BUTTON_INTERACTIVE =
  ICON_BUTTON_SHELL +
  ' cursor-pointer border-line text-muted disabled:cursor-not-allowed ' +
  'disabled:opacity-40';

export const ICON_BUTTON =
  ICON_BUTTON_INTERACTIVE + ' hover:border-accent hover:text-accent';

/** For actions with no undo. `danger` is the one sanctioned second colour. */
export const ICON_BUTTON_DANGER =
  ICON_BUTTON_INTERACTIVE + ' hover:border-danger hover:text-danger';

/**
 * The accented box, for the one action a section is really offering.
 *
 * Outlined rather than filled: DESIGN.md spends solid accent on focus,
 * required marks and the confirming button, and the header's "+ Upload" is
 * already the filled owner action on this page. A second one would dilute
 * both. Fills on hover, the way the danger button does.
 */
export const ICON_BUTTON_ACCENT =
  ICON_BUTTON_SHELL +
  ' cursor-pointer border-accent text-accent hover:bg-accent ' +
  'hover:text-on-accent disabled:cursor-not-allowed disabled:opacity-40';

/**
 * The same box with nowhere to go — the first piece has no previous.
 *
 * Kept in the layout rather than omitted so the row does not reflow at the
 * ends of the gallery, and deliberately without `cursor-pointer`: a box
 * that cannot be clicked should not claim it can.
 */
export const ICON_BUTTON_INERT =
  ICON_BUTTON_SHELL + ' border-line text-faint opacity-40';

/**
 * The one action a page exists for, filled with the accent.
 *
 * Distinct from ICON_BUTTON_ACCENT, which is outlined: that one marks a
 * useful action inside a section, this one marks the reason the page is
 * open. On a piece page, for a visitor, Detailed View is the only thing
 * there is to do -- seeing the work at full resolution is the closest this
 * gets to seeing it in person.
 *
 * Full width by default. In a system built from hairlines there is no
 * heavier weight to reach for, so prominence comes from spanning the column
 * rather than from adding ornament.
 */
export const PAGE_ACTION =
  'flex w-full cursor-pointer items-center justify-center gap-2.5 border-none ' +
  'bg-accent px-5 py-3.5 text-[13px] uppercase tracking-btn text-on-accent ' +
  'transition-opacity duration-200 hover:opacity-90 ' +
  'disabled:cursor-not-allowed disabled:opacity-40';
