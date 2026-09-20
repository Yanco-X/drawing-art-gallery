// As many columns as fit at their narrowest; the same count CSS multi-column
// arrived at, so no density changes its column count by moving to this.
export const columnCount = (width: number, narrowest: number, gap: number) =>
  Math.max(1, Math.floor((width + gap) / (narrowest + gap)));

// A column this narrow is where a denser setting stops earning one more: a
// phone held upright stays at a single column whatever the setting.
const STEP_FLOOR = 200;

// The densities from the loosest to the one chosen, each at least a column
// more than the one before while columns stay STEP_FLOOR wide. Fit alone
// gives two settings the same wall at some widths -- a phone on its side
// had Comfortable and Dense both at two columns.
export const steppedColumnCount = (width: number, gap: number, narrowests: number[]) =>
  narrowests.reduce((count, narrowest) => {
    const fit = columnCount(width, narrowest, gap);
    const stepped = Math.max(fit, count + 1);
    return (width - gap * (stepped - 1)) / stepped >= STEP_FLOOR
      ? stepped
      : Math.max(fit, count);
  }, 0);

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
