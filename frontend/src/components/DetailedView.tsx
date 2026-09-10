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
 * A native <dialog> rather than a route, so the piece page stays mounted
 * underneath and closing returns to it with its scroll intact.
 *
 * OpenSeadragon is imported dynamically: ~250KB that only downloads when
 * someone opens this.
 */

const MINIMAP_IDLE_MS = 2000;
const CHROME_IDLE_MS = 3000;

const MINIMAP_WIDTH = 180;

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
  const frameRef = useRef<HTMLDivElement>(null);
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


  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) {
      /*
       * Leave fullscreen on the way out, or the frame stays fullscreen inside
       * a `display: none` dialog: the window keeps the whole screen and draws
       * nothing in it. Only ours -- a fullscreen element elsewhere is not
       * this component's to close.
       */
      if (
        document.fullscreenElement &&
        dialog.contains(document.fullscreenElement)
      )
        void document.exitFullscreen().catch(() => undefined);
      dialog.close();
    }
  }, [open]);


  const armIdle = useCallback(() => {
    window.clearTimeout(chromeTimer.current);
    window.clearTimeout(minimapTimer.current);
    // Deliberately not skipped under `prefers-reduced-motion`: getting out of
    // the way is not motion. The stylesheet drops the fade itself.
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
   * Anything the person does brings the rail back. `focusin` is on the list
   * deliberately: a keyboard user never moves a pointer.
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
      setChrome(true);
      setMinimapAwake(true);
    };
  }, [open, armIdle, wake]);


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
          // Every control is ours, in the rail. OpenSeadragon's own are
          // sprite images from a prefixUrl.
          showNavigationControl: false,
          showNavigator: true,
          navigatorId,
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
         * A little above the home zoom, not exactly at it: floating point and
         * the spring both leave the resting zoom a hair off `getHomeZoom()`.
         * Sets a boolean, not a number, so React skips the render.
         */
        const syncZoom = () => {
          if (cancelled || !viewer) return;
          const { viewport } = viewer;
          setZoomed(viewport.getZoom() > viewport.getHomeZoom() * 1.05);
        };
        viewer.addHandler('zoom', syncZoom);
        viewer.addHandler('open', syncZoom);

        /*
         * Navigator sets `_resizeWithViewer = false` whenever its control
         * anchor is NONE, which is what `navigatorId` does. That flag gates
         * its only call to `updateSize()`, which is what performs the
         * resize, `goHome()` and `world.draw()` -- so left alone it paints a
         * blank box with a rectangle in it. Hung off `add-item` because the
         * navigator never raises `open`; the main viewer calls
         * `addTiledImage()` on it directly. The explicit draw is needed
         * because `updateSize` returns early when the size has not changed.
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
      setReady(false);
      setFailed(false);
      setZoomed(false);
    };
  }, [open, piece.id, piece.imageUrl, piece.tileSource, navigatorId]);


  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  /*
   * Requested on the frame, never on the dialog: a `dialog` is named by the
   * Fullscreen API as ineligible, and asking rejects with `TypeError: Dialog
   * elements are invalid`. The frame is an ordinary div and still paints
   * above everything. The catch stays for a refusal we can ignore -- an
   * embedding page without `allow="fullscreen"`, chiefly.
   */
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frameRef.current?.requestFullscreen().catch(() => undefined);
  };

  const zoomBy = (factor: number) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.viewport.zoomBy(factor);
    viewer.viewport.applyConstraints();
  };

  const fit = () => viewerRef.current?.viewport.goHome();

  // Only the keys OpenSeadragon does not already own: it handles arrows,
  // +/- and w/a/s/d on its canvas.
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
      /*
       * Escape fires cancel. The viewer owns a history entry, so closing has
       * to go back rather than hide, or the URL and the screen disagree. An
       * open dialog's cancel gets Escape before the browser can act on it, so
       * the first Escape leaves fullscreen here and the second closes.
       */
      onCancel={(event) => {
        event.preventDefault();
        if (document.fullscreenElement) {
          void document.exitFullscreen().catch(() => undefined);
          return;
        }
        onClose();
      }}
      className="m-0 h-screen max-h-none w-screen max-w-none border-none bg-bg p-0 text-text backdrop:bg-black/90"
    >
        {/*
          Carries its own background: once it is the fullscreen element it is
          the thing painting the screen.
        */}
      <div
        ref={frameRef}
        className="relative h-full w-full overflow-hidden bg-bg"
      >
            {/*
              Already in cache from the piece page behind, so it paints before
              OpenSeadragon has asked for a single tile.
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
            OpenSeadragon mutates the element it is given, appending its own
            class and inline styles. This inner element takes no changing
            props, so React renders it once and never wipes that; the wrapper
            above, whose className does change, stays React's.
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

        {/* `inert` as well as invisible, so a faded rail cannot be tabbed into. */}
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
