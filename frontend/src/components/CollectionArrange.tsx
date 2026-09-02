import { useState } from 'react';
import type { DragEvent, KeyboardEvent } from 'react';
import { ApiError, setCollectionPieces } from '../services';
import type { Collection, Piece } from '../types';
import { AddWorkDialog } from './AddWorkDialog';
import { PieceTile } from './PieceTile';
import { GHOST_BUTTON, ICON_BUTTON, PRIMARY_BUTTON } from './form-styles';

/*
 * Arranging a collection: order, membership and cover, in one mode.
 *
 * All three are one array and one pointer to the backend, and
 * PUT .../pieces writes them in a single idempotent request — so they get
 * one mode and one Save rather than three controls writing separately.
 * Nothing reaches the API until Save: a drop that wrote immediately would
 * turn a curation session into a dozen requests, and make an accidental
 * drag permanent.
 *
 * The grid is a plain ordered one, not the masonry. The masonry fills
 * top-to-bottom down each column, which is unreadable when the thing being
 * edited is the sequence itself.
 */

const BADGE =
  'absolute flex size-6 items-center justify-center text-[12px] leading-none';

const move = <T,>(items: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [lifted] = next.splice(from, 1);
  next.splice(to, 0, lifted);
  return next;
};

export const CollectionArrange = ({
  collection,
  onCancel,
  onSaved,
}: {
  collection: Collection;
  onCancel: () => void;
  onSaved: (collection: Collection) => void;
}) => {
  const [order, setOrder] = useState<Piece[]>(collection.pieces);
  const [coverId, setCoverId] = useState<string | null>(
    collection.coverPieceId,
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  // Null means no cover was chosen and the API is showing the first member.
  // Worth keeping distinct: it is a fallback, not a decision.
  const effectiveCoverId = coverId ?? order[0]?.id ?? null;

  const reorder = (from: number, to: number) => {
    const next = move(order, from, to);
    if (next === order) return;
    setOrder(next);
    setAnnouncement(
      `${next[to].title} moved to position ${to + 1} of ${next.length}.`,
    );
  };

  const remove = (piece: Piece) => {
    setOrder((now) => now.filter((candidate) => candidate.id !== piece.id));
    // A cover that is no longer a member would name a piece the collection
    // does not hold. The API enforces this too; doing it here keeps the
    // pending state honest before Save.
    if (coverId === piece.id) setCoverId(null);
    setAnnouncement(`${piece.title} removed.`);
  };

  const add = (pieces: Piece[]) => {
    setAdding(false);
    setOrder((now) => {
      const held = new Set(now.map((piece) => piece.id));
      return [...now, ...pieces.filter((piece) => !held.has(piece.id))];
    });
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const saved = await setCollectionPieces(
        collection.id,
        order.map((piece) => piece.id),
        coverId,
      );
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

  const onDragStart = (event: DragEvent<HTMLLIElement>, index: number) => {
    setDragIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    // Firefox starts no drag at all without data on the transfer.
    event.dataTransfer.setData('text/plain', String(index));
  };

  const onDragOver = (event: DragEvent<HTMLLIElement>, index: number) => {
    if (dragIndex === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setOverIndex(index);
  };

  const onDrop = (event: DragEvent<HTMLLIElement>, index: number) => {
    event.preventDefault();
    if (dragIndex !== null) reorder(dragIndex, index);
    setDragIndex(null);
    setOverIndex(null);
  };

  // Native drag and drop is mouse-only, so the same move is on the arrows.
  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    reorder(index, index + (event.key === 'ArrowLeft' ? -1 : 1));
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-accent px-5 py-4">
        <div className="flex flex-col gap-1">
          <p className="text-[13px] text-dim">
            {order.length === 0
              ? 'This collection is empty. Add work, or save it as it is.'
              : `${order.length} ${order.length === 1 ? 'piece' : 'pieces'}, in the order they hang.`}
          </p>
          <p className="text-[12px] text-faint">
            Drag a piece to move it, or focus one and use the left and right
            arrow keys.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAdding(true)}
            disabled={busy}
            className={ICON_BUTTON}
          >
            + Add work
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={GHOST_BUTTON}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className={PRIMARY_BUTTON}
          >
            {busy ? 'Saving…' : 'Save arrangement'}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-6 text-[13px] text-danger">
          {error}
        </p>
      )}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 p-0">
        {order.map((piece, index) => {
          const isCover = piece.id === effectiveCoverId;
          return (
            <li
              key={piece.id}
              draggable
              tabIndex={0}
              aria-label={`${piece.title}, position ${index + 1} of ${order.length}`}
              onDragStart={(event) => onDragStart(event, index)}
              onDragOver={(event) => onDragOver(event, index)}
              onDrop={(event) => onDrop(event, index)}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`cursor-grab transition-opacity duration-200 focus:outline-1 focus:outline-offset-2 focus:outline-accent ${
                dragIndex === index ? 'opacity-40' : ''
              } ${overIndex === index && dragIndex !== index ? 'outline-1 outline-offset-2 outline-accent' : ''}`}
            >
              <PieceTile piece={piece} selected={isCover}>
                <span
                  className={`${BADGE} top-2 left-2 bg-accent text-on-accent`}
                >
                  {index + 1}
                </span>

                <button
                  type="button"
                  onClick={() => remove(piece)}
                  aria-label={`Remove ${piece.title} from this collection`}
                  className={`${BADGE} top-2 right-2 cursor-pointer border-none bg-bg-translucent text-muted transition-colors duration-200 hover:text-danger`}
                >
                  ×
                </button>

                <button
                  type="button"
                  onClick={() => setCoverId(isCover && coverId ? null : piece.id)}
                  title={
                    isCover && !coverId
                      ? 'No cover chosen — showing the first piece'
                      : undefined
                  }
                  className={`absolute bottom-2 left-2 cursor-pointer px-2 py-1 text-[11px] uppercase tracking-nav transition-colors duration-200 ${
                    isCover
                      ? coverId
                        ? 'border-none bg-accent text-on-accent'
                        : 'border border-accent bg-bg-translucent text-accent'
                      : 'border border-line bg-bg-translucent text-muted hover:border-accent hover:text-accent'
                  }`}
                >
                  Cover
                </button>
              </PieceTile>
            </li>
          );
        })}
      </ul>

      <AddWorkDialog
        open={adding}
        excludeIds={order.map((piece) => piece.id)}
        onClose={() => setAdding(false)}
        onAdd={add}
      />
    </>
  );
};
