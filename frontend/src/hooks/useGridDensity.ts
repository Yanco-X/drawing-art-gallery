import type { GridDensity } from '../types';
import { usePersistentState } from './usePersistentState';

const GRID_DENSITY_STORAGE_KEY = 'sketchyart-grid-density';

export const GRID_DENSITIES: GridDensity[] = ['airy', 'comfortable', 'dense'];

export const GRID_DENSITY_LABELS: Record<GridDensity, string> = {
  airy: 'Airy',
  comfortable: 'Comfortable',
  dense: 'Dense',
};

/**
 * Ideal card width per density, as the CSS `columns` shorthand. A bare
 * length sets `column-width` and leaves `column-count` auto, so the browser
 * fits as many columns as the container allows and the count follows the
 * window without a single media query.
 *
 * Density therefore means "how wide should a piece be", not "how many
 * across" — which is what lets one setting hold on a laptop and a 32-inch
 * monitor at once. These previously carried a count as well (3/4/5), which
 * capped the grid: a wider window only made each card bigger, never added a
 * column, so the whole gallery looked identical on every screen above the
 * content cap.
 *
 * Roughly what they resolve to, at a 64px gutter and a 20px column gap:
 *
 *            1792px (laptop)   2272px (at the 2400px cap)
 *   airy          4                 5
 *   comfortable   5                 7
 *   dense         7                 9
 *
 * Below about 1200px two densities can land on the same count. That is
 * expected, and `useFlipReflow` skips the animation when nothing moved.
 */
export const GRID_DENSITY_COLUMNS: Record<GridDensity, string> = {
  airy: '380px',
  comfortable: '290px',
  dense: '230px',
};

const isGridDensity = (value: unknown): value is GridDensity =>
  typeof value === 'string' &&
  (GRID_DENSITIES as string[]).includes(value);

export const useGridDensity = () =>
  usePersistentState<GridDensity>(
    GRID_DENSITY_STORAGE_KEY,
    'comfortable',
    isGridDensity,
  );
