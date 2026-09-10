import type { ReactNode } from 'react';

/*
 * A 24-unit grid rendered at 16px puts a 1.5-unit stroke at exactly one
 * device pixel, which is what makes an icon the same hairline as every border
 * in the system. `currentColor` inherits the button's hover and disabled
 * states, so an icon never needs styling twice.
 */
export const Glyph = ({
  children,
  filled = false,
}: {
  children: ReactNode;
  /**
   * Solid instead of outlined. A 3-unit column drawn as an outline is two
   * hairlines almost touching, which at 16px is mud.
   */
  filled?: boolean;
}) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill={filled ? 'currentColor' : 'none'}
    stroke={filled ? 'none' : 'currentColor'}
    strokeWidth="1.5"
    aria-hidden="true"
    focusable="false"
    className="shrink-0"
  >
    {children}
  </svg>
);

export const EditIcon = () => (
  <Glyph>
    <path d="M4 20v-4L16 4l4 4L8 20H4Z" />
    <path d="M13 7l4 4" />
  </Glyph>
);

export const CollectionsIcon = () => (
  <Glyph>
    <path d="M3 8h13v13H3z" />
    <path d="M8 8V3h13v13h-5" />
  </Glyph>
);

export const WaiveIcon = () => (
  <Glyph>
    <path d="M3 7h18v4H3z" />
    <path d="M5 11v10h14V11" />
    <path d="M12 13v5M9.5 15.5 12 18l2.5-2.5" />
  </Glyph>
);

export const RestoreIcon = () => (
  <Glyph>
    <path d="M3 7h18v4H3z" />
    <path d="M5 11v10h14V11" />
    <path d="M12 18v-5M9.5 15.5 12 13l2.5 2.5" />
  </Glyph>
);

export const ArrangeIcon = () => (
  <Glyph>
    <path d="M10 6h11M10 12h11M10 18h11" />
    <path d="M5 4v16M2.5 6.5 5 4l2.5 2.5M2.5 17.5 5 20l2.5-2.5" />
  </Glyph>
);


export const DensityAiryIcon = () => (
  <Glyph filled>
    <path d="M3 4h7.5v16H3zM13.5 4H21v16h-7.5z" />
  </Glyph>
);

export const DensityComfortableIcon = () => (
  <Glyph filled>
    <path d="M3 4h4.6v16H3zM9.7 4h4.6v16H9.7zM16.4 4H21v16h-4.6z" />
  </Glyph>
);

export const DensityDenseIcon = () => (
  <Glyph filled>
    <path d="M3 4h3v16H3zM8 4h3v16H8zM13 4h3v16h-3zM18 4h3v16h-3z" />
  </Glyph>
);

export const DeleteIcon = () => (
  <Glyph>
    <path d="M4 6h16" />
    <path d="M9 6V3h6v3" />
    <path d="M6 6v15h12V6" />
    <path d="M10 10v7M14 10v7" />
  </Glyph>
);

export const ExpandIcon = () => (
  <Glyph>
    <path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5" />
  </Glyph>
);

export const ZoomInIcon = () => (
  <Glyph>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M15.8 15.8 21 21M11 8.5v5M8.5 11h5" />
  </Glyph>
);

export const ZoomOutIcon = () => (
  <Glyph>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M15.8 15.8 21 21M8.5 11h5" />
  </Glyph>
);

export const FitIcon = () => (
  <Glyph>
    <path d="M3 3h18v18H3z" />
    <path d="M8 8h8v8H8z" />
  </Glyph>
);

export const FullscreenIcon = () => (
  <Glyph>
    <path d="M3 8V3h5M21 16v5h-5M16 3h5v5M8 21H3v-5" />
  </Glyph>
);

export const ExitFullscreenIcon = () => (
  <Glyph>
    <path d="M8 3v5H3M16 21v-5h5M21 8h-5V3M3 16h5v5" />
  </Glyph>
);

export const CloseIcon = () => (
  <Glyph>
    <path d="M5 5l14 14M19 5L5 19" />
  </Glyph>
);

/** The one curved glyph in the set: drawn from straight segments an eye
    reads as a diamond. */
export const EyeIcon = () => (
  <Glyph>
    <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="2.5" />
  </Glyph>
);

export const EyeHiddenIcon = () => (
  <Glyph>
    <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M4 20L20 4" />
  </Glyph>
);

export const SignOutIcon = () => (
  <Glyph>
    <path d="M13 4H4v16h9" />
    <path d="M10 12h10" />
    <path d="M17 9l3 3-3 3" />
  </Glyph>
);

export const ChevronDownIcon = () => (
  <Glyph>
    <path d="M6 9l6 6 6-6" />
  </Glyph>
);

export const ExternalIcon = () => (
  <Glyph>
    <path d="M11 5H5v14h14v-6" />
    <path d="M14 4h6v6" />
    <path d="M20 4l-8 8" />
  </Glyph>
);

export const ChevronLeftIcon = () => (
  <Glyph>
    <path d="M15 6l-6 6 6 6" />
  </Glyph>
);

export const ChevronRightIcon = () => (
  <Glyph>
    <path d="M9 6l6 6-6 6" />
  </Glyph>
);

export const GearIcon = () => (
  <Glyph>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3l1.4 2.6 2.9-.4 1 2.8 2.4 1.7-1.3 2.6 1.3 2.6-2.4 1.7-1 2.8-2.9-.4L12 21l-1.4-2.6-2.9.4-1-2.8L4.3 14l1.3-2.6L4.3 8.8l2.4-1.7 1-2.8 2.9.4L12 3Z" />
  </Glyph>
);

export const FilterIcon = () => (
  <Glyph>
    <path d="M3 4h18l-7 8v7l-4-2v-5L3 4Z" />
  </Glyph>
);

export const SortIcon = () => (
  <Glyph>
    <path d="M4 6h16M4 12h10M4 18h5" />
  </Glyph>
);
