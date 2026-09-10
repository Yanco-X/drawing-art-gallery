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
      <button type="button" onClick={onOpen} className={PAGE_ACTION}>
        <ExpandIcon />
        Detailed view
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
