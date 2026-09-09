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
import {
  HOME_ORIGIN,
  ORIGIN_PARAM,
  behind,
  collectionHref,
  nearestStep,
  readTrail,
  serialiseTrail,
} from '../lib/origin';
import {
  fetchCollection,
  fetchPiece,
  fetchPieces,
  fetchWaivedPieces,
} from '../services';
import type { Collection, Piece } from '../types';

/**
 * Back to wherever this piece was opened from.
 *
 * Named, when that is a collection: "← All work" from inside a set is a
 * lie about where Back goes, and the set is the thing the reader chose to
 * be in.
 */
const BackLink = ({
  waived = false,
  from,
  trail = [],
}: {
  waived?: boolean;
  from?: Collection | null;
  /** What sits behind the collection, so its own back row survives the trip. */
  trail?: string[];
}) => {
  const to = from
    ? collectionHref(from.slug, serialiseTrail(trail) || undefined)
    : waived
      ? '/waived'
      : '/home';
  const label = from ? from.name : waived ? 'Waived' : 'All work';
  return (
    <Link to={to} className={`${ICON_BUTTON} w-fit`}>
      ← {label}
    </Link>
  );
};

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

/*
 * The cap is on the artwork *and* its button together, not on the image
 * alone.
 *
 * It was 78vh, set when nothing sat underneath. A percentage cannot hold
 * that promise once something does: the chrome around the image is a fixed
 * 226px -- header, top padding, the button with its dimensions line, and a
 * little air -- while 78vh grows with the window. The two happened to agree
 * at about a 900px viewport and disagreed everywhere else, which is why the
 * button sat five pixels below the fold on a 1080p laptop and further down
 * on anything shorter.
 *
 * Subtracting the chrome instead means the artwork takes whatever the page
 * does not need: larger on a big monitor than 78vh ever gave it, smaller on
 * a short one, and the button always in view. The 320px floor stops a
 * landscape phone from reducing the drawing to a stamp.
 *
 * Two numbers because the chrome is two heights. From lg the links live in
 * the rail and nothing sits above the artwork but the header and the page
 * padding. Below it the layout stacks, the links go back over the drawing
 * to stay reachable, and their row costs another 67px.
 *
 * The hatch sits behind the image, so a slow load shows the placeholder
 * instead of a hole.
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
      className="hatch max-h-[max(320px,calc(100vh_-_294px))] w-auto max-w-full border border-line object-contain lg:max-h-[max(320px,calc(100vh_-_226px))]"
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

/** Likewise, for a page that was not opened from a collection. */
const NO_ORIGIN = async (): Promise<Collection | null> => null;

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

  /*
   * The set this piece was opened from, if it was opened from one.
   *
   * Fetched alongside the gallery list rather than instead of it, so that a
   * `from` naming a collection that no longer exists, or is private to
   * someone else, or no longer holds this piece, falls back to gallery
   * order rather than to no neighbours at all. A stale link should be worth
   * less than a fresh one, not broken.
   */
  const rawTrail = params.get(ORIGIN_PARAM);
  const trail = useMemo(() => readTrail(rawTrail), [rawTrail]);
  // The nearest step is the list this piece belongs to. `home` is a place,
  // not a set, so it names no collection to walk.
  const openedFrom = nearestStep(trail);
  const setSlug = openedFrom === HOME_ORIGIN ? undefined : openedFrom;
  const loadOrigin = useMemo(
    () => (setSlug ? () => fetchCollection(setSlug) : NO_ORIGIN),
    [setSlug],
  );
  const origin = useAsync(loadOrigin);
  const fromSet = origin.status === 'ready' ? origin.data : null;
  // Only honoured while the piece is actually a member. Waiving drops
  // membership, so a waived piece walks the reserve however it was reached.
  const inSet = Boolean(
    piece &&
      !piece.waivedAt &&
      fromSet?.pieces.some((member) => member.id === piece.id),
  );
  const carried = inSet ? (rawTrail ?? undefined) : undefined;

  const viewing = params.get(VIEW_PARAM) === '1';

  /*
   * The search string, rebuilt rather than replaced. `setParams` writes the
   * whole query, so opening or closing the viewer with an object literal
   * would drop the origin and quietly return the reader to gallery order.
   */
  const queryWith = useCallback(
    (view: boolean) => {
      const next = new URLSearchParams();
      if (rawTrail) next.set(ORIGIN_PARAM, rawTrail);
      if (view) next.set(VIEW_PARAM, '1');
      return next;
    },
    [rawTrail],
  );

  // Whether *this* page pushed the history entry the viewer sits on. Closing
  // has to go back when it did, so the entry is consumed rather than left
  // behind -- and must not when someone arrived on `?view=1` directly, since
  // going back would take them off the site entirely.
  const pushedView = useRef(false);

  const openViewer = useCallback(() => {
    pushedView.current = true;
    setParams(queryWith(true));
  }, [setParams, queryWith]);

  const closeViewer = useCallback(() => {
    if (pushedView.current) {
      pushedView.current = false;
      navigate(-1);
      return;
    }
    setParams(queryWith(false), { replace: true });
  }, [navigate, setParams, queryWith]);

  // Moving between pieces inside the viewer replaces rather than pushes, so
  // a browsing session does not bury the page the viewer was opened from
  // under one entry per piece looked at.
  const viewNeighbour = useCallback(
    (neighbour: Piece) => {
      const query = new URLSearchParams();
      if (carried) query.set(ORIGIN_PARAM, carried);
      query.set(VIEW_PARAM, '1');
      navigate(`/piece/${neighbour.id}?${query}`, { replace: true });
    },
    [navigate, carried],
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
    if (missing && viewing) setParams(queryWith(false), { replace: true });
  }, [missing, viewing, setParams, queryWith]);

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

  /*
   * Neighbours come from the set when there is one, and from the gallery
   * otherwise. Stepping out of a collection you deliberately opened is the
   * bug this closes: prev/next used to walk every piece in the gallery
   * whatever list you had come from.
   */
  const walk = inSet
    ? (fromSet?.pieces ?? [])
    : siblings.status === 'ready'
      ? siblings.data
      : [];
  const { previous, next } = adjacent(walk, piece.id);

  // One element, two homes: the stacked row below lg and the artwork's left
  // gutter from lg. Built once so the props cannot drift between them.
  const backLink = (
    <BackLink
      waived={Boolean(piece.waivedAt)}
      from={inSet ? fromSet : null}
      trail={behind(trail)}
    />
  );

  return (
    <PageShell>
      {/* The smaller fluid step, not `section-lg`. This page ends on a 12px
          caption rather than on a grid, and 96px of air under one quiet line
          reads as a gap the page forgot to fill. */}
      <article className="mx-auto w-full max-w-content px-gutter pt-8 pb-intro-bottom">
        {/* The artwork keeps the room; the label sits beside it, divided by
            a hairline that turns horizontal when the two stack.

            No row gap from lg, so the rail's two children meet and their
            left borders read as one unbroken rule beside the artwork.

            The rows are explicit because the artwork spans both of them.
            Left to `auto`, grid hands a spanning item's height to every
            row it crosses, which inflated the first one to 400-odd pixels
            of nothing and tore a hole in that rule. `1fr` on the second
            takes the slack instead, so the first stays the height of the
            links in it. */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_1fr] lg:gap-y-0">
          {/*
            Back and neighbours sit at the top of the rail rather than in a
            row above the artwork. That row cost 68px off the top of every
            piece page and put the artwork's own action below the fold,
            while the rail beside it ran half empty. Here they cost the
            drawing nothing and are still the first thing above the fold.

            Ordered first so the stacked layout keeps them above the
            artwork: below lg the rail falls underneath it, and reaching
            Next by scrolling past the whole drawing is worse than the row
            ever was.
          */}
          <div className="flex flex-wrap items-center justify-between gap-4 lg:col-start-2 lg:row-start-1 lg:flex-col lg:items-start lg:justify-start lg:gap-3 lg:border-l lg:border-line lg:pb-6 lg:pl-8">
            {/* Stacked: back sits at the top left of the page already, which
                is where it is looked for. From lg it moves beside the
                artwork and this copy goes away. Rendered twice rather than
                placed by grid, because the two live in different columns at
                lg and in one row below it, and `hidden` keeps the unused
                copy out of the tab order as well as off the screen. */}
            <span className="lg:hidden">{backLink}</span>
            <PieceNav previous={previous} next={next} origin={carried} />
          </div>

          {/* Centred rather than left-aligned: the 78vh cap often leaves the
              image narrower than its column, and hugging the left would
              strand the dividing rule out on its own. */}
          {/* The button belongs to the artwork, not to the label: it is
              about the work itself, and this column is where the eye
              already is. Shown to everyone -- for a visitor it is the only
              action the page offers. */}
          {/*
            Three columns from lg, and the artwork is the middle one.

            Back belongs at the top left -- that is where a cursor goes by
            reflex, and it had ended up on the far right of the page when
            the controls moved into the rail. It costs nothing to put it
            back: the height cap leaves the artwork much narrower than its
            column, so there is a wide empty gutter either side of it that
            was doing nothing.

            `1fr auto 1fr` rather than padding, so there is no width to
            guess at. The outer tracks share the slack evenly, which keeps
            the artwork centred on the page rather than pushed off by
            whatever the link happens to measure, and a track cannot
            overlap its neighbour -- a wide piece squeezes the gutters
            instead of running under the link, which absolute positioning
            would have allowed.
          */}
          <figure className="flex justify-center lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:gap-4">
            <div className="hidden lg:block">{backLink}</div>
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
            className="lg:col-start-2 lg:row-start-2"
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
