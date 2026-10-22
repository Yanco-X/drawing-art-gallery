import type { useGalleryFilter } from '../hooks';
import { FIELD, LABEL, SUBTLE_ACTION } from './form-styles';
import { MultiSelect } from './MultiSelect';

export const PieceFilters = ({
  id,
  filter,
  total,
}: {
  id: string;
  filter: ReturnType<typeof useGalleryFilter>;
  total: number;
}) => (
  <div className="flex flex-col gap-4 border-t border-line pt-4">
    <div className="flex items-baseline justify-between gap-3">
      <span className={LABEL}>Filter</span>
      {filter.active && (
        <button type="button" onClick={filter.clear} className={SUBTLE_ACTION}>
          Clear
        </button>
      )}
    </div>

    <div className="flex flex-col gap-2">
      <label htmlFor={id + '-query'} className="sr-only">
        Search
      </label>
      <input
        id={id + '-query'}
        type="search"
        value={filter.query}
        onChange={(event) => filter.setQuery(event.target.value)}
        placeholder="Title, medium, tag…"
        className={FIELD}
      />
    </div>

    {filter.availableYears.length > 0 && (
      <MultiSelect
        sizing=""
        label="Year"
        placeholder="Any year"
        options={filter.availableYears.map((year) => ({
          value: String(year),
          label: String(year),
        }))}
        selected={filter.years.map(String)}
        onToggle={(value) => filter.toggleYear(Number(value))}
        summarise={(count) => `${count} years`}
      />
    )}

    {filter.availableTags.length > 0 && (
      <MultiSelect
        sizing=""
        label="Tags"
        placeholder="Any tag"
        options={filter.availableTags.map((tag) => ({ value: tag.id, label: tag.name }))}
        selected={filter.tagIds}
        onToggle={filter.toggleTag}
        summarise={(count) => `${count} tags`}
      />
    )}

    <p className="text-[12px] text-faint">
      {filter.filtered.length === total
        ? `${total} ${total === 1 ? 'piece' : 'pieces'}`
        : `${filter.filtered.length} of ${total} shown`}
    </p>
  </div>
);
