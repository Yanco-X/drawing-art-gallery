import type { Step } from './traverse';

// A phone's arrow keys: one finger across, left for the next as a page turns.
// Nothing is prevented, so a stroke mostly up or down simply scrolls.
const DISTANCE = 56;
const SLOPE = 1.5;

interface Touches {
  touches: TouchList;
  changedTouches: TouchList;
  target: EventTarget | null;
}

// One gesture at a time on one screen, so the start can live here.
let start: { x: number; y: number } | null = null;

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
