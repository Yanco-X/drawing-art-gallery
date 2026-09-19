import type { CollectionSummary } from '../types';
import { CollectionCard } from './CollectionCard';

/** `index` only picks which gradient swatch a coverless collection draws, so
    the landing row and the index cycle through them independently. */
export const CollectionGrid = ({
  collections,
  origin,
  numbered = false,
}: {
  collections: CollectionSummary[];
  origin?: string;
  /** Each card's position on an accent badge, for the curation preview. */
  numbered?: boolean;
}) => (
  <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
    {collections.map((collection, index) => (
      <div key={collection.id} className="relative grid">
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
