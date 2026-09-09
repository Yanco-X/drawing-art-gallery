import { useId, useState } from 'react';
import { useDismissable } from '../hooks';
import { LABEL } from './form-styles';
import { ChevronDownIcon } from './icons';

export type MultiSelectOption = {
  value: string;
  label: string;
  /** A count or other aside, shown quietly at the end of the row. */
  hint?: string;
};

/**
 * A select that takes more than one answer.
 *
 * A native `<select multiple>` is the obvious reach and the wrong one: it
 * renders as a permanently open scrolling box rather than a dropdown, it
 * needs ctrl-click to pick a second value, and it cannot be styled to this
 * set at all. So the trigger is a button dressed as a field and the menu is
 * real checkboxes -- which is also what makes it legible to a screen
 * reader, where a faked `role="listbox"` would need every state maintained
 * by hand.
 *
 * The menu is the socials dropdown's surface: `.menu-panel`, the 200ms
 * opacity and 8px drop, `display: none` while shut so its boxes leave the
 * tab order. A menu floating over the page is fine where the filter band
 * was not -- it is small, transient, and asked for, where the band was
 * large and covered the drawings for as long as it was open.
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
  /** Shown when nothing is picked, in `faint` like an input's placeholder. */
  placeholder: string;
  options: MultiSelectOption[];
  selected: string[];
  onToggle: (value: string) => void;
  /** Overrides the "n selected" summary when several are picked. */
  summarise?: (count: number) => string;
}) => {
  const [open, setOpen] = useState(false);
  const root = useDismissable<HTMLDivElement>(open, () => setOpen(false));
  const id = useId();

  /*
   * One pick reads better as itself than as "1 selected" -- it is shorter
   * and it says which one, which is the thing the trigger is there to
   * answer without being opened.
   */
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

      {/* Dressed as a field so it sits level with the search input beside
          it, and takes the accent border while it holds a value -- the
          same hairline accent a focused field takes. */}
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

      {/* No display utility here: utilities cascade after components and
          would beat `.menu-panel`'s `display: none`, leaving an invisible
          sheet of checkboxes over whatever sits beneath. */}
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
