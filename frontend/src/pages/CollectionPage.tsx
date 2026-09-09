import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AllWorkSection } from '../components/AllWorkSection';
import { CollectionArrange } from '../components/CollectionArrange';
import { CollectionOwnerActions } from '../components/CollectionOwnerActions';
import { PageMessage } from '../components/PageMessage';
import { PageShell } from '../components/PageShell';
import { useAsync, useSession } from '../hooks';
import { ICON_BUTTON } from '../components/form-styles';
import {
  HOME_ORIGIN,
  ORIGIN_PARAM,
  nearestStep,
  readTrail,
  serialiseTrail,
} from '../lib/origin';
import { fetchCollection } from '../services';
import type { Collection } from '../types';

const BackLink = () => (
  <Link to="/collections" className={`${ICON_BUTTON} w-fit`}>
    ← Collections
  </Link>
);

/**
 * Where back goes, when a collection can be reached two ways.
 *
 * The index is always offered, because a set always belongs to the list of
 * sets. The gallery is offered as well when that is where the reader came
 * from -- landing on the collections index after arriving from the landing
 * page is the kind of small displacement that makes a site feel like it
 * moved under you.
 *
 * It is not offered otherwise. Someone who came through the header's
 * Collections item has no gallery to go back to, and a button claiming
 * otherwise would be inventing a history they do not have.
 *
 * Gallery sits first because it is the truer "back" when it is there at
 * all; the index is the step up rather than the step back.
 */
const BackRow = ({ fromHome }: { fromHome: boolean }) => (
  <div className="flex flex-wrap items-center gap-2">
    {fromHome && (
      <Link to="/home" className={`${ICON_BUTTON} w-fit`}>
        ← Gallery
      </Link>
    )}
    <BackLink />
  </div>
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
  const [params] = useSearchParams();
  // Where this page was reached from, and what it hands on. A piece opened
  // here inherits this trail with this collection appended, so its own back
  // link can return the reader here with the gallery still behind it.
  const trail = useMemo(
    () => readTrail(params.get(ORIGIN_PARAM)),
    [params],
  );
  const fromHome = nearestStep(trail) === HOME_ORIGIN;

  const { role } = useSession();

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

  const isOwner = role === 'owner';

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-content px-gutter pt-8 pb-intro-bottom">
        {/* Back and the owner's actions share one row above the label, the
            same shape the piece page uses for back and neighbours. */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <BackRow fromHome={fromHome} />
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
          sortable
          origin={serialiseTrail([...trail, collection.slug])}
        />
      )}
    </PageShell>
  );
};

export default CollectionPage;
