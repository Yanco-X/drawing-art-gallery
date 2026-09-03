import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { DetailedView } from '../components/DetailedView';
import { DetailedViewButton } from '../components/DetailedViewButton';
import { PageShell } from '../components/PageShell';
import { PieceNav } from '../components/PieceNav';
import { PieceOwnerActions } from '../components/PieceOwnerActions';
import { PieceWallLabel } from '../components/PieceWallLabel';
import { useAsync, useSession } from '../hooks';
import { ICON_BUTTON } from '../components/form-styles';
import { fetchPiece, fetchPieces, fetchWaivedPieces } from '../services';
import type { Piece } from '../types';

const BackLink = ({ waived = false }: { waived?: boolean }) => (
  <Link
    to={waived ? '/waived' : '/home'}
    className={`${ICON_BUTTON} w-fit`}
  >
    {waived ? '← Waived' : '← All work'}
  </Link>
);

const Message = ({
  eyebrow,
  headline,
  /*
   * A sentence carrying a title is longer than "That piece isn't here." and
   * reads worse broken across two lines, so the tombstone gets a wider
   * measure. Still an em cap, so it wraps on a phone rather than running to
   * the edge of the screen.
   */
  measure = 'max-w-[14em]',
}: {
  eyebrow: string;
  headline: string;
  measure?: string;
}) => (
  <section className="mx-auto flex w-full max-w-content flex-col gap-6 px-gutter pt-intro-top pb-section-lg">
    <p className="text-[12px] uppercase tracking-eyebrow text-faint">
      {eyebrow}
    </p>
    <h1
      className={`${measure} font-serif text-[clamp(28px,4vw,48px)] leading-[1.05] font-normal text-pretty`}
    >
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
const adjacent = (pieces: Piece[], id: string) => {
  const index = pieces.findIndex((candidate) => candidate.id === id);
  if (index === -1) return {};
  return {
    previous: index > 0 ? pieces[index - 1] : undefined,
    next: index < pieces.length - 1 ? pieces[index + 1] : undefined,
  };
};

/** Stable placeholder loader while the piece itself is still resolving. */
const NO_SIBLINGS = async (): Promise<Piece[]> => [];

/*
 * The detail view lives in the URL, as `?view=1`.
 *
 * Which buys two things worth having: Back closes the viewer instead of
 * leaving the page, and "look at this closely" is a link somebody can be
 * sent. A query parameter rather than a nested route, because a route would
 * unmount this page underneath the overlay, and keeping it mounted -- scroll
 * position and all -- is the reason the overlay was chosen.
 */
const VIEW_PARAM = 'view';

const PiecePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  /*
   * The detail route rather than the list. A waived piece is absent from
   * the gallery listing by design, so deriving this page from that list
   * would make the reserve unreachable. The detail payload also carries
   * `collections`, which the waive dialog needs in order to name the
   * membership it is about to drop.
   *
   * Waive and restore both return the updated piece, so `edited` holds it
   * and no refetch is needed. It is only trusted while it matches the route,
   * which keeps a stale one from surviving a move to another piece.
   */
  const loadPiece = useMemo(() => () => fetchPiece(id ?? ''), [id]);
  const load = useAsync(loadPiece);
  const [edited, setEdited] = useState<Piece | null>(null);
  const { role } = useSession();

  const answer = load.status === 'ready' ? load.data : null;
  const fetched = answer?.state === 'found' ? answer.piece : null;
  const piece = edited && edited.id === id ? edited : fetched;

  /*
   * Neighbours come from whichever list this piece belongs to, so prev/next
   * never steps out of the gallery into the reserve or back. Keyed on the
   * state rather than the piece, so refetching one piece does not refetch
   * its siblings.
   */
  const state = piece ? (piece.waivedAt ? 'waived' : 'exhibited') : null;
  const loadSiblings = useMemo(() => {
    if (state === 'waived') return fetchWaivedPieces;
    if (state === 'exhibited') return fetchPieces;
    return NO_SIBLINGS;
  }, [state]);
  const siblings = useAsync(loadSiblings);

  const viewing = params.get(VIEW_PARAM) === '1';

  // Whether *this* page pushed the history entry the viewer sits on. Closing
  // has to go back when it did, so the entry is consumed rather than left
  // behind -- and must not when someone arrived on `?view=1` directly, since
  // going back would take them off the site entirely.
  const pushedView = useRef(false);

  const openViewer = useCallback(() => {
    pushedView.current = true;
    setParams({ [VIEW_PARAM]: '1' });
  }, [setParams]);

  const closeViewer = useCallback(() => {
    if (pushedView.current) {
      pushedView.current = false;
      navigate(-1);
      return;
    }
    setParams({}, { replace: true });
  }, [navigate, setParams]);

  // Moving between pieces inside the viewer replaces rather than pushes, so
  // a browsing session does not bury the page the viewer was opened from
  // under one entry per piece looked at.
  const viewNeighbour = useCallback(
    (neighbour: Piece) =>
      navigate(`/piece/${neighbour.id}?${VIEW_PARAM}=1`, { replace: true }),
    [navigate],
  );

  const refresh = useCallback((updated: Piece) => setEdited(updated), []);
  // replace: true so Back does not return to a page that no longer exists.
  // Leaving the route remounts the reserve, which refetches.
  const afterDelete = useCallback(
    () => navigate('/waived', { replace: true }),
    [navigate],
  );

  // A piece that does not exist cannot be viewed, and leaving the parameter
  // behind would put the page one refresh away from opening an empty viewer.
  const missing = load.status === 'ready' && piece === null;
  useEffect(() => {
    if (missing && viewing) setParams({}, { replace: true });
  }, [missing, viewing, setParams]);

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

  /*
   * Two absences, and they are not the same absence. A piece that was on
   * the wall and came off it says so, by name -- whoever followed a link
   * here saw it hanging, so the gallery owes them an explanation rather
   * than a shrug. A piece that never existed gets the shrug.
   */
  if (answer?.state === 'gone') {
    return (
      <PageShell>
        <Message
          eyebrow="No longer exhibited"
          measure="max-w-[24em]"
          headline={
            answer.title
              ? `${answer.title} has been taken off the wall.`
              : 'That work has been taken off the wall.'
          }
        />
      </PageShell>
    );
  }

  if (piece === null) {
    return (
      <PageShell>
        <Message eyebrow="Not found" headline="That piece isn't here." />
      </PageShell>
    );
  }

  const { previous, next } =
    siblings.status === 'ready' ? adjacent(siblings.data, piece.id) : {};

  return (
    <PageShell>
      <article className="mx-auto w-full max-w-content px-gutter pt-8 pb-section-lg">
        {/* Back and neighbours share one row above the artwork, so moving
            between pieces never requires scrolling past it. */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <BackLink waived={Boolean(piece.waivedAt)} />
          <PieceNav previous={previous} next={next} />
        </div>

        {/* The artwork keeps the room; the label sits beside it, divided by
            a hairline that turns horizontal when the two stack. */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Centred rather than left-aligned: the 78vh cap often leaves the
              image narrower than its column, and hugging the left would
              strand the dividing rule out on its own. */}
          {/* The button belongs to the artwork, not to the label: it is
              about the work itself, and this column is where the eye
              already is. Shown to everyone -- for a visitor it is the only
              action the page offers. */}
          <figure className="flex justify-center">
            {/* `w-fit` so the column shrinks to the artwork: the button then
                spans the drawing exactly rather than the whole grid cell,
                which is often much wider because of the 78vh cap. It should
                read as belonging to the work, not floating beside it. */}
            <div className="flex w-fit flex-col items-stretch">
              <PieceImage piece={piece} />
              <DetailedViewButton piece={piece} onOpen={openViewer} />
            </div>
          </figure>
          <PieceWallLabel
            piece={piece}
            collections={piece.collections ?? []}
            actions={
              role === 'owner' ? (
                <PieceOwnerActions
                  piece={piece}
                  onChanged={refresh}
                  onDeleted={afterDelete}
                />
              ) : undefined
            }
          />
        </div>
      </article>

      <DetailedView
        open={viewing}
        piece={piece}
        previous={previous}
        next={next}
        onClose={closeViewer}
        onNavigate={viewNeighbour}
      />
    </PageShell>
  );
};

export default PiecePage;
