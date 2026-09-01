import { CollectionGrid } from '../components/CollectionGrid';
import { PageShell } from '../components/PageShell';
import { SectionState } from '../components/SectionState';
import { useAsync } from '../hooks';
import { fetchVisibleCollections } from '../services';

/*
 * Every collection this caller may see — the landing row without the
 * truncation. Drafts are included for the owner and marked on the card;
 * a visitor is never told they exist.
 */
const CollectionsIndexPage = () => {
  const collections = useAsync(fetchVisibleCollections);
  const ready = collections.status === 'ready' ? collections.data : [];

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
    </PageShell>
  );
};

export default CollectionsIndexPage;
