import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { PieceNav } from '../components/PieceNav';
import { PieceWallLabel } from '../components/PieceWallLabel';
import {
  getAdjacentPieces,
  getCollectionsForPiece,
  getPieceById,
} from '../lib/mock-data';
import type { Piece } from '../types';

const BackLink = () => (
  <Link
    to="/home"
    className="text-[13px] uppercase tracking-btn text-faint transition-colors duration-200 hover:text-accent"
  >
    ← All work
  </Link>
);

const NotFound = () => (
  <section className="mx-auto flex w-full max-w-content flex-col gap-6 px-gutter pt-intro-top pb-section-lg">
    <p className="text-[12px] uppercase tracking-eyebrow text-faint">
      Not found
    </p>
    <h1 className="max-w-[14em] font-serif text-[clamp(28px,4vw,48px)] leading-[1.05] font-normal text-pretty">
      That piece isn't here.
    </h1>
    <div>
      <BackLink />
    </div>
  </section>
);

/**
 * Capped at 78vh so a tall portrait still fits on screen beside its label
 * rather than pushing the metadata below the fold. The hatch sits behind
 * the image, so a slow load shows the placeholder instead of a hole.
 */
const PieceImage = ({ piece }: { piece: Piece }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="hatch flex w-full max-w-[560px] items-center justify-center border border-line"
        style={{ aspectRatio: piece.aspectRatio }}
      >
        <span className="font-mono text-[11px] tracking-[0.05em] text-faint">
          [ artwork unavailable ]
        </span>
      </div>
    );
  }

  return (
    <img
      src={piece.imageUrl}
      alt={piece.title}
      onError={() => setFailed(true)}
      style={{ aspectRatio: piece.aspectRatio }}
      className="hatch max-h-[78vh] w-auto max-w-full border border-line object-contain"
    />
  );
};

const PiecePage = () => {
  const { id } = useParams<{ id: string }>();
  const piece = id ? getPieceById(id) : undefined;

  if (!piece) {
    return (
      <PageShell>
        <NotFound />
      </PageShell>
    );
  }

  const collections = getCollectionsForPiece(piece.id);
  const { previous, next } = getAdjacentPieces(piece.id);

  return (
    <PageShell>
      <article className="mx-auto w-full max-w-content px-gutter pt-8 pb-section-lg">
        {/* Back and neighbours share one row above the artwork, so moving
            between pieces never requires scrolling past it. */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <BackLink />
          <PieceNav previous={previous} next={next} />
        </div>

        {/* The artwork keeps the room; the label sits beside it, divided by
            a hairline that turns horizontal when the two stack. */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Centred rather than left-aligned: the 78vh cap often leaves the
              image narrower than its column, and hugging the left would
              strand the dividing rule out on its own. */}
          <figure className="flex items-start justify-center">
            <PieceImage piece={piece} />
          </figure>
          <PieceWallLabel piece={piece} collections={collections} />
        </div>
      </article>
    </PageShell>
  );
};

export default PiecePage;
