import {
  Suspense,
  lazy,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSession, useSpotlight } from '../hooks';
import { INTERVAL_MS } from '../hooks/useSpotlight';
import { HOME_ORIGIN, sequenceState } from '../lib/origin';
import { framePiece, pickedIds, spotlightSlots } from '../lib/spotlight';
import {
  TURN,
  carry,
  swipeCancel,
  swipeDrag,
  swipeStart,
  swipeStep,
  turnSlides,
  turnsWhole,
} from '../lib/swipe';
import { arrowStep } from '../lib/traverse';
import type { CollectionSummary, Piece } from '../types';
import { CollectionGrid } from './CollectionGrid';
import { ICON_BUTTON, ICON_BUTTON_ACCENT, SUBTLE_ACTION } from './form-styles';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GearIcon,
} from './icons';

// Lazy, and owner-only. STATUS.md carries "the owner surface still ships to
// every visitor" as a known gap; a new owner dialog should not add to it.
const SpotlightDialog = lazy(() => import('./SpotlightDialog'));

const BAND =
  'h-[clamp(320px,52vh,500px)] wide:h-[clamp(440px,72vh,780px)] ' +
  'flat:h-[calc(100svh-var(--spacing-header))]';

/*
 * Spelled out rather than derived from BAND: a Tailwind class exists only if
 * its literal string appears in the source, so `2xl:h-[${...}]` would compile,
 * ship, and quietly do nothing.
 */
const LABEL_BAND = '2xl:h-[clamp(440px,72vh,780px)]';

