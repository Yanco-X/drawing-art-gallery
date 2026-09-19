import { PAGE_ACTION } from './form-styles';
import { ExpandIcon } from './icons';
import type { Piece } from '../types';

export const DetailedViewButton = ({
  piece,
  onOpen,
}: {
  piece: Piece;
  onOpen: () => void;
}) => {
  // A piece imported before dimensions were recorded has none. The button
  // still works -- it just cannot make the boast.
  const measured = piece.width && piece.height;

  return (
    <div className="mt-6 flex w-full flex-col items-center gap-2">
      {/* Named, so a view transition stretches the box to the new width
          rather than cutting to it. The label is named apart from it: a
          named descendant is left out of its parent's capture, so the box
          is a flat rectangle that stretches cleanly while the label stays
          sharp and only re-centres. */}
      <button
        type="button"
        onClick={onOpen}
        className={PAGE_ACTION + ' [view-transition-name:detailed-view]'}
      >
        <span className="flex items-center gap-2.5 [view-transition-name:detailed-view-label]">
          <ExpandIcon />
          Detailed view
        </span>
      </button>
      <p className="text-[12px] text-faint">
        {measured
          ? `Full resolution · ${piece.width} × ${piece.height}`
          : 'Full resolution · zoom and pan'}
        {measured && !piece.tileSource && ' · deep zoom not built yet'}
      </p>
    </div>
  );
};
