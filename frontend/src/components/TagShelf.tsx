import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { pieceHref, sequenceState } from '../lib/origin';
import { narrowToTag } from '../lib/returnMemory';
import { intendStep } from '../lib/traverse';
import type { Piece, Tag } from '../types';
import { ICON_BUTTON_ACCENT } from './form-styles';
import { CloseIcon, GalleryIcon } from './icons';

const GALLERY = '/home';

const Thumbnail = ({ piece }: { piece: Piece }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={piece.thumbnailUrl ?? piece.imageUrl}
      alt=""
      loading="lazy"
      onLoad={() => setLoaded(true)}
      className={`h-full w-full object-cover transition-opacity duration-300 ease-reflow ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
};

const ShelfPiece = ({
  piece,
  current,
  row,
}: {
  piece: Piece;
  current: boolean;
  row: boolean;
}) => (
  <>
    <div
      className={`hatch border border-line transition-colors duration-200 group-hover:border-accent ${
        row ? 'h-[120px]' : 'w-full'
      } ${current ? 'outline-1 outline-offset-2 outline-accent' : ''}`}
      style={{ aspectRatio: piece.aspectRatio }}
    >
      <Thumbnail piece={piece} />
    </div>
    {/* In a row the caption is as wide as its drawing and no wider: `w-0`
        keeps it out of the width, `min-w-full` gives it the drawing's. */}
    <span
      className={`text-[12px] ${current ? 'text-text' : 'text-muted'} ${
        row ? 'block w-0 min-w-full truncate' : ''
      }`}
    >
      {piece.title}
      {current && <span className="sr-only"> (this piece)</span>}
    </span>
  </>
);

export const TagShelf = ({
  id,
  tag,
  pieces,
  currentId,
  row = false,
  origin,
  onClose,
}: {
  id: string;
  tag: Tag;
  /** Every exhibited piece carrying the tag, in gallery order. */
  pieces: Piece[];
  currentId: string;
  /** Under the tags, scrolling sideways, rather than the drawer's column. */
  row?: boolean;
  origin?: string;
  onClose: () => void;
}) => {
  const listRef = useRef<HTMLUListElement>(null);
  const order = pieces.map((piece) => piece.id);
  const here = order.indexOf(currentId);
  const count = `${pieces.length} ${pieces.length === 1 ? 'piece' : 'pieces'}`;

  // Keeps the piece on the wall in view as the reader walks the list. The
  // list's own scroll only, less its padding: scrollIntoView would move the
  // page too, and below `xl` the row can be well off screen.
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector('[aria-current]');
    if (!list || !item) return;
    const box = list.getBoundingClientRect();
    const at = item.getBoundingClientRect();
    if (row) {
      if (at.left < box.left || at.right > box.right)
        list.scrollLeft += at.left - box.left - 4;
    } else if (at.top < box.top || at.bottom > box.bottom) {
      list.scrollTop += at.top - box.top - 16;
    }
  }, [currentId, tag.id, row]);

  const close = (
    <button
      type="button"
      onClick={onClose}
      aria-label={`Close ${tag.name}`}
      title="Close"
      className="flex size-9 shrink-0 cursor-pointer items-center justify-center border border-line bg-transparent text-muted transition-colors duration-200 hover:border-accent hover:text-accent"
    >
      <CloseIcon />
    </button>
  );

  const seeAll = (
    <Link
      to={GALLERY}
      onClick={() => narrowToTag(GALLERY, tag.id, currentId)}
      className={`${ICON_BUTTON_ACCENT} ${row ? 'w-fit' : ''}`}
    >
      <GalleryIcon />
      See all in gallery
    </Link>
  );

  return (
    <section
      id={id}
      aria-label={`Pieces tagged ${tag.name}`}
      className={
        row
          ? 'flex flex-col gap-3 pt-4'
          : 'flex h-full w-[240px] flex-col border-l border-line bg-bg'
      }
    >
      {row ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-faint">
            {count} tagged <span className="text-muted">{tag.name}</span>
          </p>
          {close}
        </div>
      ) : (
        <div className="flex flex-col gap-4 border-b border-line p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-[12px] uppercase tracking-eyebrow text-faint">
                Tagged
              </p>
              <h2 className="font-serif text-[22px] leading-tight font-normal break-words text-text">
                {tag.name}
              </h2>
              <p className="text-[12px] text-faint">{count}</p>
            </div>
            {close}
          </div>
          {seeAll}
        </div>
      )}

      {/* `min-h-0`, or the column refuses to shrink and never scrolls. */}
      <ul
        ref={listRef}
        className={
          row
            ? 'flex gap-3 overflow-x-auto p-1'
            : 'flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4'
        }
      >
        {pieces.map((piece, at) => {
          const current = piece.id === currentId;
          const body = <ShelfPiece piece={piece} current={current} row={row} />;
          return (
            <li key={piece.id} className={row ? 'shrink-0' : undefined}>
              {current ? (
                <div aria-current="true" className="flex flex-col gap-2">
                  {body}
                </div>
              ) : (
                <Link
                  to={pieceHref(piece.id, origin)}
                  state={sequenceState(order)}
                  onClick={() => intendStep(piece.id, at > here ? 1 : -1)}
                  className="group flex flex-col gap-2"
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {row && seeAll}
    </section>
  );
};
