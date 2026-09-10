import type { CollectionSummary } from '../types';
import { CollectionCard } from './CollectionCard';

/** `index` only picks which gradient swatch a coverless collection draws, so
    the landing row and the index cycle through them independently. */
export const CollectionGrid = ({
  collections,
  origin,
}: {
  collections: CollectionSummary[];
  origin?: string;
}) => (
  <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
    {collections.map((collection, index) => (
      <CollectionCard
        key={collection.id}
        collection={collection}
        index={index}
        origin={origin}
      />
    ))}
  </div>
);
