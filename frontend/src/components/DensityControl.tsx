import type { ReactNode } from 'react';
import { GRID_DENSITIES, GRID_DENSITY_LABELS } from '../hooks/useGridDensity';
import type { GridDensity } from '../types';
import {
  DensityAiryIcon,
  DensityComfortableIcon,
  DensityDenseIcon,
} from './icons';

/** Each density drawn as the columns it produces. */
const GRID_DENSITY_ICONS: Record<GridDensity, ReactNode> = {
  airy: <DensityAiryIcon />,
  comfortable: <DensityComfortableIcon />,
  dense: <DensityDenseIcon />,
};

interface DensityControlProps {
  value: GridDensity;
  onChange: (density: GridDensity) => void;
}

/**
 * Not in the original design — the prototype exposed density as a
 * developer knob with no UI. Built in the tag-chip idiom (12px, same
 * padding and tracking, accent fill when active) but as one bordered group
 * with hairline dividers, so it reads as a single control rather than as
 * three more filters sitting next to the tags.
 */
export const DensityControl = ({ value, onChange }: DensityControlProps) => (
  <div
    role="group"
    aria-label="Grid density"
    className="flex border border-line"
  >
    {GRID_DENSITIES.map((density, index) => (
      <button
        key={density}
        type="button"
        onClick={() => onChange(density)}
        aria-pressed={density === value}
        // Named explicitly: the label is display:none below 640px, which
        // takes it away from a screen reader as well as from the screen.
        aria-label={GRID_DENSITY_LABELS[density]}
        title={GRID_DENSITY_LABELS[density]}
        className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[12px] tracking-nav transition-colors duration-200 ${
          index > 0 ? 'border-l border-line' : ''
        } ${
          density === value
            ? 'bg-accent text-on-accent'
            : 'text-muted hover:text-accent'
        }`}
      >
        {GRID_DENSITY_ICONS[density]}
        {/* Label hidden on the narrowest screens, where this control shares
            a row with the section heading and the icons carry it alone. */}
        <span className="hidden sm:inline">
          {GRID_DENSITY_LABELS[density]}
        </span>
      </button>
    ))}
  </div>
);
