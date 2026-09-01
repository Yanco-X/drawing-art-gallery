import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError, createCollection } from '../services';
import type { Collection } from '../types';

/*
 * Naming a collection after its pieces have been picked.
 *
 * Picking first and naming second is deliberate: a collection is defined by
 * what is in it, and asking for a name up front invites naming a thing that
 * does not exist yet. Same form vocabulary as the upload modal.
 */

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

interface NewCollectionDialogProps {
  open: boolean;
  /** In pick order, which becomes the collection's display order. */
  pieceIds: string[];
  onClose: () => void;
  onCreated: (collection: Collection) => void;
}

export const NewCollectionDialog = ({
  open,
  pieceIds,
  onClose,
  onCreated,
}: NewCollectionDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fieldId = useId();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const reset = () => {
    setName('');
    setDescription('');
    setIsPublic(true);
    setError(null);
  };

  const close = () => {
    if (busy) return;
    reset();
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
        description,
        isPublic,
        pieceIds,
      });
      reset();
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
      className="m-auto w-[min(92vw,540px)] border border-line bg-surface p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-[3px]"
    >
      <form onSubmit={submit} className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-2">
          <h2
            id={fieldId + '-heading'}
            className="font-serif text-[22px] font-normal text-text"
          >
            Name this collection
          </h2>
          <p className="text-[13px] text-faint">
            {pieceIds.length} {pieceIds.length === 1 ? 'piece' : 'pieces'}, in
            the order you picked them.
          </p>
        </div>

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

        <div className="flex flex-col gap-2">
          <label htmlFor={fieldId + '-description'} className={LABEL}>
            Description
          </label>
          <textarea
            id={fieldId + '-description'}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            placeholder="What holds these together."
            className={FIELD + ' resize-y'}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-[14px] text-dim transition-colors duration-200 hover:text-text">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
            className="size-4 accent-accent"
          />
          Show this collection in the gallery
        </label>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
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
              {busy ? 'Creating…' : 'Create collection'}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
};
