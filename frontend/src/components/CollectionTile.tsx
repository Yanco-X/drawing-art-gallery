import type { ReactNode } from 'react';
import type { CollectionSummary } from '../types';

/** A collection in the curation board's frame, the one `PieceTile` draws.
    `index` picks the swatch a coverless collection shows, as on the card. */
export const CollectionTile = ({
  collection,
  index,
  selected = false,
  children,
}: {
  collection: CollectionSummary;
  index: number;
  selected?: boolean;
  children?: ReactNode;
}) => (
  <div className="flex flex-col gap-2">
    <div
      className={`hatch relative aspect-[4/3] w-full border transition-colors duration-200 ${
        selected ? 'border-accent' : 'border-line'
      }`}
    >
      {collection.coverImageUrl ? (
        <img
          src={collection.coverImageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: `var(--sa-swatch-${(index % 4) + 1})` }}
        />
      )}
      {children}
    </div>
    <span className="truncate text-[13px] text-text">{collection.name}</span>
    <span className="text-[12px] text-faint">
      {collection.pieceCount} {collection.pieceCount === 1 ? 'piece' : 'pieces'}
      {!collection.isPublic && ' · Private'}
    </span>
  </div>
);
