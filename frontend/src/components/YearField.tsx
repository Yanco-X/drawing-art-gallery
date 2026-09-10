import { yearOf } from '../lib/year';
import { FIELD, LABEL } from './form-styles';

/** Stated where a date made supplies it, asked for where nothing does.
    `lib/year.ts` carries the rule. */
export const YearField = ({
  id,
  year,
  createdDate,
  onChange,
}: {
  id: string;
  year: string;
  createdDate: string;
  onChange: (year: string) => void;
}) => {
  const derived = createdDate ? yearOf(createdDate) : '';

  if (derived) {
    return (
      <div className="flex flex-col gap-2">
        <span className={LABEL}>Year</span>
        <p className="py-2.5 text-[14px] text-text">{derived}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={LABEL}>
        Year
      </label>
      {/* `inputMode` rather than `type="number"`: no spinner, and a scroll
          over the field cannot quietly change the value. Sent as typed, so
          a mistyped year is refused by the API rather than becoming NaN and
          vanishing to null. */}
      <input
        id={id}
        inputMode="numeric"
        value={year}
        onChange={(event) => onChange(event.target.value)}
        placeholder="2026"
        className={FIELD}
      />
    </div>
  );
};
