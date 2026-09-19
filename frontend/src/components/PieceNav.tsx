import { useEffect } from 'react';
import type { RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pieceHref, sequenceState } from '../lib/origin';
import {
  settleBack,
  swipeCancel,
  swipeDrag,
  swipeStart,
  swipeStep,
  turnAway,
  turnsWhole,
} from '../lib/swipe';
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
  page,
}: {
  previous?: Piece;
  next?: Piece;
  /** Carried on to the neighbour, so walking a collection stays in it. */
  origin?: string;
  /** Likewise for a narrowed or sorted list. */
  sequence?: string[];
  /** What a swipe carries on a phone: the piece and its label. */
  page: RefObject<HTMLElement | null>;
}) => {
  const navigate = useNavigate();

  // Fetched ahead, so a step lands on a drawing already in hand instead of
  // sitting off screen while it downloads.
  const previousImage = previous?.imageUrl;
  const nextImage = next?.imageUrl;
  useEffect(() => {
    for (const url of [previousImage, nextImage]) {
      if (url) new Image().src = url;
    }
  }, [previousImage, nextImage]);

  // The arrow keys, and on a phone a swipe anywhere on the page: both walk
  // the same way the buttons do, so the arrival slides in from that side.
  useEffect(() => {
    // Inside the article, so the article is there before this runs.
    const body = page.current;
    let carried = 0;
    const walk = (step: Direction, from = 0) => {
      const piece = step > 0 ? next : previous;
      if (!piece) return false;
      intendStep(piece.id, step);
      if (body) turnAway(body, from, step);
      navigate(pieceHref(piece.id, origin), { state: sequenceState(sequence) });
      return true;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const step = arrowStep(event);
      if (step && walk(step)) event.preventDefault();
    };
    const onTouchMove = (event: TouchEvent) => {
      const dx = swipeDrag(event);
      if (dx === null || !body || !turnsWhole()) return;
      // Nothing that way: the page gives a little and comes back.
      carried = (dx < 0 ? next : previous) ? dx : dx / 4;
      body.style.translate = `${carried}px`;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const step = swipeStep(event);
      const from = carried;
      carried = 0;
      if (step && walk(step, from)) return;
      if (from && body) settleBack(body, from);
    };
    const onTouchCancel = () => {
      swipeCancel();
      if (carried && body) settleBack(body, carried);
      carried = 0;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('touchstart', swipeStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('touchstart', swipeStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchCancel);
      // Neighbours that land mid-stroke re-run this; the page must not stay
      // where the old listeners left it.
      if (carried && body) body.style.translate = '';
    };
  }, [previous, next, origin, sequence, navigate, page]);

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
