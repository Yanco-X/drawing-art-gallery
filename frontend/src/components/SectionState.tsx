import type { ReactNode } from 'react';

/**
 * The quiet line a section shows instead of its content: loading, failed,
 * or genuinely empty. All three are 13px `faint`, matching the meta scale —
 * a section with nothing in it should not shout about it.
 *
 * `action` is for the one absence with a way out: a gallery narrowed to
 * nothing by its own filter, where the message alone would leave the reader
 * to work out that the filter is what emptied it.
 */
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
