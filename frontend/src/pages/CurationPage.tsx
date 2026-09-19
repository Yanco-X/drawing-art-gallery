import { useMemo, useState } from 'react';
import { CollectionGrid } from '../components/CollectionGrid';
import { CollectionTile } from '../components/CollectionTile';
import { CurationBoard } from '../components/CurationBoard';
import type { Arrangement } from '../components/CurationBoard';
import { MasonryGrid } from '../components/MasonryGrid';
import { PageMessage } from '../components/PageMessage';
import { PageShell } from '../components/PageShell';
import { PieceTile } from '../components/PieceTile';
import { SectionState } from '../components/SectionState';
import { useAsync, useSession } from '../hooks';
import { sortPieces } from '../lib/sortPieces';
import {
  fetchAllCollections,
  fetchPieces,
  setCollectionOrder,
  setCuratedOrder,
} from '../services';
import type { CollectionSummary, Piece } from '../types';

type Subject = 'pieces' | 'collections';

const SUBJECTS: { subject: Subject; label: string }[] = [
  { subject: 'pieces', label: 'Pieces' },
  { subject: 'collections', label: 'Collections' },
];

const PIECE_ARRANGEMENTS: Arrangement<Piece>[] = [
  {
    label: 'Newest upload',
    arrange: (all) => sortPieces(all, 'added', 'desc'),
  },
  { label: 'Oldest upload', arrange: (all) => sortPieces(all, 'added', 'asc') },
  {
    label: 'Year, newest first',
    arrange: (all) => sortPieces(all, 'year', 'desc'),
  },
  {
    label: 'Year, oldest first',
    arrange: (all) => sortPieces(all, 'year', 'asc'),
  },
  { label: 'Title, A–Z', arrange: (all) => sortPieces(all, 'title', 'asc') },
];

const made = (collection: CollectionSummary) =>
  collection.createdAt ? Date.parse(collection.createdAt) : 0;

const COLLECTION_ARRANGEMENTS: Arrangement<CollectionSummary>[] = [
  {
    label: 'Newest first',
    arrange: (all) => [...all].sort((a, b) => made(b) - made(a)),
  },
  {
    label: 'Oldest first',
    arrange: (all) => [...all].sort((a, b) => made(a) - made(b)),
  },
  {
    label: 'Name, A–Z',
    arrange: (all) =>
      [...all].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
  },
  {
    label: 'Most pieces first',
    arrange: (all) => [...all].sort((a, b) => b.pieceCount - a.pieceCount),
  },
];

const NO_COLLECTIONS = async (): Promise<CollectionSummary[]> => [];

const CurationPage = () => {
  const { role } = useSession();
  const [subject, setSubject] = useState<Subject>('pieces');
  const pieces = useAsync(fetchPieces);
  // Drafts included, which only the owner may ask for.
  const loadCollections = useMemo(
    () => (role === 'owner' ? fetchAllCollections : NO_COLLECTIONS),
    [role],
  );
  const collections = useAsync(loadCollections);

  if (role !== 'owner') {
    return (
      <PageShell>
        <PageMessage eyebrow="Not found" headline="There's nothing here." />
      </PageShell>
    );
  }

  const list = subject === 'pieces' ? pieces : collections;

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-content px-gutter pt-intro-top pb-intro-bottom">
        <p className="mb-4 text-[12px] uppercase tracking-eyebrow text-faint">
          On the wall
        </p>
        <h1 className="max-w-[16em] font-serif text-[clamp(28px,4vw,48px)] leading-[1.05] font-normal text-pretty text-text">
          Curation.
        </h1>
        <p className="mt-4 max-w-[42em] text-[14px] leading-relaxed text-muted">
          {subject === 'pieces'
            ? 'The gallery in the order visitors meet it, first to last. New uploads and restored pieces wait at the top until you place them.'
            : 'The collections in the order visitors meet them, on the landing page and the Collections page. New ones wait at the top until you place them. Drafts are ordered with the rest.'}
        </p>
        <div
          role="group"
          aria-label="What to curate"
          className="mt-6 flex w-fit border border-line"
        >
          {SUBJECTS.map((option, index) => (
            <button
              key={option.subject}
              type="button"
              onClick={() => setSubject(option.subject)}
              aria-pressed={subject === option.subject}
              className={`cursor-pointer px-4 py-2 text-[13px] uppercase tracking-btn transition-colors duration-200 ${
                index > 0 ? 'border-l border-line' : ''
              } ${
                subject === option.subject
                  ? 'bg-accent text-on-accent'
                  : 'text-muted hover:text-accent'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-content px-gutter pb-section-lg">
        {list.status === 'loading' && <SectionState message="Loading…" />}
        {list.status === 'error' && <SectionState message={list.message} />}
        {subject === 'pieces' &&
          pieces.status === 'ready' &&
          (pieces.data.length === 0 ? (
            <SectionState message="Nothing to curate yet. Upload a piece first." />
          ) : (
            <CurationBoard
              key="pieces"
              items={pieces.data}
              noun={['piece', 'pieces']}
              nameOf={(piece) => piece.title}
              renderTile={(piece, _index, picked, overlays) => (
                <PieceTile piece={piece} selected={picked} whole>
                  {overlays}
                </PieceTile>
              )}
              renderPreview={(order, density) => (
                <MasonryGrid pieces={order} density={density} numbered />
              )}
              previewNote="The wall as a visitor sees it at this window's width and density, unsaved changes included. It reads across: the first pieces are the top row, left to right, and each after them hangs under the shortest column."
              arrangements={PIECE_ARRANGEMENTS}
              save={setCuratedOrder}
              draftKey="sketchyart-curation-draft"
            />
          ))}
        {subject === 'collections' &&
          collections.status === 'ready' &&
          (collections.data.length === 0 ? (
            <SectionState message="No collections yet." />
          ) : (
            <CurationBoard
              key="collections"
              items={collections.data}
              noun={['collection', 'collections']}
              nameOf={(collection) => collection.name}
              renderTile={(collection, index, picked, overlays) => (
                <CollectionTile
                  collection={collection}
                  index={index}
                  selected={picked}
                >
                  {overlays}
                </CollectionTile>
              )}
              renderPreview={(order) => (
                <CollectionGrid collections={order} numbered />
              )}
              previewNote="The collections as a visitor sees them, unsaved changes included, left to right and row by row. Drafts show here; a visitor never sees them."
              arrangements={COLLECTION_ARRANGEMENTS}
              save={setCollectionOrder}
              draftKey="sketchyart-curation-draft-collections"
            />
          ))}
      </section>
    </PageShell>
  );
};

export default CurationPage;
