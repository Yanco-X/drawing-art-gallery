import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
    <SectionHeader title="Collections">
      <div className="flex items-center gap-5">
        {action}
        {collections.length > 0 && (
          <Link
            to="/collections"
            className="text-[13px] text-faint transition-colors duration-200 hover:text-accent"
          >
            View all
          </Link>
        )}
      </div>
    </SectionHeader>

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
