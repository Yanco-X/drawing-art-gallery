import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { DragEvent, FormEvent } from 'react';
import { useAsync } from '../hooks';
import { ApiError, createPiece, fetchAllCollections } from '../services';
import type { CollectionSummary, NewPiece, Piece } from '../types';
import { CollectionPicker } from './CollectionPicker';
import { TagInput } from './TagInput';

/*
 * Add work.
 *
 * Built on a native <dialog>: focus trapping, Escape to dismiss, an inert
 * background and top-layer stacking all come from the platform, which is
 * considerably more reliable than a hand-rolled focus trap.
 *
 * The design system had no form vocabulary, so this establishes one --
 * 1px lines instead of elevation, square corners, uppercase eyebrow labels
 * in `muted` rather than `faint` (which is too quiet to read as an
 * instruction), and the gold accent spent only on focus, required marks,
 * and the confirming button.
 */

/** Mirrors MAX_UPLOAD_MB in backend/app/config.py. */
const MAX_UPLOAD_MB = 40;

/** Stable no-op loader, so a closed dialog issues no request. */
const NO_COLLECTIONS = async (): Promise<CollectionSummary[]> => [];

const EMPTY_FIELDS = {
  title: '',
  description: '',
  medium: '',
  year: '',
  createdDate: '',
};

const LABEL = 'text-[12px] uppercase tracking-eyebrow text-muted';

const FIELD =
  'w-full border border-line bg-bg px-3 py-2.5 text-[14px] text-text ' +
  'placeholder:text-faint transition-colors duration-200 ' +
  'focus:border-accent focus:outline-1 focus:outline-accent';

const PRIMARY_BUTTON =
  'cursor-pointer border-none bg-accent px-5 py-2.5 text-[13px] uppercase ' +
  'tracking-btn text-on-accent transition-opacity duration-200 ' +
  'hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';

const GHOST_BUTTON =
  'cursor-pointer border border-line bg-transparent px-5 py-2.5 text-[13px] ' +
  'uppercase tracking-btn text-muted transition-colors duration-200 ' +
  'hover:border-accent hover:text-accent disabled:cursor-not-allowed ' +
  'disabled:opacity-40';

const dropZoneClasses = (dragging: boolean, hasFile: boolean) =>
  [
    'relative flex min-h-[280px] w-full cursor-pointer items-center',
    'justify-center overflow-hidden border p-4 transition-colors duration-200',
    hasFile ? 'bg-bg' : 'hatch',
    dragging ? 'border-accent' : 'border-line hover:border-accent',
  ].join(' ');

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  /** Handed the created piece so the caller can show it without a refetch. */
  onUploaded?: (piece: Piece) => void;
}

