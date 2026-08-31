/**
 * The quiet line a section shows instead of its content: loading, failed,
 * or genuinely empty. All three are 13px `faint`, matching the meta scale —
 * a section with nothing in it should not shout about it.
 */
export const SectionState = ({ message }: { message: string }) => (
  <p className="text-[13px] text-faint">{message}</p>
);
