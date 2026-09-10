import { useState } from 'react';
import type { DragEvent, KeyboardEvent } from 'react';
import type { Piece } from '../types';
import { ArrangeIcon } from './icons';

const SLOT =
  'flex items-center gap-3 px-2 py-1.5 text-[13px] transition-opacity ' +
  'duration-200';

export const SpotlightOrder = ({
  slots,
  pickedCount,
  onReorder,
}: {
  slots: Piece[];
  pickedCount: number;
  onReorder: (from: number, to: number) => void;
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const movable = pickedCount > 1;

  const reorder = (from: number, to: number) => {
    if (from === to || to < 0 || to >= pickedCount) return;
    onReorder(from, to);
    setAnnouncement(
      `${slots[from].title} moved to position ${to + 1} of ${slots.length}.`,
    );
  };

  const onDragStart = (event: DragEvent<HTMLLIElement>, index: number) => {
    setDragIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    // Firefox starts no drag at all without data on the transfer.
    event.dataTransfer.setData('text/plain', String(index));
  };

  const onDragOver = (event: DragEvent<HTMLLIElement>, index: number) => {
    if (dragIndex === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setOverIndex(index);
  };

  const onDrop = (event: DragEvent<HTMLLIElement>, index: number) => {
    event.preventDefault();
    if (dragIndex !== null) reorder(dragIndex, index);
    setDragIndex(null);
    setOverIndex(null);
  };

  // Native drag and drop is mouse-only, so the same move is on the arrows.
  // Without preventDefault the press scrolls the column instead.
  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    reorder(index, index + (event.key === 'ArrowUp' ? -1 : 1));
  };

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <ol className="-mx-2 flex flex-col gap-1">
        {slots.map((piece, at) => {
          const chosen = at < pickedCount;
          if (!chosen) {
            return (
              <li key={piece.id} className={SLOT}>
                <span className="flex size-5 shrink-0 items-center justify-center border border-line text-[11px] text-faint">
                  {at + 1}
                </span>
                <span className="truncate text-text">{piece.title}</span>
                <span className="ml-auto shrink-0 text-[11px] uppercase tracking-eyebrow text-faint">
                  Latest
                </span>
              </li>
            );
          }
          return (
            <li
              key={piece.id}
              draggable={movable}
              tabIndex={movable ? 0 : undefined}
              aria-label={`${piece.title}, position ${at + 1} of ${slots.length}`}
              onDragStart={(event) => onDragStart(event, at)}
              onDragOver={(event) => onDragOver(event, at)}
              onDrop={(event) => onDrop(event, at)}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              onKeyDown={(event) => onKeyDown(event, at)}
              className={`${SLOT} group focus:outline-1 focus:outline-offset-2 focus:outline-accent ${
                movable ? 'cursor-grab' : ''
              } ${dragIndex === at ? 'opacity-40' : ''} ${
                overIndex === at && dragIndex !== at
                  ? 'outline-1 outline-offset-2 outline-accent'
                  : ''
              }`}
            >
              <span className="flex size-5 shrink-0 items-center justify-center bg-accent text-[11px] text-on-accent">
                {at + 1}
              </span>
              <span className="truncate text-text">{piece.title}</span>
              {movable && (
                <span
                  aria-hidden="true"
                  className="ml-auto text-faint transition-colors duration-200 group-hover:text-accent"
                >
                  <ArrangeIcon />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
};
