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

const BackLink = ({
  waived = false,
  from,
  trail = [],
}: {
  waived?: boolean;
  from?: Collection | null;
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
 * The cap covers the artwork *and* its button together, not the image alone,
 * so it subtracts a fixed chrome height rather than taking a percentage. Two
 * numbers because the chrome is two heights: from lg the links sit in the
 * rail, below it they move above the artwork and cost another 67px.
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

const adjacent = (pieces: Piece[], id: string) => {
  const index = pieces.findIndex((candidate) => candidate.id === id);
  if (index === -1) return {};
  return {
    previous: index > 0 ? pieces[index - 1] : undefined,
    next: index < pieces.length - 1 ? pieces[index + 1] : undefined,
  };
};

const NO_SIBLINGS = async (): Promise<Piece[]> => [];

const NO_ORIGIN = async (): Promise<Collection | null> => null;

/*
 * `?view=1` rather than a nested route: a route would unmount this page
 * underneath the overlay, and keeping it mounted -- scroll position and all --
 * is why the overlay was chosen.
 */
const VIEW_PARAM = 'view';

const PiecePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  /*
   * The detail route rather than the list: a waived piece is absent from the
   * listing by design, so deriving this page from it would make the reserve
   * unreachable. `edited` is trusted only while it matches the route.
   */
  const loadPiece = useMemo(() => () => fetchPiece(id ?? ''), [id]);
  const load = useAsync(loadPiece);
  const [edited, setEdited] = useState<Piece | null>(null);
  const { role } = useSession();

  const answer = load.status === 'ready' ? load.data : null;
  const fetched = answer?.state === 'found' ? answer.piece : null;
  const piece = edited && edited.id === id ? edited : fetched;

  // Keyed on the state rather than the piece, so refetching one piece does
  // not refetch its siblings.
  const state = piece ? (piece.waivedAt ? 'waived' : 'exhibited') : null;
  const loadSiblings = useMemo(() => {
    if (state === 'waived') return fetchWaivedPieces;
    if (state === 'exhibited') return fetchPieces;
    return NO_SIBLINGS;
  }, [state]);
  const siblings = useAsync(loadSiblings);

  // Fetched alongside the gallery list rather than instead of it, so a stale
  // or private `from` falls back to gallery order rather than to no
  // neighbours at all.
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
  // goes back only when it did: someone who arrived on `?view=1` directly
  // would otherwise be taken off the site.
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

  // Moving between pieces inside the viewer replaces rather than pushes, so a
  // browsing session is not buried under one entry per piece.
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
      <article className="mx-auto w-full max-w-content px-gutter pt-8 pb-intro-bottom">
        {/* The rows are explicit because the artwork spans both. Left to
            `auto`, grid hands a spanning item's height to every row it crosses,
            which inflated the first to 400-odd pixels of nothing. */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_1fr] lg:gap-y-0">
          <div className="flex flex-wrap items-center justify-between gap-4 lg:col-start-2 lg:row-start-1 lg:flex-col lg:items-start lg:justify-start lg:gap-3 lg:border-l lg:border-line lg:pb-6 lg:pl-8">
            {/* Rendered twice rather than placed by grid: the two live in
                different columns at lg and in one row below it. `hidden` keeps
                the unused copy out of the tab order as well as off screen. */}
            <span className="lg:hidden">{backLink}</span>
            <PieceNav previous={previous} next={next} origin={carried} />
          </div>

          {/*
            `1fr auto 1fr` rather than padding: the outer tracks share the slack
            so the artwork stays centred, and a track cannot overlap its
            neighbour -- a wide piece squeezes the gutters instead of running
            under the back link.
          */}
          <figure className="flex justify-center lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:gap-4">
            <div className="hidden lg:block">{backLink}</div>
            {/* `w-fit` so the column shrinks to the artwork: the button then
                spans the drawing exactly rather than the whole grid cell. */}
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
