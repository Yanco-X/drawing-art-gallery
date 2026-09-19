type Identified = { id: string };

export const sameOrder = (a: Identified[], b: Identified[]) =>
  a.length === b.length && a.every((item, index) => item.id === b[index].id);

// The named items, in the order they already stand, lifted out and set down
// together so the first of them lands at `at` in the result.
export const place = <T extends Identified>(
  items: T[],
  ids: ReadonlySet<string>,
  at: number,
): T[] => {
  const moving = items.filter((item) => ids.has(item.id));
  const staying = items.filter((item) => !ids.has(item.id));
  const landing = Math.max(0, Math.min(at, staying.length));
  return [...staying.slice(0, landing), ...moving, ...staying.slice(landing)];
};

// A drop just before `index` counts positions with the moving items already
// lifted out, which is what `place` expects.
export const landingBefore = (
  items: Identified[],
  ids: ReadonlySet<string>,
  index: number,
) => index - items.slice(0, index).filter((item) => ids.has(item.id)).length;

// Returned unchanged for a no-op or out-of-bounds move, so a caller can
// compare by identity to tell whether anything actually moved.
export const move = <T>(items: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [lifted] = next.splice(from, 1);
  next.splice(to, 0, lifted);
  return next;
};
