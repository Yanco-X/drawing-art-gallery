import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useAsync, usePieceFilter } from '../hooks';
import { fetchPieces } from '../services';
import type { Piece } from '../types';
import { GHOST_BUTTON, PRIMARY_BUTTON, SUBTLE_ACTION } from './form-styles';
import { PieceFilters } from './PieceFilters';
import { PiecePickerGrid } from './PiecePickerGrid';
import { SectionState } from './SectionState';

/*
 * Picking work to add to a collection already being arranged.
 *
 * The same shape as the new collection dialog — grid on the left, controls
 * on the right — because it is the same act. Ticked pieces append in the
 * order they were ticked, which is the rule everywhere else pieces are
 * picked.
 */

/** Stable no-op loader, so a closed dialog issues no request. */
const NO_PIECES = async (): Promise<Piece[]> => [];

export const AddWorkDialog = ({
  open,
  excludeIds,
  onClose,
  onAdd,
}: {
  open: boolean;
  /** Already in the collection, so not offered again. */
  excludeIds: string[];
  onClose: () => void;
  /** Handed the picked pieces, in pick order. */
  onAdd: (pieces: Piece[]) => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const [picked, setPicked] = useState<string[]>([]);

  const loadPieces = useMemo(() => (open ? fetchPieces : NO_PIECES), [open]);
  const pieces = useAsync(loadPieces);

  const available = useMemo(
    () =>
      (pieces.status === 'ready' ? pieces.data : []).filter(
        (piece) => !excludeIds.includes(piece.id),
      ),
    [pieces, excludeIds],
  );
  const filter = usePieceFilter(available);

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
    setPicked([]);
    filter.clear();
    onClose();
  };

  const confirm = () => {
    // Mapped through `picked` rather than filtered from `available`, so the
    // order they were ticked in survives into the collection.
    const chosen = picked
      .map((id) => available.find((piece) => piece.id === id))
      .filter((piece): piece is Piece => piece !== undefined);
    setPicked([]);
    filter.clear();
    onAdd(chosen);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onClose={close}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      className="m-auto h-[92vh] w-[94vw] max-w-[2200px] border border-line bg-surface p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-[3px]"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2
            id={headingId}
            className="font-serif text-[22px] font-normal text-text"
          >
            Add work
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="cursor-pointer border-none bg-transparent text-[22px] leading-none text-muted transition-colors duration-200 hover:text-accent"
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
                    : 'Every piece in the gallery is already here.'
                }
              />
            )}
          </div>

          <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto border-t border-line p-6 md:border-t-0 md:border-l">
            <p className="text-[13px] text-faint">
              Pick from the gallery. They join the end of the collection, in
              the order you pick them.
            </p>

            <PieceFilters
              id={headingId}
              query={filter.query}
              onQueryChange={filter.setQuery}
              year={filter.year}
              onYearChange={filter.setYear}
              years={filter.years}
              showing={filter.filtered.length}
              total={available.length}
              active={filter.active}
              onClear={filter.clear}
            />

            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-4">
              <p className="text-[13px] text-dim">
                {picked.length === 0
                  ? 'Nothing picked yet.'
                  : `${picked.length} ${picked.length === 1 ? 'piece' : 'pieces'} picked.`}
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

            <div className="mt-auto flex flex-col gap-3 border-t border-line pt-4">
              <button
                type="button"
                onClick={confirm}
                disabled={picked.length === 0}
                className={PRIMARY_BUTTON}
              >
                {picked.length === 0
                  ? 'Add'
                  : `Add ${picked.length} ${picked.length === 1 ? 'piece' : 'pieces'}`}
              </button>
              <button type="button" onClick={close} className={GHOST_BUTTON}>
                Cancel
              </button>
            </div>
          </aside>
        </div>
      </div>
    </dialog>
  );
};
