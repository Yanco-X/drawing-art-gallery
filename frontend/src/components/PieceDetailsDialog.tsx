import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { dropDraft, keepDraft, readDraft, savedFields } from '../lib/pieceDraft';
import type { PieceFields } from '../lib/pieceDraft';
import { BAND_PREVIEWS } from '../lib/spotlight';
import { effectiveYear } from '../lib/year';
import { ApiError, updatePiece } from '../services';
import type { Piece } from '../types';
import {
  FIELD,
  GHOST_BUTTON,
  LABEL,
  PRIMARY_BUTTON,
  SUBTLE_ACTION,
} from './form-styles';
import { FocalPicker } from './FocalPicker';
import { TagInput } from './TagInput';
import { YearField } from './YearField';

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

  /*
   * Mounted only while open, so the fields initialise from the piece as it
   * stands, or from the draft a close left behind. Syncing from a prop in an
   * effect would be the same thing done twice, one render later.
   */
  const [draft] = useState(() => readDraft(piece.id));
  const [fields, setFields] = useState(() => draft ?? savedFields(piece));
  const [restored, setRestored] = useState(draft !== null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { title, description, medium, year, createdDate, tags, focal } = fields;

  const setField = <K extends keyof PieceFields>(key: K, value: PieceFields[K]) =>
    setFields((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // On every change rather than on close: a reload never closes the dialog.
  useEffect(() => {
    keepDraft(piece.id, fields, savedFields(piece));
  }, [piece, fields]);

  const discard = () => {
    setFields(savedFields(piece));
    setRestored(false);
  };

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
        // A date made outranks it, so correcting the date corrects the year
        // rather than leaving the two to disagree.
        year: effectiveYear(year.trim(), createdDate) || null,
        createdDate: createdDate || null,
        focalX: focal.x,
        focalY: focal.y,
        focalZoom: focal.zoom,
        tags,
      });
      dropDraft(piece.id);
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
      className="m-auto max-h-[90vh] w-[min(94vw,940px)] border border-line bg-surface p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-[3px]"
    >
      <form onSubmit={submit} className="flex max-h-[90vh] flex-col">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2
            id={fieldId + '-heading'}
            className="font-display text-[22px] font-normal text-text"
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

        {restored && (
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line bg-bg px-6 py-3">
            <p className="text-[13px] text-dim">
              Your unsaved changes from last time are back.
            </p>
            <button type="button" onClick={discard} className={SUBTLE_ACTION}>
              Discard them
            </button>
          </div>
        )}

        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            <FocalPicker
              piece={piece}
              x={focal.x}
              y={focal.y}
              zoom={focal.zoom}
              onChange={(next) => setField('focal', next)}
              previews={BAND_PREVIEWS}
              fillHint="Fills its half of the band, whatever shape that is."
            />
            <p className="text-[12px] text-faint">
              The wall label and the crop — the artwork itself stays as
              uploaded.
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
                  setField('title', event.target.value);
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
                onChange={(event) => setField('description', event.target.value)}
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
                  onChange={(event) => setField('medium', event.target.value)}
                  maxLength={100}
                  placeholder="Charcoal"
                  className={FIELD}
                />
              </div>

              <YearField
                id={fieldId + '-year'}
                year={year}
                createdDate={createdDate}
                onChange={(value) => {
                  setError(null);
                  setField('year', value);
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={fieldId + '-created'} className={LABEL}>
                Date made
              </label>
              <input
                id={fieldId + '-created'}
                type="date"
                value={createdDate}
                onChange={(event) => {
                  setError(null);
                  setField('createdDate', event.target.value);
                }}
                className={FIELD}
              />
            </div>

            <TagInput
              id={fieldId + '-tags'}
              tags={tags}
              onChange={(next) => setField('tags', next)}
            />
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
