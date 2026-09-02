import { PageShell } from '../components/PageShell';

/*
 * A placeholder with a route.
 *
 * Tags are real in the database and can be set on upload and on edit, but
 * nothing reads them: there is no filtering and no tag view. The nav item
 * pointed at `#` and did nothing, which is worse than a page that says so —
 * a link that swallows the click reads as a bug rather than as unfinished
 * work.
 *
 * What belongs here has not been decided. See STATUS.md §10.
 */
const TagsPage = () => (
  <PageShell>
    <section className="mx-auto w-full max-w-content px-gutter pt-intro-top pb-intro-bottom">
      <p className="mb-4 text-[12px] uppercase tracking-eyebrow text-faint">
        In progress
      </p>
      <h1 className="max-w-[16em] font-serif text-[clamp(28px,4vw,48px)] leading-[1.05] font-normal text-pretty text-text">
        Tags.
      </h1>
      <p className="mt-4 max-w-[42em] text-[14px] leading-relaxed text-muted">
        Pieces carry tags, and you can set them when uploading a piece or
        editing one afterwards. Nothing reads them yet — there is no
        filtering, and no view of the work sharing a tag.
      </p>
    </section>

    <section className="mx-auto w-full max-w-content px-gutter pb-section-lg">
      {/* The same hatch that stands in for artwork that has not loaded,
          doing the same job for a page that is not built. */}
      <div className="hatch flex min-h-[280px] items-center justify-center border border-line">
        <span className="font-mono text-[11px] tracking-[0.05em] text-faint">
          [ work in progress ]
        </span>
      </div>
    </section>
  </PageShell>
);

export default TagsPage;
