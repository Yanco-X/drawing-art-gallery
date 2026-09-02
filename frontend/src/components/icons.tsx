import type { ReactNode } from 'react';

/*
 * Line icons, drawn rather than imported.
 *
 * A 24-unit grid rendered at 16px puts a 1.5-unit stroke at exactly one
 * device pixel, which is the whole design language — hairlines, square
 * corners, no fill. `currentColor` means they inherit every hover and
 * disabled state already on the button, so an icon never has to be styled
 * twice.
 *
 * Not a dependency: an icon set would be several hundred kilobytes to use
 * a handful of glyphs, and AGENTS.md rules out new packages without asking.
 * Not Unicode dingbats either — ✎ and friends render as colour emoji on
 * Windows, and this project has no emoji in it.
 */
const Glyph = ({
  children,
  filled = false,
}: {
  children: ReactNode;
  /**
   * Solid shapes instead of outlines. For the density bars: a 3-unit column
   * drawn as an outline is two hairlines almost touching, which at 16px is
   * mud. Filled, it stays a column.
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

/** A pencil, for correcting a wall label. */
export const EditIcon = () => (
  <Glyph>
    <path d="M4 20v-4L16 4l4 4L8 20H4Z" />
    <path d="M13 7l4 4" />
  </Glyph>
);

/** Two stacked frames, for the sets a piece belongs to. */
export const CollectionsIcon = () => (
  <Glyph>
    <path d="M3 8h13v13H3z" />
    <path d="M8 8V3h13v13h-5" />
  </Glyph>
);

/** A box with the work going into it: withdrawn from the wall, kept. */
export const WaiveIcon = () => (
  <Glyph>
    <path d="M3 7h18v4H3z" />
    <path d="M5 11v10h14V11" />
    <path d="M12 13v5M9.5 15.5 12 18l2.5-2.5" />
  </Glyph>
);

/** The same box, the other way: back onto the wall. */
export const RestoreIcon = () => (
  <Glyph>
    <path d="M3 7h18v4H3z" />
    <path d="M5 11v10h14V11" />
    <path d="M12 18v-5M9.5 15.5 12 13l2.5 2.5" />
  </Glyph>
);

/** Lines with a handle beside them: reordering, which is what Arrange does. */
export const ArrangeIcon = () => (
  <Glyph>
    <path d="M10 6h11M10 12h11M10 18h11" />
    <path d="M5 4v16M2.5 6.5 5 4l2.5 2.5M2.5 17.5 5 20l2.5-2.5" />
  </Glyph>
);

/*
 * Grid density, drawn as the columns it produces — two wide, three, then
 * four narrow. The control is about how much room each piece gets, and
 * columns say that faster than any label does.
 */

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

/** A bin. Only ever paired with the danger token. */
export const DeleteIcon = () => (
  <Glyph>
    <path d="M4 6h16" />
    <path d="M9 6V3h6v3" />
    <path d="M6 6v15h12V6" />
    <path d="M10 10v7M14 10v7" />
  </Glyph>
);

/*
 * The detail view's glyphs.
 *
 * Arrows to the corners rather than a magnifier: the button opens a window,
 * and the zooming only starts once you are inside it. A magnifier would
 * promise the wrong verb.
 */
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

/** A frame with the work sized to fit it: back to the whole piece. */
export const FitIcon = () => (
  <Glyph>
    <path d="M3 3h18v18H3z" />
    <path d="M8 8h8v8H8z" />
  </Glyph>
);

/** Corners only — the browser chrome goes away, the frame stays. */
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

/** Dismiss. A drawn glyph rather than a &times;, so it lines up with the rest. */
export const CloseIcon = () => (
  <Glyph>
    <path d="M5 5l14 14M19 5L5 19" />
  </Glyph>
);
