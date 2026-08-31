import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PageShell } from '../components/PageShell';
import { PieceNav } from '../components/PieceNav';
import { PieceWallLabel } from '../components/PieceWallLabel';
import { useAsync } from '../hooks';
import { CURRENT_ROLE } from '../lib/session';
import { ApiError, deletePiece, fetchPieces } from '../services';
import type { Piece } from '../types';

const BackLink = () => (
  <Link
    to="/home"
    className="text-[13px] uppercase tracking-btn text-faint transition-colors duration-200 hover:text-accent"
  >
    ← All work
  </Link>
);

const Message = ({
  eyebrow,
  headline,
}: {
  eyebrow: string;
  headline: string;
}) => (
  <section className="mx-auto flex w-full max-w-content flex-col gap-6 px-gutter pt-intro-top pb-section-lg">
    <p className="text-[12px] uppercase tracking-eyebrow text-faint">
      {eyebrow}
    </p>
    <h1 className="max-w-[14em] font-serif text-[clamp(28px,4vw,48px)] leading-[1.05] font-normal text-pretty">
      {headline}
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

/** Neighbours in gallery order. Ends are open rather than wrapping. */
const adjacent = (pieces: Piece[], index: number) => ({
  previous: index > 0 ? pieces[index - 1] : undefined,
  next: index < pieces.length - 1 ? pieces[index + 1] : undefined,
});

const PiecePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // One request rather than two: the list carries this piece and the
  // neighbours either side of it, and it is metadata only.
  const load = useAsync(fetchPieces);

  // Declared before the early returns below — hooks cannot be conditional.
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (load.status === 'loading') {
    return (
      <PageShell>
        <section className="mx-auto w-full max-w-content px-gutter pt-intro-top pb-section-lg">
          <p className="text-[12px] uppercase tracking-eyebrow text-faint">
            Loading
          </p>
        </section>
      </PageShell>
    );
  }

  if (load.status === 'error') {
    return (
      <PageShell>
        <Message eyebrow="Unavailable" headline={load.message} />
      </PageShell>
    );
  }

  const index = load.data.findIndex((candidate) => candidate.id === id);
  if (index === -1) {
    return (
      <PageShell>
        <Message eyebrow="Not found" headline="That piece isn't here." />
      </PageShell>
    );
  }

  const piece = load.data[index];
  const { previous, next } = adjacent(load.data, index);

  const remove = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePiece(piece.id);
      // replace: true so Back does not return to a page that no longer
      // exists. Leaving the route remounts the gallery, which refetches.
      navigate('/home', { replace: true });
    } catch (caught) {
      setDeleteError(
        caught instanceof ApiError
          ? caught.message
          : 'Could not reach the API. Is the backend running?',
      );
      setDeleting(false);
    }
  };

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
          {/*
            The list payload omits `collections` — only GET /api/pieces/<id>
            carries them, since resolving them per row would be a query per
            piece. Fetch the detail route here once collections exist and
            the block has something to show.
          */}
          <PieceWallLabel
            piece={piece}
            collections={piece.collections ?? []}
            onDelete={
              CURRENT_ROLE === 'owner' ? () => setConfirming(true) : undefined
            }
          />
        </div>
      </article>

      <ConfirmDialog
        open={confirming}
        title="Delete this piece?"
        confirmLabel="Delete permanently"
        busyLabel="Deleting…"
        busy={deleting}
        error={deleteError}
        onCancel={() => {
          setConfirming(false);
          setDeleteError(null);
        }}
        onConfirm={remove}
      >
        <p>
          <span className="text-text">{piece.title}</span> will be removed
          from the database, and its original and both renditions deleted
          from storage.
        </p>
        <p>
          This cannot be undone. The only copy left will be whatever you
          still have on your own disk.
        </p>
      </ConfirmDialog>
    </PageShell>
  );
};

export default PiecePage;
