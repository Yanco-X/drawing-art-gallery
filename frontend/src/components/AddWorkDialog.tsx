import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useAsync } from '../hooks';
import { fetchPieces } from '../services';
import type { Piece } from '../types';
import { GHOST_BUTTON, PRIMARY_BUTTON } from './form-styles';
import { PieceTile } from './PieceTile';
import { SectionState } from './SectionState';

/*
 * Picking work to add to a collection.
 *
 * Thumbnails rather than a list of titles: most of this gallery is called
 * "Untitled Study something", so a name is not enough to choose by. Ticked
 * pieces append in the order they were ticked, which is the same rule the
 * creation flow uses.
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    setPicked([]);
    onClose();
  };

  const available = (pieces.status === 'ready' ? pieces.data : []).filter(
    (piece) => !excludeIds.includes(piece.id),
  );

  const toggle = (id: string) =>
    setPicked((now) =>
      now.includes(id) ? now.filter((x) => x !== id) : [...now, id],
    );

  const confirm = () => {
    // Mapped through `picked` rather than filtered from `available`, so the
    // order they were ticked in survives into the collection.
    const chosen = picked
      .map((id) => available.find((piece) => piece.id === id))
      .filter((piece): piece is Piece => piece !== undefined);
    setPicked([]);
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
      className="m-auto w-[min(92vw,760px)] border border-line bg-surface p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-[3px]"
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-2">
          <h2
            id={headingId}
            className="font-serif text-[22px] font-normal text-text"
          >
            Add work
          </h2>
          <p className="text-[13px] text-faint">
            Pick from the gallery. They join the end of the collection, in the
            order you pick them.
          </p>
        </div>

        <div className="max-h-[52vh] overflow-y-auto">
          {pieces.status === 'error' ? (
            <SectionState message={pieces.message} />
          ) : pieces.status === 'loading' ? (
            <SectionState message="Loading work…" />
          ) : available.length === 0 ? (
            <SectionState message="Every piece in the gallery is already here." />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
              {available.map((piece) => {
                const index = picked.indexOf(piece.id);
                return (
                  <button
                    key={piece.id}
                    type="button"
                    onClick={() => toggle(piece.id)}
                    aria-pressed={index !== -1}
                    className="cursor-pointer border-none bg-transparent p-0 text-left"
                  >
                    <PieceTile piece={piece} selected={index !== -1}>
                      {index !== -1 && (
                        <span className="absolute top-2 left-2 flex size-6 items-center justify-center bg-accent text-[12px] text-on-accent">
                          {index + 1}
                        </span>
                      )}
                    </PieceTile>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
          <button type="button" onClick={close} className={GHOST_BUTTON}>
            Cancel
          </button>
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
        </div>
      </div>
    </dialog>
  );
};
