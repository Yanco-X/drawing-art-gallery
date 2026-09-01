import { useCallback, useState } from 'react';
import { AllWorkSection } from '../components/AllWorkSection';
import { CollectionsSection } from '../components/CollectionsSection';
import { IntroSection } from '../components/IntroSection';
import { NewCollectionDialog } from '../components/NewCollectionDialog';
import { PageShell } from '../components/PageShell';
import { useAsync } from '../hooks';
import { CURRENT_ROLE } from '../lib/session';
import { fetchCollections, fetchPieces } from '../services';
import type { CollectionSummary, Piece } from '../types';

// The intro belongs on the root gallery view; hide it on filtered or
// collection routes when those are built.
const SHOW_INTRO = true;

const ACTION =
  'cursor-pointer border-none bg-transparent p-0 text-[13px] uppercase ' +
  'tracking-btn transition-colors duration-200';

/** The bar that replaces ordinary browsing while pieces are being picked. */
const SelectionBar = ({
  count,
  onName,
  onCancel,
}: {
  count: number;
  onName: () => void;
  onCancel: () => void;
}) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-accent px-5 py-4">
    <p className="text-[13px] text-dim">
      {count === 0
        ? 'Pick the pieces for this collection. They hang in the order you pick them.'
        : `${count} ${count === 1 ? 'piece' : 'pieces'} picked.`}
    </p>
    <div className="flex items-center gap-5">
      <button type="button" onClick={onCancel} className={`${ACTION} text-muted hover:text-accent`}>
        Cancel
      </button>
      <button
        type="button"
        onClick={onName}
        disabled={count === 0}
        className="cursor-pointer border-none bg-accent px-5 py-2.5 text-[13px] uppercase tracking-btn text-on-accent transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Name it
      </button>
    </div>
  </div>
);

const LandingPage = () => {
  const pieces = useAsync(fetchPieces);
  const collections = useAsync(fetchCollections);

  // Pieces uploaded since this page loaded, newest first. They are already
  // in the database — this only saves a refetch to put them on screen.
  const [added, setAdded] = useState<Piece[]>([]);
  // Collections created since this page loaded, likewise.
  const [made, setMade] = useState<CollectionSummary[]>([]);

  /*
   * Picking pieces for a new collection. Kept as an ordered list rather than
   * a set: the order they are picked in becomes the collection's display
   * order, which is the cheapest possible curation step.
   */
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [naming, setNaming] = useState(false);

  const togglePicked = useCallback(
    (id: string) =>
      setPicked((now) =>
        now.includes(id) ? now.filter((x) => x !== id) : [...now, id],
      ),
    [],
  );

  const stopPicking = () => {
    setPicking(false);
    setPicked([]);
    setNaming(false);
  };

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
          CURRENT_ROLE === 'owner' && !picking && allPieces.length > 0 ? (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className={`${ACTION} text-faint hover:text-accent`}
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
        selection={
          picking ? { ids: picked, onToggle: togglePicked } : undefined
        }
        banner={
          picking ? (
            <SelectionBar
              count={picked.length}
              onName={() => setNaming(true)}
              onCancel={stopPicking}
            />
          ) : undefined
        }
      />

      <NewCollectionDialog
        open={naming}
        pieceIds={picked}
        onClose={() => setNaming(false)}
        onCreated={(collection) => {
          // Prepended rather than refetched: the response is the collection
          // the API just built, cover and count included.
          setMade((now) => [collection, ...now]);
          stopPicking();
        }}
      />
    </PageShell>
  );
};

export default LandingPage;
