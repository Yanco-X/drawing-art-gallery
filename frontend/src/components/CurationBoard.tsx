import { useEffect, useRef, useState } from 'react';
import type {
  DragEvent,
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from 'react';
import { useFlipReflow, usePersistentState } from '../hooks';
import { GRID_DENSITIES } from '../hooks/useGridDensity';
import { landingBefore, move, place, sameOrder } from '../lib/order';
import { keyTaken } from '../lib/traverse';
import { ApiError } from '../services';
import type { GridDensity } from '../types';
import { DensityControl } from './DensityControl';
import {
  GHOST_BUTTON,
  ICON_BUTTON,
  PRIMARY_BUTTON,
  SUBTLE_ACTION,
} from './form-styles';
import { CheckIcon } from './icons';

/*
 * Nothing reaches the API until Save, as in a collection's arrange mode. The
 * pending order is kept on this device as well, because the router cannot
 * hold a navigation: a click on the nav mid-session must not cost the work.
 *
 * One board for every list the owner orders -- the gallery's pieces, the
 * collections -- which differ only in what a tile and the preview show.
 */

export interface Curated {
  id: string;
  curatedOrder: number | null;
}

export interface Arrangement<T> {
  label: string;
  arrange: (items: T[]) => T[];
}

const DENSITY_KEY = 'sketchyart-curation-density';

const TILE_COLUMNS: Record<GridDensity, string> = {
  airy: 'grid-cols-[repeat(auto-fill,minmax(230px,1fr))]',
  comfortable: 'grid-cols-[repeat(auto-fill,minmax(160px,1fr))]',
  dense: 'grid-cols-[repeat(auto-fill,minmax(110px,1fr))]',
};

const BADGE =
  'absolute flex h-6 min-w-6 items-center justify-center px-1 text-[12px] leading-none';

const POSITION_FIELD =
  'h-9 w-20 border border-line bg-bg px-2 text-[12px] text-text ' +
  'placeholder:text-faint transition-colors duration-200 ' +
  'focus:border-accent focus:outline-1 focus:outline-accent';

const START_FROM =
  'h-9 cursor-pointer border border-line bg-bg px-2 text-[12px] ' +
  'tracking-nav text-muted transition-colors duration-200 ' +
  'hover:border-accent hover:text-accent focus:border-accent ' +
  'focus:outline-1 focus:outline-accent';

const isDraft = (value: unknown): value is string[] | null =>
  value === null ||
  (Array.isArray(value) && value.every((id) => typeof id === 'string'));

const isDensity = (value: unknown): value is GridDensity =>
  GRID_DENSITIES.includes(value as GridDensity);

// A draft outlives the list it was made from: items added since join at the
// top, as the list shows them, and items gone since drop out.
const fromDraft = <T extends Curated>(items: T[], draft: string[]): T[] => {
  const byId = new Map(items.map((item) => [item.id, item]));
  const listed = new Set(draft);
  return [
    ...items.filter((item) => !listed.has(item.id)),
    ...draft.flatMap((id) => byId.get(id) ?? []),
  ];
};

const rightHalf = (event: { clientX: number; currentTarget: Element }) => {
  const box = event.currentTarget.getBoundingClientRect();
  return event.clientX > box.left + box.width / 2;
};

type View = 'arrange' | 'preview';

const VIEWS: { view: View; label: string }[] = [
  { view: 'arrange', label: 'Arrange' },
  { view: 'preview', label: 'Preview' },
];

interface Aim {
  index: number;
  after: boolean;
}

export const CurationBoard = <T extends Curated>({
  items,
  noun,
  nameOf,
  renderTile,
  renderPreview,
  previewNote,
  arrangements,
  save: send,
  draftKey,
}: {
  items: T[];
  /** Singular and plural, as the counts and announcements say them. */
  noun: [string, string];
  nameOf: (item: T) => string;
  /** The item's frame, with the board's badges passed in to sit over it. */
  renderTile: (
    item: T,
    index: number,
    picked: boolean,
    overlays: ReactNode,
  ) => ReactNode;
  renderPreview: (order: T[], density: GridDensity) => ReactNode;
  previewNote: string;
  arrangements: Arrangement<T>[];
  save: (ids: string[]) => Promise<T[]>;
  draftKey: string;
}) => {
  const [one, many] = noun;
  const [draft, setDraft] = usePersistentState(draftKey, null, isDraft);
  const [density, setDensity] = usePersistentState<GridDensity>(
    DENSITY_KEY,
    'comfortable',
    isDensity,
  );
  const [saved, setSaved] = useState(items);
  const [order, setOrder] = useState(() =>
    draft ? fromDraft(items, draft) : items,
  );
  const [history, setHistory] = useState<T[][]>([]);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [anchor, setAnchor] = useState<string | null>(null);
  const [dragging, setDragging] = useState<ReadonlySet<string> | null>(null);
  const [aim, setAim] = useState<Aim | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [view, setView] = useState<View>('arrange');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const listRef = useRef<HTMLUListElement>(null);

  useFlipReflow(listRef, `${density}:${order.map((item) => item.id).join()}`);

  const dirty = !sameOrder(order, saved);
  const unplaced = order.filter((item) => item.curatedOrder === null).length;
  const moving = dragging ?? (picked.size > 0 ? picked : null);

  const show = (next: T[]) => {
    setOrder(next);
    setDraft(sameOrder(next, saved) ? null : next.map((item) => item.id));
  };

  const commit = (next: T[], message: string) => {
    if (sameOrder(next, order)) return;
    setHistory((past) => [...past, order]);
    show(next);
    setAnnouncement(message);
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory(history.slice(0, -1));
    show(previous);
    setAnnouncement('Undone.');
  };

  // Ctrl+Z anywhere on the page but a field, which has its own undo.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (keyTaken(event)) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const placeAt = (ids: ReadonlySet<string>, at: number) => {
    const next = place(order, ids, at);
    const first = next.findIndex((item) => ids.has(item.id));
    const what = ids.size === 1 ? nameOf(next[first]) : `${ids.size} ${many}`;
    commit(next, `${what} moved to position ${first + 1} of ${next.length}.`);
    setPicked((now) => new Set([...now].filter((id) => !ids.has(id))));
  };

  const togglePick = (id: string) => {
    setPicked((now) => {
      const next = new Set(now);
      if (!next.delete(id)) next.add(id);
      return next;
    });
    setAnchor(id);
  };

  const pickRange = (id: string) => {
    const from = order.findIndex((item) => item.id === anchor);
    const to = order.findIndex((item) => item.id === id);
    if (from < 0) return togglePick(id);
    const [low, high] = from < to ? [from, to] : [to, from];
    const range = order.slice(low, high + 1).map((item) => item.id);
    setPicked((now) => new Set([...now, ...range]));
  };

  const aimAt = (index: number, after: boolean) =>
    setAim((now) =>
      now?.index === index && now.after === after ? now : { index, after },
    );

  const onTileClick = (event: MouseEvent<HTMLLIElement>, index: number) => {
    const item = order[index];
    if (event.ctrlKey || event.metaKey) return togglePick(item.id);
    if (event.shiftKey && anchor) return pickRange(item.id);
    if (picked.size === 0 || picked.has(item.id)) return togglePick(item.id);
    const before = index + (rightHalf(event) ? 1 : 0);
    placeAt(picked, landingBefore(order, picked, before));
  };

  const onDragStart = (event: DragEvent<HTMLLIElement>, item: T) => {
    setDragging(picked.has(item.id) ? picked : new Set([item.id]));
    event.dataTransfer.effectAllowed = 'move';
    // Firefox starts no drag at all without data on the transfer.
    event.dataTransfer.setData('text/plain', item.id);
  };

  const onDragOver = (event: DragEvent<HTMLLIElement>, index: number) => {
    if (!dragging) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    aimAt(index, rightHalf(event));
  };

  const endDrag = () => {
    setDragging(null);
    setAim(null);
  };

  const onDrop = (event: DragEvent<HTMLLIElement>, index: number) => {
    event.preventDefault();
    if (dragging) {
      const before = index + (rightHalf(event) ? 1 : 0);
      placeAt(dragging, landingBefore(order, dragging, before));
    }
    endDrag();
  };

  // A moved element loses focus when React reinserts it, so it is handed
  // back once the new order is on screen.
  const refocus = (id: string) =>
    requestAnimationFrame(() =>
      listRef.current
        ?.querySelector<HTMLElement>(`[data-flip-id="${id}"]`)
        ?.focus(),
    );

  const onTileKey = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
    if (event.target !== event.currentTarget) return;
    const item = order[index];
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const to = index + (event.key === 'ArrowLeft' ? -1 : 1);
      const next = move(order, index, to);
      if (next === order) return;
      commit(
        next,
        `${nameOf(item)} moved to position ${to + 1} of ${next.length}.`,
      );
      refocus(item.id);
    } else if (event.key === ' ') {
      event.preventDefault();
      togglePick(item.id);
    } else if (
      event.key === 'Enter' &&
      picked.size > 0 &&
      !picked.has(item.id)
    ) {
      event.preventDefault();
      placeAt(picked, landingBefore(order, picked, index));
    }
  };

  const onPositionKey = (event: KeyboardEvent<HTMLInputElement>, item: T) => {
    event.stopPropagation();
    if (event.key === 'Escape') setEditing(null);
    if (event.key !== 'Enter') return;
    const to = Number(event.currentTarget.value);
    if (Number.isInteger(to) && to >= 1) placeAt(new Set([item.id]), to - 1);
    setEditing(null);
  };

  const onPickedPosition = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const field = event.currentTarget.elements.namedItem('position');
    const to = Number((field as HTMLInputElement).value);
    if (Number.isInteger(to) && to >= 1) placeAt(picked, to - 1);
  };

  const startFrom = (index: string) => {
    const chosen = arrangements[Number(index)];
    if (chosen) commit(chosen.arrange(order), `Arranged: ${chosen.label}.`);
  };

  const discard = () => {
    commit(saved, 'Changes discarded.');
    setPicked(new Set());
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const fresh = await send(order.map((item) => item.id));
      setSaved(fresh);
      setOrder(fresh);
      setHistory([]);
      setPicked(new Set());
      setDraft(null);
      setAnnouncement('Order saved.');
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        setError('Could not reach the API. Is the backend running?');
      } else if (caught.status === 404 || caught.status === 409) {
        // Gone or waived in another tab. A reload drops it from the draft.
        setError(`${caught.message} Reload the page: your order is kept.`);
      } else {
        setError(caught.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const status = !dirty
    ? 'Saved. This is the order visitors see.'
    : history.length === 0 && draft
      ? 'Unsaved changes, kept from your last visit.'
      : 'Unsaved changes.';

  const overlays = (item: T, index: number, isPicked: boolean) => (
    <>
      {editing === item.id ? (
        <input
          type="number"
          min={1}
          max={order.length}
          defaultValue={index + 1}
          autoFocus
          aria-label={`New position for ${nameOf(item)}`}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => onPositionKey(event, item)}
          onBlur={() => setEditing(null)}
          className="absolute top-2 left-2 h-7 w-16 border border-accent bg-bg px-1.5 text-[12px] text-text outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setEditing(item.id);
          }}
          title="Type a new position"
          aria-label={`Position ${index + 1}. Type a new one`}
          className={`${BADGE} top-2 left-2 cursor-pointer border-none bg-accent text-on-accent transition-opacity duration-200 hover:opacity-80`}
        >
          {index + 1}
        </button>
      )}

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          togglePick(item.id);
        }}
        aria-pressed={isPicked}
        aria-label={`Pick ${nameOf(item)}`}
        className={`${BADGE} top-2 right-2 w-6 cursor-pointer border transition-colors duration-200 ${
          isPicked
            ? 'border-accent bg-accent text-on-accent'
            : 'border-line bg-bg-translucent text-transparent hover:border-accent hover:text-accent'
        }`}
      >
        <CheckIcon />
      </button>

      {item.curatedOrder === null && (
        <span className="absolute bottom-2 left-2 border border-accent bg-bg-translucent px-2 py-0.5 text-[11px] uppercase tracking-nav text-accent">
          New
        </span>
      )}
    </>
  );

  return (
    <>
      <div className="sticky top-header z-[5] -mx-gutter mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-line bg-bg-translucent px-gutter py-3 backdrop-blur-[12px]">
        <div className="flex flex-col gap-1">
          <p className="text-[13px] text-dim">
            {order.length} {order.length === 1 ? one : many}
            {unplaced > 0 && `, ${unplaced} new at the top`}
          </p>
          <p className={`text-[12px] ${dirty ? 'text-accent' : 'text-faint'}`}>
            {status}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="View"
            className="flex border border-line"
          >
            {VIEWS.map((option, index) => (
              <button
                key={option.view}
                type="button"
                onClick={() => setView(option.view)}
                aria-pressed={view === option.view}
                className={`cursor-pointer px-3 py-1.5 text-[12px] tracking-nav transition-colors duration-200 ${
                  index > 0 ? 'border-l border-line' : ''
                } ${
                  view === option.view
                    ? 'bg-accent text-on-accent'
                    : 'text-muted hover:text-accent'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <DensityControl value={density} onChange={setDensity} />
          {/* Picking resets it to its label: this is an action, not a
              setting, and the order it made is the one on screen. */}
          <select
            aria-label="Start from"
            value=""
            onChange={(event) => startFrom(event.target.value)}
            disabled={busy}
            className={START_FROM}
          >
            <option value="" disabled>
              Start from…
            </option>
            {arrangements.map((option, index) => (
              <option key={option.label} value={index}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0 || busy}
            title="Undo (Ctrl+Z)"
            className={GHOST_BUTTON}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={discard}
            disabled={!dirty || busy}
            className={GHOST_BUTTON}
          >
            Discard
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || busy}
            className={PRIMARY_BUTTON}
          >
            {busy ? 'Saving…' : 'Save order'}
          </button>
        </div>
      </div>

      <p className="mb-6 text-[12px] text-faint">
        {view === 'preview'
          ? previewNote
          : `Drag a ${one} to move it. Or pick ${many} with their check box, then click the left or right half of another ${one} to put them there. Click a number to type a position. A focused ${one} moves with the left and right arrow keys, and Space picks it.`}
      </p>

      {error && (
        <p role="alert" className="mb-6 text-[13px] text-danger">
          {error}
        </p>
      )}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {view === 'preview' ? (
        // Look, don't touch: a card here would open its page.
        <div inert>{renderPreview(order, density)}</div>
      ) : (
        <ul
          ref={listRef}
          onPointerLeave={() => setAim(null)}
          className={`relative grid list-none gap-4 p-0 select-none ${TILE_COLUMNS[density]}`}
        >
          {order.map((item, index) => {
            const isPicked = picked.has(item.id);
            const lifted = dragging?.has(item.id) ?? false;
            const target = moving !== null && !moving.has(item.id);
            const line = target && aim?.index === index ? aim : null;
            return (
              <li
                key={item.id}
                data-flip-id={item.id}
                draggable
                tabIndex={0}
                aria-label={`${nameOf(item)}, position ${index + 1} of ${order.length}${isPicked ? ', picked' : ''}`}
                onClick={(event) => onTileClick(event, index)}
                onPointerMove={(event) => {
                  if (!dragging && target) aimAt(index, rightHalf(event));
                }}
                onDragStart={(event) => onDragStart(event, item)}
                onDragOver={(event) => onDragOver(event, index)}
                onDrop={(event) => onDrop(event, index)}
                onDragEnd={endDrag}
                onKeyDown={(event) => onTileKey(event, index)}
                className={`relative transition-opacity duration-200 focus:outline-1 focus:outline-offset-2 focus:outline-accent ${
                  target ? 'cursor-pointer' : 'cursor-grab'
                } ${lifted ? 'opacity-40' : ''}`}
              >
                {renderTile(
                  item,
                  index,
                  isPicked,
                  overlays(item, index, isPicked),
                )}

                {line && (
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-y-0 w-0.5 bg-accent ${
                      line.after ? '-right-[9px]' : '-left-[9px]'
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {view === 'arrange' && picked.size > 0 && (
        <div className="sticky bottom-0 z-[5] mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border border-accent bg-bg-translucent px-5 py-3 backdrop-blur-[12px]">
          <p className="text-[13px] text-dim">
            {picked.size} picked. Click the left or right half of another {one}{' '}
            to put {picked.size === 1 ? 'it' : 'them'} there.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => placeAt(picked, 0)}
              className={ICON_BUTTON}
            >
              To top
            </button>
            <button
              type="button"
              onClick={() => placeAt(picked, order.length)}
              className={ICON_BUTTON}
            >
              To bottom
            </button>
            <form
              onSubmit={onPickedPosition}
              className="flex items-center gap-2"
            >
              <input
                name="position"
                type="number"
                min={1}
                max={order.length}
                placeholder="#"
                aria-label="Position"
                className={POSITION_FIELD}
              />
              <button type="submit" className={ICON_BUTTON}>
                To position
              </button>
            </form>
            <button
              type="button"
              onClick={() => setPicked(new Set())}
              className={SUBTLE_ACTION}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  );
};
