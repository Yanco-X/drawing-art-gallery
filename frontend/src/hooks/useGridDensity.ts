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
 * CSS `columns` shorthand per density: <count> <min-width>. The browser
 * fits as many columns as the min-width allows, capped at the count, so
 * these reflow on their own without media queries.
 *
 * Retuned from the prototype's 3/380 · 4/320 · 5/300. Those were written
 * without reference to the 1400px content cap: inside it the grid only has
 * ~1272px, where 4×320 and 5×300 both overflow and collapse back to three
 * columns — so airy, comfortable and dense all rendered identically. These
 * widths give a real 3 / 4 / 5 split at full width and stay distinct down
 * to roughly a 1200px viewport.
 */
export const GRID_DENSITY_COLUMNS: Record<GridDensity, string> = {
  airy: '3 380px',
  comfortable: '4 290px',
  dense: '5 230px',
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
