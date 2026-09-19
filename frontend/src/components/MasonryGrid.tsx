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
  sequence,
}: {
  pieces: Piece[];
  density: GridDensity;
  origin?: string;
  marked?: string | null;
  sequence?: string[];
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useFlipReflow(
    containerRef,
    density + pieces.map((piece) => piece.id).join(),
  );

  return (
    // Cards on their way out are put back inside this wrapper, beside the
    // columns rather than among them, so no engine has to decide which
    // column an absolutely positioned child belongs to. `isolate` keeps
    // their negative z-index above the page and below the cards moving in.
    <div ref={containerRef} className="arrives relative isolate">
      <div style={{ columns: GRID_DENSITY_COLUMNS[density], columnGap: '20px' }}>
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
              sequence={sequence}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
