import { useRef } from 'react';
import { useFlipReflow } from '../hooks/useFlipReflow';
import { GRID_DENSITY_COLUMNS } from '../hooks/useGridDensity';
import type { GridDensity, Piece } from '../types';
import { PieceCard } from './PieceCard';


/**
 * CSS multi-column masonry, per the design — no JS layout library.
 *
 * The trade-off is reading order: columns fill top-to-bottom, so pieces
 * run down each column rather than left-to-right across the row. Switch to
 * a JS/grid masonry if strict ordering ever matters.
 *
 * `columns` is set inline because the value is chosen at runtime; Tailwind
 * only emits utilities it can see statically in the source.
 */
export const MasonryGrid = ({
  pieces,
  density,
  origin,
  marked,
}: {
  pieces: Piece[];
  density: GridDensity;
  /** Passed to each card, so a piece opened here knows where from. */
  origin?: string;
  /** The piece the reader last opened from this list, if they came back. */
  marked?: string | null;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useFlipReflow(containerRef, density);

  return (
    <div
      ref={containerRef}
      style={{ columns: GRID_DENSITY_COLUMNS[density], columnGap: '20px' }}
    >
      {pieces.map((piece) => (
        // The column child owns spacing and break behaviour, and is the
        // element FLIP animates — the card inside stays layout-agnostic.
        <div
          key={piece.id}
          data-flip-id={piece.id}
          className="mb-5 break-inside-avoid"
        >
          <PieceCard
            piece={piece}
            origin={origin}
            marked={piece.id === marked}
          />
        </div>
      ))}
    </div>
  );
};
