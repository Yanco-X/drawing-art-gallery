import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CollectionRef, Piece, Tag } from '../types';

const Rule = () => <div aria-hidden="true" className="border-t border-line" />;

const CHIP = 'block border px-3 py-1.5 text-[12px] tracking-nav';

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
  tagShelf,
}: {
  piece: Piece;
  collections: CollectionRef[];
  actions?: ReactNode;
  className?: string;
  /** Left out, every tag is a plain label. */
  tagShelf?: {
    /** Tags another piece carries too; only those have a shelf to open. */
    shared: Set<string>;
    openId: string | null;
    controls: string;
    onToggle: (tag: Tag, chip: HTMLButtonElement) => void;
    /** The shelf as a row under the tags, below `xl`. */
    row: ReactNode;
  };
}) => {
  // Nullable on an uploaded piece: only draw the separator between values
  // that are actually there.
  const meta = [piece.medium, piece.year].filter(Boolean).join(' · ');

  return (
    <aside
      className={`@container flex flex-col gap-6 border-t border-line pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8 ${className}`}
    >
      <div className="flex flex-col gap-2">
        {piece.waivedAt && (
          <p className="text-[12px] uppercase tracking-eyebrow text-faint">
            Waived
          </p>
        )}
        {/* The `cqi` term only bites when the column narrows for the tag
            drawer: the title scales down with it and keeps its line breaks. */}
        <h1 className="font-serif text-[clamp(22px,min(2.4vw,11.2cqi),32px)] leading-tight font-normal text-text">
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
            <div>
              <ul className="flex flex-wrap gap-2">
                {piece.tags.map((tag) => {
                  const open = tagShelf?.openId === tag.id;
                  return (
                    <li key={tag.id}>
                      {tagShelf?.shared.has(tag.id) ? (
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-controls={tagShelf.controls}
                          onClick={(event) =>
                            tagShelf.onToggle(tag, event.currentTarget)
                          }
                          className={`${CHIP} cursor-pointer transition-colors duration-200 ${
                            open
                              ? 'border-accent text-accent'
                              : 'border-line text-muted hover:border-accent hover:text-accent'
                          }`}
                        >
                          {tag.name}
                        </button>
                      ) : (
                        <span className={`${CHIP} border-line text-muted`}>
                          {tag.name}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {tagShelf?.row}
            </div>
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
