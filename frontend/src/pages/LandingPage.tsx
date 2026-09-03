import { useMemo, useState } from 'react';
import { AllWorkSection } from '../components/AllWorkSection';
import { CollectionsSection } from '../components/CollectionsSection';
import { IntroSection } from '../components/IntroSection';
import { NewCollectionDialog } from '../components/NewCollectionDialog';
import { PageShell } from '../components/PageShell';
import { ICON_BUTTON_ACCENT } from '../components/form-styles';
import { useAsync, useSession } from '../hooks';
import { collectionsFor, fetchPieces } from '../services';
import type { CollectionSummary, Piece } from '../types';

// The intro belongs on the root gallery view; hide it on filtered or
// collection routes when those are built.
const SHOW_INTRO = true;

const LandingPage = () => {
  const { role } = useSession();
  const pieces = useAsync(fetchPieces);
  // Drafts included for the owner, so an unpublished collection does not
  // vanish from its maker's own gallery on the next reload. Memoised on the
  // role, which is what the loader depends on now that it is answered at
  // runtime rather than read at import.
  const loadCollections = useMemo(() => collectionsFor(role), [role]);
  const collections = useAsync(loadCollections);
  const isOwner = role === 'owner';

  // Pieces uploaded since this page loaded, newest first. They are already
  // in the database — this only saves a refetch to put them on screen.
  const [added, setAdded] = useState<Piece[]>([]);
  // Collections created since this page loaded, likewise.
  const [made, setMade] = useState<CollectionSummary[]>([]);

  /*
   * Picking happens inside the dialog now, so this page holds nothing but
   * the flag that opens it. It used to carry the whole selection: the
   * gallery went into a picking mode, which meant scrolling the length of
   * the gallery to choose and scrolling back up to name or cancel.
   */
  const [making, setMaking] = useState(false);

  const loaded = pieces.status === 'ready' ? pieces.data : [];
  const allPieces = [...added, ...loaded];
  const allCollections = [
    ...made,
    ...(collections.status === 'ready' ? collections.data : []),
  ];

  return (
    <PageShell onPieceUploaded={(piece) => setAdded((now) => [piece, ...now])}>
      {SHOW_INTRO && <IntroSection />}

      <CollectionsSection
        collections={allCollections}
        loading={collections.status === 'loading'}
        error={collections.status === 'error' ? collections.message : undefined}
        action={
          isOwner && allPieces.length > 0 ? (
            <button
              type="button"
              onClick={() => setMaking(true)}
              className={ICON_BUTTON_ACCENT}
            >
              + New collection
            </button>
          ) : undefined
        }
      />

      <AllWorkSection
        pieces={allPieces}
        loading={pieces.status === 'loading'}
        error={pieces.status === 'error' ? pieces.message : undefined}
      />

      {isOwner && (
        <NewCollectionDialog
          open={making}
          onClose={() => setMaking(false)}
          onCreated={(collection) => {
            // Prepended rather than refetched: the response is the collection
            // the API just built, cover and count included.
            setMade((now) => [collection, ...now]);
            setMaking(false);
          }}
        />
      )}
    </PageShell>
  );
};

export default LandingPage;
