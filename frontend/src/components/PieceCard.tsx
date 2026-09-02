import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Piece } from '../types';

interface PieceCardProps {
  piece: Piece;
}

export const PieceCard = ({ piece }: PieceCardProps) => {
  const [failed, setFailed] = useState(false);
  // Both are optional on an uploaded piece, so the separator is only
  // drawn between values that exist.
  const meta = [piece.medium, piece.year].filter(Boolean).join(' · ');

  const dimmed = piece.waivedAt
    ? 'opacity-60 transition-opacity hover:opacity-100'
    : '';
  const shell = `group flex w-full flex-col gap-2.5 text-left ${dimmed}`;

  const body = (
    <>
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
            src={piece.thumbnailUrl ?? piece.imageUrl}
            alt={piece.title}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        {piece.waivedAt && (
          <span className="text-[11px] uppercase tracking-eyebrow text-faint">
            Waived
          </span>
        )}
        <span className="text-[14px] text-text">{piece.title}</span>
        {meta && <span className="text-[12px] text-faint">{meta}</span>}
      </div>
    </>
  );

  return (
    <Link to={`/piece/${piece.id}`} className={shell}>
      {body}
    </Link>
  );
};
