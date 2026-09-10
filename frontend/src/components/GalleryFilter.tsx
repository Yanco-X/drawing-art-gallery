import type { CollectionSummary } from '../types';
import { FIELD, ICON_BUTTON, LABEL } from './form-styles';
import { CloseIcon, FilterIcon } from './icons';
import { MultiSelect } from './MultiSelect';

/*
 * Separate from the row because the two are not neighbours in the DOM: the
 * button sits in the section header, the row opens beneath the whole header.
 * `AllWorkSection` holds the flag that joins them.
 */
export const GalleryFilterButton = ({
  open,
  onToggle,
  controls,
  active,
  showing,
  total,
}: {
  open: boolean;
  onToggle: () => void;
  controls: string;
  active: boolean;
  showing: number;
  total: number;
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={open}
    aria-controls={controls}
    className={
      'flex cursor-pointer items-center justify-center gap-2 border ' +
      'bg-transparent px-3 py-2 text-[12px] uppercase tracking-btn ' +
      'transition-colors duration-200 ' +
      (active || open
        ? 'border-accent text-accent'
        : 'border-line text-muted hover:border-accent hover:text-accent')
    }
  >
    <FilterIcon />
    Filter
    {active && <span>· {showing === total ? total : showing}</span>}
  </button>
);

/*
 * Rendered whether or not it is open, so closing can be animated and a typed
 * query survives being hidden. `inert` while closed keeps its controls out of
 * the tab order and out of hit testing.
 */
export const GalleryFilterRow = ({
  id,
  open,
  query,
  onQueryChange,
  years,
  availableYears,
  onToggleYear,
  collections,
  collectionIds,
  onToggleCollection,
  showing,
  total,
  active,
  onClear,
}: {
  id: string;
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  years: number[];
  availableYears: number[];
  onToggleYear: (year: number) => void;
  collections: CollectionSummary[];
  collectionIds: string[];
  onToggleCollection: (id: string) => void;
  showing: number;
  total: number;
  active: boolean;
  onClear: () => void;
}) => (
  // No display utility on this element: `.filter-row` needs the `grid` it
  // sets, and utilities cascade after components.
  <div id={id} data-open={open} className="filter-row" inert={!open}>
    <div>
      <div className="mb-8 flex flex-wrap items-end gap-x-8 gap-y-5 border border-line bg-surface p-5">
        <div className="w-full max-w-[280px] min-w-[200px] flex-1">
          <label htmlFor={id + '-query'} className={LABEL + ' mb-3 block'}>
            Search
          </label>
          <input
            id={id + '-query'}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Title, medium, tag…"
            className={FIELD}
          />
        </div>

        {availableYears.length > 0 && (
          <MultiSelect
            label="Year"
            placeholder="Any year"
            options={availableYears.map((year) => ({
              value: String(year),
              label: String(year),
            }))}
            selected={years.map(String)}
            onToggle={(value) => onToggleYear(Number(value))}
            summarise={(count) => `${count} years`}
          />
        )}

        {collections.length > 0 && (
          <MultiSelect
            label="Collections"
            placeholder="Any collection"
            options={collections.map((collection) => ({
              value: collection.id,
              label: collection.name,
              hint: String(collection.pieceCount),
            }))}
            selected={collectionIds}
            onToggle={onToggleCollection}
            summarise={(count) => `${count} collections`}
          />
        )}

        <div className="ml-auto flex items-center gap-4">
          <p className="text-[12px] text-faint">
            {showing === total
              ? `${total} ${total === 1 ? 'piece' : 'pieces'}`
              : `${showing} of ${total} shown`}
          </p>
          {active && (
            <button type="button" onClick={onClear} className={ICON_BUTTON}>
              <CloseIcon />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);
