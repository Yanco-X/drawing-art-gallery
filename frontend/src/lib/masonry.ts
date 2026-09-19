// As many columns as fit at their narrowest; the same count CSS multi-column
// arrived at, so no density changes its column count by moving to this.
export const columnCount = (width: number, narrowest: number, gap: number) =>
  Math.max(1, Math.floor((width + gap) / (narrowest + gap)));

// Each item goes into the shortest column, leftmost on a tie, so the order
// reads across the rows: the first `count` items are the top row at any
// width, and the first few pieces are always the first seen.
export const layMasonry = (heights: number[], count: number, gap: number) => {
  const tops = new Array<number>(count).fill(0);
  const spots = heights.map((height) => {
    const column = tops.indexOf(Math.min(...tops));
    const spot = { column, top: tops[column] };
    tops[column] += height + gap;
    return spot;
  });
  return { spots, height: Math.max(0, Math.max(...tops) - gap) };
};
