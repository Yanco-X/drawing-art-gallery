import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AllWorkSection } from '../components/AllWorkSection';
import { PageMessage } from '../components/PageMessage';
import { PageShell } from '../components/PageShell';
import { useAsync } from '../hooks';
import { fetchCollection } from '../services';

const BackLink = () => (
  <Link
    to="/collections"
    className="text-[13px] uppercase tracking-btn text-faint transition-colors duration-200 hover:text-accent"
  >
    ← Collections
  </Link>
);

/**
 * One collection: a wall label for the set, then the work it holds.
 *
 * Pieces come back in `display_order` and are rendered in it. Note the
 * caveat in `MasonryGrid` — CSS multi-column fills top-to-bottom, so a
 * curated order reads down each column rather than across each row.
 */
const CollectionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  // Wrapped, not inline: `useAsync` takes the loader as its dependency.
  const loadCollection = useMemo(
    () => () => fetchCollection(slug ?? ''),
    [slug],
  );
  const load = useAsync(loadCollection);

  if (load.status === 'loading') {
    return (
      <PageShell>
        <section className="mx-auto w-full max-w-content px-gutter pt-intro-top pb-section-lg">
          <p className="text-[12px] uppercase tracking-eyebrow text-faint">
            Loading
          </p>
        </section>
      </PageShell>
    );
  }

  if (load.status === 'error') {
    return (
      <PageShell>
        <PageMessage eyebrow="Unavailable" headline={load.message}>
          <BackLink />
        </PageMessage>
      </PageShell>
    );
  }

  // Null rather than a rejection: a collection that does not exist, or is a
  // draft while we are not the owner, is an expected answer for this page.
  if (load.data === null) {
    return (
      <PageShell>
        <PageMessage eyebrow="Not found" headline="That collection isn't here.">
          <BackLink />
        </PageMessage>
      </PageShell>
    );
  }

  const collection = load.data;

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-content px-gutter pt-8 pb-intro-bottom">
        <div className="mb-8">
          <BackLink />
        </div>

        <p className="mb-4 text-[12px] uppercase tracking-eyebrow text-faint">
          {collection.isPublic ? 'Collection' : 'Collection · Private'}
        </p>
        <h1 className="max-w-[16em] font-serif text-[clamp(28px,4vw,48px)] leading-[1.05] font-normal text-pretty text-text">
          {collection.name}
        </h1>
        {collection.description && (
          <p className="mt-4 max-w-[42em] text-[14px] leading-relaxed text-muted">
            {collection.description}
          </p>
        )}
        <p className="mt-4 text-[12px] uppercase tracking-nav text-faint">
          {collection.pieceCount}{' '}
          {collection.pieceCount === 1 ? 'piece' : 'pieces'}
        </p>
      </section>

      <AllWorkSection
        title="In this collection"
        pieces={collection.pieces}
        emptyMessage="Nothing hangs here yet."
      />
    </PageShell>
  );
};

export default CollectionPage;
