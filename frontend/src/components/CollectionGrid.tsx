import type { CollectionSummary } from '../types';
import { CollectionCard } from './CollectionCard';

/**
 * The collections grid, shared by the landing row and the index.
 *
 * `index` only picks which gradient swatch a coverless collection draws, so
 * the two views deliberately cycle through them independently.
 */
export const CollectionGrid = ({
  collections,
}: {
  collections: CollectionSummary[];
}) => (
  <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
    {collections.map((collection, index) => (
      <CollectionCard
        key={collection.id}
        collection={collection}
        index={index}
      />
    ))}
  </div>
);
