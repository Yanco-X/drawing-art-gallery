import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { COVER_PREVIEWS, COVER_ZOOM_MAX } from '../lib/spotlight';
import { ApiError, updateCollection } from '../services';
import type { Collection, Piece } from '../types';
import { FocalPicker } from './FocalPicker';
import { GHOST_BUTTON, PRIMARY_BUTTON } from './form-styles';

export const CollectionCoverDialog = ({
  collection,
  cover,
  onClose,
  onSaved,
}: {
  collection: Collection;
  cover: Piece;
  onClose: () => void;
  onSaved: (collection: Collection) => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  const [framing, setFraming] = useState({
    x: collection.coverFocalX,
    y: collection.coverFocalY,
    zoom: collection.coverZoom,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mounted only while open, as the details dialog is, so the framing
  // starts from the collection as it stands.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const close = () => {
    if (busy) return;
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Named even when it is only the first-member fallback: the framing
      // holds for this picture alone, so saving it pins the picture.
      const saved = await updateCollection(collection.id, {
        coverPieceId: cover.id,
        coverFocalX: framing.x,
        coverFocalY: framing.y,
        coverZoom: framing.zoom,
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
      aria-labelledby={headingId}
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onClose={close}
      className="m-auto max-h-[90vh] w-[min(92vw,640px)] border border-line bg-surface p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-[3px]"
    >
      <form onSubmit={submit} className="flex max-h-[90vh] flex-col">
        <h2
          id={headingId}
          className="border-b border-line px-6 py-5 font-display text-[22px] font-normal text-text"
        >
          Frame the cover
        </h2>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <FocalPicker
            piece={cover}
            x={framing.x}
            y={framing.y}
            zoom={framing.zoom}
            onChange={setFraming}
            previews={COVER_PREVIEWS}
            fillHint="Fills the card, however wide it is."
            zoomMax={COVER_ZOOM_MAX}
          />
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
