import type { CollectionSummary } from '../types';
import { FIELD, ICON_BUTTON, LABEL } from './form-styles';
import { CloseIcon, FilterIcon } from './icons';
import { MultiSelect } from './MultiSelect';

/**
 * The button that opens the filter, sitting beside the "All work" heading.
 *
 * Separate from the row because the two are not neighbours in the DOM: the
 * button belongs in the section header beside the density control, and the
 * row opens beneath the whole header. `AllWorkSection` holds the flag that
 * joins them.
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
  /** The row's id, for `aria-controls`. */
  controls: string;
  active: boolean;
  showing: number;
  total: number;
}) => (
  // Outlined accent while something is filtered: the interface pointing at
  // itself, which DESIGN.md allows to repeat. Filled would claim to be the
  // action the page exists for.
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
    {/* The count, not a dot: how much is being hidden is worth knowing
        without reopening the row to find out. */}
    {active && <span>· {showing === total ? total : showing}</span>}
  </button>
);

/**
 * The criteria, as a band between the section header and the grid.
 *
 * It was a floating panel first and was changed on 2026-09-08. Functionally
 * the panel was fine; it simply covered the drawings, and on a gallery the
 * work is the one thing the interface may not sit on top of. In flow it
 * pushes the grid down instead, which costs a scroll and nothing else.
 *
 * Year and Collections are multi-select dropdowns rather than rows of
 * checkboxes: the band stays one line tall however many years the gallery
 * grows, where flat lists would have made it taller every year.
 *
 * Rendered whether or not it is open, so closing can be animated and so the
 * typed query survives being hidden -- unmounting would clear the filter
 * every time the row was shut, which is not what shutting a row means.
 * `inert` while closed keeps its controls out of the tab order and out of
 * hit testing, since collapsed content is still both.
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
  /** Only the years actually present, newest first. */
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
          {/* Every field, not just the title: medium, year, tags and the
              collections a piece is in are all things someone might have in
              mind when they start typing. */}
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

        {/* Pushed to the far end, and last in the tab order, because it
            undoes the row rather than being part of filling it in.

            An icon button rather than the 12px `SUBTLE_ACTION` it started
            as. Beside a 12px `faint` count, that treatment was the same
            weight as the number it sat next to -- two quiet strings, one of
            them secretly clickable. Given the box every other control in
            this band wears, it reads as the control it is. */}
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
