import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Piece } from '../types';

interface PieceCardProps {
  piece: Piece;
  /**
   * Present only while picking pieces for a collection. The card becomes a
   * button rather than a link — clicking it must not navigate away from a
   * selection in progress.
   */
  onSelect?: () => void;
  /** 1-based pick order, or null when this piece is not selected. */
  selectionIndex?: number | null;
}

export const PieceCard = ({
  piece,
  onSelect,
  selectionIndex = null,
}: PieceCardProps) => {
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
        className={`hatch relative flex w-full items-center justify-center border transition-colors duration-200 ${
          selectionIndex === null
            ? 'border-line group-hover:border-accent'
            : 'border-accent'
        }`}
        style={{ aspectRatio: piece.aspectRatio }}
      >
        {selectionIndex !== null && (
          // Numbered, because pick order becomes the order the collection
          // hangs in — a plain tick would hide that.
          <span className="absolute top-2 left-2 z-1 flex size-6 items-center justify-center bg-accent text-[12px] text-on-accent">
            {selectionIndex}
          </span>
        )}
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

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={`${shell} cursor-pointer`}>
        {body}
      </button>
    );
  }

  return (
    <Link to={`/piece/${piece.id}`} className={shell}>
      {body}
    </Link>
  );
};
