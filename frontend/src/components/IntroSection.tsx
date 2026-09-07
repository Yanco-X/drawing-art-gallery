/*
 * The gallery's own line, under the spotlight band.
 *
 * Its padding and type step are local rather than the shared `intro-top` /
 * `intro-bottom` tokens and the display size. Those are spent on six other
 * headings -- the collection, collections index, piece, waived and message
 * pages -- and this only wants to be quieter where it follows the band.
 */
export const IntroSection = () => (
  <section className="mx-auto w-full max-w-content px-gutter pt-[clamp(18px,2.2vw,32px)] pb-[clamp(16px,2vw,28px)]">
    <p className="mb-2.5 text-[12px] uppercase tracking-eyebrow text-faint">
      A personal gallery
    </p>
    <h1 className="max-w-[14em] font-serif text-[clamp(22px,2.6vw,34px)] leading-[1.05] font-normal text-pretty">
      Drawings, kept quietly in one place.
    </h1>
  </section>
);
