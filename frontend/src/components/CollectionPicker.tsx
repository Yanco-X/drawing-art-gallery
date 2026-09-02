import type { CollectionSummary } from '../types';

/*
 * A checkbox per collection.
 *
 * Used wherever a piece's membership is decided: restoring one from the
 * reserve, editing an existing piece's collections, and uploading a new
 * one. Deliberately dumb — the caller owns the selected ids and decides
 * what saving them means, because "append on restore" and "replace the
 * whole set" are the same control with different consequences.
 */
export const CollectionPicker = ({
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
