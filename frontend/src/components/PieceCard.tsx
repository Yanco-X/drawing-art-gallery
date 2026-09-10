import { useState } from 'react';
import { Link } from 'react-router-dom';
import { pieceHref } from '../lib/origin';
import { rememberVisit } from '../lib/returnMemory';
import type { Piece } from '../types';

interface PieceCardProps {
  piece: Piece;
  origin?: string;
  marked?: boolean;
}

export const PieceCard = ({ piece, origin, marked = false }: PieceCardProps) => {
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
        The hatch sits underneath the image, so a slow or broken load shows the
        placeholder rather than a hole. `aspectRatio` comes from the stored
        dimensions, which reserves the height and stops the masonry reflowing
        as images arrive.
      */}
      <div
        className={`hatch relative flex w-full items-center justify-center border border-line transition-colors duration-200 group-hover:border-accent ${
          marked ? 'outline-1 outline-offset-2 outline-accent' : ''
        }`}
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
        <span className="text-[14px] text-text">
          {piece.title}
          {marked && <span className="sr-only"> (last viewed)</span>}
        </span>
        {meta && <span className="text-[12px] text-faint">{meta}</span>}
      </div>
    </>
  );

  return (
    <Link
      to={pieceHref(piece.id, origin)}
      // Written as the piece is opened rather than on every scroll: that is
      // what lets arriving from the header start at the top while coming
      // back from a piece does not.
      onClick={() => rememberVisit(window.location.pathname, piece.id)}
      className={shell}
    >
      {body}
    </Link>
  );
};
