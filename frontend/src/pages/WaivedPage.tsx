import { AllWorkSection } from '../components/AllWorkSection';
import { PageShell } from '../components/PageShell';
import { useAsync } from '../hooks';
import { CURRENT_ROLE } from '../lib/session';
import { fetchWaivedPieces } from '../services';

/*
 * The reserve: work withdrawn from the gallery but not destroyed.
 *
 * Its own route rather than a toggle on the gallery, so the gallery query
 * stays one thing and this has a URL of its own. Deletion is only reachable
 * from here, by way of a piece's own page.
 */
const WaivedPage = () => {
  const pieces = useAsync(fetchWaivedPieces);

  if (CURRENT_ROLE !== 'owner') {
    return (
      <PageShell>
        <section className="mx-auto flex w-full max-w-content flex-col gap-6 px-gutter pt-intro-top pb-section-lg">
          <p className="text-[12px] uppercase tracking-eyebrow text-faint">
            Not found
          </p>
          <h1 className="max-w-[14em] font-serif text-[clamp(28px,4vw,48px)] leading-[1.05] font-normal text-pretty">
            There's nothing here.
          </h1>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-content px-gutter pt-intro-top pb-intro-bottom">
        <p className="mb-4 text-[12px] uppercase tracking-eyebrow text-faint">
          Off the wall
        </p>
        <h1 className="max-w-[16em] font-serif text-[clamp(28px,4vw,48px)] leading-[1.05] font-normal text-pretty text-text">
          Waived work.
        </h1>
        <p className="mt-4 max-w-[42em] text-[14px] leading-relaxed text-muted">
          Withdrawn from the gallery and kept. Restore a piece to put it back,
          or delete it to remove it and its files for good.
        </p>
      </section>

      <AllWorkSection
        title="In the reserve"
        pieces={pieces.status === 'ready' ? pieces.data : []}
        loading={pieces.status === 'loading'}
        error={pieces.status === 'error' ? pieces.message : undefined}
        emptyMessage="Nothing waived."
      />
    </PageShell>
  );
};

export default WaivedPage;
