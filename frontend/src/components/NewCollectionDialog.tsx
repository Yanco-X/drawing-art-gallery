import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useAsync, usePieceFilter } from '../hooks';
import { ApiError, createCollection, fetchPieces } from '../services';
import type { Collection, Piece } from '../types';
import {
  FIELD,
  GHOST_BUTTON,
  LABEL,
  PRIMARY_BUTTON,
  SUBTLE_ACTION,
} from './form-styles';
import { PieceFilters } from './PieceFilters';
import { PiecePickerGrid } from './PiecePickerGrid';
import { SectionState } from './SectionState';

/*
 * Building a collection: pick the work, name it, save.
 *
 * One dialog rather than a mode on the gallery page. Picking used to put
 * the landing page into a selection state, which meant scrolling the whole
 * gallery to choose and scrolling back to the top to name it or cancel.
 * Here the work and the controls are on screen at once, and the filters
 * mean the scroll is usually unnecessary.
 *
 * Picking itself is unchanged — click a piece, get a number, and the order
 * of the numbers is the order the collection hangs in.
 */

/** Stable no-op loader, so a closed dialog issues no request. */
const NO_PIECES = async (): Promise<Piece[]> => [];

export const NewCollectionDialog = ({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (collection: Collection) => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fieldId = useId();

  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPieces = useMemo(() => (open ? fetchPieces : NO_PIECES), [open]);
  const pieces = useAsync(loadPieces);
  const all = pieces.status === 'ready' ? pieces.data : [];
  const filter = usePieceFilter(all);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const toggle = useCallback(
    (id: string) =>
      setPicked((now) =>
        now.includes(id) ? now.filter((x) => x !== id) : [...now, id],
      ),
    [],
  );

  const close = () => {
    if (busy) return;
    setName('');
    setPicked([]);
    setError(null);
    filter.clear();
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('A collection needs a name.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const collection = await createCollection({
        name,
        description: '',
        isPublic: true,
        pieceIds: picked,
      });
      setName('');
      setPicked([]);
      filter.clear();
      onCreated(collection);
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

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={fieldId + '-heading'}
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onClose={close}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      className="m-auto h-[92vh] w-[94vw] max-w-[2200px] border border-line bg-surface p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-[3px]"
    >
      <form onSubmit={submit} className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2
            id={fieldId + '-heading'}
            className="font-serif text-[22px] font-normal text-text"
          >
            New collection
          </h2>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Close"
            className="cursor-pointer border-none bg-transparent text-[22px] leading-none text-muted transition-colors duration-200 hover:text-accent disabled:opacity-40"
          >
            &times;
          </button>
        </div>

        {/* 80/20. The grid scrolls on its own, so the controls never leave
            the screen no matter how far into the gallery the picking goes. */}
        <div className="grid min-h-0 flex-1 md:grid-cols-[4fr_1fr]">
          <div className="min-h-0 overflow-y-auto p-6">
            {pieces.status === 'error' ? (
              <SectionState message={pieces.message} />
            ) : pieces.status === 'loading' ? (
              <SectionState message="Loading work…" />
            ) : (
              <PiecePickerGrid
                pieces={filter.filtered}
                picked={picked}
                onToggle={toggle}
                emptyMessage={
                  filter.active
                    ? 'Nothing matches those filters.'
                    : 'No work in the gallery yet.'
                }
              />
            )}
          </div>

          <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto border-t border-line p-6 md:border-t-0 md:border-l">
            <div className="flex flex-col gap-2">
              <label htmlFor={fieldId + '-name'} className={LABEL}>
                Name <span className="text-accent">*</span>
              </label>
              <input
                id={fieldId + '-name'}
                value={name}
                onChange={(event) => {
                  setError(null);
                  setName(event.target.value);
                }}
                maxLength={255}
                placeholder="Night Calls"
                className={FIELD}
              />
            </div>

            <PieceFilters
              id={fieldId}
              query={filter.query}
              onQueryChange={filter.setQuery}
              year={filter.year}
              onYearChange={filter.setYear}
              years={filter.years}
              showing={filter.filtered.length}
              total={all.length}
              active={filter.active}
              onClear={filter.clear}
            />

            <div className="flex flex-col gap-1 border-t border-line pt-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] text-dim">
                  {picked.length === 0
                    ? 'Pick the pieces for this collection.'
                    : `${picked.length} ${picked.length === 1 ? 'piece' : 'pieces'} picked.`}
                </p>
                {/* Only once there is something to undo. Unpicking is not a
                    filter — it clears the choice, not the view — so it sits
                    with the count rather than with the filters. */}
                {picked.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPicked([])}
                    className={SUBTLE_ACTION}
                  >
                    Unpick all
                  </button>
                )}
              </div>
              <p className="text-[12px] text-faint">
                They hang in the order you pick them.
              </p>
            </div>

            {/* Pushed to the bottom of the column, so the buttons sit in the
                same place whether or not the filters are showing a year. */}
            <div className="mt-auto flex flex-col gap-3 border-t border-line pt-4">
              <p role="alert" className="text-[13px] text-danger empty:hidden">
                {error}
              </p>
              <button
                type="submit"
                disabled={busy || picked.length === 0}
                className={PRIMARY_BUTTON}
              >
                {busy ? 'Creating…' : 'Create collection'}
              </button>
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className={GHOST_BUTTON}
              >
                Cancel
              </button>
            </div>
          </aside>
        </div>
      </form>
    </dialog>
  );
};
