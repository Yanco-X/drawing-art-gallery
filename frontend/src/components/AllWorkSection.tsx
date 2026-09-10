import { useEffect, useId, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useGalleryFilter, useGallerySort, useReturnMemory } from '../hooks';
import { readListState, rememberListState } from '../lib/returnMemory';
import { useGridDensity } from '../hooks/useGridDensity';
import type { CollectionSummary, Piece } from '../types';
import { DensityControl } from './DensityControl';
import { ACTION } from './form-styles';
import { GalleryFilterButton, GalleryFilterRow } from './GalleryFilter';
import { GallerySort } from './GallerySort';
import { MasonryGrid } from './MasonryGrid';
import { SectionHeader } from './SectionHeader';
import { SectionState } from './SectionState';

export const AllWorkSection = ({
  pieces,
  loading = false,
  error,
  title = 'All work',
  emptyMessage = 'No work here yet.',
  collections,
  sortable = false,
  origin,
}: {
  pieces: Piece[];
  loading?: boolean;
  error?: string;
  title?: string;
  emptyMessage?: string;
  /** Passing this turns the filter on and supplies its collections criterion. */
  collections?: CollectionSummary[];
  /** Independent of `collections`: a collection sorts but does not filter
      by collection. */
  sortable?: boolean;
  /** Threaded to the cards so the piece page walks this set, not the gallery. */
  origin?: string;
}) => {
  const [density, setDensity] = useGridDensity();

  /*
   * Read once during render -- a pure map lookup -- and handed to the hooks as
   * their initial state, so a return renders narrowed and sorted in one pass.
   */
  const { pathname } = useLocation();
  const remembered = readListState(pathname);

  const [filterOpen, setFilterOpen] = useState(remembered?.filterOpen ?? false);
  const [sortOpen, setSortOpen] = useState(remembered?.sortOpen ?? false);

  const filter = useGalleryFilter(pieces, collections ?? [], remembered);
  const filtering = collections !== undefined;
  const narrowed = filtering ? filter.filtered : pieces;
  const sort = useGallerySort(
    narrowed,
    remembered && { key: remembered.sortKey, direction: remembered.sortDirection },
  );
  const shown = sortable ? sort.sorted : narrowed;

  useEffect(() => {
    rememberListState(pathname, {
      query: filter.query,
      years: filter.years,
      collectionIds: filter.collectionIds,
      sortKey: sort.key,
      sortDirection: sort.direction,
      filterOpen,
      sortOpen,
    });
  }, [
    pathname,
    filter.query,
    filter.years,
    filter.collectionIds,
    sort.key,
    sort.direction,
    filterOpen,
    sortOpen,
  ]);
  const rowId = useId() + '-filter';
  // Full height as soon as the pieces render, because the grid reserves each
  // card's height from its stored aspect ratio.
  const marked = useReturnMemory(!loading && !error && pieces.length > 0);

  return (
    <section className="mx-auto w-full max-w-content px-gutter pb-section-lg">
      <SectionHeader title={title}>
        {pieces.length > 0 && (
          <div className="flex items-center gap-3">
            {sortable && (
              <GallerySort
                sortKey={sort.key}
                direction={sort.direction}
                onChoose={sort.choose}
                onClear={sort.clear}
                active={sort.active}
                open={sortOpen}
                onToggle={() => setSortOpen((was) => !was)}
              />
            )}
            {filtering && (
              <GalleryFilterButton
                open={filterOpen}
                onToggle={() => setFilterOpen((was) => !was)}
                controls={rowId}
                active={filter.active}
                showing={shown.length}
                total={pieces.length}
              />
            )}
            <DensityControl value={density} onChange={setDensity} />
          </div>
        )}
      </SectionHeader>

      {filtering && pieces.length > 0 && (
        <GalleryFilterRow
          id={rowId}
          open={filterOpen}
          query={filter.query}
          onQueryChange={filter.setQuery}
          years={filter.years}
          availableYears={filter.availableYears}
          onToggleYear={filter.toggleYear}
          collections={collections}
          collectionIds={filter.collectionIds}
          onToggleCollection={filter.toggleCollection}
          showing={shown.length}
          total={pieces.length}
          active={filter.active}
          onClear={filter.clear}
        />
      )}

      {error ? (
        <SectionState message={error} />
      ) : loading ? (
        <SectionState message="Loading work…" />
      ) : pieces.length === 0 ? (
        <SectionState message={emptyMessage} />
      ) : shown.length === 0 ? (
        /* Narrowed to nothing is not an empty gallery, so the way out is named. */
        <SectionState
          message="No work matches these filters."
          action={
            <button type="button" onClick={filter.clear} className={ACTION + ' text-accent hover:opacity-80'}>
              Clear filters
            </button>
          }
        />
      ) : (
        <MasonryGrid
          pieces={shown}
          density={density}
          origin={origin}
          marked={marked}
        />
      )}
    </section>
  );
};
