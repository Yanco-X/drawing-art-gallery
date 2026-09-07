import { useCallback, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { CENTRE_FOCAL } from '../lib/spotlight';
import type { Piece } from '../types';
import { LABEL, SUBTLE_ACTION } from './form-styles';

/*
 * Where the spotlight aims its crop on this piece.
 *
 * Two views of one number pair: the whole artwork with a mark on it, and
 * beside it the band's actual shape showing what survives. Choosing on the
 * full image and judging on the crop are different jobs, and a control that
 * only did the first would have the owner saving and reloading to find out
 * what they picked.
 *
 * The band is 66/34 of a 2400px measure at up to 780px tall, so its artwork
 * half is roughly 3:2. The preview uses that rather than a round number,
 * because a preview at the wrong shape lies about what will be cut.
 */
const BAND_RATIO = '3 / 2';

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

export const FocalPicker = ({
  piece,
  x,
  y,
  onChange,
}: {
  piece: Piece;
  /** Null means the piece has never been placed; the mark sits at centre. */
  x: number | null;
  y: number | null;
  onChange: (next: { x: number | null; y: number | null }) => void;
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);

  const atX = x ?? CENTRE_FOCAL;
  const atY = y ?? CENTRE_FOCAL;
  const placed = x !== null || y !== null;

  const place = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const frame = frameRef.current;
      if (!frame) return;
      const box = frame.getBoundingClientRect();
      onChange({
        x: clamp(((event.clientX - box.left) / box.width) * 100),
        y: clamp(((event.clientY - box.top) / box.height) * 100),
      });
    },
    [onChange],
  );

  /*
   * Pointer capture rather than window listeners: the element keeps
   * receiving moves once the pointer leaves it, and the browser cleans up on
   * its own if the gesture is cancelled. It also makes touch and mouse the
   * same code, which a mousedown/mousemove pair would not.
   */
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    place(event);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging) place(event);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Shift takes bigger steps; the whole range is 100, so 1% a press would
    // be forty presses to cross a piece.
    const step = event.shiftKey ? 10 : 2;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    onChange({ x: clamp(atX + move[0]), y: clamp(atY + move[1]) });
  };

  const position = `${atX}% ${atY}%`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className={LABEL}>Focal point</span>
        {placed && (
          <button
            type="button"
            onClick={() => onChange({ x: null, y: null })}
            className={SUBTLE_ACTION}
          >
            Centre
          </button>
        )}
      </div>

      {failed ? (
        <div className="hatch flex items-center justify-center border border-line py-16">
          <span className="font-mono text-[11px] tracking-[0.05em] text-faint">
            [ artwork unavailable ]
          </span>
        </div>
      ) : (
        <>
          {/*
            The whole piece, with the mark on it. `touch-none` matters: without
            it a drag on a touch screen scrolls the dialog instead of moving
            the point.
          */}
          <div
            ref={frameRef}
            role="application"
            aria-label={`Focal point for ${piece.title}, ${atX} percent across and ${atY} percent down. Arrow keys to move.`}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            onKeyDown={onKeyDown}
            className="hatch relative flex cursor-crosshair touch-none items-center justify-center border border-line transition-colors duration-200 focus:border-accent focus:outline-1 focus:outline-accent"
          >
            <img
              src={piece.imageUrl}
              alt=""
              draggable={false}
              onError={() => setFailed(true)}
              className="max-h-[300px] w-full select-none object-contain"
            />

            {/*
              A hairline cross rather than a filled dot: at this size a dot
              covers the very detail being aimed at, and the system has no
              filled marks outside the density icons.
            */}
            <span
              aria-hidden="true"
              style={{ left: `${atX}%`, top: `${atY}%` }}
              className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 border border-accent"
            >
              <span className="absolute top-1/2 left-0 h-px w-full bg-accent" />
              <span className="absolute top-0 left-1/2 h-full w-px bg-accent" />
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-faint">
              Drag to choose what the band keeps.
            </span>
            {/* The band's own shape, cropping live. */}
            <div
              style={{ aspectRatio: BAND_RATIO }}
              className="hatch w-full overflow-hidden border border-line"
            >
              <img
                src={piece.imageUrl}
                alt=""
                draggable={false}
                style={{ objectPosition: position }}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
