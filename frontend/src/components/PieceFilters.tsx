import { FIELD, LABEL, SUBTLE_ACTION } from './form-styles';

/**
 * Title search and a year, for narrowing a picker.
 *
 * Stacked rather than laid out in a row, because these live in the picker's
 * control column beside the name and the actions. Filtering is live: there
 * is no apply step, so the grid answers as the title is typed.
 */
export const PieceFilters = ({
  id,
  query,
  onQueryChange,
  year,
  onYearChange,
  years,
  showing,
  total,
  active,
  onClear,
}: {
  id: string;
  query: string;
  onQueryChange: (value: string) => void;
  year: string;
  onYearChange: (value: string) => void;
  /** Only the years actually present, newest first. */
  years: number[];
  showing: number;
  total: number;
  active: boolean;
  onClear: () => void;
}) => (
  <div className="flex flex-col gap-4 border-t border-line pt-4">
    <div className="flex items-baseline justify-between gap-3">
      <span className={LABEL}>Filter</span>
      {active && (
        <button type="button" onClick={onClear} className={SUBTLE_ACTION}>
          Clear
        </button>
      )}
    </div>

    <div className="flex flex-col gap-2">
      <label htmlFor={id + '-query'} className="sr-only">
        Search by title
      </label>
      <input
        id={id + '-query'}
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search titles…"
        className={FIELD}
      />
    </div>

    {years.length > 0 && (
      <div className="flex flex-col gap-2">
        <label htmlFor={id + '-year'} className="sr-only">
          Filter by year
        </label>
        <select
          id={id + '-year'}
          value={year}
          onChange={(event) => onYearChange(event.target.value)}
          className={FIELD + ' cursor-pointer'}
        >
          <option value="">Any year</option>
          {years.map((value) => (
            <option key={value} value={String(value)}>
              {value}
            </option>
          ))}
        </select>
      </div>
    )}

    <p className="text-[12px] text-faint">
      {showing === total
        ? `${total} ${total === 1 ? 'piece' : 'pieces'}`
        : `${showing} of ${total} shown`}
    </p>
  </div>
);
