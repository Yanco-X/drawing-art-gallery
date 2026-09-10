import { useCallback, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import {
  CENTRE_FOCAL,
  ZOOM_MAX,
  ZOOM_MIN,
  fillRatio,
  framePiece,
} from '../lib/spotlight';
import type { Piece } from '../types';
import { LABEL, SUBTLE_ACTION } from './form-styles';

const BAND_RATIO = '3 / 2';
/* The same shape as a number. Only used to park the slider where an
   unsized piece already sits, so that first drag does not jump. Nothing
   stored depends on it: the band is this shape at some window sizes and
   not at others, which is exactly why the zoom stopped being a percentage
   of it. */
const BAND_ASPECT = 3 / 2;

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

export const FocalPicker = ({
  piece,
  x,
  y,
  zoom,
  onChange,
}: {
  piece: Piece;
  /** Null means the piece has never been placed; the mark sits at centre. */
  x: number | null;
  y: number | null;
  /** Null means it has never been sized; the piece fills the frame. */
  zoom: number | null;
  onChange: (next: {
    x: number | null;
    y: number | null;
    zoom: number | null;
  }) => void;
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);

  const atX = x ?? CENTRE_FOCAL;
  const atY = y ?? CENTRE_FOCAL;
  /* An unsized piece fills the frame, so the slider starts where filling
     this preview lands. Anywhere else and the first touch would jump. */
  const atZoom =
    zoom ??
    Math.round(fillRatio(piece.aspectRatio, BAND_ASPECT) * 100);
  const placed = x !== null || y !== null;

  const place = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const frame = frameRef.current;
      if (!frame) return;
      const box = frame.getBoundingClientRect();
      onChange({
        x: clamp(((event.clientX - box.left) / box.width) * 100),
        y: clamp(((event.clientY - box.top) / box.height) * 100),
        zoom,
      });
    },
    [onChange, zoom],
  );

  /*
   * Pointer capture rather than window listeners: the element keeps receiving
   * moves once the pointer leaves it, the browser cleans up a cancelled
   * gesture, and touch and mouse become one code path.
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
    onChange({ x: clamp(atX + move[0]), y: clamp(atY + move[1]), zoom });
  };

  const shown = framePiece({ focalX: x, focalY: y, focalZoom: zoom });
  const framing = {
    objectFit: shown.fit,
    objectPosition: shown.position,
    transformOrigin: shown.position,
    transform: `scale(${shown.scale})`,
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className={LABEL}>Focal point</span>
        {placed && (
          <button
            type="button"
            onClick={() => onChange({ x: null, y: null, zoom })}
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
          {/* `touch-none` matters: without it a drag on a touch screen scrolls
              the dialog instead of moving the point. */}
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
            <div
              style={{ aspectRatio: BAND_RATIO }}
              className="hatch w-full overflow-hidden border border-line"
            >
              <img
                src={piece.imageUrl}
                alt=""
                draggable={false}
                style={framing}
                className="h-full w-full"
              />
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-3">
              <span className={LABEL}>Zoom</span>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-faint">
                  {atZoom}%
                </span>
                {zoom !== null && (
                  <button
                    type="button"
                    onClick={() => onChange({ x, y, zoom: null })}
                    className={SUBTLE_ACTION}
                  >
                    Fill
                  </button>
                )}
              </div>
            </div>

            <input
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              value={atZoom}
              onChange={(event) =>
                onChange({ x, y, zoom: Number(event.target.value) })
              }
              aria-label={`Zoom for ${piece.title}, ${atZoom} percent — about ${Math.round(10000 / atZoom)} percent of the piece in frame`}
              className="sa-slider"
            />

            <span className="text-[12px] text-faint">
              {zoom === null
                ? 'Fills its half of the band, whatever shape that is.'
                : `About ${Math.round(100 / (atZoom / 100))}% of the piece in` +
                  ' frame, on every screen.'}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
