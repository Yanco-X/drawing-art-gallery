import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Piece } from '../types';

/**
 * A uniform thumbnail, for the places where pieces are being handled rather
 * than looked at — arranging a collection, picking work to add.
 *
 * Deliberately not `PieceCard`. That card honours each piece's aspect ratio,
 * which is right on a wall and wrong in a row of things being sorted: ragged
 * heights make an ordered sequence hard to read and a drop target hard to
 * aim at. Here every tile is the same box and the image is cropped to fit.
 */
export const PieceTile = ({
  piece,
  selected = false,
  children,
}: {
  piece: Piece;
  /** Draws the accent border, for a tile that is picked or is the cover. */
  selected?: boolean;
  /** Overlaid on the image: badges, remove, cover. */
  children?: ReactNode;
}) => {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`hatch relative flex aspect-[4/3] w-full items-center justify-center border transition-colors duration-200 ${
          selected ? 'border-accent' : 'border-line'
        }`}
      >
        {failed ? (
          <span className="font-mono text-[11px] tracking-[0.05em] text-faint">
            [ artwork ]
          </span>
        ) : (
          <img
            src={piece.thumbnailUrl ?? piece.imageUrl}
            alt={piece.title}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
        {children}
      </div>
      <span className="truncate text-[13px] text-text">{piece.title}</span>
    </div>
  );
};
