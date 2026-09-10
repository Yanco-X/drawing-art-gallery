import { useRef } from 'react';
import { useFlipReflow } from '../hooks/useFlipReflow';
import { GRID_DENSITY_COLUMNS } from '../hooks/useGridDensity';
import type { GridDensity, Piece } from '../types';
import { PieceCard } from './PieceCard';


/*
 * Columns fill top-to-bottom, so pieces read down each column rather than
 * across the row. That is the trade-off of CSS multi-column; a JS masonry
 * would be needed to change it.
 *
 * `columns` is inline because the value is chosen at runtime, and Tailwind
 * only emits utilities it can see statically.
 */
export const MasonryGrid = ({
  pieces,
  density,
  origin,
  marked,
}: {
  pieces: Piece[];
  density: GridDensity;
  origin?: string;
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
