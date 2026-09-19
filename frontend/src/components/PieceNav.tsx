import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pieceHref, sequenceState } from '../lib/origin';
import { swipeCancel, swipeStart, swipeStep } from '../lib/swipe';
import { arrowStep, intendStep } from '../lib/traverse';
import type { Step as Direction } from '../lib/traverse';
import type { Piece } from '../types';
import { ICON_BUTTON, ICON_BUTTON_INERT } from './form-styles';

const Step = ({
  piece,
  step,
  display,
  name,
  origin,
  sequence,
}: {
  piece?: Piece;
  step: Direction;
  display: string;
  name: string;
  origin?: string;
  sequence?: string[];
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
      state={sequenceState(sequence)}
      onClick={() => intendStep(piece.id, step)}
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
  sequence,
}: {
  previous?: Piece;
  next?: Piece;
  /** Carried on to the neighbour, so walking a collection stays in it. */
  origin?: string;
  /** Likewise for a narrowed or sorted list. */
  sequence?: string[];
}) => {
  const navigate = useNavigate();

  // The arrow keys, and on a phone a swipe anywhere on the page: both walk
  // the same way the buttons do, so the arrival slides in from that side.
  useEffect(() => {
    const walk = (step: Direction) => {
      const piece = step > 0 ? next : previous;
      if (!piece) return false;
      intendStep(piece.id, step);
      navigate(pieceHref(piece.id, origin), { state: sequenceState(sequence) });
      return true;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const step = arrowStep(event);
      if (step && walk(step)) event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent) => {
      const step = swipeStep(event);
      if (step) walk(step);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('touchstart', swipeStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', swipeCancel, { passive: true });
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('touchstart', swipeStart);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', swipeCancel);
    };
  }, [previous, next, origin, sequence, navigate]);

  return (
    <nav aria-label="Piece navigation" className="flex items-center gap-2">
      <Step
        piece={previous}
        step={-1}
        display="← Previous"
        name="Previous piece"
        origin={origin}
        sequence={sequence}
      />
      <Step
        piece={next}
        step={1}
        display="Next →"
        name="Next piece"
        origin={origin}
        sequence={sequence}
      />
    </nav>
  );
};
