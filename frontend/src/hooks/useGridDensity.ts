import type { GridDensity } from '../types';
import { usePersistentState } from './usePersistentState';

const GRID_DENSITY_STORAGE_KEY = 'sketchyart-grid-density';

export const GRID_DENSITIES: GridDensity[] = ['airy', 'comfortable', 'dense'];

export const GRID_DENSITY_LABELS: Record<GridDensity, string> = {
  airy: 'Airy',
  comfortable: 'Comfortable',
  dense: 'Dense',
};

// The narrowest a column may be. The count is as many as fit, so it follows
// the window without a media query.
export const GRID_DENSITY_COLUMNS: Record<GridDensity, number> = {
  airy: 380,
  comfortable: 290,
  dense: 230,
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
