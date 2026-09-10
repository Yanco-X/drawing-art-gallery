import type { ReactNode } from 'react';

export const PageMessage = ({
  eyebrow,
  headline,
  children,
}: {
  eyebrow: string;
  headline: string;
  children?: ReactNode;
}) => (
  <section className="mx-auto flex w-full max-w-content flex-col gap-6 px-gutter pt-intro-top pb-section-lg">
    <p className="text-[12px] uppercase tracking-eyebrow text-faint">
      {eyebrow}
    </p>
    <h1 className="max-w-[14em] font-serif text-[clamp(28px,4vw,48px)] leading-[1.05] font-normal text-pretty">
      {headline}
    </h1>
    {children && <div>{children}</div>}
  </section>
);
