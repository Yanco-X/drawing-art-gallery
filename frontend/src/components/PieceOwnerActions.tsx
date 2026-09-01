import { useMemo, useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { PieceDetailsDialog } from './PieceDetailsDialog';
import { useAsync } from '../hooks';
import {
  ApiError,
  createCollection,
  deletePiece,
  fetchAllCollections,
  restorePiece,
  setPieceCollections,
  waivePiece,
} from '../services';
import type { CollectionSummary, Piece } from '../types';

/*
 * The owner's actions on a piece, and the dialogs behind them.
 *
 * Exhibited work offers only Waive; delete is not reachable from the wall.
 * Waived work offers Restore and Delete permanently. That two-stage shape
 * is enforced by the API as well, so this is the affordance for a rule
 * rather than the rule itself.
 */

const ACTION =
  'cursor-pointer border-none bg-transparent p-0 text-[13px] uppercase ' +
  'tracking-btn text-faint transition-colors duration-200';

/** Stable no-op loader, so an exhibited piece issues no request. */
const NO_COLLECTIONS = async (): Promise<CollectionSummary[]> => [];

const describe = (caught: unknown): string =>
  caught instanceof ApiError
    ? caught.message
    : 'Could not reach the API. Is the backend running?';

/** Which collections a restored piece should join. */
const CollectionPicker = ({
  collections,
  selected,
  onToggle,
  loading,
  legend = 'Add to collections',
  /** Shown instead of the list when there is nothing to pick. */
  emptyMessage,
}: {
  collections: CollectionSummary[];
  selected: string[];
  onToggle: (id: string) => void;
  loading: boolean;
  legend?: string;
  emptyMessage?: string;
}) => {
  if (loading) {
    return <p className="text-[13px] text-faint">Loading collections…</p>;
  }
  if (collections.length === 0 && emptyMessage) {
    return <p className="text-[13px] text-faint">{emptyMessage}</p>;
  }

  return (
    <fieldset className="flex flex-col gap-2 border-none p-0">
      <legend className="mb-2 text-[12px] uppercase tracking-eyebrow text-muted">
        {legend}
      </legend>
      {collections.length === 0 && (
        <p className="text-[13px] text-faint">No collections yet.</p>
      )}
      {collections.map((collection) => (
        <label
          key={collection.id}
          className="flex cursor-pointer items-center gap-3 text-[14px] text-dim transition-colors duration-200 hover:text-text"
        >
          <input
            type="checkbox"
            checked={selected.includes(collection.id)}
            onChange={() => onToggle(collection.id)}
            className="size-4 accent-accent"
          />
          {collection.name}
          <span className="text-[12px] text-faint">
            {collection.pieceCount} pieces
          </span>
        </label>
      ))}
    </fieldset>
  );
};

interface PieceOwnerActionsProps {
  piece: Piece;
  /** Handed the updated piece, so the page never has to refetch it. */
  onChanged: (piece: Piece) => void;
  /** Called after the piece stops existing. */
  onDeleted: () => void;
}

export const PieceOwnerActions = ({
  piece,
  onChanged,
  onDeleted,
}: PieceOwnerActionsProps) => {
  const [dialog, setDialog] = useState<
    'waive' | 'restore' | 'delete' | 'collections' | 'edit' | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [newName, setNewName] = useState('');
  const [newIsPublic, setNewIsPublic] = useState(true);

  // Fetched only once a dialog that needs them is opened, so simply
  // viewing a piece costs no extra request.
  const needsCollections = dialog === 'restore' || dialog === 'collections';
  const loadCollections = useMemo(
    () => (needsCollections ? fetchAllCollections : NO_COLLECTIONS),
    [needsCollections],
  );
  const collections = useAsync(loadCollections);
  const available =
    collections.status === 'ready' ? collections.data : ([] as CollectionSummary[]);

  const close = () => {
    if (busy) return;
    setDialog(null);
    setError(null);
    setSelected([]);
    setNewName('');
    setNewIsPublic(true);
  };

  /**
   * Applies the checkbox state, creating the typed-in collection first if
   * there is one. Creating last-minute rather than on keystroke means
   * cancelling the dialog leaves no empty collection behind.
   */
  const saveCollections = async (): Promise<Piece> => {
    let ids = selected;
    if (newName.trim()) {
      const created = await createCollection({
        name: newName,
        description: '',
        isPublic: newIsPublic,
        pieceIds: [],
      });
      ids = [...ids, created.id];
    }
    return setPieceCollections(piece.id, ids);
  };

  const run = async <T,>(
    action: () => Promise<T>,
    after: (result: T) => void,
  ) => {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      setDialog(null);
      setSelected([]);
      after(result);
    } catch (caught) {
      setError(describe(caught));
    } finally {
      setBusy(false);
    }
  };

  const memberships = piece.collections ?? [];

  const openCollections = () => {
    setSelected(memberships.map((collection) => collection.id));
    setNewName('');
    setNewIsPublic(true);
    setDialog('collections');
  };

  const restoreLabel =
    selected.length === 0
      ? 'Restore'
      : `Restore to gallery and ${selected.length} collection${
          selected.length === 1 ? '' : 's'
        }`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-5">
        {/* Offered on waived work too: correcting a label has nothing to do
            with whether the piece is on the wall, and the reserve is where
            it would be tidied up before going back. */}
        <button
          type="button"
          onClick={() => setDialog('edit')}
          className={`${ACTION} hover:text-accent`}
        >
          Edit details
        </button>
        {piece.waivedAt ? (
          <>
            <button
              type="button"
              onClick={() => setDialog('restore')}
              className={`${ACTION} hover:text-accent`}
            >
              Restore
            </button>
            <button
              type="button"
              onClick={() => setDialog('delete')}
              className={`${ACTION} hover:text-danger`}
            >
              Delete permanently
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={openCollections}
              className={`${ACTION} hover:text-accent`}
            >
              Collections
            </button>
            <button
              type="button"
              onClick={() => setDialog('waive')}
              className={`${ACTION} hover:text-accent`}
            >
              Waive piece
            </button>
          </>
        )}
      </div>

      {/* Mounted only while open, so its fields always start from the piece
          as it stands. */}
      {dialog === 'edit' && (
        <PieceDetailsDialog
          piece={piece}
          onClose={close}
          onSaved={(saved) => {
            setDialog(null);
            onChanged(saved);
          }}
        />
      )}

      <ConfirmDialog
        open={dialog === 'waive'}
        title="Waive this piece?"
        confirmLabel="Waive"
        busyLabel="Waiving…"
        busy={busy}
        error={error}
        onCancel={close}
        onConfirm={() => run(() => waivePiece(piece.id), onChanged)}
      >
        <p>
          <span className="text-text">{piece.title}</span> will be removed
          from the gallery
          {memberships.length > 0 && (
            <>
              , and from{' '}
              {memberships.map((collection, index) => (
                <span key={collection.id}>
                  {index > 0 && (index === memberships.length - 1 ? ' and ' : ', ')}
                  <span className="text-text">{collection.name}</span>
                </span>
              ))}
            </>
          )}
          .
        </p>
        <p>
          You can restore it at any time
          {memberships.length > 0 && ', though it will not rejoin those collections on its own'}
          . It stays in the reserve until you delete it.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === 'restore'}
        title="Restore this piece?"
        confirmLabel={restoreLabel}
        busyLabel="Restoring…"
        busy={busy}
        error={error}
        onCancel={close}
        onConfirm={() => run(() => restorePiece(piece.id, selected), onChanged)}
      >
        <p>
          <span className="text-text">{piece.title}</span> will return to the
          gallery.
        </p>
        <CollectionPicker
          collections={available}
          selected={selected}
          loading={collections.status === 'loading'}
          emptyMessage="No collections yet — this will return to the gallery on its own."
          onToggle={(id) =>
            setSelected((now) =>
              now.includes(id) ? now.filter((x) => x !== id) : [...now, id],
            )
          }
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === 'collections'}
        title="Collections"
        confirmLabel="Save"
        busyLabel="Saving…"
        busy={busy}
        error={error}
        onCancel={close}
        onConfirm={() => run(saveCollections, onChanged)}
      >
        <p>
          Which collections <span className="text-text">{piece.title}</span>{' '}
          belongs to. Unticking one removes it.
        </p>
        <CollectionPicker
          collections={available}
          selected={selected}
          loading={collections.status === 'loading'}
          legend="In collections"
          onToggle={(id) =>
            setSelected((now) =>
              now.includes(id) ? now.filter((x) => x !== id) : [...now, id],
            )
          }
        />
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <label
            htmlFor="new-collection-name"
            className="text-[12px] uppercase tracking-eyebrow text-muted"
          >
            Or start a new one
          </label>
          <input
            id="new-collection-name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            maxLength={255}
            placeholder="Name it, and this piece goes in"
            className="w-full border border-line bg-bg px-3 py-2.5 text-[14px] text-text placeholder:text-faint transition-colors duration-200 focus:border-accent focus:outline-1 focus:outline-accent"
          />
          {/* Only once there is something to publish. Creating from a piece
              used to force a public collection, while creating from the grid
              offered the choice — the same act with two different rules. */}
          {newName.trim() && (
            <label className="flex cursor-pointer items-center gap-3 text-[14px] text-dim transition-colors duration-200 hover:text-text">
              <input
                type="checkbox"
                checked={newIsPublic}
                onChange={(event) => setNewIsPublic(event.target.checked)}
                className="size-4 accent-accent"
              />
              Show this collection in the gallery
            </label>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === 'delete'}
        title="Delete this piece?"
        confirmLabel="Delete permanently"
        busyLabel="Deleting…"
        tone="danger"
        busy={busy}
        error={error}
        onCancel={close}
        onConfirm={() => run(() => deletePiece(piece.id), () => onDeleted())}
      >
        <p>
          <span className="text-text">{piece.title}</span> will be removed
          from the database, and its original and both renditions deleted
          from storage.
        </p>
        <p>
          This cannot be undone. The only copy left will be whatever you
          still have on your own disk.
        </p>
      </ConfirmDialog>
    </>
  );
};