const SpotlightArtwork = ({
  piece,
  load,
  priority,
  sequence,
}: {
  piece: Piece;
  /** Held back until the slide is current or beside it, so five full-size
      renditions do not download on first paint. */
  load: boolean;
  priority: boolean;
  sequence: string[];
}) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const framing = framePiece(piece);

  // The way in on a phone, where View piece gives its place to the
  // collections toggle; on a desktop a second way beside the button.
  return (
    <Link
      to={`/piece/${piece.id}`}
      state={sequenceState(sequence)}
      aria-label={`View ${piece.title}`}
      className={`flex touch-pan-y touch-pinch-zoom items-center justify-center overflow-hidden bg-bg ${BAND}`}
    >
      {failed ? (
        <span className="font-mono text-[11px] tracking-[0.05em] text-faint">
          [ artwork ]
        </span>
      ) : (
        load && (
          <img
            src={piece.imageUrl}
            alt={piece.title}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            /* Continuous per-piece values, so they cannot be static classes.
               See the inline-style exceptions in DESIGN.md. */
            style={{
              objectFit: framing.fit,
              objectPosition: framing.position,
              transformOrigin: framing.position,
              transform: `scale(${framing.scale})`,
            }}
            className={`h-full w-full transition-opacity duration-300 ease-reflow ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )
      )}
    </Link>
  );
};

const SpotlightLabel = ({
  piece,
  position,
  total,
  collections,
  sequence,
}: {
  piece: Piece;
  position: number;
  total: number;
  collections: CollectionSummary[];
  /** The band's order, so the piece page walks the picks and not the wall. */
  sequence: string[];
}) => {
  const meta = [piece.medium, piece.year].filter(Boolean).join(' · ');

  const holding = collections.filter((collection) =>
    collection.pieceIds.includes(piece.id),
  );
  // Below 1024px the cards sit between the artwork and the wall, so they
  // wait behind a toggle rather than pushing the pieces down.
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const collectionsId = useId();

  return (
    <div
      className={`flex flex-col px-gutter py-10 wide:py-12 flat:py-6 lg:gap-8 2xl:flex-row 2xl:gap-x-10 ${LABEL_BAND}`}
    >
      <div
        className={`flex min-w-0 touch-pan-y touch-pinch-zoom flex-col justify-start gap-4 wide:justify-center 2xl:flex-1 ${
          holding.length > 0 ? '2xl:max-w-[26rem]' : ''
        }`}
      >
        <p className="text-[12px] uppercase tracking-eyebrow text-faint">
          Featured
          <span className="sr-only">
            , piece {position} of {total}
          </span>
        </p>

        <h2 className="font-serif text-[clamp(22px,2.4vw,32px)] leading-[1.05] font-normal text-text">
          {piece.title}
        </h2>

        {meta && <p className="text-[12px] text-faint">{meta}</p>}

        {piece.description && (
          <p className="line-clamp-3 max-w-[42em] text-[14px] text-dim">
            {piece.description}
          </p>
        )}

        <div
          className={`flex flex-wrap items-center gap-3 ${
            holding.length > 0 ? '' : 'max-lg:hidden'
          }`}
        >
          <Link
            to={`/piece/${piece.id}`}
            state={sequenceState(sequence)}
            className={`${ICON_BUTTON_ACCENT} w-fit max-lg:hidden`}
          >
            View piece
            <ChevronRightIcon />
          </Link>
          {holding.length > 0 && (
            <button
              type="button"
              onClick={() => setCollectionsOpen((open) => !open)}
              aria-expanded={collectionsOpen}
              aria-controls={collectionsId}
              className={`${ICON_BUTTON} lg:hidden`}
            >
              {holding.length === 1
                ? 'In a collection'
                : `In ${holding.length} collections`}
              <span
                className={`flex transition-transform duration-300 ease-reflow motion-reduce:transition-none ${
                  collectionsOpen ? 'rotate-180' : ''
                }`}
              >
                <ChevronDownIcon />
              </span>
            </button>
          )}
        </div>
      </div>

      {/*
        `min-h-0` is not optional on the scroller: without it a flex child
        refuses to shrink and overflows the band -- measured at 2492px of cards
        spilling out of a 637px band.
      */}
      {/*
        Below `lg` a grid-row reveal, invisible once shut so its links leave
        the tab order; from `lg` the two inner wrappers are `contents` and the
        eyebrow and scroller are the column's own children again.
      */}
      {holding.length > 0 && (
        <div
          id={collectionsId}
          data-open={collectionsOpen}
          className={`max-lg:grid max-lg:grid-rows-[0fr] max-lg:transition-[grid-template-rows,visibility] max-lg:duration-300 max-lg:ease-reflow max-lg:data-[open=true]:grid-rows-[1fr] motion-reduce:transition-none lg:flex lg:flex-col lg:gap-3 2xl:w-[40%] 2xl:max-w-[340px] 2xl:min-w-[220px] 2xl:min-h-0 2xl:shrink-0 2xl:justify-center ${
            collectionsOpen ? '' : 'max-lg:invisible'
          }`}
        >
          <div className="min-h-0 overflow-hidden lg:contents">
            <div className="flex flex-col gap-3 pt-6 lg:contents">
              <span className="hidden shrink-0 text-[12px] uppercase tracking-eyebrow text-faint lg:block">
                {holding.length === 1 ? 'In a collection' : 'In collections'}
              </span>
              {/*
                Three regimes, three caps: stacked and unbounded under `lg`, a
                viewport cap from `lg` where the artwork is fixed and the label
                is not, and from `2xl` the flex box caps it instead.
              */}
              <div className="lg:max-h-[clamp(180px,32vh,420px)] lg:overflow-y-auto 2xl:max-h-none 2xl:min-h-0">
                {/* The band is the landing page's, so its collections
                    offer the way back to it, as the row below them does. */}
                <CollectionGrid
                  collections={holding}
                  origin={HOME_ORIGIN}
                  row="inset"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Spotlight = ({
  pieces,
  collections,
}: {
  pieces: Piece[];
  collections: CollectionSummary[];
}) => {
  const { role } = useSession();
  const isOwner = role === 'owner';

  // Null means "believe the pieces", which is every first load and every
  // visitor. Set only while a save is ahead of the refetch.
  const [saved, setSaved] = useState<string[] | null>(null);
  const [curating, setCurating] = useState(false);

  const slides = useMemo(() => spotlightSlots(pieces, saved), [pieces, saved]);
  const picks = useMemo(() => saved ?? pickedIds(pieces), [saved, pieces]);

  const {
    index,
    direction,
    playing,
    running,
    reducedMotion,
    go,
    next,
    previous,
    toggle,
    hold,
    release,
  } = useSpotlight(slides.length, curating);

  // Grows and never shrinks: a slide keeps its src once asked for, so
  // stepping back does not fetch the same rendition twice.
  // Both neighbours, because a finger drags either one into view.
  const [wanted, setWanted] = useState([0, 1]);

  useEffect(() => {
    if (slides.length === 0) return;
    const after = (index + 1) % slides.length;
    const before = (index - 1 + slides.length) % slides.length;
    setWanted((now) =>
      [index, after, before].every((at) => now.includes(at))
        ? now
        : [...new Set([...now, index, after, before])],
    );
  }, [index, slides.length]);

  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shownAt = useRef(index);
  // Null until a sideways stroke takes hold of the band.
  const carried = useRef<number | null>(null);
  // Where a swipe let go, so the turn carries on from under the finger.
  const letGo = useRef(0);

  useLayoutEffect(() => {
    const from = shownAt.current;
    const offset = letGo.current;
    shownAt.current = index;
    letGo.current = 0;
    if (from === index || reducedMotion) return;
    const leaving = slideRefs.current[from];
    const arriving = slideRefs.current[index];
    if (leaving && arriving) turnSlides(leaving, arriving, direction, offset);
  }, [index, direction, reducedMotion]);

  // On the page, not on the band: the arrows step the picks wherever the
  // focus is, as they step the pieces on a piece page.
  useEffect(() => {
    if (slides.length < 2) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const step = arrowStep(event);
      if (!step) return;
      event.preventDefault();
      if (step > 0) next();
      else previous();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [slides.length, next, previous]);

  if (slides.length === 0) return null;

  const many = slides.length > 1;
  const order = slides.map((slide) => slide.id);

  const beside = (dx: number) =>
    (index + (dx < 0 ? 1 : -1) + slides.length) % slides.length;

  const letBandGo = () => {
    for (const slide of slideRefs.current) if (slide) carry(slide, null);
    release();
  };

  const follow = (event: TouchEvent) => {
    const dx = swipeDrag(event.nativeEvent);
    if (dx === null || !many || !turnsWhole()) return;
    if (carried.current === null) hold();
    carried.current = dx;
    const width = slideRefs.current[index]?.offsetWidth ?? 0;
    const neighbour = beside(dx);
    slideRefs.current.forEach((slide, at) => {
      if (!slide) return;
      if (at === index) carry(slide, dx);
      else if (at === neighbour) carry(slide, dx + (dx < 0 ? width : -width), true);
      else carry(slide, null);
    });
  };

  const springBack = (from: number) => {
    const current = slideRefs.current[index];
    const neighbour = slideRefs.current[beside(from)];
    if (!current || !neighbour) return;
    const side = from < 0 ? current.offsetWidth : -current.offsetWidth;
    current.animate([{ translate: `${from}px` }, { translate: '0px' }], TURN);
    neighbour.animate(
      [
        { translate: `${from + side}px`, opacity: 1 },
        { translate: `${side}px`, opacity: 1 },
      ],
      TURN,
    );
  };

  const finish = (event: TouchEvent) => {
    const step = swipeStep(event.nativeEvent);
    const from = carried.current;
    carried.current = null;
    if (from !== null) letBandGo();
    if (step) {
      letGo.current = from ?? 0;
      if (step > 0) next();
      else previous();
    } else if (from !== null) springBack(from);
  };

  const abandon = () => {
    swipeCancel();
    const from = carried.current;
    carried.current = null;
    if (from === null) return;
    letBandGo();
    springBack(from);
  };

  /*
   * The dialog is a sibling of the band, not a child. However the top layer
   * paints it, a child is still a DOM descendant, so its events bubble, and
   * the band's own handlers would hear its clicks and keys.
   */
  return (
    <>
      <section
        aria-roledescription="carousel"
        aria-label="Featured work"
        /*
          `touch-pan-y` sits on the artwork and the label's words rather than
          here: a browser intersects touch-action down the tree, so a band
          that forbids sideways panning forbids it for the collections row
          inside it too, and the row would not scroll.
        */
        className="arrives border-b border-line"
        /*
          A finger is not a hover, and a tap is not keyboard focus. A phone
          synthesises both from a tap, and pausing there swaps the indicator
          mid-tap -- a browser then spends that tap on the hover and drops the
          click, so the first tap on a control in the band did nothing.
        */
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') hold();
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') release();
        }}
        onFocus={(event) => {
          if (event.target.matches(':focus-visible')) hold();
        }}
        onBlur={release}
        // On the band only, unlike the keys: a swipe further down the page
        // is somebody reading the wall, not steering the picks.
        onTouchStart={(event) => {
          if (many) swipeStart(event.nativeEvent);
        }}
        onTouchMove={follow}
        onTouchCancel={abandon}
        onTouchEnd={finish}
      >
        {/*
          The slides stack in one grid cell, so from 1024px the band takes the
          height of the tallest. Below it, either way up, the hidden slides
          leave the flow and the band fits the one on show: a label without a
          collection -- or with its collections shut -- would otherwise sit
          over a gap as tall as the card it lacks.
        */}
        <div
          className="relative mx-auto grid w-full max-w-content overflow-hidden"
          aria-live={running ? 'off' : 'polite'}
        >
          {slides.map((piece, at) => (
            <div
              key={piece.id}
              ref={(slide) => {
                slideRefs.current[at] = slide;
              }}
              className={`col-start-1 row-start-1 grid grid-cols-1 wide:grid-cols-2 ${
                at === index
                  ? 'opacity-100'
                  : 'pointer-events-none opacity-0 max-lg:absolute max-lg:inset-x-0 max-lg:top-0'
              }`}
              aria-hidden={at !== index}
              inert={at !== index}
            >
              <SpotlightArtwork
                piece={piece}
                load={wanted.includes(at)}
                priority={at === 0}
                sequence={order}
              />
              <SpotlightLabel
                piece={piece}
                position={at + 1}
                total={slides.length}
                collections={collections}
                sequence={order}
              />
            </div>
          ))}
        </div>

        {(many || isOwner) && (
          <div className="mx-auto flex w-full max-w-content items-center gap-6 px-gutter pb-5">
            {many ? (
              <>
                <div className="flex flex-1 items-center gap-2">
                  {slides.map((piece, at) => (
                    <button
                      key={piece.id}
                      type="button"
                      onClick={() => go(at)}
                      aria-label={`Show ${piece.title}`}
                      aria-current={at === index}
                      className="group flex-1 cursor-pointer border-none bg-transparent px-0 py-3"
                    >
                      {/* The fill is a clock for the slide. Held or paused,
                          the timer restarts on release, so the line shows
                          full rather than a progress it would not keep. */}
                      <span
                        className={`block h-px w-full bg-line transition-colors duration-200 ${
                          at === index ? '' : 'group-hover:bg-accent'
                        }`}
                      >
                        {at === index &&
                          (running ? (
                            <span
                              key="filling"
                              className="spotlight-fill block h-full w-full bg-accent"
                              style={{ animationDuration: `${INTERVAL_MS}ms` }}
                            />
                          ) : (
                            <span key="full" className="block h-full w-full bg-accent" />
                          ))}
                      </span>
                    </button>
                  ))}
                </div>

                {/*
                  A word rather than a glyph: WCAG 2.2.2 wants an explicit way
                  to stop anything moving for more than five seconds.
                */}
                {!reducedMotion && (
                  <button
                    type="button"
                    onClick={toggle}
                    className={`${SUBTLE_ACTION} uppercase tracking-btn`}
                  >
                    {playing ? 'Pause' : 'Play'}
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={previous}
                    aria-label="Previous piece"
                    className={ICON_BUTTON}
                  >
                    <ChevronLeftIcon />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Next piece"
                    className={ICON_BUTTON}
                  >
                    <ChevronRightIcon />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1" />
            )}

            {isOwner && (
              <button
                type="button"
                onClick={() => setCurating(true)}
                aria-label="Choose spotlight pieces"
                title="Choose spotlight pieces"
                className={`${ICON_BUTTON} ml-10`}
              >
                <GearIcon />
              </button>
            )}
          </div>
        )}
      </section>

      {isOwner && curating && (
        <Suspense fallback={null}>
          <SpotlightDialog
            open={curating}
            picks={picks}
            onClose={() => setCurating(false)}
            onSaved={(pieceIds) => {
              setSaved(pieceIds);
              setCurating(false);
            }}
          />
        </Suspense>
      )}
    </>
  );
};
