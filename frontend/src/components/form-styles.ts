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

export const SUBTLE_ACTION =
  'cursor-pointer border-none bg-transparent p-0 text-[12px] text-faint ' +
  'transition-colors duration-200 hover:text-accent';

export const ACTION =
  'cursor-pointer border-none bg-transparent p-0 text-[13px] uppercase ' +
  'tracking-btn transition-colors duration-200';

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

export const ICON_BUTTON_DANGER =
  ICON_BUTTON_INTERACTIVE + ' hover:border-danger hover:text-danger';

// Outlined, and fills on hover. See PAGE_ACTION for the filled one.
export const ICON_BUTTON_ACCENT =
  ICON_BUTTON_SHELL +
  ' cursor-pointer border-accent text-accent hover:bg-accent ' +
  'hover:text-on-accent disabled:cursor-not-allowed disabled:opacity-40';

// Kept in the layout rather than omitted so the row does not reflow at the
// ends of the gallery. No `cursor-pointer`: it cannot be clicked.
export const ICON_BUTTON_INERT =
  ICON_BUTTON_SHELL + ' border-line text-faint opacity-40';

// Filled, and at most one per page -- against the outlined ICON_BUTTON_ACCENT,
// which marks a useful action inside a section.
export const PAGE_ACTION =
  'flex w-full cursor-pointer items-center justify-center gap-2.5 border-none ' +
  'bg-accent px-5 py-3.5 text-[13px] uppercase tracking-btn text-on-accent ' +
  'transition-opacity duration-200 hover:opacity-90 ' +
  'disabled:cursor-not-allowed disabled:opacity-40';
