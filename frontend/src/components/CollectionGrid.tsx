import type { CollectionSummary } from '../types';
import { CollectionCard } from './CollectionCard';

// On a phone the grid costs a card's height per row of collections, before
// the pieces. As a row it costs one, the next card peeking in.
// `overscroll-x-contain` so a flick that runs out of cards stays here rather
// than reaching the browser's swipe-back.
const ROW =
  'phone:flex phone:snap-x phone:snap-mandatory phone:overflow-x-auto ' +
  'phone:overscroll-x-contain';
// Out to the screen's edges, which only works where nothing clips it.
const BLEED = 'phone:-mx-gutter phone:scroll-px-gutter phone:px-gutter';
const ROW_ITEM = 'phone:w-[min(280px,72vw)] phone:shrink-0 phone:snap-start';

/** `index` only picks which gradient swatch a coverless collection draws, so
    the landing row and the index cycle through them independently. */
export const CollectionGrid = ({
  collections,
  origin,
  numbered = false,
  row,
}: {
  collections: CollectionSummary[];
  origin?: string;
  /** Each card's position on an accent badge, for the curation preview. */
  numbered?: boolean;
  /** A sideways-scrolling row on a phone, for a list the pieces come after.
      `inset` stays inside its box, for a row in a clipper that would cut the
      bleed off. */
  row?: 'edge' | 'inset';
}) => (
  <div
    className={`grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 ${row ? ROW : ''} ${row === 'edge' ? BLEED : ''}`}
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
