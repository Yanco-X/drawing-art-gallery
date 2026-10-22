import { useState } from 'react';
import { AllWorkSection } from '../components/AllWorkSection';
import { PageShell } from '../components/PageShell';
import { useAsync } from '../hooks';
import { fetchSketchbook } from '../services';
import type { Piece } from '../types';

const SketchbookPage = () => {
  const pieces = useAsync(fetchSketchbook);
  // Sketches uploaded since this page loaded, newest first, as the landing
  // page keeps its own: they are in the database already, this only saves a
  // refetch to put them on screen.
  const [added, setAdded] = useState<Piece[]>([]);
  const loaded = pieces.status === 'ready' ? pieces.data : [];

  return (
    <PageShell
      onPieceUploaded={(piece) => {
        if (piece.inSketchbook) setAdded((now) => [piece, ...now]);
      }}
    >
      <section className="mx-auto w-full max-w-content px-gutter pt-intro-top pb-intro-bottom">
        <p className="mb-4 text-[12px] uppercase tracking-eyebrow text-faint">
          Unfinished
        </p>
        <h1 className="max-w-[16em] font-display text-[clamp(28px,4vw,48px)] leading-[1.05] font-normal text-pretty text-text">
          Sketchbook.
        </h1>
        <p className="mt-4 max-w-[42em] text-[14px] leading-relaxed text-muted">
          Doodles, sketches and drafts: the work that never became a piece, but still I want you to see.
        </p>
      </section>

      <AllWorkSection
        title="All sketches"
        pieces={[...added, ...loaded]}
        loading={pieces.status === 'loading'}
        error={pieces.status === 'error' ? pieces.message : undefined}
        emptyMessage="Nothing in the sketchbook yet."
        sortable
      />
    </PageShell>
  );
};

export default SketchbookPage;
