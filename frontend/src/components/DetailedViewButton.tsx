import { PAGE_ACTION } from './form-styles';
import { ExpandIcon } from './icons';
import type { Piece } from '../types';

/*
 * The invitation to look properly.
 *
 * Beneath the artwork rather than in the wall label rail, spanning the image
 * column: it is about the work, not about the label, and it is the widest
 * thing on the page. Shown to everyone -- for a visitor it is the only
 * action this page offers, and the one that most resembles standing in
 * front of the drawing.
 *
 * The dimensions underneath are doing the persuading. "4999 x 5001" tells
 * you there is four times more here than you are looking at, which is a
 * more honest reason to click than any amount of button styling.
 */
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
        {/* Said plainly rather than hidden: a piece still waiting on its
            pyramid opens at display size, and pretending otherwise would
            make the boast above a lie. */}
        {measured && !piece.tileSource && ' · deep zoom not built yet'}
      </p>
    </div>
  );
};
