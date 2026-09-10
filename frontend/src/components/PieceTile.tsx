import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Piece } from '../types';

export const PieceTile = ({
  piece,
  selected = false,
  children,
}: {
  piece: Piece;
  selected?: boolean;
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
