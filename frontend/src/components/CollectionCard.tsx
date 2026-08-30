import type { Collection } from '../types';
import { InertLink } from './InertLink';

interface CollectionCardProps {
  collection: Collection;
  /** Position in the row; picks one of the four gradient swatches. */
  index: number;
}

export const CollectionCard = ({ collection, index }: CollectionCardProps) => (
  <InertLink className="flex flex-col gap-3 border border-line bg-surface p-5 transition-colors duration-200 hover:border-accent">
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
      <span className="font-serif text-[18px] text-text">
        {collection.name}
      </span>
      <span className="text-[12px] uppercase tracking-nav text-faint">
        {collection.pieceCount} pieces
      </span>
    </div>
  </InertLink>
);
