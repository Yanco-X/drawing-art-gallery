import type { Piece } from '../types';
import { PieceTile } from './PieceTile';
import { SectionState } from './SectionState';

export const PiecePickerGrid = ({
  pieces,
  picked,
  onToggle,
  emptyMessage,
}: {
  pieces: Piece[];
  picked: string[];
  onToggle: (id: string) => void;
  emptyMessage: string;
}) => {
  if (pieces.length === 0) {
    return <SectionState message={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
      {pieces.map((piece) => {
        const index = picked.indexOf(piece.id);
        return (
          <button
            key={piece.id}
            type="button"
            onClick={() => onToggle(piece.id)}
            aria-pressed={index !== -1}
            className="cursor-pointer border-none bg-transparent p-0 text-left"
          >
            <PieceTile piece={piece} selected={index !== -1}>
              {index !== -1 && (
                <span className="absolute top-2 left-2 flex size-6 items-center justify-center bg-accent text-[12px] text-on-accent">
                  {index + 1}
                </span>
              )}
            </PieceTile>
          </button>
        );
      })}
    </div>
  );
};
