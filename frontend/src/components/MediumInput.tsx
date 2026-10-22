import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { mediumOptions } from '../lib/media';
import { fetchPublicPieces } from '../services';
import { FIELD, LABEL } from './form-styles';
import { ChevronDownIcon } from './icons';

// A blur would close the list before the click on an option lands.
const keepFieldFocus = (event: MouseEvent) => event.preventDefault();

export const MediumInput = ({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (medium: string) => void;
}) => {
  const [options, setOptions] = useState(() => mediumOptions([]));
  const [open, setOpen] = useState(false);
  // The field opens holding a medium, and filtering by it would hide every
  // other one, so the list narrows only once something is typed.
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState(-1);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();

  const draft = value.trim();
  const needle = typed ? draft.toLowerCase() : '';
  const listedAs = options.find((name) => name.toLowerCase() === draft.toLowerCase());
  const rows = options
    .filter((name) => name.toLowerCase().includes(needle))
    .map((name) => ({ name, label: name }));
  if (typed && draft && !listedAs) rows.push({ name: draft, label: `Add "${draft}"` });
  const listed = open && rows.length > 0;

  useEffect(() => {
    list.current?.togglePopover(listed);
  }, [listed]);

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  const pick = (name: string) => {
    onChange(name);
    close();
  };

  // Every focus rather than once, as with tags: a medium given to the last
  // upload should be offered for the next.
  const suggest = () => {
    setTyped(false);
    setOpen(true);
    fetchPublicPieces()
      .then((pieces) => setOptions(mediumOptions(pieces)))
      .catch(() => {});
  };

  const settle = () => {
    close();
    const settled = listedAs ?? draft;
    if (settled !== value) onChange(settled);
  };

  const move = (step: 1 | -1) => {
    const count = rows.length;
    const next = active < 0 && step < 0 ? count - 1 : (active + step + count) % count;
    setActive(next);
    list.current?.children[next]?.scrollIntoView({ block: 'nearest' });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (listed) move(event.key === 'ArrowDown' ? 1 : -1);
      else setOpen(true);
    } else if ((event.key === 'Enter' || event.key === 'Escape') && listed) {
      // With the list open, Enter would submit the form and Escape close the
      // dialog around it.
      event.preventDefault();
      if (event.key === 'Enter' && active >= 0) pick(rows[active].name);
      else close();
    }
  };

  return (
    <div className="suggestion-field flex flex-col gap-2">
      <label htmlFor={id} className={LABEL}>
        Medium
      </label>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={listed}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={listed && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          maxLength={100}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setTyped(true);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
          onFocus={suggest}
          onClick={() => setOpen(true)}
          onBlur={settle}
          placeholder="Graphite"
          className={FIELD + ' suggestion-field-input pr-9'}
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted">
          <ChevronDownIcon />
        </span>
      </div>
      <ul
        ref={list}
        id={listId}
        popover="manual"
        role="listbox"
        aria-label="Media"
        onMouseDown={keepFieldFocus}
        className="suggestion-list max-h-[240px] overflow-y-auto border border-line bg-surface p-1"
      >
        {rows.map((row, index) => (
          <li
            key={row.label}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            onClick={() => pick(row.name)}
            className={
              'cursor-pointer px-3 py-2 text-[14px] transition-colors duration-200 hover:text-accent ' +
              (index === active ? 'text-accent' : 'text-dim')
            }
          >
            {row.label}
          </li>
        ))}
      </ul>
    </div>
  );
};
