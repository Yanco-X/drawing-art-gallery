import { Suspense, lazy, useState } from 'react';
import type { ReactNode } from 'react';
import { useSecretTrigger, useSession } from '../hooks';
import type { Piece } from '../types';
import { Header } from './Header';
import { SiteFooter } from './SiteFooter';
import { UploadModal } from './UploadModal';

// Lazy, so the one field that asks for a secret is not in the bundle a
// visitor downloads. It is also never mounted until something opens it.
const Keyhole = lazy(() => import('./Keyhole'));

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
  const { role, keyholeOpen, openKeyhole, signOut } = useSession();
  const onMark = useSecretTrigger(openKeyhole);
  const isOwner = role === 'owner';

  return (
    <div className="flex min-h-screen flex-col transition-[background-color,color] duration-300">
      <Header
        role={role}
        onUploadClick={() => setUploadOpen(true)}
        onSignOut={signOut}
      />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter onMark={onMark} />

      {isOwner && (
        <UploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUploaded={onPieceUploaded}
        />
      )}

      {keyholeOpen && (
        <Suspense fallback={null}>
          <Keyhole />
        </Suspense>
      )}
    </div>
  );
};
