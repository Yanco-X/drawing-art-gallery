import type { ReactNode } from 'react';

/** `action` is for the one absence with a way out: a gallery narrowed to
    nothing by its own filter. */
export const SectionState = ({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-wrap items-baseline gap-3">
    <p className="text-[13px] text-faint">{message}</p>
    {action}
  </div>
);
