import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError, updatePiece } from '../services';
import type { Piece } from '../types';
import { FIELD, GHOST_BUTTON, LABEL, PRIMARY_BUTTON } from './form-styles';
import { TagInput } from './TagInput';

/*
 * Correcting a piece's wall label.
 *
 * The same shape as the upload modal — artwork on the left, the fields it
 * describes on the right — because they are the same act at different
 * times. A piece uploaded in a hurry and corrected later should not have to
 * be described twice in two different layouts.
 *
 * The image is shown but not editable. Replacing the bytes behind an id
 * would mean re-deriving both renditions and invalidating every URL already
 * handed out, which is a different act from fixing a title. Showing it
 * still earns its place: these fields describe a drawing, and choosing a
 * medium or a year from memory is guesswork.
 */
export const PieceDetailsDialog = ({
  piece,
  onClose,
  onSaved,
}: {
  piece: Piece;
  onClose: () => void;
  onSaved: (piece: Piece) => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fieldId = useId();

  const [title, setTitle] = useState(piece.title);
  const [description, setDescription] = useState(piece.description);
  const [medium, setMedium] = useState(piece.medium ?? '');
  const [year, setYear] = useState(piece.year === null ? '' : String(piece.year));
  const [createdDate, setCreatedDate] = useState(piece.createdDate ?? '');
  const [tags, setTags] = useState(piece.tags.map((tag) => tag.name));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  /*
   * Mounted only while open, so the fields above initialise from the piece
   * as it stands. Syncing them from a prop in an effect would be the same
   * thing done twice, one render later.
   */
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const close = () => {
    if (busy) return;
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('A piece needs a title.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const saved = await updatePiece(piece.id, {
        title: title.trim(),
        description: description.trim(),
        medium: medium.trim(),
        // Sent as typed. Number('soon') is NaN, which JSON turns into null,
        // and a mistyped year would silently vanish instead of being refused.
        year: year.trim() || null,
        createdDate: createdDate || null,
        tags,
      });
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

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={fieldId + '-heading'}
      onCancel={(event) => {
        // Refused mid-request, so a stray Escape cannot abandon a save
        // already in flight.
        if (busy) event.preventDefault();
      }}
      onClose={close}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      className="m-auto max-h-[90vh] w-[min(94vw,940px)] border border-line bg-surface p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-[3px]"
    >
      <form onSubmit={submit} className="flex max-h-[90vh] flex-col">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2
            id={fieldId + '-heading'}
            className="font-serif text-[22px] font-normal text-text"
          >
            Edit details
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

        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className={LABEL}>Artwork</span>
            {/* The hatch sits underneath, so a slow or broken load shows the
                placeholder rather than a hole. */}
            <div className="hatch flex items-center justify-center border border-line p-2">
              {failed ? (
                <span className="py-16 font-mono text-[11px] tracking-[0.05em] text-faint">
                  [ artwork unavailable ]
                </span>
              ) : (
                <img
                  src={piece.imageUrl}
                  alt={piece.title}
                  onError={() => setFailed(true)}
                  className="max-h-[420px] w-full object-contain"
                />
              )}
            </div>
            <p className="text-[12px] text-faint">
              The wall label only — the artwork itself stays as uploaded.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor={fieldId + '-title'} className={LABEL}>
                Title <span className="text-accent">*</span>
              </label>
              <input
                id={fieldId + '-title'}
                value={title}
                onChange={(event) => {
                  setError(null);
                  setTitle(event.target.value);
                }}
                maxLength={255}
                className={FIELD}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={fieldId + '-description'} className={LABEL}>
                Description
              </label>
              <textarea
                id={fieldId + '-description'}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="A note about the work, shown on its page."
                className={FIELD + ' resize-y'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={fieldId + '-medium'} className={LABEL}>
                  Medium
                </label>
                <input
                  id={fieldId + '-medium'}
                  value={medium}
                  onChange={(event) => setMedium(event.target.value)}
                  maxLength={100}
                  placeholder="Charcoal"
                  className={FIELD}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={fieldId + '-year'} className={LABEL}>
                  Year
                </label>
                <input
                  id={fieldId + '-year'}
                  inputMode="numeric"
                  value={year}
                  onChange={(event) => {
                    setError(null);
                    setYear(event.target.value);
                  }}
                  placeholder="2026"
                  className={FIELD}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={fieldId + '-created'} className={LABEL}>
                Date made
              </label>
              <input
                id={fieldId + '-created'}
                type="date"
                value={createdDate}
                onChange={(event) => setCreatedDate(event.target.value)}
                className={FIELD}
              />
            </div>

            <TagInput id={fieldId + '-tags'} tags={tags} onChange={setTags} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-4">
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
          <div className="ml-auto flex items-center gap-3">
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
      </form>
    </dialog>
  );
};
