import { useState } from 'react';
import { useObjectUrl } from '../hooks';
import { describeFileSize } from '../lib/upload';
import type { Piece } from '../types';
import { LABEL } from './form-styles';

interface ReplacementComparisonProps {
  piece: Piece;
  replacement: File | null;
}

interface Measured {
  src: string;
  width: number;
  height: number;
}

// The window's height less the dialog around the frames -- title, text, file
// field, captions, buttons, and the margin a modal dialog keeps -- so a laptop
// never scrolls the dialog to reach Replace.
const FRAME_HEIGHT = 'h-[clamp(200px,100dvh_-_340px,1100px)]';
const FRAME = FRAME_HEIGHT + ' w-full bg-bg object-contain';
const CAPTION = 'flex min-w-0 flex-col text-[12px] leading-snug text-faint';

export const ReplacementComparison = ({
  piece,
  replacement,
}: ReplacementComparisonProps) => {
  const src = useObjectUrl(replacement);
  const [measured, setMeasured] = useState<Measured | null>(null);
  const size = measured && measured.src === src ? measured : null;

  return (
    <div className="grid grid-cols-2 gap-3">
      <figure className="flex min-w-0 flex-col gap-1.5">
        <img
          src={piece.imageUrl}
          alt={'Current image of ' + piece.title}
          className={FRAME}
        />
        <figcaption className={CAPTION}>
          <span className={LABEL}>Current</span>
          {piece.width !== null && piece.height !== null && (
            <span>
              {piece.width} × {piece.height}
            </span>
          )}
        </figcaption>
      </figure>

      <figure className="flex min-w-0 flex-col gap-1.5">
        {src ? (
          <img
            src={src}
            alt={'New image for ' + piece.title}
            className={FRAME}
            onLoad={(event) =>
              setMeasured({
                src,
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
          />
        ) : (
          <div
            className={
              FRAME_HEIGHT +
              ' flex items-center justify-center border border-dashed border-line text-[12px] text-faint'
            }
          >
            No file chosen
          </div>
        )}
        <figcaption className={CAPTION}>
          <span className={LABEL}>New</span>
          {replacement && (
            <>
              {size && (
                <span>
                  {size.width} × {size.height}
                </span>
              )}
              <span className="truncate" title={replacement.name}>
                {replacement.name} · {describeFileSize(replacement)}
              </span>
            </>
          )}
        </figcaption>
      </figure>
    </div>
  );
};
