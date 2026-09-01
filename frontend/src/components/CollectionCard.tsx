import { Link } from 'react-router-dom';
import type { CollectionSummary } from '../types';

interface CollectionCardProps {
  collection: CollectionSummary;
  /** Position in the row; picks one of the four gradient swatches. */
  index: number;
}

export const CollectionCard = ({ collection, index }: CollectionCardProps) => (
  <Link
    to={`/collections/${collection.slug}`}
    className="flex flex-col gap-3 border border-line bg-surface p-5 transition-colors duration-200 hover:border-accent"
  >
    {collection.coverImageUrl ? (
      <img
        src={collection.coverImageUrl}
        alt=""
        loading="lazy"
        className="h-[90px] w-full object-cover opacity-85"
      />
    ) : (
      // Swatches cycle through four gradients and are decorative only —
      // they stand in until a collection has a cover image.
      <div
        aria-hidden="true"
        className="h-[90px] opacity-85"
        style={{ background: `var(--sa-swatch-${(index % 4) + 1})` }}
      />
    )}
    <div className="flex flex-col gap-1">
      {/* A draft the owner can see and a visitor cannot. Marked the way a
          waived piece is, because it says the same kind of thing: this is
          here, and it is not on the wall. */}
      {!collection.isPublic && (
        <span className="text-[11px] uppercase tracking-eyebrow text-faint">
          Private
        </span>
      )}
      <span className="font-serif text-[18px] text-text">
        {collection.name}
      </span>
      <span className="text-[12px] uppercase tracking-nav text-faint">
        {collection.pieceCount} {collection.pieceCount === 1 ? 'piece' : 'pieces'}
      </span>
    </div>
  </Link>
);
