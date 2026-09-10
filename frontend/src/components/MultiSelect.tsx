import { useId, useState } from 'react';
import { useDismissable } from '../hooks';
import { LABEL } from './form-styles';
import { ChevronDownIcon } from './icons';

export type MultiSelectOption = {
  value: string;
  label: string;
  hint?: string;
};

/*
 * A native `<select multiple>` is the obvious reach and the wrong one: it
 * renders as a permanently open scrolling box, needs ctrl-click for a second
 * value, and cannot be styled to this set. So the trigger is a button dressed
 * as a field and the menu is real checkboxes, which a screen reader can also
 * read without every state being maintained by hand.
 */
export const MultiSelect = ({
  label,
  placeholder,
  options,
  selected,
  onToggle,
  summarise,
}: {
  label: string;
  placeholder: string;
  options: MultiSelectOption[];
  selected: string[];
  onToggle: (value: string) => void;
  summarise?: (count: number) => string;
}) => {
  const [open, setOpen] = useState(false);
  const root = useDismissable<HTMLDivElement>(open, () => setOpen(false));
  const id = useId();

  const chosen = options.filter((option) => selected.includes(option.value));
  const summary =
    chosen.length === 0
      ? placeholder
      : chosen.length === 1
        ? chosen[0].label
        : (summarise?.(chosen.length) ?? `${chosen.length} selected`);

  return (
    <div ref={root} className="relative w-full max-w-[240px] min-w-[180px] flex-1">
      <span id={id + '-label'} className={LABEL + ' mb-3 block'}>
        {label}
      </span>

      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-labelledby={`${id}-label ${id}-summary`}
        className={
          'flex w-full cursor-pointer items-center justify-between gap-2 ' +
          'border bg-bg px-3 py-2.5 text-left text-[14px] ' +
          'transition-colors duration-200 ' +
          (chosen.length > 0 || open
            ? 'border-accent text-text'
            : 'border-line text-faint hover:border-accent')
        }
      >
        <span id={id + '-summary'} className="truncate">
          {summary}
        </span>
        <span
          className={`shrink-0 text-muted transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {/* No display utility here: utilities cascade after components and would
          beat `.menu-panel`'s `display: none`, leaving an invisible sheet of
          checkboxes over whatever sits beneath. */}
      <div
        data-open={open}
        className="menu-panel absolute top-full left-0 z-20 mt-2 max-h-[280px] w-full min-w-[180px] overflow-y-auto border border-line bg-surface"
      >
        <fieldset className="border-none p-1">
          <legend className="sr-only">{label}</legend>
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 text-[14px] text-dim transition-colors duration-200 hover:text-accent"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => onToggle(option.value)}
                className="size-4 accent-accent"
              />
              <span className="flex-1">{option.label}</span>
              {option.hint && (
                <span className="text-[12px] text-faint">{option.hint}</span>
              )}
            </label>
          ))}
        </fieldset>
      </div>
    </div>
  );
};
