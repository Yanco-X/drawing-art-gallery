import { useEffect, useRef, useState } from 'react';
import { shortDay } from '../lib/visitRange';
import type { DailyVisits } from '../types';

const HEIGHT = 220;
const MARGIN = { top: 12, right: 44, bottom: 24, left: 36 };
const DIVISIONS = 4;

// The smallest of 2, 4, 8, 12, 16 or 20 times a power of ten that clears the
// largest value: all divide by four, so the ticks are whole and round.
const niceCeiling = (max: number): number => {
  if (max <= DIVISIONS) return DIVISIONS;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = [2, 4, 8, 12, 16, 20].find((s) => s * magnitude >= max) ?? 20;
  return step * magnitude;
};

const xLabelIndices = (count: number): number[] => {
  const step = Math.max(1, Math.ceil(count / 6));
  const indices = [];
  for (let i = 0; i < count; i += step) indices.push(i);
  if (indices[indices.length - 1] !== count - 1) indices.push(count - 1);
  return indices;
};

const useMeasuredWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
};

const LineKey = ({ className }: { className: string }) => (
  <span aria-hidden="true" className={`inline-block h-0.5 w-4 ${className}`} />
);

export const DailyVisitsChart = ({ daily }: { daily: DailyVisits[] }) => {
  const { ref, width } = useMeasuredWidth();
  const [hovered, setHovered] = useState<number | null>(null);

  const count = daily.length;
  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const ceiling = niceCeiling(
    Math.max(0, ...daily.map((day) => Math.max(day.unique, day.visits))),
  );
  const x = (index: number) =>
    MARGIN.left +
    (count === 1 ? innerWidth / 2 : (index * innerWidth) / (count - 1));
  const y = (value: number) =>
    MARGIN.top + innerHeight - (value / ceiling) * innerHeight;
  const path = (read: (day: DailyVisits) => number) =>
    daily
      .map((day, i) => `${i === 0 ? 'M' : 'L'}${x(i)} ${y(read(day))}`)
      .join(' ');

  const last = daily[count - 1];
  const ticks = Array.from({ length: DIVISIONS + 1 }, (_, i) =>
    Math.round((ceiling * i) / DIVISIONS),
  );

  const pointTo = (clientX: number, svg: SVGSVGElement) => {
    if (count === 0) return;
    const px = clientX - svg.getBoundingClientRect().left - MARGIN.left;
    const step = count === 1 ? innerWidth : innerWidth / (count - 1);
    setHovered(Math.min(count - 1, Math.max(0, Math.round(px / step))));
  };

  const hover = hovered === null ? null : daily[hovered];
  const tooltipOnLeft = hovered !== null && x(hovered) > width / 2;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-muted">
        <span className="flex items-center gap-2">
          <LineKey className="bg-accent" /> Unique visitors
        </span>
        <span className="flex items-center gap-2">
          <LineKey className="bg-chart-quiet" /> Visits
        </span>
      </div>

      <div ref={ref} className="relative w-full">
        {width > 0 && count > 0 && (
          <svg
            role="img"
            aria-label="Unique visitors and visits per day"
            width={width}
            height={HEIGHT}
            onPointerMove={(event) => pointTo(event.clientX, event.currentTarget)}
            onPointerLeave={() => setHovered(null)}
            className="block overflow-visible"
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  className="stroke-line"
                  strokeWidth={1}
                />
                <text
                  x={MARGIN.left - 8}
                  y={y(tick) + 4}
                  textAnchor="end"
                  className="fill-faint text-[11px] tabular-nums"
                >
                  {tick}
                </text>
              </g>
            ))}

            {xLabelIndices(count).map((index) => (
              <text
                key={index}
                x={x(index)}
                y={HEIGHT - 4}
                textAnchor="middle"
                className="fill-faint text-[11px]"
              >
                {shortDay(daily[index].date)}
              </text>
            ))}

            {hovered !== null && (
              <line
                x1={x(hovered)}
                x2={x(hovered)}
                y1={MARGIN.top}
                y2={MARGIN.top + innerHeight}
                className="stroke-faint"
                strokeWidth={1}
              />
            )}

            <path
              d={path((day) => day.visits)}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="stroke-chart-quiet"
            />
            <path
              d={path((day) => day.unique)}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="stroke-accent"
            />

            {/* The 2px ring in the ground colour keeps a marker legible where
                the two lines cross. */}
            {(hover ?? last) && (
              <g>
                {[
                  { value: (hover ?? last).visits, fill: 'fill-chart-quiet' },
                  { value: (hover ?? last).unique, fill: 'fill-accent' },
                ].map((marker) => (
                  <circle
                    key={marker.fill}
                    cx={x(hovered ?? count - 1)}
                    cy={y(marker.value)}
                    r={4}
                    strokeWidth={2}
                    className={`${marker.fill} stroke-bg`}
                  />
                ))}
              </g>
            )}

            {hovered === null && (
              <text
                x={x(count - 1) + 8}
                y={y(last.unique) + 4}
                className="fill-text text-[12px] tabular-nums"
              >
                {last.unique}
              </text>
            )}
          </svg>
        )}

        {hover && hovered !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 border border-line bg-surface px-3 py-2 text-[12px] whitespace-nowrap"
            style={{
              left: tooltipOnLeft ? x(hovered) - 12 : x(hovered) + 12,
              transform: tooltipOnLeft ? 'translateX(-100%)' : undefined,
            }}
          >
            <p className="mb-1 text-faint">{shortDay(hover.date)}</p>
            <p className="flex items-center gap-2 text-text">
              <LineKey className="bg-accent" />
              <span className="font-semibold tabular-nums">{hover.unique}</span>
              <span className="text-muted">unique</span>
            </p>
            <p className="flex items-center gap-2 text-text">
              <LineKey className="bg-chart-quiet" />
              <span className="font-semibold tabular-nums">{hover.visits}</span>
              <span className="text-muted">visits</span>
            </p>
          </div>
        )}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-[12px] text-faint transition-colors duration-200 hover:text-accent">
          Show as a table
        </summary>
        <table className="mt-3 border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line text-[12px] uppercase tracking-eyebrow text-faint">
              <th scope="col" className="py-2 pr-6 text-left font-normal">
                Day
              </th>
              <th scope="col" className="py-2 pr-6 text-right font-normal">
                Unique
              </th>
              <th scope="col" className="py-2 text-right font-normal">
                Visits
              </th>
            </tr>
          </thead>
          <tbody>
            {daily.map((day) => (
              <tr key={day.date} className="border-b border-line">
                <td className="py-1.5 pr-6 text-text">{day.date}</td>
                <td className="py-1.5 pr-6 text-right tabular-nums text-muted">
                  {day.unique}
                </td>
                <td className="py-1.5 text-right tabular-nums text-muted">
                  {day.visits}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};
