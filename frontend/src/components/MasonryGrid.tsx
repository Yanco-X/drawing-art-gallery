import { useCallback, useEffect, useRef, useState } from 'react';
import { useFlipReflow } from '../hooks/useFlipReflow';
import { GRID_DENSITIES, GRID_DENSITY_COLUMNS } from '../hooks/useGridDensity';
import { layMasonry, steppedColumnCount } from '../lib/masonry';
import type { GridDensity, Piece } from '../types';
import { PieceCard } from './PieceCard';

const GAP = 20;
// Under the image until a card has been measured: about a title line and a
// meta line.
const CAPTION = 48;

interface Measured {
  width: number;
  height: number;
}

/*
 * Laid out here rather than by CSS multi-column, which fills down each column
 * first: the curated order has to read across the rows. The cards stay in
 * that order in the DOM, so tab order and a screen reader follow it too, and
 * each is placed absolutely -- `left` and `top`, never a transform, which is
 * FLIP's to animate.
 */
export const MasonryGrid = ({
  pieces,
  density,
  origin,
  marked,
  sequence,
  numbered = false,
}: {
  pieces: Piece[];
  density: GridDensity;
  origin?: string;
  marked?: string | null;
  sequence?: string[];
  /** Each card's position on an accent badge, for the curation preview. */
  numbered?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardObserver = useRef<ResizeObserver | null>(null);
  const [width, setWidth] = useState(0);
  const [measured, setMeasured] = useState<ReadonlyMap<string, Measured>>(
    new Map(),
  );
  useFlipReflow(containerRef, density + pieces.map((piece) => piece.id).join());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // A caption's height depends on how its title wraps, which only the
  // browser knows, so each card reports its own.
  const observeCard = useCallback((node: HTMLDivElement) => {
    cardObserver.current ??= new ResizeObserver((entries) =>
      setMeasured((now) => {
        let next: Map<string, Measured> | null = null;
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.flipId;
          const [box] = entry.borderBoxSize;
          if (!id || !box) continue;
          const known = now.get(id);
          if (known?.width === box.inlineSize && known.height === box.blockSize)
            continue;
          next ??= new Map(now);
          next.set(id, { width: box.inlineSize, height: box.blockSize });
        }
        return next ?? now;
      }),
    );
    const observer = cardObserver.current;
    observer.observe(node);
    return () => observer.unobserve(node);
  }, []);

  const count = steppedColumnCount(
    width,
    GAP,
    GRID_DENSITIES.slice(0, GRID_DENSITIES.indexOf(density) + 1).map(
      (step) => GRID_DENSITY_COLUMNS[step],
    ),
  );
  const columnWidth = (width - GAP * (count - 1)) / count;
  // A height measured at another width is stale, and an estimate from the
  // stored proportions is closer than it.
  const { spots, height } = layMasonry(
    pieces.map((piece) => {
      const known = measured.get(piece.id);
      return known && Math.abs(known.width - columnWidth) < 0.5
        ? known.height
        : columnWidth / (piece.aspectRatio || 1) + CAPTION;
    }),
    count,
    GAP,
  );

  return (
    // Cards on their way out are put back inside this wrapper for the length
    // of their fade. `isolate` keeps their negative z-index above the page
    // and below the cards moving in.
    <div
      ref={containerRef}
      className="arrives relative isolate"
      style={{ height: width > 0 ? height : undefined }}
    >
      {width > 0 &&
        pieces.map((piece, index) => (
          <div
            key={piece.id}
            ref={observeCard}
            data-flip-id={piece.id}
            className="absolute"
            style={{
              left: spots[index].column * (columnWidth + GAP),
              top: spots[index].top,
              width: columnWidth,
            }}
          >
            <PieceCard
              piece={piece}
              origin={origin}
              marked={piece.id === marked}
              sequence={sequence}
            />
            {numbered && (
              <span className="absolute top-2 left-2 flex h-6 min-w-6 items-center justify-center bg-accent px-1 text-[12px] leading-none text-on-accent">
                {index + 1}
              </span>
            )}
          </div>
        ))}
    </div>
  );
};
