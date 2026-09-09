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

/*
 * Tags are searched by the filter's text field but have no control of their
 * own yet. Typing a tag name finds its pieces, which is most of what
 * `STATUS.md` section 10 wanted from tag filtering; a checkbox list of tags
 * is the obvious next criterion.
 */
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
  /** Set when the fetch failed; takes precedence over the empty state. */
  error?: string;
  title?: string;
  emptyMessage?: string;
  /**
   * Passing this turns the filter on, and supplies its collections
   * criterion. Omitted by the collection page and the reserve, which show a
   * set that is already narrowed.
   */
  collections?: CollectionSummary[];
  /**
   * Offers the sort control. Separate from `collections` because the two
   * are independent: a collection sorts but does not filter by collection.
   */
  sortable?: boolean;
  /**
   * The collection whose pieces these are. Threaded to the cards so the
   * piece page can walk this set rather than the whole gallery.
   */
  origin?: string;
}) => {
  const [density, setDensity] = useGridDensity();

  /*
   * How this list was last left. Read once, during render, and handed to the
   * hooks as their initial state -- so coming back from a piece renders the
   * narrowed, sorted list in one pass instead of showing the whole gallery
   * for a frame and then correcting itself.
   *
   * A pure map lookup, which is what makes it safe to read here rather than
   * in an effect.
   */
  const { pathname } = useLocation();
  const remembered = readListState(pathname);

  // Both bars keep the position they were left in, for the same reason the
  // controls keep their values: shutting them while the reader was away
  // would be tidying up after them.
  const [filterOpen, setFilterOpen] = useState(remembered?.filterOpen ?? false);
  const [sortOpen, setSortOpen] = useState(remembered?.sortOpen ?? false);

  const filter = useGalleryFilter(pieces, collections ?? [], remembered);
  const filtering = collections !== undefined;
  const narrowed = filtering ? filter.filtered : pieces;
  // Sorted after narrowing rather than before: the same answer either way,
  // over fewer rows.
  const sort = useGallerySort(
    narrowed,
    remembered && { key: remembered.sortKey, direction: remembered.sortDirection },
  );
  const shown = sortable ? sort.sorted : narrowed;

  // Written back whenever a control moves, so leaving is never a step the
  // reader has to remember to take.
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
  // The grid reserves its height from stored aspect ratios, so the page is
  // its full height as soon as the pieces render -- which is what makes a
  // remembered scroll position mean anything.
  const marked = useReturnMemory(!loading && !error && pieces.length > 0);

  return (
    <section className="mx-auto w-full max-w-content px-gutter pb-section-lg">
      <SectionHeader title={title}>
        {/* Hidden until there is something to arrange or narrow. */}
        {pieces.length > 0 && (
          <div className="flex items-center gap-3">
            {/* The options open leftwards from here into the empty middle of
                the row, which is why this cluster and not a panel: the far
                item of a `space-between` row is pinned to the right edge, so
                widening it moves its left edge and nothing else. */}
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

      {/* Beneath the whole header rather than under its button, so opening
          the filter pushes the gallery down instead of covering it. */}
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
        /* Narrowed to nothing is not the same absence as an empty gallery,
           and the way out is named rather than left to be guessed at. */
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
