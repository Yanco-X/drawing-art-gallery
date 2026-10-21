export type Tallied = { value: string; count: number };

// Case-blind, so "Graphite" and "graphite" count once, under the spelling
// seen first. Most frequent first.
export const tally = (values: string[]): Tallied[] => {
  const byKey = new Map<string, Tallied>();
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    const held = byKey.get(key);
    if (held) held.count += 1;
    else byKey.set(key, { value, count: 1 });
  }
  return [...byKey.values()].sort((a, b) => b.count - a.count);
};
