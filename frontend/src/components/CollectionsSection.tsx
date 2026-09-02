import type { ReactNode } from 'react';
import type { CollectionSummary } from '../types';
import { CollectionGrid } from './CollectionGrid';
import { SectionHeader } from './SectionHeader';
import { SectionState } from './SectionState';

export const CollectionsSection = ({
  collections,
  loading = false,
  error,
  action,
}: {
  collections: CollectionSummary[];
  loading?: boolean;
  /** Set when the fetch failed; takes precedence over the empty state. */
  error?: string;
  /** Owner-only affordance, e.g. starting a new collection. */
  action?: ReactNode;
}) => (
  <section
    id="collections"
    className="mx-auto w-full max-w-content px-gutter pb-section-sm"
  >
    {/* No "View all" beside the action: the header's Collections nav item
        already goes to /collections, and two ways to the same page put a
        quiet link next to the one thing this section is actually offering. */}
    <SectionHeader title="Collections">{action}</SectionHeader>

    {error ? (
      <SectionState message={error} />
    ) : loading ? (
      <SectionState message="Loading collections…" />
    ) : collections.length === 0 ? (
      <SectionState message="No collections yet." />
    ) : (
      <CollectionGrid collections={collections} />
    )}
  </section>
);
