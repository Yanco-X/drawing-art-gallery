import type { CollectionSummary } from '../types';
import { CollectionCard } from './CollectionCard';
import { InertLink } from './InertLink';
import { SectionHeader } from './SectionHeader';
import { SectionState } from './SectionState';

export const CollectionsSection = ({
  collections,
  loading = false,
  error,
}: {
  collections: CollectionSummary[];
  loading?: boolean;
  /** Set when the fetch failed; takes precedence over the empty state. */
  error?: string;
}) => (
  <section
    id="collections"
    className="mx-auto w-full max-w-content px-gutter pb-section-sm"
  >
    <SectionHeader title="Collections">
      {collections.length > 0 && (
        <InertLink className="text-[13px] text-faint transition-colors duration-200 hover:text-accent">
          View all
        </InertLink>
      )}
    </SectionHeader>

    {error ? (
      <SectionState message={error} />
    ) : loading ? (
      <SectionState message="Loading collections…" />
    ) : collections.length === 0 ? (
      <SectionState message="No collections yet." />
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
