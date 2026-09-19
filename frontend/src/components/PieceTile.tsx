import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Piece } from '../types';

export const PieceTile = ({
  piece,
  selected = false,
  whole = false,
  children,
}: {
  piece: Piece;
  selected?: boolean;
  /** The whole drawing inside a frame that holds its 4:3, rather than a
      frame that grows to the drawing. */
  whole?: boolean;
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
            // In flow, the image's own height floors the frame's and the
            // aspect ratio loses; taken out of flow, the frame keeps it.
            className={
              whole
                ? 'absolute inset-0 h-full w-full object-contain'
                : 'h-full w-full object-cover'
            }
          />
        )}
        {children}
      </div>
      <span className="truncate text-[13px] text-text">{piece.title}</span>
    </div>
  );
};
