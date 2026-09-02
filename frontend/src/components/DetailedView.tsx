import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { Viewer } from 'openseadragon';
import type { Piece } from '../types';
import {
  CloseIcon,
  ExitFullscreenIcon,
  FitIcon,
  FullscreenIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from './icons';

/*
 * The piece, the whole window, and every pixel of it.
 *
 * A native <dialog> rather than a route: the piece page stays mounted
 * underneath, so closing returns to it with its scroll position rather than
 * re-rendering it. Top-layer stacking, focus trapping and the enter/exit
 * transition all come from the platform and from the base stylesheet.
 *
 * OpenSeadragon is imported dynamically, so its ~250KB becomes a chunk that
 * only downloads when someone actually opens this. A viewer most visits
 * never open has no business in the bundle every visit pays for.
 */

/*
 * Two clocks, not one.
 *
 * The rail sits at the edges; the minimap sits on the drawing. Someone who
 * has zoomed in moves the mouse away and stops, which is the moment they are
 * actually looking -- so the thing overlapping the artwork clears first, and
 * the rail follows.
 */
const MINIMAP_IDLE_MS = 2000;
const CHROME_IDLE_MS = 3000;

/* Wide enough to make out the composition, small enough to stay out of it. */
const MINIMAP_WIDTH = 180;

/** Glyph-only control in the rail. Labelled, because it has no text. */
const RailButton = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="flex size-9 cursor-pointer items-center justify-center border border-line bg-bg-translucent text-muted transition-colors duration-200 hover:border-accent hover:text-accent"
  >
    {children}
  </button>
);

