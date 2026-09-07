/**
 * The same item, at a different index.
 *
 * Returned unchanged when the move is a no-op or out of bounds, so a caller
 * can compare by identity to decide whether anything actually happened --
 * which is what keeps dropping a piece back where it was picked up from
 * announcing a move that never occurred.
 *
 * Shared by the two arrangers rather than copied into each: an off-by-one
 * in one copy of a splice pair is not the kind of drift that shows up in a
 * screenshot.
 */
export const move = <T>(items: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [lifted] = next.splice(from, 1);
  next.splice(to, 0, lifted);
  return next;
};
