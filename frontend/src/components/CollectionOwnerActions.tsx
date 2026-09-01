import { useState } from 'react';
import { ApiError, deleteCollection } from '../services';
import type { Collection } from '../types';
import { CollectionDetailsDialog } from './CollectionDetailsDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { ACTION } from './form-styles';

/*
 * The owner's actions on a collection, in the page header rather than
 * behind an edit mode — the same placement PieceWallLabel uses.
 *
 * Details and deletion are single writes and get a dialog each. Order,
 * membership and cover are one array to the API, so they live together in
 * arrange mode instead, which this only opens.
 */
export const CollectionOwnerActions = ({
  collection,
  onChanged,
  onArrange,
  onDeleted,
}: {
  collection: Collection;
  /** Handed the updated collection, so the page never has to refetch. */
  onChanged: (collection: Collection) => void;
  onArrange: () => void;
  /** Called after the collection stops existing. */
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
      <div className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={() => setDialog('details')}
          className={`${ACTION} text-faint hover:text-accent`}
        >
          Edit details
        </button>
        <button
          type="button"
          onClick={onArrange}
          className={`${ACTION} text-faint hover:text-accent`}
        >
          Arrange
        </button>
        <button
          type="button"
          onClick={() => setDialog('delete')}
          className={`${ACTION} text-faint hover:text-danger`}
        >
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
