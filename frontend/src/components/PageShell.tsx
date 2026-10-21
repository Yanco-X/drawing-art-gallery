import { Suspense, lazy, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSecretTrigger, useSession } from '../hooks';
import { pieceHref } from '../lib/origin';
import type { Piece } from '../types';
import { BackToTop } from './BackToTop';
import { ConfirmDialog } from './ConfirmDialog';
import { Header } from './Header';
import { SiteFooter } from './SiteFooter';
import { UploadModal } from './UploadModal';

// Lazy, so the one field that asks for a secret is not in the bundle a
// visitor downloads. It is also never mounted until something opens it.
const Keyhole = lazy(() => import('./Keyhole'));

export const PageShell = ({
  children,
  onPieceUploaded,
}: {
  children: ReactNode;
  onPieceUploaded?: (piece: Piece) => void;
}) => {
  // The dialog lives with the button that opens it rather than in each
  // page, so every route gets the same upload affordance for free.
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploaded, setUploaded] = useState<Piece | null>(null);
  const navigate = useNavigate();
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
      {/* A swiped page slides past the edge, and a phone would widen the
          page to hold it. `clip` rather than `hidden`, so sticky still sticks. */}
      <main className="flex flex-1 flex-col overflow-x-clip">
        {children}
        <BackToTop />
      </main>
      <SiteFooter onMark={onMark} />

      {isOwner && (
        <>
          <UploadModal
            open={uploadOpen}
            onClose={() => setUploadOpen(false)}
            onUploaded={(piece) => {
              onPieceUploaded?.(piece);
              setUploaded(piece);
            }}
          />
          <ConfirmDialog
            open={uploaded !== null}
            title="Uploaded"
            confirmLabel="Open piece"
            cancelLabel="Stay here"
            onCancel={() => setUploaded(null)}
            onConfirm={() => {
              if (uploaded) navigate(pieceHref(uploaded.id));
              setUploaded(null);
            }}
          >
            <p>{uploaded?.title} is in the gallery.</p>
          </ConfirmDialog>
        </>
      )}

      {keyholeOpen && (
        <Suspense fallback={null}>
          <Keyhole />
        </Suspense>
      )}
    </div>
  );
};
