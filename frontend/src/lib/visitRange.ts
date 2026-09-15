import type { VisitRange } from '../types';

// The API's cap on one query, so a preset never asks for more than it allows.
export const MAX_RANGE_DAYS = 366;

export const RANGE_PRESETS = [
  { label: 'Today', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '12 months', days: 365 },
];

const pad = (part: number) => String(part).padStart(2, '0');

// The local calendar date, never `toISOString`, which reports the UTC day
// and is a day off every evening west of Greenwich.
export const isoDate = (day: Date): string =>
  `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;

// YYYY-MM-DD read as a local day. `new Date(string)` would read it as UTC
// midnight and shift it a day in some zones.
export const parseDay = (date: string): Date => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const lastDays = (days: number, today = new Date()): VisitRange => {
  const from = new Date(today);
  from.setDate(today.getDate() - (days - 1));
  return { from: isoDate(from), to: isoDate(today) };
};

export const rangeDays = (range: VisitRange): number => {
  const span = parseDay(range.to).getTime() - parseDay(range.from).getTime();
  return Math.round(span / 86_400_000) + 1;
};

export const isValidRange = (range: VisitRange): boolean => {
  if (!range.from || !range.to) return false;
  const days = rangeDays(range);
  return days >= 1 && days <= MAX_RANGE_DAYS;
};

export const sameRange = (a: VisitRange, b: VisitRange): boolean =>
  a.from === b.from && a.to === b.to;

export const previousPeriodLabel = (days: number): string =>
  days === 1 ? 'the day before' : `the previous ${days} days`;

export const shortDay = (date: string): string =>
  parseDay(date).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
