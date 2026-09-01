import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AllWorkSection } from '../components/AllWorkSection';
import { CollectionArrange } from '../components/CollectionArrange';
import { CollectionOwnerActions } from '../components/CollectionOwnerActions';
import { PageMessage } from '../components/PageMessage';
import { PageShell } from '../components/PageShell';
import { useAsync } from '../hooks';
import { CURRENT_ROLE } from '../lib/session';
import { fetchCollection } from '../services';
import type { Collection } from '../types';

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
 * curated order reads down each column rather than across each row. Arrange
 * mode uses a plain ordered grid for exactly that reason.
 */
const CollectionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Wrapped, not inline: `useAsync` takes the loader as its dependency.
  const loadCollection = useMemo(
    () => () => fetchCollection(slug ?? ''),
    [slug],
  );
  const load = useAsync(loadCollection);

  /*
   * Every owner write returns the updated collection, so `edited` holds it
   * and no refetch is needed. Trusted only while it matches the route, which
   * keeps a stale one from surviving a move to another collection. A rename
   * does not change the slug, so this survives one.
   */
  const [edited, setEdited] = useState<Collection | null>(null);
  const [arranging, setArranging] = useState(false);

  const fetched = load.status === 'ready' ? load.data : null;
  const collection = edited && edited.slug === slug ? edited : fetched;

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
  if (collection === null) {
    return (
      <PageShell>
        <PageMessage eyebrow="Not found" headline="That collection isn't here.">
          <BackLink />
        </PageMessage>
      </PageShell>
    );
  }

  const isOwner = CURRENT_ROLE === 'owner';

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-content px-gutter pt-8 pb-intro-bottom">
        {/* Back and the owner's actions share one row above the label, the
            same shape the piece page uses for back and neighbours. */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <BackLink />
          {isOwner && !arranging && (
            <CollectionOwnerActions
              collection={collection}
              onChanged={setEdited}
              onArrange={() => setArranging(true)}
              // replace: true so Back does not return to a page that no
              // longer exists.
              onDeleted={() => navigate('/collections', { replace: true })}
            />
          )}
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

      {arranging ? (
        <section className="mx-auto w-full max-w-content px-gutter pb-section-lg">
          <CollectionArrange
            collection={collection}
            onCancel={() => setArranging(false)}
            onSaved={(saved) => {
              setEdited(saved);
              setArranging(false);
            }}
          />
        </section>
      ) : (
        <AllWorkSection
          title="In this collection"
          pieces={collection.pieces}
          emptyMessage="Nothing hangs here yet."
        />
      )}
    </PageShell>
  );
};

export default CollectionPage;
