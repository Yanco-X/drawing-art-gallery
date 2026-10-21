import { Fragment } from 'react';
import { usePersistentState } from '../hooks';
import {
  describeColorMode,
  describeMegapixels,
  describePrintSize,
  describeUploadDay,
} from '../lib/fileDetails';
import { describeBytes } from '../lib/upload';
import type { Piece, PieceFile } from '../types';
import { ChevronDownIcon } from './icons';

const FILE_DETAILS_OPEN_KEY = 'sketchyart-file-details-open';

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

interface PieceFileDetailsProps {
  piece: Piece;
  file: PieceFile;
}

export const PieceFileDetails = ({ piece, file }: PieceFileDetailsProps) => {
  const [open, setOpen] = usePersistentState(FILE_DETAILS_OPEN_KEY, true, isBoolean);
  const { width, height } = piece;
  const measured = width !== null && height !== null;

  const rows: [label: string, value: string | null][] = [
    ['File name', file.originalName],
    ['Format', file.format.toUpperCase()],
    ['Dimensions', measured ? `${width} × ${height} px` : null],
    ['Megapixels', measured ? describeMegapixels(width, height) : null],
    ['File size', file.byteSize !== null ? describeBytes(file.byteSize) : null],
    ['Resolution', file.dpi !== null ? `${file.dpi} dpi` : null],
    [
      'Print size',
      measured && file.dpi !== null ? describePrintSize(width, height, file.dpi) : null,
    ],
    ['Color', file.colorMode ? describeColorMode(file.colorMode) : null],
    ['Captured with', file.captureDevice],
    ['Uploaded', piece.createdAt ? describeUploadDay(piece.createdAt) : null],
  ];

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[12px] uppercase tracking-nav text-faint transition-colors duration-200 hover:text-text [&::-webkit-details-marker]:hidden">
        File
        <span className="transition-transform duration-200 group-open:rotate-180">
          <ChevronDownIcon />
        </span>
      </summary>
      <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[13px] leading-snug">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <Fragment key={label}>
              <dt className="text-faint">{label}</dt>
              <dd className="break-words text-dim">{value}</dd>
            </Fragment>
          ))}
      </dl>
    </details>
  );
};
