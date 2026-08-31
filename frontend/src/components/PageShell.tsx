import { useState } from 'react';
import type { ReactNode } from 'react';
import { CURRENT_ROLE } from '../lib/session';
import type { Piece } from '../types';
import { Header } from './Header';
import { SiteFooter } from './SiteFooter';
import { UploadModal } from './UploadModal';

/** The frame every route shares: sticky header, content, footer pinned down. */
export const PageShell = ({
  children,
  onPieceUploaded,
}: {
  children: ReactNode;
  /** Pages that show work pass this to receive newly uploaded pieces. */
  onPieceUploaded?: (piece: Piece) => void;
}) => {
  // The dialog lives with the button that opens it rather than in each
  // page, so every route gets the same upload affordance for free.
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col transition-[background-color,color] duration-300">
      <Header role={CURRENT_ROLE} onUploadClick={() => setUploadOpen(true)} />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />

      {CURRENT_ROLE === 'owner' && (
        <UploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUploaded={onPieceUploaded}
        />
      )}
    </div>
  );
};