export const UploadModal = ({ open, onClose, onUploaded }: UploadModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Counts enter/leave pairs: dragging over a child element fires dragleave
  // on the parent, which would otherwise make the highlight flicker.
  const dragDepth = useRef(0);
  const fieldId = useId();

  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [tags, setTags] = useState<string[]>([]);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // showModal() cannot be expressed as a prop, so open state is mirrored
  // onto the element imperatively.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // Drafts included: uploading is an owner act, and a draft is exactly the
  // kind of collection new work gets gathered into. Fetched only while the
  // dialog is open, so the page costs nothing until Add work is clicked.
  const loadCollections = useMemo(
    () => (open ? fetchAllCollections : NO_COLLECTIONS),
    [open],
  );
  const collections = useAsync(loadCollections);

  // Derived from the file rather than stored: the preview is not
  // independent state, and computing it in an effect would render once with
  // no image and again with it.
  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  // Revoking is the one part that is a real side effect. Leaking an object
  // URL pins the entire file in memory for the life of the page.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const reset = () => {
    setFields(EMPTY_FIELDS);
    setTags([]);
    setCollectionIds([]);
    setFile(null);
    setError(null);
    dragDepth.current = 0;
    setDragging(false);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const setField = (key: keyof typeof EMPTY_FIELDS, value: string) => {
    // Any edit clears the message: leaving "a piece needs a title" up while
    // a title sits in the box reads as though the form is still refusing.
    setError(null);
    setFields((current) => ({ ...current, [key]: value }));
  };

  const acceptFile = (candidate: File | undefined) => {
    if (!candidate) return;
    // Advisory only: the API decides what is an image by decoding it.
    if (!candidate.type.startsWith('image/')) {
      setError('That file is not an image.');
      return;
    }
    if (candidate.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError('Images must be under ' + MAX_UPLOAD_MB + ' MB.');
      return;
    }
    setError(null);
    setFile(candidate);
  };

  const onDragEnter = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) setDragging(false);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    acceptFile(event.dataTransfer.files[0]);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('Choose an image to upload.');
      return;
    }
    if (!fields.title.trim()) {
      setError('A piece needs a title.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const payload: NewPiece = { ...fields, file, tags, collectionIds };
      const piece = await createPiece(payload);
      onUploaded?.(piece);
      reset();
      onClose();
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

  // Spelled out the way Restore does, so the picked collections are
  // confirmed by the button that acts on them rather than only by ticks
  // sitting further up a scrolled form.
  const submitLabel =
    collectionIds.length === 0
      ? 'Add to gallery'
      : `Add to gallery and ${collectionIds.length} collection${
          collectionIds.length === 1 ? '' : 's'
        }`;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={fieldId + '-heading'}
      // Escape fires cancel, then close. Both are refused mid-upload so a
      // stray keypress cannot abandon a request already in flight.
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onClose={close}
      onClick={(event) => {
        // Backdrop clicks are dispatched to the dialog element itself.
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
            Add work
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
            <span className={LABEL}>
              Artwork <span className="text-accent">*</span>
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={onDragEnter}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={dropZoneClasses(dragging, Boolean(preview))}
            >
              {preview ? (
                <img
                  src={preview}
                  alt=""
                  className="max-h-[420px] w-full object-contain"
                />
              ) : (
                <span className="flex flex-col items-center gap-2 text-center">
                  <span className="text-[14px] text-dim">
                    Drop an image here
                  </span>
                  <span className="text-[12px] text-muted">
                    or click to browse
                  </span>
                </span>
              )}
            </button>

            {file && (
              <p className="text-[12px] text-faint">
                {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => acceptFile(event.target.files?.[0])}
            />

            {/* Under the artwork rather than beside the wall label: this is
                about where the piece hangs, not what the label says, and
                this column has the room the other one does not. */}
            <div className="mt-4 border-t border-line pt-4">
              <CollectionPicker
                collections={
                  collections.status === 'ready' ? collections.data : []
                }
                selected={collectionIds}
                loading={collections.status === 'loading'}
                emptyMessage={
                  // An unreachable API and an empty gallery are not the same
                  // answer, and "no collections yet" would be a lie about
                  // the first one.
                  collections.status === 'error'
                    ? 'Could not load collections — you can add this piece to one afterwards.'
                    : 'No collections yet — this goes straight to the gallery.'
                }
                onToggle={(id) =>
                  setCollectionIds((now) =>
                    now.includes(id)
                      ? now.filter((x) => x !== id)
                      : [...now, id],
                  )
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor={fieldId + '-title'} className={LABEL}>
                Title <span className="text-accent">*</span>
              </label>
              <input
                id={fieldId + '-title'}
                value={fields.title}
                onChange={(event) => setField('title', event.target.value)}
                maxLength={255}
                placeholder="Night Calls V"
                className={FIELD}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={fieldId + '-description'} className={LABEL}>
                Description
              </label>
              <textarea
                id={fieldId + '-description'}
                value={fields.description}
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
                  value={fields.medium}
                  onChange={(event) => setField('medium', event.target.value)}
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
                  type="number"
                  value={fields.year}
                  onChange={(event) => setField('year', event.target.value)}
                  min={1}
                  max={9999}
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
                value={fields.createdDate}
                onChange={(event) => setField('createdDate', event.target.value)}
                className={FIELD}
              />
            </div>

            <TagInput id={fieldId + '-tags'} tags={tags} onChange={setTags} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-4">
          <p role="alert" className="text-[13px] text-accent">
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
              {busy ? 'Uploading…' : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
};
