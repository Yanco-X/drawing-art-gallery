import { useState } from 'react';
import { ApiError, deleteCollection } from '../services';
import type { Collection } from '../types';
import { CollectionDetailsDialog } from './CollectionDetailsDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { ICON_BUTTON, ICON_BUTTON_DANGER } from './form-styles';
import { ArrangeIcon, DeleteIcon, EditIcon } from './icons';

export const CollectionOwnerActions = ({
  collection,
  onChanged,
  onArrange,
  onDeleted,
}: {
  collection: Collection;
  onChanged: (collection: Collection) => void;
  onArrange: () => void;
  onDeleted: () => void;
}) => {
  const [dialog, setDialog] = useState<'details' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (busy) return;
    setDialog(null);
    setError(null);
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteCollection(collection.id);
      setDialog(null);
      onDeleted();
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
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setDialog('details')}
          className={ICON_BUTTON}
        >
          <EditIcon />
          Edit details
        </button>
        <button type="button" onClick={onArrange} className={ICON_BUTTON}>
          <ArrangeIcon />
          Arrange
        </button>
        <button
          type="button"
          onClick={() => setDialog('delete')}
          className={ICON_BUTTON_DANGER}
        >
          <DeleteIcon />
          Delete collection
        </button>
      </div>

      {/* Mounted only while open, so its fields always start from the
          collection as it stands. */}
      {dialog === 'details' && (
        <CollectionDetailsDialog
          collection={collection}
          onClose={close}
          onSaved={(saved) => {
            setDialog(null);
            onChanged(saved);
          }}
        />
      )}

      <ConfirmDialog
        open={dialog === 'delete'}
        title="Delete this collection?"
        confirmLabel="Delete collection"
        busyLabel="Deleting…"
        tone="danger"
        busy={busy}
        error={error}
        onCancel={close}
        onConfirm={remove}
      >
        <p>
          <span className="text-text">{collection.name}</span> will stop
          existing as a grouping.
        </p>
        <p>
          The {collection.pieceCount}{' '}
          {collection.pieceCount === 1 ? 'piece' : 'pieces'} in it are not
          touched — they stay in the gallery, and in any other collection they
          belong to. Only the grouping goes.
        </p>
      </ConfirmDialog>
    </>
  );
};
