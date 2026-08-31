import { useState } from 'react';
import { AllWorkSection } from '../components/AllWorkSection';
import { CollectionsSection } from '../components/CollectionsSection';
import { IntroSection } from '../components/IntroSection';
import { PageShell } from '../components/PageShell';
import { useAsync } from '../hooks';
import { fetchCollections, fetchPieces } from '../services';
import type { Piece } from '../types';

// The intro belongs on the root gallery view; hide it on filtered or
// collection routes when those are built.
const SHOW_INTRO = true;

const LandingPage = () => {
  const pieces = useAsync(fetchPieces);
  const collections = useAsync(fetchCollections);

  // Pieces uploaded since this page loaded, newest first. They are already
  // in the database — this only saves a refetch to put them on screen.
  const [added, setAdded] = useState<Piece[]>([]);

  const loaded = pieces.status === 'ready' ? pieces.data : [];

  return (
    <PageShell onPieceUploaded={(piece) => setAdded((now) => [piece, ...now])}>
      {SHOW_INTRO && <IntroSection />}

      <CollectionsSection
        collections={collections.status === 'ready' ? collections.data : []}
        loading={collections.status === 'loading'}
        error={collections.status === 'error' ? collections.message : undefined}
      />

      <AllWorkSection
        pieces={[...added, ...loaded]}
        loading={pieces.status === 'loading'}
        error={pieces.status === 'error' ? pieces.message : undefined}
      />
    </PageShell>
  );
};

export default LandingPage;
