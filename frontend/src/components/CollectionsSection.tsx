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
  origin,
}: {
  collections: CollectionSummary[];
  loading?: boolean;
  error?: string;
  action?: ReactNode;
  origin?: string;
}) => (
  <section
    id="collections"
    className="mx-auto w-full max-w-content px-gutter pb-section-sm"
  >
    <SectionHeader title="Collections">{action}</SectionHeader>

    {error ? (
      <SectionState message={error} />
    ) : loading ? (
      <SectionState message="Loading collections…" />
    ) : collections.length === 0 ? (
      <SectionState message="No collections yet." />
    ) : (
      <CollectionGrid collections={collections} origin={origin} />
    )}
  </section>
);
