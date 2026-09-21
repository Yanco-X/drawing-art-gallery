import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DailyVisitsChart } from '../components/DailyVisitsChart';
import { MetricsRange } from '../components/MetricsRange';
import { MetricsTable } from '../components/MetricsTable';
import { PageMessage } from '../components/PageMessage';
import { PageShell } from '../components/PageShell';
import { VisitStats } from '../components/VisitStats';
import { useAsync, useSession } from '../hooks';
import {
  isValidRange,
  lastDays,
  previousPeriodLabel,
  rangeDays,
} from '../lib/visitRange';
import { fetchVisitSummary } from '../services';
import type { VisitRange, VisitSummary } from '../types';

const percent = (share: number) => `${Math.round(share * 100)}%`;

const EMPTY_SUMMARY = async (): Promise<VisitSummary | null> => null;

const MetricsSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="mx-auto w-full max-w-content px-gutter pb-section-lg">
    <h2 className="mb-4 text-[12px] uppercase tracking-eyebrow text-dim">
      {title}
    </h2>
    {children}
  </section>
);

const MetricsPage = () => {
  const { role } = useSession();
  const [range, setRange] = useState<VisitRange>(() => lastDays(30));
  const valid = isValidRange(range);

  // Keyed on the two dates: the loader is `useAsync`'s dependency, and a new
  // closure per render would refetch every render. Gated on the role here as
  // well as below: the hook runs before the early return, and a visitor's
  // 401 would open the sign-in dialog over the "nothing here" page.
  const { from, to } = range;
  const loadSummary = useMemo(
    () =>
      valid && role === 'owner'
        ? () => fetchVisitSummary({ from, to }) as Promise<VisitSummary | null>
        : EMPTY_SUMMARY,
    [from, to, valid, role],
  );
  const load = useAsync(loadSummary);

  if (role !== 'owner') {
    return (
      <PageShell>
        <PageMessage eyebrow="Not found" headline="There's nothing here." />
      </PageShell>
    );
  }

  const summary = load.status === 'ready' ? load.data : null;
  const days = rangeDays(range);

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-content px-gutter pt-intro-top pb-intro-bottom">
        <p className="mb-4 text-[12px] uppercase tracking-eyebrow text-faint">
          Behind the wall
        </p>
        <h1 className="max-w-[16em] font-display text-[clamp(28px,4vw,48px)] leading-[1.05] font-normal text-pretty text-text">
          Visits.
        </h1>
        <p className="mt-4 max-w-[42em] text-[14px] leading-relaxed text-muted">
          Unique visitors are unique browsers, counted once each, and an upper
          bound: read trends and rankings, not headcounts.
        </p>
      </section>

      <section className="mx-auto w-full max-w-content px-gutter pb-10">
        <MetricsRange range={range} onChange={setRange} />
        {!valid && (
          <p className="mt-3 text-[12px] text-faint">
            Pick a range that runs forwards and spans at most a year.
          </p>
        )}
      </section>

      {load.status === 'error' && (
        <PageMessage eyebrow="Unavailable" headline={load.message} />
      )}

      {load.status === 'loading' && (
        <p className="mx-auto w-full max-w-content px-gutter pb-section-lg text-[12px] uppercase tracking-eyebrow text-faint">
          Loading
        </p>
      )}

      {summary && (
        <>
          <MetricsSection title="Visitors">
            <VisitStats
              visitors={summary.visitors}
              devices={summary.devices}
              previousPeriod={previousPeriodLabel(days)}
            />
          </MetricsSection>

          <MetricsSection title="Day by day">
            <DailyVisitsChart daily={summary.daily} />
          </MetricsSection>

          <MetricsSection title="Pieces">
            <MetricsTable
              rows={summary.pieces.map((piece) => ({
                ...piece,
                rate: piece.viewers === 0 ? 0 : piece.detailedViewers / piece.viewers,
              }))}
              sortBy="viewers"
              empty="No piece was opened in this range."
              columns={[
                {
                  key: 'title',
                  label: 'Piece',
                  render: (piece) => (
                    <Link
                      to={`/piece/${piece.id}`}
                      className="transition-colors duration-200 hover:text-accent"
                    >
                      {piece.title}
                    </Link>
                  ),
                },
                { key: 'viewers', label: 'Viewers', numeric: true },
                { key: 'detailedViewers', label: 'Detailed view', numeric: true },
                {
                  key: 'rate',
                  label: 'Detailed rate',
                  numeric: true,
                  render: (piece) => percent(piece.rate),
                },
              ]}
            />
          </MetricsSection>

          <MetricsSection title="Collections">
            <MetricsTable
              rows={summary.collections.map((collection) => ({
                ...collection,
                share:
                  summary.visitors.unique === 0
                    ? 0
                    : collection.viewers / summary.visitors.unique,
              }))}
              sortBy="viewers"
              empty="No collection was opened in this range."
              columns={[
                {
                  key: 'name',
                  label: 'Collection',
                  render: (collection) => (
                    <Link
                      to={`/collections/${collection.slug}`}
                      className="transition-colors duration-200 hover:text-accent"
                    >
                      {collection.name}
                    </Link>
                  ),
                },
                { key: 'viewers', label: 'Viewers', numeric: true },
                {
                  key: 'share',
                  label: 'Of all visitors',
                  numeric: true,
                  render: (collection) => percent(collection.share),
                },
              ]}
            />
          </MetricsSection>
        </>
      )}
    </PageShell>
  );
};

export default MetricsPage;
