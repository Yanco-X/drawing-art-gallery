import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Piece } from '../types';

export const PieceCard = ({ piece }: { piece: Piece }) => {
  const [failed, setFailed] = useState(false);

  return (
    <Link to={`/piece/${piece.id}`} className="group flex flex-col gap-2.5">
      {/*
        The hatch sits underneath the image, so a slow or broken load shows
        the placeholder rather than a hole. aspectRatio comes from the
        stored dimensions, which reserves the height up front and stops the
        masonry reflowing as images arrive.
      */}
      <div
        className="hatch relative flex w-full items-center justify-center border border-line transition-colors duration-200 group-hover:border-accent"
        style={{ aspectRatio: piece.aspectRatio }}
      >
        {failed ? (
          <span className="font-mono text-[11px] tracking-[0.05em] text-faint">
            [ artwork ]
          </span>
        ) : (
          <img
            src={piece.imageUrl}
            alt={piece.title}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[14px] text-text">{piece.title}</span>
        <span className="text-[12px] text-faint">
          {piece.medium} · {piece.year}
        </span>
      </div>
    </Link>
  );
};
