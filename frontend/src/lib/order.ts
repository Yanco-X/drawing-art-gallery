// Returned unchanged for a no-op or out-of-bounds move, so a caller can
// compare by identity to tell whether anything actually moved.
export const move = <T>(items: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [lifted] = next.splice(from, 1);
  next.splice(to, 0, lifted);
  return next;
};
