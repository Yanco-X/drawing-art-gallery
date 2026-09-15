import { FIELD, ICON_BUTTON } from './form-styles';
import {
  MAX_RANGE_DAYS,
  RANGE_PRESETS,
  isoDate,
  lastDays,
  parseDay,
  sameRange,
} from '../lib/visitRange';
import type { VisitRange } from '../types';

const daysBefore = (date: string, days: number): string => {
  const day = parseDay(date);
  day.setDate(day.getDate() - days);
  return isoDate(day);
};

export const MetricsRange = ({
  range,
  onChange,
}: {
  range: VisitRange;
  onChange: (range: VisitRange) => void;
}) => {
  const today = isoDate(new Date());

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div role="group" aria-label="Range" className="flex flex-wrap gap-2">
        {RANGE_PRESETS.map((preset) => {
          const active = sameRange(range, lastDays(preset.days));
          return (
            <button
              key={preset.days}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(lastDays(preset.days))}
              className={`${ICON_BUTTON} ${active ? 'border-accent text-accent' : ''}`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[12px] text-faint">
        <label className="flex items-center gap-2">
          From
          <input
            type="date"
            value={range.from}
            max={range.to}
            min={daysBefore(range.to, MAX_RANGE_DAYS - 1)}
            onChange={(event) =>
              onChange({ ...range, from: event.target.value })
            }
            className={`${FIELD} w-auto py-1.5`}
          />
        </label>
        <label className="flex items-center gap-2">
          To
          <input
            type="date"
            value={range.to}
            min={range.from}
            max={today}
            onChange={(event) => onChange({ ...range, to: event.target.value })}
            className={`${FIELD} w-auto py-1.5`}
          />
        </label>
      </div>
    </div>
  );
};
