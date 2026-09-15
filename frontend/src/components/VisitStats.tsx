import type { VisitSummary } from '../types';

const compact = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const percent = (share: number) => `${Math.round(share * 100)}%`;

const delta = (now: number, before: number, against: string): string => {
  if (before === 0) return now === 0 ? 'nothing before either' : `none in ${against}`;
  const change = Math.round(((now - before) / before) * 100);
  const sign = change > 0 ? '+' : '';
  return `${sign}${change}% vs ${against}`;
};

const StatTile = ({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) => (
  <div className="flex flex-col gap-1.5 border-t border-line pt-4">
    <p className="text-[12px] uppercase tracking-eyebrow text-faint">{label}</p>
    <p className="font-sans text-[32px] leading-none font-semibold text-text">
      {value}
    </p>
    <p className="text-[12px] text-muted">{note}</p>
  </div>
);

export const VisitStats = ({
  visitors,
  devices,
  previousPeriod,
}: {
  visitors: VisitSummary['visitors'];
  devices: VisitSummary['devices'];
  previousPeriod: string;
}) => {
  const perVisitor =
    visitors.unique === 0 ? 0 : visitors.visits / visitors.unique;
  const counted = devices.mobile + devices.desktop;

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-6 lg:grid-cols-4">
      <StatTile
        label="Unique visitors"
        value={compact.format(visitors.unique)}
        note={delta(visitors.unique, visitors.previousUnique, previousPeriod)}
      />
      <StatTile
        label="Visits"
        value={compact.format(visitors.visits)}
        note={delta(visitors.visits, visitors.previousVisits, previousPeriod)}
      />
      <StatTile
        label="Visits per visitor"
        value={perVisitor.toFixed(1)}
        note={perVisitor > 1.2 ? 'people come back' : 'mostly once each'}
      />
      <StatTile
        label="On a phone"
        value={counted === 0 ? '0%' : percent(devices.mobile / counted)}
        note={`${devices.mobile} mobile, ${devices.desktop} desktop`}
      />
    </div>
  );
};
