import { useEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { ApiError, saveSocials } from '../services';
import type { Social, SocialDraft } from '../types';
import { CloseIcon } from './icons';
import {
  PLATFORMS,
  markFor,
  labelForPlatform,
  platformFromUrl,
} from './platform-icons';
import { FIELD, GHOST_BUTTON, LABEL, PRIMARY_BUTTON } from './form-styles';

/*
 * Editing the socials list.
 *
 * One list, one Save, nothing written until then -- the rule arrange mode
 * set for the same reason: this is one ordered list, not five independent
 * records, and a drop that wrote immediately would make an accidental drag
 * permanent.
 *
 * Pasting a url usually fills the rest in. The platform is what picks the
 * mark, and asking someone to type `artstation` correctly to get an icon is
 * a spelling test with a silent penalty.
 */

const move = <T,>(items: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [lifted] = next.splice(from, 1);
  next.splice(to, 0, lifted);
  return next;
};

interface Row extends SocialDraft {
  /** Stable across reorders; the API's id is absent until a row is saved. */
  key: string;
}

const toRows = (socials: Social[]): Row[] =>
  socials.map((social) => ({ ...social, key: social.id }));

let created = 0;
const blankRow = (): Row => ({
  key: `new-${created++}`,
  platform: 'link',
  label: '',
  url: '',
});

const PlatformPicker = ({
  value,
  onPick,
}: {
  value: string;
  onPick: (platform: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const Mark = markFor(value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-label={`Platform: ${labelForPlatform(value)}`}
        aria-expanded={open}
        className="flex size-9 cursor-pointer items-center justify-center border border-line bg-transparent text-muted transition-colors duration-200 hover:border-accent hover:text-accent"
      >
        <Mark />
      </button>

      {/* A grid of the marks themselves. A native select cannot show one,
          and the mark is the thing being chosen.

          The grid is on the inner element, not on .menu-panel. A display
          utility there would outrank the class -- utilities cascade after
          components -- leaving the panel laid out and clickable while it
          reads as closed. */}
      <div
        data-open={open}
        className="menu-panel absolute top-full left-0 z-30 mt-2 w-44 border border-line bg-surface p-2"
      >
        <div className="grid grid-cols-4 gap-1">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.key}
              type="button"
              title={platform.label}
              aria-label={platform.label}
              onClick={() => {
                onPick(platform.key);
                setOpen(false);
              }}
              className={`flex size-9 cursor-pointer items-center justify-center border bg-transparent transition-colors duration-200 hover:border-accent hover:text-accent ${
                platform.key === value
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted'
              }`}
            >
              <platform.icon />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SocialsDialog = ({
  open,
  socials,
  onClose,
  onSaved,
}: {
  open: boolean;
  socials: Social[];
  onClose: () => void;
  onSaved: (socials: Social[]) => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState<Row[]>(() => toRows(socials));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setRows(toRows(socials));
      setError(null);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, socials]);

  const update = (index: number, patch: Partial<Row>) =>
    setRows((now) =>
      now.map((row, at) => (at === index ? { ...row, ...patch } : row)),
    );

  /*
   * A pasted url names its own platform, and fills the label if it is still
   * empty. It never overwrites a label already typed: the whole point of
   * label being separate from platform is that two accounts on one site can
   * be told apart.
   */
  const onUrl = (index: number, url: string) => {
    const detected = platformFromUrl(url);
    setRows((now) =>
      now.map((row, at) => {
        if (at !== index) return row;
        const next: Row = { ...row, url };
        if (detected) {
          next.platform = detected;
          if (!row.label.trim()) next.label = labelForPlatform(detected);
        }
        return next;
      }),
    );
  };

  const reorder = (from: number, to: number) => {
    setRows((now) => {
      const next = move(now, from, to);
      if (next !== now) {
        setAnnouncement(
          `${next[to].label || 'Row'} moved to position ${to + 1} of ${next.length}.`,
        );
      }
      return next;
    });
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const saved = await saveSocials(
        rows.map(({ key, ...row }) => {
          void key;
          return row;
        }),
      );
      onSaved(saved);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Could not reach the API. Is the backend running?',
      );
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    if (busy) return;
    onClose();
  };

  const onDragStart = (event: DragEvent<HTMLLIElement>, index: number) => {
    setDragIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    // Firefox starts no drag at all without data on the transfer.
    event.dataTransfer.setData('text/plain', String(index));
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label="Socials"
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onClose={dismiss}
      onClick={(event) => {
        if (event.target === dialogRef.current) dismiss();
      }}
      className="m-auto w-[min(94vw,600px)] border border-line bg-surface p-0 text-[14px] tracking-normal text-text normal-case backdrop:bg-black/70 backdrop:backdrop-blur-[3px]"
    >
      <div className="flex flex-col gap-5 p-6">
        <div>
          <h2 className="font-serif text-[22px] font-normal text-text">
            Where to find you
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-dim">
            Paste a link and the rest fills itself in. Drag a row, or use the
            arrows, to change the order they appear in.
          </p>
        </div>

        <ul className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <li
              key={row.key}
              draggable={!busy}
              onDragStart={(event) => onDragStart(event, index)}
              onDragOver={(event) => {
                if (dragIndex === null) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragIndex !== null) reorder(dragIndex, index);
                setDragIndex(null);
              }}
              className={`flex flex-wrap items-center gap-2 border border-line p-2 transition-colors duration-200 ${
                dragIndex === index ? 'border-accent' : ''
              }`}
            >
              <PlatformPicker
                value={row.platform}
                onPick={(platform) => update(index, { platform })}
              />

              {/* Wrapped rather than sized directly: FIELD carries w-full,
                  so a width on the input itself is a coin toss over which
                  utility the stylesheet emits last. */}
              <div className="w-[110px] shrink-0">
                <input
                  value={row.label}
                  onChange={(event) => update(index, { label: event.target.value })}
                  placeholder="Label"
                  aria-label="Label"
                  disabled={busy}
                  className={FIELD}
                />
              </div>
              <div className="min-w-[150px] flex-1">
                <input
                  value={row.url}
                  onChange={(event) => onUrl(index, event.target.value)}
                  placeholder="https://"
                  aria-label="Link"
                  disabled={busy}
                  className={FIELD}
                />
              </div>

              {/* Native drag and drop is mouse-only, so the same move is on
                  buttons a keyboard can reach. */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => reorder(index, index - 1)}
                  disabled={busy || index === 0}
                  aria-label="Move up"
                  className="flex size-9 cursor-pointer items-center justify-center border border-line bg-transparent text-muted transition-colors duration-200 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => reorder(index, index + 1)}
                  disabled={busy || index === rows.length - 1}
                  aria-label="Move down"
                  className="flex size-9 cursor-pointer items-center justify-center border border-line bg-transparent text-muted transition-colors duration-200 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRows((now) => now.filter((_, at) => at !== index))
                  }
                  disabled={busy}
                  aria-label={`Remove ${row.label || 'this link'}`}
                  className="flex size-9 cursor-pointer items-center justify-center border border-line bg-transparent text-muted transition-colors duration-200 hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <CloseIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {rows.length === 0 && (
          <p className={LABEL}>Nothing here yet.</p>
        )}

        <div>
          <button
            type="button"
            onClick={() => setRows((now) => [...now, blankRow()])}
            disabled={busy}
            className={GHOST_BUTTON}
          >
            + Add
          </button>
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={dismiss}
            disabled={busy}
            className={GHOST_BUTTON}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className={PRIMARY_BUTTON}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </dialog>
  );
};
