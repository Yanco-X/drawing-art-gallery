import type { ReactNode } from 'react';

export const SectionHeader = ({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) => (
  <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
    <h2 className="font-serif text-[22px] font-normal text-dim">{title}</h2>
    {children}
  </div>
);
