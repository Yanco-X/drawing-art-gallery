import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSession, useSpotlight } from '../hooks';
import { framePiece, pickedIds, spotlightSlots } from '../lib/spotlight';
import type { CollectionSummary, Piece } from '../types';
import { CollectionGrid } from './CollectionGrid';
import { ICON_BUTTON, ICON_BUTTON_ACCENT, SUBTLE_ACTION } from './form-styles';
import { ChevronLeftIcon, ChevronRightIcon, GearIcon } from './icons';

// Lazy, and owner-only. STATUS.md carries "the owner surface still ships to
// every visitor" as a known gap; a new owner dialog should not add to it.
const SpotlightDialog = lazy(() => import('./SpotlightDialog'));

const BAND = 'h-[clamp(320px,52vh,500px)] lg:h-[clamp(440px,72vh,780px)]';

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
}: {
  piece: Piece;
  /** Held back until the slide is current or next, so five full-size
      renditions do not download on first paint. */
  load: boolean;
  priority: boolean;
}) => {
  const [failed, setFailed] = useState(false);
  const framing = framePiece(piece);

  return (
    <div
      className={`hatch flex items-center justify-center overflow-hidden ${BAND}`}
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
            onError={() => setFailed(true)}
            /* Continuous per-piece values, so they cannot be static classes.
               See the inline-style exceptions in DESIGN.md. */
            style={{
              objectFit: framing.fit,
              objectPosition: framing.position,
              transformOrigin: framing.position,
              transform: `scale(${framing.scale})`,
            }}
            className="h-full w-full"
          />
        )
      )}
    </div>
  );
};

const SpotlightLabel = ({
  piece,
  position,
  total,
  collections,
}: {
  piece: Piece;
  position: number;
  total: number;
  collections: CollectionSummary[];
}) => {
  const meta = [piece.medium, piece.year].filter(Boolean).join(' · ');

  const holding = collections.filter((collection) =>
    collection.pieceIds.includes(piece.id),
  );

  return (
    <div
      className={`flex flex-col gap-8 px-gutter py-10 lg:py-12 2xl:flex-row 2xl:gap-x-10 ${LABEL_BAND}`}
    >
      <div
        className={`flex min-w-0 flex-col justify-start gap-4 lg:justify-center 2xl:flex-1 ${
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

        <Link
          to={`/piece/${piece.id}`}
          className={`${ICON_BUTTON_ACCENT} w-fit`}
        >
          View piece
          <ChevronRightIcon />
        </Link>
      </div>

      {/*
        `min-h-0` is not optional on the scroller: without it a flex child
        refuses to shrink and overflows the band -- measured at 2492px of cards
        spilling out of a 637px band.
      */}
      {holding.length > 0 && (
        <div className="flex flex-col gap-3 2xl:w-[40%] 2xl:max-w-[340px] 2xl:min-w-[220px] 2xl:min-h-0 2xl:shrink-0 2xl:justify-center">
          <span className="shrink-0 text-[12px] uppercase tracking-eyebrow text-faint">
            {holding.length === 1 ? 'In a collection' : 'In collections'}
          </span>
          {/*
            Three regimes, three caps: stacked and unbounded under `lg`, a
            viewport cap from `lg` where the artwork is fixed and the label is
            not, and from `2xl` the flex box caps it instead.
          */}
          <div className="lg:max-h-[clamp(180px,32vh,420px)] lg:overflow-y-auto 2xl:max-h-none 2xl:min-h-0">
            <CollectionGrid collections={holding} />
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
  const [wanted, setWanted] = useState([0, 1]);

  useEffect(() => {
    if (slides.length === 0) return;
    const after = (index + 1) % slides.length;
    setWanted((now) =>
      now.includes(index) && now.includes(after)
        ? now
        : [...new Set([...now, index, after])],
    );
  }, [index, slides.length]);

  if (slides.length === 0) return null;

  const many = slides.length > 1;

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previous();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    }
  };

  /*
   * The dialog is a sibling of the band, not a child. However the top layer
   * paints it, a child is still a DOM descendant, so its events bubble: an
   * arrow key typed in its search field would advance the carousel behind it.
   */
  return (
    <>
      <section
        aria-roledescription="carousel"
        aria-label="Featured work"
        className="border-b border-line"
        onMouseEnter={hold}
        onMouseLeave={release}
        onFocus={hold}
        onBlur={release}
        onKeyDown={many ? onKeyDown : undefined}
      >
        {/*
          The slides stack in one grid cell rather than being positioned
          absolutely, so the band takes the height of the tallest and the
          stacked layout below 1024px needs no fixed height of its own.
        */}
        <div
          className="mx-auto grid w-full max-w-content"
          aria-live={running ? 'off' : 'polite'}
        >
          {slides.map((piece, at) => (
            <div
              key={piece.id}
              className={`col-start-1 row-start-1 grid grid-cols-1 transition-opacity duration-200 motion-reduce:transition-none lg:grid-cols-2 ${
                at === index ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
              aria-hidden={at !== index}
              inert={at !== index}
            >
              <SpotlightArtwork
                piece={piece}
                load={wanted.includes(at)}
                priority={at === 0}
              />
              <SpotlightLabel
                piece={piece}
                position={at + 1}
                total={slides.length}
                collections={collections}
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
                      <span
                        className={`block h-px w-full transition-colors duration-200 ${
                          at === index
                            ? 'bg-accent'
                            : 'bg-line group-hover:bg-accent'
                        }`}
                      />
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
