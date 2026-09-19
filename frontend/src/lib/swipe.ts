import type { Step } from './traverse';

// A phone's arrow keys: one finger across, left for the next as a page turns.
// Nothing is prevented, so a stroke mostly up or down simply scrolls.
const DISTANCE = 56;
const SLOPE = 1.5;
// Travel before a stroke is read as sideways or as a scroll, and kept to.
const LOCK = 10;
// Wider than a phone a turn only nudges, under a crossfade.
const NUDGE = 32;
// Below 1024px, motion allowed, a turn carries the whole slide or page
// under the finger and off the edge.
const WHOLE = '(width < 64rem) and (prefers-reduced-motion: no-preference)';
const HOLD = 'swipe-hold';

export const TURN = { duration: 300, easing: 'cubic-bezier(0.2, 0, 0, 1)' };

interface Touches {
  touches: TouchList;
  changedTouches: TouchList;
  target: EventTarget | null;
}

// One gesture at a time on one screen, so the start can live here.
let start: { x: number; y: number; sideways?: boolean } | null = null;

// A finger already has work inside a dialog -- the viewer pans -- and on
// anything that scrolls sideways, as the tag row does.
const spokenFor = (target: EventTarget | null) => {
  for (
    let node = target instanceof Element ? target : null;
    node && node !== document.body;
    node = node.parentElement
  ) {
    if (node.tagName === 'DIALOG') return true;
    const { overflowX } = getComputedStyle(node);
    if (
      (overflowX === 'auto' || overflowX === 'scroll') &&
      node.scrollWidth > node.clientWidth
    )
      return true;
  }
  return false;
};

export const swipeStart = (event: Touches) => {
  const [touch] = event.touches;
  // A second finger makes it a pinch, which is the browser's.
  start =
    event.touches.length === 1 && !spokenFor(event.target)
      ? { x: touch.clientX, y: touch.clientY }
      : null;
};

export const swipeCancel = () => {
  start = null;
};

/** How far a sideways stroke has carried; null while it scrolls or is undecided. */
export const swipeDrag = (event: Touches): number | null => {
  const [touch] = event.touches;
  if (event.touches.length > 1) start = null;
  if (!start || !touch) return null;
  const dx = touch.clientX - start.x;
  const dy = touch.clientY - start.y;
  if (start.sideways === undefined) {
    if (Math.hypot(dx, dy) < LOCK) return null;
    start.sideways = Math.abs(dx) > Math.abs(dy);
  }
  return start.sideways ? dx : null;
};

/** The step a finished stroke asks for, or none. */
export const swipeStep = (event: Touches): Step | 0 => {
  const from = start;
  start = null;
  const [touch] = event.changedTouches;
  if (!from || !touch) return 0;
  const dx = touch.clientX - from.x;
  const dy = touch.clientY - from.y;
  if (Math.abs(dx) < DISTANCE || Math.abs(dx) < Math.abs(dy) * SLOPE) return 0;
  return dx < 0 ? 1 : -1;
};

export const turnsWhole = () => window.matchMedia(WHOLE).matches;

// Null puts it back where the stylesheet has it.
export const carry = (element: HTMLElement, dx: number | null, shown = false) => {
  element.style.translate = dx === null ? '' : `${dx}px`;
  element.style.opacity = shown ? '1' : '';
};

export const turnSlides = (
  leaving: HTMLElement,
  arriving: HTMLElement,
  step: Step,
  from = 0,
) => {
  const whole = turnsWhole();
  const distance = whole ? arriving.offsetWidth : NUDGE;
  const faded = whole ? 1 : 0;
  leaving.animate(
    [
      { translate: `${from}px`, opacity: 1 },
      { translate: `${-step * distance}px`, opacity: faded },
    ],
    TURN,
  );
  arriving.animate(
    [
      { translate: `${from + step * distance}px`, opacity: faded },
      { translate: '0px', opacity: 1 },
    ],
    TURN,
  );
};

export const settleBack = (page: HTMLElement, from: number) => {
  page.style.translate = '';
  page.animate([{ translate: `${from}px` }, { translate: '0px' }], TURN);
};

const holds = (page: HTMLElement | null) =>
  page?.getAnimations().filter((animation) => animation.id === HOLD) ?? [];

// A copy carries on out from under the finger while the page waits past the
// other edge, so the next piece can come in before the old one has gone.
export const turnAway = (page: HTMLElement, from: number, step: Step) => {
  page.style.translate = '';
  if (!turnsWhole()) return;
  const box = page.getBoundingClientRect();
  const ghost = page.cloneNode(true) as HTMLElement;
  ghost.inert = true;
  ghost.setAttribute('aria-hidden', 'true');
  // Fixed, so it neither scrolls with the page nor widens it on the way out.
  Object.assign(ghost.style, {
    position: 'fixed',
    top: `${box.top}px`,
    left: `${box.left}px`,
    width: `${box.width}px`,
    margin: '0',
    pointerEvents: 'none',
  });
  document.body.append(ghost);
  const remove = () => ghost.remove();
  ghost
    .animate(
      [{ translate: `${from}px` }, { translate: `${-step * box.width}px` }],
      TURN,
    )
    .finished.then(remove, remove);
  const past = `${step * box.width}px`;
  page.animate([{ translate: past }, { translate: past }], {
    duration: 0,
    fill: 'forwards',
    id: HOLD,
  });
};

// Held off screen, a page with nothing coming after all would stay there.
export const comeBack = (page: HTMLElement | null) => {
  for (const hold of holds(page)) hold.cancel();
};

export const turnIn = (page: HTMLElement, step: Step) => {
  comeBack(page);
  page.animate(
    [{ translate: `${step * page.offsetWidth}px` }, { translate: '0px' }],
    TURN,
  );
};