export const DetailedView = ({
  open,
  piece,
  previous,
  next,
  onClose,
  onNavigate,
}: {
  open: boolean;
  piece: Piece;
  previous?: Piece;
  next?: Piece;
  onClose: () => void;
  onNavigate: (piece: Piece) => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const chromeTimer = useRef<number | undefined>(undefined);
  const minimapTimer = useRef<number | undefined>(undefined);
  const headingId = useId();

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [chrome, setChrome] = useState(true);
  const [minimapAwake, setMinimapAwake] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  // Whether the view is zoomed past the whole piece. The minimap answers
  // "where am I", which is only a question once you cannot see everything.
  const [zoomed, setZoomed] = useState(false);

  // OpenSeadragon looks this up with getElementById, so it has to be a real
  // id on a real element rather than a ref.
  const navigatorId = `sa-minimap-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  /* ---- the dialog itself ---- */

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  /* ---- chrome that gets out of the way ---- */

  /* Starts both clocks. Touches no state, so an effect may call it. */
  const armIdle = useCallback(() => {
    window.clearTimeout(chromeTimer.current);
    window.clearTimeout(minimapTimer.current);
    // Deliberately not skipped under `prefers-reduced-motion`. Getting out of
    // the way is not motion, and someone who has asked for less animation
    // wants an uncluttered view no less than anyone else. The stylesheet
    // drops the fade itself for them, so it happens without the transition.
    minimapTimer.current = window.setTimeout(
      () => setMinimapAwake(false),
      MINIMAP_IDLE_MS,
    );
    chromeTimer.current = window.setTimeout(
      () => setChrome(false),
      CHROME_IDLE_MS,
    );
  }, []);

  /*
   * Anything the person does brings the rail back and restarts the clock.
   * `focusin` is on the list deliberately: a keyboard user never moves a
   * pointer, and a control that has faded out and cannot be summoned is a
   * bug rather than restraint. The same reasoning puts the whole fade
   * behind `prefers-reduced-motion` above.
   */
  const wake = useCallback(() => {
    setChrome(true);
    setMinimapAwake(true);
    armIdle();
  }, [armIdle]);

  useEffect(() => {
    if (!open) return;
    armIdle();
    const dialog = dialogRef.current;
    if (!dialog) return;
    const events = [
      'pointermove',
      'pointerdown',
      // Zooming with the wheel moves no pointer, so without this the chrome
      // fades out from under the very gesture that needs it.
      'wheel',
      'keydown',
      'focusin',
    ] as const;
    events.forEach((name) => dialog.addEventListener(name, wake));
    return () => {
      window.clearTimeout(chromeTimer.current);
      window.clearTimeout(minimapTimer.current);
      events.forEach((name) => dialog.removeEventListener(name, wake));
      // Restored on the way out rather than on the way in: both must be
      // showing the next time this opens, and resetting here keeps the
      // effect body free of state changes.
      setChrome(true);
      setMinimapAwake(true);
    };
  }, [open, armIdle, wake]);

  /* ---- OpenSeadragon ---- */

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let viewer: Viewer | null = null;

    const source = piece.tileSource
      ? {
          width: piece.tileSource.width,
          height: piece.tileSource.height,
          tileSize: piece.tileSource.tileSize,
          tileOverlap: piece.tileSource.overlap,
          minLevel: 0,
          maxLevel: piece.tileSource.maxLevel,
          getTileUrl: (level: number, x: number, y: number) =>
            `${piece.tileSource?.base}/${level}/${x}_${y}.webp`,
        }
      : // No pyramid: a piece uploaded before tiling existed and not yet
        // backfilled, or one whose build failed. The display rendition still
        // pans and zooms, it just runs out of detail sooner.
        { type: 'image', url: piece.imageUrl };

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    void (async () => {
      try {
        const { default: OpenSeadragon } = await import('openseadragon');
        if (cancelled || !hostRef.current) return;

        viewer = OpenSeadragon({
          element: hostRef.current,
          tileSources: source as never,
          // Every control is ours, in the rail. OpenSeadragon's own
          // buttons are sprite images from a prefixUrl, and would not
          // match anything here.
          showNavigationControl: false,
          // Mounted into our own element, so OpenSeadragon leaves the
          // frame to us and to `.sa-minimap` in the stylesheet.
          showNavigator: true,
          navigatorId,
          // Its visibility is ours to decide, from the zoom level, rather
          // than OpenSeadragon's own idle timer.
          navigatorAutoFade: false,
          animationTime: reduced ? 0 : 0.5,
          blendTime: reduced ? 0 : 0.15,
          springStiffness: 7,
          // A little past 1:1 is useful on a drawing; far past it is just
          // upscaling, which is the thing the pyramid exists to avoid.
          maxZoomPixelRatio: 2,
          minZoomImageRatio: 0.85,
          visibilityRatio: 1,
          constrainDuringPan: true,
          gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true },
        });

        viewer.addHandler('open', () => {
          if (!cancelled) setReady(true);
        });

        /*
         * A little above the home zoom rather than exactly at it: floating
         * point and the spring animation both leave the resting zoom a
         * hair off `getHomeZoom()`, and a minimap that flickers in and out
         * while the view settles is worse than one that waits.
         *
         * Fires on every animation frame of a zoom, so it sets a boolean
         * rather than a number -- React skips the render when the value has
         * not actually changed.
         */
        const syncZoom = () => {
          if (cancelled || !viewer) return;
          const { viewport } = viewer;
          setZoomed(viewport.getZoom() > viewport.getHomeZoom() * 1.05);
        };
        viewer.addHandler('zoom', syncZoom);
        viewer.addHandler('open', syncZoom);

        /*
         * Make the minimap draw the drawing.
         *
         * Navigator sets `_resizeWithViewer = false` whenever its control
         * anchor is NONE -- which is precisely what handing it an element
         * via `navigatorId` does. That flag gates the only call it ever
         * makes to `updateSize()`, and `updateSize()` is what performs
         * `viewport.resize()`, `goHome()` and `world.draw()`. Left alone,
         * the navigator paints its frame and its display region over an
         * empty world: a blank box with a rectangle floating in it.
         *
         * Hung off its world's `add-item` rather than an `open` handler,
         * because the navigator never opens. The main viewer calls
         * `navigator.addTiledImage()` directly, and only the main viewer
         * ever raises `open` -- so an `open` listener here would wait
         * forever.
         *
         * The explicit draw after `updateSize()` is not superstition:
         * `updateSize` returns early when the container size has not
         * changed, so on any later call it would do nothing at all.
         */
        const navigator = viewer.navigator;
        if (navigator) {
          const drawMinimap = () => {
            if (cancelled) return;
            navigator.updateSize();
            // `true` = the viewport changed, so every tiled image is
            // recomputed rather than left on last frame's bounds.
            navigator.world.update(true);
            navigator.world.draw();
            navigator.update(viewer!.viewport);
          };
          navigator.world.addHandler('add-item', drawMinimap);
          viewer.addHandler('open', drawMinimap);
        }
        viewer.addHandler('open-failed', () => {
          if (!cancelled) setFailed(true);
        });

        viewerRef.current = viewer;
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      viewer?.destroy();
      viewerRef.current = null;
      // These describe the instance being destroyed, so they go with it --
      // and the next piece opens showing its placeholder rather than
      // inheriting the last one's "ready".
      setReady(false);
      setFailed(false);
      setZoomed(false);
    };
    // Re-keyed on the piece, so moving to a neighbour rebuilds the viewer
    // and the zoom starts from the whole drawing again.
  }, [open, piece.id, piece.imageUrl, piece.tileSource, navigatorId]);

  /* ---- fullscreen ---- */

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggleFullscreen = () => {
    // Requested on the dialog rather than the document, so the top layer
    // and the fullscreen element are the same node.
    if (document.fullscreenElement) void document.exitFullscreen();
    else void dialogRef.current?.requestFullscreen().catch(() => undefined);
  };

  /* ---- keyboard ---- */

  const zoomBy = (factor: number) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.viewport.zoomBy(factor);
    viewer.viewport.applyConstraints();
  };

  const fit = () => viewerRef.current?.viewport.goHome();

  /*
   * Only the keys OpenSeadragon does not already own. It handles arrows,
   * +/- and w/a/s/d on its canvas; claiming those would fight it.
   */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === '0') {
      event.preventDefault();
      fit();
    }
    if (event.key === 'f') {
      event.preventDefault();
      toggleFullscreen();
    }
  };

  const label = piece.tileSource
    ? `${piece.tileSource.width} × ${piece.tileSource.height}`
    : 'Display resolution';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onKeyDown={onKeyDown}
      // Escape fires cancel. The viewer owns a history entry, so closing has
      // to go back rather than simply hiding, or the URL and the screen stop
      // agreeing with each other.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-0 h-screen max-h-none w-screen max-w-none border-none bg-bg p-0 text-text backdrop:bg-black/90"
    >
      <div className="relative h-full w-full overflow-hidden">
        {/*
          The first frame, instantly: the piece page behind has already
          loaded this exact file, so it is in cache and paints before
          OpenSeadragon has finished asking for a single tile. It fades out
          once the real viewer has opened.
        */}
        <img
          src={piece.imageUrl}
          alt=""
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 m-auto max-h-full max-w-full object-contain transition-opacity duration-300 ${
            ready ? 'opacity-0' : 'opacity-100'
          }`}
        />

        <div ref={hostRef} className="h-full w-full" />

        {/*
          Where you are in the drawing, and how much of it you are not seeing.

          Fades on its own clock, sooner than the rail. An earlier version
          kept it up for as long as the view was zoomed, reasoning that it is
          feedback you need while panning. That confused "zoomed in" with
          "panning": once someone stops moving they have started looking, and
          a panel sitting on the artwork is noise at exactly the wrong moment.
          It comes straight back on the next movement.

          Below the rail rather than in a free corner, so it never sits on top
          of the title or the zoom controls.
        */}
        <div
          aria-hidden="true"
          className={`sa-minimap sa-fade absolute right-4 top-[72px] transition-opacity duration-300 ${
            zoomed && ready && minimapAwake
              ? 'opacity-100'
              : 'pointer-events-none opacity-0'
          }`}
          style={{
            width: MINIMAP_WIDTH,
            // Matched to the piece, so the frame is the drawing's shape and
            // OpenSeadragon has no letterboxing to do inside it.
            height: Math.round(MINIMAP_WIDTH / (piece.aspectRatio || 1)),
          }}
        >
          {/*
            Two elements rather than one, and the split matters.

            OpenSeadragon mutates the element it is given -- it appends its
            own `navigator` class and writes inline styles onto it. React
            owns the wrapper above, whose className changes every time the
            minimap shows or hides, and re-applying that className would wipe
            whatever OpenSeadragon had put there. This inner element takes
            no changing props, so React renders it once and never touches it
            again, leaving OpenSeadragon free to do as it likes with it.
          */}
          <div id={navigatorId} className="h-full w-full" />
        </div>

        {failed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-mono text-[12px] tracking-[0.05em] text-faint">
              [ this piece could not be opened ]
            </p>
          </div>
        )}

        {/*
          One rail, top of the window, fading after a couple of seconds of
          stillness. `inert` as well as invisible while hidden, so a faded
          rail cannot be tabbed into by accident.
        */}
        <div
          inert={!chrome}
          className={`sa-fade absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-4 border-b border-line bg-bg-translucent px-4 py-3 transition-opacity duration-300 ${
            chrome ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <RailButton label="Close detailed view" onClick={onClose}>
              <CloseIcon />
            </RailButton>
            <div className="min-w-0">
              <h2
                id={headingId}
                className="truncate font-serif text-[18px] font-normal text-text"
              >
                {piece.title}
              </h2>
              <p className="text-[11px] text-faint">{label}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <RailButton label="Zoom out" onClick={() => zoomBy(1 / 1.4)}>
              <ZoomOutIcon />
            </RailButton>
            <RailButton label="Fit to window" onClick={fit}>
              <FitIcon />
            </RailButton>
            <RailButton label="Zoom in" onClick={() => zoomBy(1.4)}>
              <ZoomInIcon />
            </RailButton>
            <RailButton
              label={fullscreen ? 'Leave fullscreen' : 'Fullscreen'}
              onClick={toggleFullscreen}
            >
              {fullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            </RailButton>
          </div>
        </div>

        {/* Neighbours, so the viewer is a way of browsing rather than a
            detour that has to be left and re-entered for every piece. */}
        <div
          inert={!chrome}
          className={`sa-fade absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-4 transition-opacity duration-300 ${
            chrome ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {previous ? (
            <RailButton
              label={`Previous: ${previous.title}`}
              onClick={() => onNavigate(previous)}
            >
              <span aria-hidden="true">←</span>
            </RailButton>
          ) : (
            <span />
          )}
          {next ? (
            <RailButton
              label={`Next: ${next.title}`}
              onClick={() => onNavigate(next)}
            >
              <span aria-hidden="true">→</span>
            </RailButton>
          ) : (
            <span />
          )}
        </div>
      </div>
    </dialog>
  );
};
