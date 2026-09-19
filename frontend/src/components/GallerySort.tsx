import { useId } from 'react';
import type { SortDirection, SortKey } from '../lib/sortPieces';
import { SortIcon } from './icons';

const label = (key: SortKey, active: boolean, direction: SortDirection) => {
  if (key === 'title') return direction === 'asc' || !active ? 'A–Z' : 'Z–A';
  const noun = key === 'year' ? 'Year' : 'Last upload';
  return active ? `${noun} ${direction === 'desc' ? '↓' : '↑'}` : noun;
};

const OPTIONS: SortKey[] = ['year', 'title', 'added'];

const OPTION =
  'cursor-pointer border bg-transparent px-3 py-2 text-[12px] uppercase ' +
  'tracking-btn whitespace-nowrap transition-colors duration-200';

const optionClass = (on: boolean) =>
  `${OPTION} ${
    on
      ? 'border-accent text-accent'
      : 'border-line text-muted hover:border-accent hover:text-accent'
  }`;

/*
 * One component rather than the filter's split pair: these two are neighbours
 * in the DOM, which is what lets the options grow into the row instead of over
 * the gallery. Rendered whether or not it is open, so closing can be animated,
 * and `inert` while shut so its buttons leave the tab order. Open is owned
 * above, so it can be remembered with the rest of the list's state.
 */
export const GallerySort = ({
  sortKey,
  direction,
  onChoose,
  onClear,
  active,
  open,
  onToggle,
}: {
  sortKey: SortKey | null;
  direction: SortDirection;
  onChoose: (key: SortKey) => void;
  onClear: () => void;
  active: boolean;
  open: boolean;
  onToggle: () => void;
}) => {
  const id = useId();

  return (
    <div className="flex items-center">
      {/* No display utility on this element: `.sort-row` needs its `grid`. */}
      <div id={id} data-open={open} className="sort-row" inert={!open}>
        <div>
          <div className="flex items-center gap-2 pr-3 whitespace-nowrap">
            {/* The order the list arrives in: the owner's, for the gallery
                and for a collection alike. */}
            <button
              type="button"
              onClick={onClear}
              aria-pressed={!active}
              className={optionClass(!active)}
            >
              Curated
            </button>
            {OPTIONS.map((option) => {
              const on = sortKey === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChoose(option)}
                  aria-pressed={on}
                  className={optionClass(on)}
                >
                  {label(option, on, direction)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className={
          'flex shrink-0 cursor-pointer items-center justify-center gap-2 ' +
          'border bg-transparent px-3 py-2 text-[12px] uppercase ' +
          'tracking-btn transition-colors duration-200 ' +
          (active || open
            ? 'border-accent text-accent'
            : 'border-line text-muted hover:border-accent hover:text-accent')
        }
      >
        <SortIcon />
        Sort
      </button>
    </div>
  );
};
