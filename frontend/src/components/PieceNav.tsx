import { Link } from 'react-router-dom';
import { pieceHref } from '../lib/origin';
import type { Piece } from '../types';
import { ICON_BUTTON, ICON_BUTTON_INERT } from './form-styles';

const Step = ({
  piece,
  display,
  name,
  origin,
}: {
  piece?: Piece;
  display: string;
  name: string;
  origin?: string;
}) => {
  // Rendered disabled rather than omitted so the row does not reflow at
  // the first and last piece.
  if (!piece) {
    return (
      <span aria-hidden="true" className={ICON_BUTTON_INERT}>
        {display}
      </span>
    );
  }

  return (
    <Link
      to={pieceHref(piece.id, origin)}
      title={piece.title}
      aria-label={`${name}: ${piece.title}`}
      className={ICON_BUTTON}
    >
      {display}
    </Link>
  );
};

export const PieceNav = ({
  previous,
  next,
  origin,
}: {
  previous?: Piece;
  next?: Piece;
  /** Carried on to the neighbour, so walking a collection stays in it. */
  origin?: string;
}) => (
  <nav aria-label="Piece navigation" className="flex items-center gap-2">
    <Step
      piece={previous}
      display="← Previous"
      name="Previous piece"
      origin={origin}
    />
    <Step piece={next} display="Next →" name="Next piece" origin={origin} />
  </nav>
);
