import { useMemo, useState } from 'react';
import { CollectionGrid } from '../components/CollectionGrid';
import { NewCollectionDialog } from '../components/NewCollectionDialog';
import { PageShell } from '../components/PageShell';
import { SectionState } from '../components/SectionState';
import { ICON_BUTTON_ACCENT } from '../components/form-styles';
import { useAsync, useSession } from '../hooks';
import { collectionsFor } from '../services';
import type { CollectionSummary } from '../types';

const CollectionsIndexPage = () => {
  const { role } = useSession();
  const loadCollections = useMemo(() => collectionsFor(role), [role]);
  const collections = useAsync(loadCollections);
  const isOwner = role === 'owner';

  // Collections created since this page loaded. The response is the
  // collection the API just built, cover and count included, so this only
  // saves a refetch to put it on screen.
  const [made, setMade] = useState<CollectionSummary[]>([]);
  const [making, setMaking] = useState(false);

  const ready = [
    ...made,
    ...(collections.status === 'ready' ? collections.data : []),
  ];

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-content px-gutter pt-intro-top pb-intro-bottom">
        <p className="mb-4 text-[12px] uppercase tracking-eyebrow text-faint">
          Sets
        </p>
        <h1 className="max-w-[16em] font-serif text-[clamp(28px,4vw,48px)] leading-[1.05] font-normal text-pretty text-text">
          Collections.
        </h1>
        <p className="mt-4 max-w-[42em] text-[14px] leading-relaxed text-muted">
          Work grouped into sets. Each one hangs in the order it was curated.
        </p>

        {isOwner && (
          <button
            type="button"
            onClick={() => setMaking(true)}
            className={`${ICON_BUTTON_ACCENT} mt-6`}
          >
            + New collection
          </button>
        )}
      </section>

      <section className="mx-auto w-full max-w-content px-gutter pb-section-lg">
        {collections.status === 'error' ? (
          <SectionState message={collections.message} />
        ) : collections.status === 'loading' ? (
          <SectionState message="Loading collections…" />
        ) : ready.length === 0 ? (
          <SectionState message="No collections yet." />
        ) : (
          <CollectionGrid collections={ready} />
        )}
      </section>

      {isOwner && (
        <NewCollectionDialog
          open={making}
          onClose={() => setMaking(false)}
          onCreated={(collection) => {
            setMade((now) => [collection, ...now]);
            setMaking(false);
          }}
        />
      )}
    </PageShell>
  );
};

export default CollectionsIndexPage;
