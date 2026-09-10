import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CollectionRef, Piece } from '../types';

const Rule = () => <div aria-hidden="true" className="border-t border-line" />;

const Block = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-3">
    <h2 className="text-[12px] uppercase tracking-nav text-faint">{label}</h2>
    {children}
  </div>
);

export const PieceWallLabel = ({
  piece,
  collections,
  actions,
  className = '',
}: {
  piece: Piece;
  collections: CollectionRef[];
  actions?: ReactNode;
  className?: string;
}) => {
  // Nullable on an uploaded piece: only draw the separator between values
  // that are actually there.
  const meta = [piece.medium, piece.year].filter(Boolean).join(' · ');

  return (
    <aside
      className={`flex flex-col gap-6 border-t border-line pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8 ${className}`}
    >
      <div className="flex flex-col gap-2">
        {piece.waivedAt && (
          <p className="text-[12px] uppercase tracking-eyebrow text-faint">
            Waived
          </p>
        )}
        <h1 className="font-serif text-[clamp(22px,2.4vw,32px)] leading-tight font-normal text-text">
          {piece.title}
        </h1>
        {meta && <p className="text-[12px] text-faint">{meta}</p>}
      </div>

      {piece.description && (
        <>
          <Rule />
          <p className="text-[14px] leading-relaxed text-dim">
            {piece.description}
          </p>
        </>
      )}

      {piece.tags.length > 0 && (
        <>
          <Rule />
          <Block label="Tags">
            <ul className="flex flex-wrap gap-2">
              {piece.tags.map((tag) => (
                <li
                  key={tag.id}
                  className="border border-line px-3 py-1.5 text-[12px] tracking-nav text-muted"
                >
                  {tag.name}
                </li>
              ))}
            </ul>
          </Block>
        </>
      )}

      {collections.length > 0 && (
        <>
          <Rule />
          <Block label="In collections">
            <ul className="flex flex-col gap-2">
              {collections.map((collection) => (
                <li key={collection.id}>
                  <Link
                    to={`/collections/${collection.slug}`}
                    className="font-serif text-[20px] font-normal text-text transition-colors duration-200 hover:text-accent"
                  >
                    {collection.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Block>
        </>
      )}
      {actions && (
        <>
          <Rule />
          <div>{actions}</div>
        </>
      )}
    </aside>
  );
};
