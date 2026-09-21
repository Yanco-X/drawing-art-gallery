import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Link,
  useLocation,
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
import { TagShelf } from '../components/TagShelf';
import { useArrivingPiece, useAsync, useSession } from '../hooks';
import { ICON_BUTTON } from '../components/form-styles';
import { StarIcon } from '../components/icons';
import {
  ABOUT_ORIGIN,
  HOME_ORIGIN,
  ORIGIN_PARAM,
  behind,
  collectionHref,
  nearestStep,
  readSequence,
  readTrail,
  sequenceState,
  serialiseTrail,
} from '../lib/origin';
import { keyTaken } from '../lib/traverse';
import {
  fetchCollection,
  fetchPiece,
  fetchPieces,
  fetchWaivedPieces,
  recordEvent,
} from '../services';
import type { Collection, Piece, Tag } from '../types';

const BackLink = ({
  waived = false,
  from,
  trail = [],
  about = false,
}: {
  waived?: boolean;
  from?: Collection | null;
  trail?: string[];
  about?: boolean;
}) => {
  const to = from
    ? collectionHref(from.slug, serialiseTrail(trail) || undefined)
    : about
      ? '/about'
      : waived
        ? '/waived'
        : '/home';
  const label = from ? from.name : about ? 'Yanco' : waived ? 'Waived' : 'All work';
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
      // Named, so a view transition carries the old drawing into the new
      // one's place rather than crossfading it with the whole page.
      className="hatch max-h-[max(320px,calc(100vh_-_294px))] w-auto max-w-full border border-line object-contain [view-transition-name:artwork] wide:max-h-[max(320px,calc(100vh_-_226px))] flat:max-h-[calc(100svh_-_2.5rem)]"
    />
  );
};

// The same height as the bordered links it sits level with.
const SpotlightMark = () => (
  <span
    role="img"
    aria-label="In the Spotlight"
    title="In the Spotlight!"
    className="flex items-center py-1 text-accent [&>svg]:size-7"
  >
    <StarIcon />
  </span>
);

const adjacent = (pieces: Piece[], id: string) => {
  const index = pieces.findIndex((candidate) => candidate.id === id);
  if (index === -1) return {};
  return {
    previous: index > 0 ? pieces[index - 1] : undefined,
    next: index < pieces.length - 1 ? pieces[index + 1] : undefined,
  };
};

