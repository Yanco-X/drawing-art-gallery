import type { CollectionSummary } from '../types';
import { CollectionCard } from './CollectionCard';

// Below 640px the grid is one column, a card's height per collection. As a
// row it costs one card's height, edge to edge, the next card peeking in.
const ROW =
  'max-sm:-mx-gutter max-sm:flex max-sm:snap-x max-sm:snap-mandatory ' +
  'max-sm:overflow-x-auto max-sm:scroll-px-gutter max-sm:px-gutter';
const ROW_ITEM = 'max-sm:w-[min(280px,72vw)] max-sm:shrink-0 max-sm:snap-start';

/** `index` only picks which gradient swatch a coverless collection draws, so
    the landing row and the index cycle through them independently. */
export const CollectionGrid = ({
  collections,
  origin,
  numbered = false,
  row = false,
}: {
  collections: CollectionSummary[];
  origin?: string;
  /** Each card's position on an accent badge, for the curation preview. */
  numbered?: boolean;
  /** A sideways-scrolling row below 640px, for a list the pieces come after. */
  row?: boolean;
}) => (
  <div
    className={`grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 ${row ? ROW : ''}`}
  >
    {collections.map((collection, index) => (
      <div
        key={collection.id}
        className={`relative grid ${row ? ROW_ITEM : ''}`}
      >
        <CollectionCard
          collection={collection}
          index={index}
          origin={origin}
        />
        {numbered && (
          <span className="absolute top-2 left-2 flex h-6 min-w-6 items-center justify-center bg-accent px-1 text-[12px] leading-none text-on-accent">
            {index + 1}
          </span>
        )}
      </div>
    ))}
  </div>
);
