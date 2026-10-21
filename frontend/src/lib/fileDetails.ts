const COLOR_MODES: Record<string, string> = {
  '1': 'Black and white, 1-bit',
  L: 'Grayscale, 8-bit',
  LA: 'Grayscale with alpha, 8-bit',
  RGB: 'Color, 8-bit',
  RGBA: 'Color with alpha, 8-bit',
  CMYK: 'CMYK',
  P: 'Indexed color',
};

/** Pillow's mode names, which are what the API stores. */
export const describeColorMode = (mode: string): string =>
  COLOR_MODES[mode] ?? (mode.startsWith('I;16') ? 'Grayscale, 16-bit' : mode);

export const describeMegapixels = (width: number, height: number): string =>
  ((width * height) / 1_000_000).toFixed(1) + ' MP';

// Phones and editors declare 72 whatever they hold, which would put a photo
// at over a metre; below this a declared dpi says nothing about paper.
const PRINT_DPI_FLOOR = 300;

export const describePrintSize = (
  width: number,
  height: number,
  dpi: number,
): string | null => {
  if (dpi < PRINT_DPI_FLOOR) return null;
  const cm = (pixels: number) => ((pixels / dpi) * 2.54).toFixed(1);
  const inches = (pixels: number) => (pixels / dpi).toFixed(1);
  return `${cm(width)} × ${cm(height)} cm · ${inches(width)} × ${inches(height)} in`;
};

export const describeUploadDay = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
