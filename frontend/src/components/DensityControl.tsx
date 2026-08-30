import { GRID_DENSITIES, GRID_DENSITY_LABELS } from '../hooks/useGridDensity';
import type { GridDensity } from '../types';

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
        className={`cursor-pointer px-3 py-1.5 text-[12px] tracking-nav transition-colors duration-200 ${
          index > 0 ? 'border-l border-line' : ''
        } ${
          density === value
            ? 'bg-accent text-on-accent'
            : 'text-muted hover:text-accent'
        }`}
      >
        {GRID_DENSITY_LABELS[density]}
      </button>
    ))}
  </div>
);
