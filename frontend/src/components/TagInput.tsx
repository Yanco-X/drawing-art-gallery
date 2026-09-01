import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { FIELD, LABEL } from './form-styles';

/**
 * Free-text tags as chips.
 *
 * Enter or a comma commits the draft, and Backspace on an empty field takes
 * the last chip back. Blur commits too, so a tag typed and left behind is
 * not silently dropped.
 *
 * Shared by upload and edit. The two forms collect the same thing, and a
 * second copy of this would be a second set of rules about what counts as a
 * duplicate.
 */
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

  const add = (raw: string) => {
    const value = raw.replace(/,+$/, '').trim();
    if (!value) return;
    // The backend slugifies, so "Ink" and "ink" would collapse into one row.
    if (!tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
      onChange([...tags, value]);
    }
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      // Enter inside a form would otherwise submit it.
      event.preventDefault();
      add(draft);
    } else if (event.key === 'Backspace' && !draft) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={LABEL}>
        Tags
      </label>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag}>
              <button
                type="button"
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
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        placeholder="Charcoal, Portrait — enter to add"
        className={FIELD}
      />
    </div>
  );
};
