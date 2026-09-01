import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError, updateCollection } from '../services';
import type { Collection } from '../types';
import { FIELD, GHOST_BUTTON, LABEL, PRIMARY_BUTTON } from './form-styles';

/*
 * A collection's name, description and visibility.
 *
 * Same form as NewCollectionDialog, deliberately: creating a collection and
 * correcting one afterwards should not feel like two different tools.
 *
 * The slug is never sent. The API only re-slugs when it receives one, so a
 * collection keeps the URL it was first given no matter how often the name
 * changes — which is the whole reason a link to it stays good.
 */
export const CollectionDetailsDialog = ({
  collection,
  onClose,
  onSaved,
}: {
  collection: Collection;
  onClose: () => void;
  onSaved: (collection: Collection) => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fieldId = useId();

  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description);
  const [isPublic, setIsPublic] = useState(collection.isPublic);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * Mounted only while it is open, so the fields above initialise from the
   * collection as it stands right now. Syncing them from a prop in an
   * effect would be the same thing done twice, one render later.
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
    if (!name.trim()) {
      setError('A collection needs a name.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const saved = await updateCollection(collection.id, {
        name: name.trim(),
        description: description.trim(),
        isPublic,
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
        if (busy) event.preventDefault();
      }}
      onClose={close}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      className="m-auto w-[min(92vw,540px)] border border-line bg-surface p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-[3px]"
    >
      <form onSubmit={submit} className="flex flex-col gap-5 p-6">
        <h2
          id={fieldId + '-heading'}
          className="font-serif text-[22px] font-normal text-text"
        >
          Edit details
        </h2>

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
            className={FIELD}
          />
          <p className="text-[12px] text-faint">
            Renaming keeps the current address, so existing links still work.
          </p>
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
