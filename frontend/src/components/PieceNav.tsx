import { Link } from 'react-router-dom';
import type { Piece } from '../types';

const STEP_CLASSES =
  'text-[13px] uppercase tracking-btn transition-colors duration-200';

const Step = ({
  piece,
  display,
  name,
}: {
  piece?: Piece;
  display: string;
  name: string;
}) => {
  // Rendered disabled rather than omitted so the row does not reflow at
  // the first and last piece.
  if (!piece) {
    return (
      <span aria-hidden="true" className={`${STEP_CLASSES} text-faint opacity-40`}>
        {display}
      </span>
    );
  }

  return (
    <Link
      to={`/piece/${piece.id}`}
      title={piece.title}
      aria-label={`${name}: ${piece.title}`}
      className={`${STEP_CLASSES} text-faint hover:text-accent`}
    >
      {display}
    </Link>
  );
};

/**
 * Neighbours in gallery order, sized to sit inline beside the back link
 * rather than as a block below the artwork. Titles move to the tooltip and
 * the accessible name -- at this size the labels alone carry the action,
 * and keeping them short is what lets the whole control live above the fold.
 */
export const PieceNav = ({
  previous,
  next,
}: {
  previous?: Piece;
  next?: Piece;
}) => (
  <nav aria-label="Piece navigation" className="flex items-center gap-6">
    <Step piece={previous} display="← Previous" name="Previous piece" />
    <Step piece={next} display="Next →" name="Next piece" />
  </nav>
);
