import type { Collection } from '../types';
import { CollectionCard } from './CollectionCard';
import { InertLink } from './InertLink';
import { SectionHeader } from './SectionHeader';

export const CollectionsSection = ({
  collections,
}: {
  collections: Collection[];
}) => (
  <section
    id="collections"
    className="mx-auto w-full max-w-content px-gutter pb-section-sm"
  >
    <SectionHeader title="Collections">
      <InertLink className="text-[13px] text-faint transition-colors duration-200 hover:text-accent">
        View all
      </InertLink>
    </SectionHeader>

    {collections.length === 0 ? (
      <p className="text-[13px] text-faint">No collections yet.</p>
    ) : (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {collections.map((collection, index) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            index={index}
          />
        ))}
      </div>
    )}
  </section>
);
