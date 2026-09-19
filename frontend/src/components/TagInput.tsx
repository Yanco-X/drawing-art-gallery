import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { tagsInUse } from '../lib/tags';
import { fetchPieces } from '../services';
import { FIELD, LABEL } from './form-styles';

// A blur would close the list, and commit the half-typed draft as a tag of its
// own before the click lands.
const keepFieldFocus = (event: MouseEvent) => event.preventDefault();

export const TagInput = ({
  id,
  tags,
  onChange,
}: {
  id: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) => {
  const [draft, setDraft] = useState('');
  const [inUse, setInUse] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();

  const needle = draft.trim().toLowerCase();
  const suggestions = inUse.filter(
    (name) => !tags.includes(name) && name.includes(needle),
  );
  const listed = open && suggestions.length > 0;

  useEffect(() => {
    list.current?.togglePopover(listed);
  }, [listed]);

  const add = (raw: string) => {
    const value = raw.replace(/,+$/, '').trim().toLowerCase();
    setActive(-1);
    if (!value) return;
    if (!tags.includes(value)) {
      onChange([...tags, value]);
    }
    setDraft('');
  };

  // Every focus rather than once: the upload dialog stays mounted between
  // pieces, and a tag given to the last one should be offered for the next.
  const suggest = () => {
    setOpen(true);
    fetchPieces()
      .then((pieces) => setInUse(tagsInUse(pieces).map((tag) => tag.name)))
      .catch(() => {});
  };

  const move = (step: 1 | -1) => {
    const count = suggestions.length;
    const next = active < 0 && step < 0 ? count - 1 : (active + step + count) % count;
    setActive(next);
    list.current?.children[next]?.scrollIntoView({ block: 'nearest' });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (listed) move(event.key === 'ArrowDown' ? 1 : -1);
      else setOpen(true);
    } else if (event.key === 'Enter' || event.key === ',') {
      // Enter inside a form would otherwise submit it.
      event.preventDefault();
      const picked = event.key === 'Enter' && listed ? suggestions[active] : undefined;
      add(picked ?? draft);
    } else if (event.key === 'Escape' && listed) {
      // Cancelled, or the dialog around the field closes with the list.
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Backspace' && !draft) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="tag-field flex flex-col gap-2">
      <label htmlFor={id} className={LABEL}>
        Tags
      </label>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onMouseDown={keepFieldFocus}
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                aria-label={'Remove ' + tag}
                className="cursor-pointer border border-line bg-bg px-2.5 py-1 text-[12px] text-dim transition-colors duration-200 hover:border-accent hover:text-accent"
              >
                {tag} <span aria-hidden="true">&times;</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={id}
        role="combobox"
        aria-expanded={listed}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={listed && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={onKeyDown}
        onFocus={suggest}
        onClick={() => setOpen(true)}
        onBlur={() => {
          add(draft);
          setOpen(false);
        }}
        placeholder="Charcoal, Portrait — enter to add"
        className={FIELD + ' tag-field-input'}
      />
      <ul
        ref={list}
        id={listId}
        popover="manual"
        role="listbox"
        aria-label="Tags in use"
        onMouseDown={keepFieldFocus}
        className="tag-suggestions max-h-[240px] overflow-y-auto border border-line bg-surface p-1"
      >
        {suggestions.map((name, index) => (
          <li
            key={name}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            onClick={() => add(name)}
            className={
              'cursor-pointer px-3 py-2 text-[14px] transition-colors duration-200 hover:text-accent ' +
              (index === active ? 'text-accent' : 'text-dim')
            }
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
};