// Pieces waived or deleted since the list was shown drop out of it.
const inSequence = (pieces: Piece[], ids: string[]) => {
  const byId = new Map(pieces.map((piece) => [piece.id, piece]));
  return ids.flatMap((id) => byId.get(id) ?? []);
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
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  /*
   * The detail route rather than the list: a waived piece is absent from the
   * listing by design, so deriving this page from it would make the reserve
   * unreachable. `edited` is trusted only while it matches the route.
   */
  // The answer carries the id it was asked about: the last piece's stays in
  // `load` until this one's lands, and must not be taken for it.
  const loadPiece = useMemo(
    () => () => fetchPiece(id ?? '').then((answer) => ({ id, answer })),
    [id],
  );
  const load = useAsync(loadPiece);
  const [edited, setEdited] = useState<Piece | null>(null);
  const { role } = useSession();

  const answer =
    load.status === 'ready' && load.data.id === id ? load.data.answer : null;
  const fetched = answer?.state === 'found' ? answer.piece : null;
  const target = edited && edited.id === id ? edited : fetched;
  const viewing = params.get(VIEW_PARAM) === '1';
  const pageRef = useRef<HTMLElement>(null);
  const piece = useArrivingPiece(target, viewing, pageRef);

  // Kept after it closes, so the drawer has its list to show while it slides
  // shut. This page stays mounted from piece to piece, and so does the shelf.
  const [shelf, setShelf] = useState<{ tag: Tag; open: boolean } | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const shelfId = useId();
  const shelfOpen = Boolean(
    shelf?.open &&
      piece &&
      !piece.waivedAt &&
      piece.tags.some((tag) => tag.id === shelf.tag.id),
  );
  // Walked on to a piece without the tag: shut it for good, or it would come
  // back up on the next piece that happened to carry it.
  if (shelf?.open && piece && !shelfOpen) setShelf({ ...shelf, open: false });

  const toggleShelf = useCallback((tag: Tag, chip: HTMLButtonElement) => {
    opener.current = chip;
    setShelf((held) => ({
      tag,
      open: !(held?.open && held.tag.id === tag.id),
    }));
  }, []);

  const closeShelf = useCallback(() => {
    setShelf((held) => held && { ...held, open: false });
    opener.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!shelfOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !keyTaken(event)) closeShelf();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [shelfOpen, closeShelf]);

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
  // The nearest step is the list this piece belongs to. `home` and `about`
  // are places, not sets, so they name no collection to walk.
  const openedFrom = nearestStep(trail);
  const setSlug =
    openedFrom === HOME_ORIGIN || openedFrom === ABOUT_ORIGIN
      ? undefined
      : openedFrom;
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
  // Carried on to the neighbours, so walking the about page's picks keeps
  // the way back to it.
  const fromAbout = openedFrom === ABOUT_ORIGIN && Boolean(piece && !piece.waivedAt);
  const carried = inSet || fromAbout ? (rawTrail ?? undefined) : undefined;

  // On a set's terms: a waived piece walks the reserve however it was reached.
  const shownAs = readSequence(location.state);
  const sequence =
    piece && !piece.waivedAt && shownAs?.includes(piece.id) ? shownAs : undefined;

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
    setParams(queryWith(true), { state: sequenceState(sequence) });
  }, [setParams, queryWith, sequence]);

  const closeViewer = useCallback(() => {
    if (pushedView.current) {
      pushedView.current = false;
      navigate(-1);
      return;
    }
    setParams(queryWith(false), { replace: true, state: sequenceState(sequence) });
  }, [navigate, setParams, queryWith, sequence]);

  // Moving between pieces inside the viewer replaces rather than pushes, so a
  // browsing session is not buried under one entry per piece.
  const viewNeighbour = useCallback(
    (neighbour: Piece) => {
      const query = new URLSearchParams();
      if (carried) query.set(ORIGIN_PARAM, carried);
      query.set(VIEW_PARAM, '1');
      navigate(`/piece/${neighbour.id}?${query}`, {
        replace: true,
        state: sequenceState(sequence),
      });
    },
    [navigate, carried, sequence],
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
  const missing = answer !== null && answer.state !== 'found';
  useEffect(() => {
    if (missing && viewing) setParams(queryWith(false), { replace: true });
  }, [missing, viewing, setParams, queryWith]);

  // Keyed on the id, so an edit does not count as another look. The viewer
  // counts on its own: a `?view=1` arrival and the viewer's own prev/next
  // never pass through openViewer.
  const shownId = piece?.id ?? null;
  const viewedId = viewing ? shownId : null;
  useEffect(() => {
    if (shownId) recordEvent({ kind: 'piece_view', pieceId: shownId });
  }, [shownId]);
  useEffect(() => {
    if (viewedId) recordEvent({ kind: 'detailed_view', pieceId: viewedId });
  }, [viewedId]);

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

  if (answer?.state === 'missing') {
    return (
      <PageShell>
        <Message eyebrow="Not found" headline="That piece isn't here." />
      </PageShell>
    );
  }

  // Nothing up yet: the first piece is still on its way, image included.
  if (piece === null) {
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

  const gallery = siblings.status === 'ready' ? siblings.data : [];
  const walk = sequence
    ? inSequence(gallery, sequence)
    : inSet
      ? (fromSet?.pieces ?? [])
      : gallery;
  const { previous, next } = adjacent(walk, piece.id);

  // One element, two homes: the stacked row below lg and the artwork's left
  // gutter from lg. Built once so the props cannot drift between them.
  const backLink = (
    <BackLink
      waived={Boolean(piece.waivedAt)}
      from={inSet ? fromSet : null}
      trail={behind(trail)}
      about={fromAbout}
    />
  );

  const picked = piece.spotlightOrder !== null;

  const tagged = (tagId: string) =>
    gallery.filter((one) => one.tags.some((tag) => tag.id === tagId));
  // The reserve has no shelf: a waived piece's tags stay plain labels.
  const exhibited = !piece.waivedAt;
  const shelved = shelf &&
    exhibited && {
      tag: shelf.tag,
      pieces: tagged(shelf.tag.id),
      currentId: piece.id,
      origin: carried,
    };

  return (
    <PageShell>
      <article
        ref={pageRef}
        className="mx-auto flex w-full max-w-content touch-manipulation items-start px-gutter pt-8 pb-intro-bottom flat:pt-4"
      >
        {/* The rows are explicit because the artwork spans both. Left to
            `auto`, grid hands a spanning item's height to every row it crosses,
            which inflated the first to 400-odd pixels of nothing. */}
        <div
          className={`grid min-w-0 flex-1 gap-8 wide:grid-cols-[minmax(0,1fr)_320px] wide:grid-rows-[auto_1fr] wide:gap-y-0 wide:transition-[grid-template-columns] wide:duration-300 wide:ease-reflow flat:grid-cols-[minmax(0,1fr)_260px] flat:gap-x-5 motion-reduce:transition-none ${
            shelfOpen ? 'xl:grid-cols-[minmax(0,1fr)_272px]' : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 wide:col-start-2 wide:row-start-1 wide:flex-col wide:items-start wide:justify-start wide:gap-3 wide:border-l wide:border-line wide:pb-6 wide:pl-8 flat:pl-5">
            {/* Rendered twice rather than placed by grid: the two live in
                different columns when wide and in one row when stacked. A
                phone on its side keeps this copy, in the rail, and gives the
                artwork the gutters. `hidden` keeps the unused copy out of the
                tab order as well as off screen. */}
            <span className="flex items-center gap-3 wide:hidden flat:flex">
              {backLink}
              {picked && <SpotlightMark />}
            </span>
            <PieceNav
              previous={previous}
              next={next}
              origin={carried}
              sequence={sequence}
              page={pageRef}
            />
            {/* Beside the artwork on a phone on its side, which then has the
                whole height to itself. */}
            <div className="hidden w-full flat:block">
              <DetailedViewButton piece={piece} onOpen={openViewer} />
            </div>
          </div>

          {/*
            `1fr auto 1fr` rather than padding: the outer tracks share the slack
            so the artwork stays centred, and a track cannot overlap its
            neighbour -- a wide piece squeezes the gutters instead of running
            under the back link.
          */}
          <figure className="flex justify-center wide:col-start-1 wide:row-start-1 wide:row-span-2 wide:grid wide:grid-cols-[1fr_auto_1fr] wide:items-start wide:gap-4 flat:flex">
            <div className="hidden wide:block flat:hidden">{backLink}</div>
            {/* `w-fit` so the column shrinks to the artwork: the button then
                spans the drawing exactly rather than the whole grid cell. */}
            <div className="flex w-fit flex-col items-stretch">
              <PieceImage key={piece.id} piece={piece} />
              <div className="flat:hidden">
                <DetailedViewButton piece={piece} onOpen={openViewer} />
              </div>
            </div>
            {/* The right gutter, the mirror of the back link's: a mark on
                the frame the drawing hangs in, not on the drawing. */}
            <div className="hidden wide:flex wide:justify-end flat:hidden">
              {picked && <SpotlightMark />}
            </div>
          </figure>
          <PieceWallLabel
            className="wide:col-start-2 wide:row-start-2"
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
            tagShelf={
              exhibited
                ? {
                    shared: new Set(
                      piece.tags
                        .filter((tag) => tagged(tag.id).length > 1)
                        .map((tag) => tag.id),
                    ),
                    openId: shelfOpen && shelf ? shelf.tag.id : null,
                    controls: `${shelfId}-drawer ${shelfId}-row`,
                    onToggle: toggleShelf,
                    row: (
                      <div
                        data-open={shelfOpen}
                        inert={!shelfOpen}
                        className="tag-strip xl:hidden"
                      >
                        <div>
                          {shelved && (
                            <TagShelf
                              id={`${shelfId}-row`}
                              row
                              onClose={closeShelf}
                              {...shelved}
                            />
                          )}
                        </div>
                      </div>
                    ),
                  }
                : undefined
            }
          />
        </div>

        {/* Up through the article's top padding, to hang from the header.
            There from the start, shut, so the first opening has somewhere
            to open from. */}
        {exhibited && (
          <div
            data-open={shelfOpen}
            inert={!shelfOpen}
            className="tag-drawer -mt-8 hidden shrink-0 xl:grid"
          >
            <div>
              {shelved && (
                <TagShelf
                  id={`${shelfId}-drawer`}
                  onClose={closeShelf}
                  {...shelved}
                />
              )}
            </div>
          </div>
        )}
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
