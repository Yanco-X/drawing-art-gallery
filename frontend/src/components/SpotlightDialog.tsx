import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useAsync, usePieceFilter } from '../hooks';
import { move } from '../lib/order';
import { SPOTLIGHT_COUNT, spotlightSlots } from '../lib/spotlight';
import { ApiError, fetchPieces, setSpotlight } from '../services';
import type { Piece } from '../types';
import {
  GHOST_BUTTON,
  LABEL,
  PRIMARY_BUTTON,
  SUBTLE_ACTION,
} from './form-styles';
import { PieceFilters } from './PieceFilters';
import { PiecePickerGrid } from './PiecePickerGrid';
import { SpotlightOrder } from './SpotlightOrder';
import { SectionState } from './SectionState';

/*
 * Curating the spotlight.
 *
 * The picking vocabulary collection creation established, with the name
 * field taken out and a cap put in: five slots, numbered, and the order
 * they are picked in is the order they start in -- then dragged into the
 * order they are shown.
 *
 * The one thing this dialog does that the collection one does not is show
 * what happens to the slots left over. Filling is the whole point of the
 * feature -- pick two and the newest three follow -- and a rule you can only
 * verify by closing the dialog and looking at the page is a rule that will
 * be mistaken for a bug.
 */

/** Stable no-op loader, so a closed dialog issues no request. */
const NO_PIECES = async (): Promise<Piece[]> => [];

export const SpotlightDialog = ({
  open,
  onClose,
  picks,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  /** The current hand-picked ids, in slot order. */
  picks: string[];
  onSaved: (pieceIds: string[]) => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fieldId = useId();

  const [picked, setPicked] = useState<string[]>(picks);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPieces = useMemo(() => (open ? fetchPieces : NO_PIECES), [open]);
  const pieces = useAsync(loadPieces);
  const all = pieces.status === 'ready' ? pieces.data : [];
  const filter = usePieceFilter(all);

  // Reopened, the dialog shows what is actually saved rather than what was
  // abandoned last time.
  useEffect(() => {
    if (open) setPicked(picks);
  }, [open, picks]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const full = picked.length >= SPOTLIGHT_COUNT;

  const toggle = useCallback(
    (id: string) =>
      setPicked((now) => {
        if (now.includes(id)) return now.filter((x) => x !== id);
        // Refused rather than dropping the oldest pick: silently evicting
        // something the owner chose is worse than not adding the sixth.
        if (now.length >= SPOTLIGHT_COUNT) return now;
        return [...now, id];
      }),
    [],
  );

  // What the band will actually show, picks and fillers together.
  const slots = useMemo(() => spotlightSlots(all, picked), [all, picked]);

  const reorder = useCallback(
    (from: number, to: number) => setPicked((now) => move(now, from, to)),
    [],
  );

  const close = () => {
    if (busy) return;
    setError(null);
    filter.clear();
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await setSpotlight(picked);
      filter.clear();
      onSaved(picked);
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
            Spotlight
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
            <div className="flex flex-col gap-3">
              <span className={LABEL}>On the band</span>
              <SpotlightOrder
                slots={slots}
                pickedCount={picked.length}
                onReorder={reorder}
              />
              {picked.length > 1 && (
                <p className="text-[12px] text-faint">
                  Drag a pick to move it, or focus one and use the up and down
                  arrow keys.
                </p>
              )}
              {slots.length === 0 && (
                <p className="text-[13px] text-faint">
                  Nothing in the gallery to show yet.
                </p>
              )}
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
                    ? 'Pick up to five, or leave it empty for the newest work.'
                    : `${picked.length} of ${SPOTLIGHT_COUNT} picked.`}
                </p>
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
              {full && (
                <p className="text-[12px] text-faint">
                  Every slot is taken. Unpick one to choose another.
                </p>
              )}
            </div>

            <div className="mt-auto flex flex-col gap-3">
              {error && (
                <p role="alert" className="text-[12px] text-accent">
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={close}
                  disabled={busy}
                  className={GHOST_BUTTON}
                >
                  Cancel
                </button>
                <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
                  {busy ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </dialog>
  );
};

export default SpotlightDialog;
