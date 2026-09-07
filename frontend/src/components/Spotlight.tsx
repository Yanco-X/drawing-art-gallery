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

/*
 * The band at the top of the gallery: one piece filling its half, its label
 * beside it.
 *
 * Cropped, not contained -- but aimed, and sized. Contain left hatch bars
 * either side of every portrait with no way out, because the panel is wider
 * than the work and a scale over contain only ate the axis that was already
 * full. Cover fills the half outright, `object-position` says which part of
 * the piece survives, and a per-piece zoom says how much of it to show.
 * Centre-cropping alone is what beheads a portrait; a focal point is what
 * makes cover safe, and the zoom is what makes it optional -- under 100 the
 * hatch comes back, on the pieces where the owner decides that is the trade.
 *
 * The zoom is spent over `contain` rather than over `cover`, because a
 * transform scales what `object-fit` already cropped and cannot give back
 * what cover threw away. It is a multiple of `contain` and not of `cover`,
 * so the band needs to know nothing about its own shape: the same number
 * shows the same amount of artwork in every window.
 */
const BAND = 'h-[clamp(320px,52vh,500px)] lg:h-[clamp(440px,72vh,780px)]';

/*
 * The label takes the artwork's height once it is wide enough to put the
 * collections beside the wall label, which is what gives that column a
 * definite box to scroll inside rather than growing the band.
 *
 * Spelled out rather than derived from BAND. A Tailwind class exists only
 * if its literal string appears in the source, so `2xl:h-[${...}]` would
 * compile, ship, and quietly do nothing.
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
               See the inline-style exceptions in DESIGN.md. The origin is the
               focal point, so the zoom pivots on what the owner aimed at
               rather than drifting back to the middle of the frame. */
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
  /** Every collection the page can see, not this piece's. */
  collections: CollectionSummary[];
}) => {
  const meta = [piece.medium, piece.year].filter(Boolean).join(' · ');

  /*
   * Worked out here rather than fetched. `GET /api/collections` carries
   * `pieceIds` and the landing page has already asked for it, so knowing
   * which collections hold this piece costs a filter over a handful of
   * rows -- and the band keeps its promise of adding no request.
   *
   * A draft never reaches a visitor, because that route drops private
   * collections before they get here.
   */
  const holding = collections.filter((collection) =>
    collection.pieceIds.includes(piece.id),
  );

  /*
   * Two columns: the wall label, and the collections the piece hangs in.
   *
   * Stacked slides make the row as tall as the longest label, so a short
   * one has slack to place. Centred beside the artwork, where the slack
   * splits evenly and is invisible; below it, hard against the top, so the
   * slack falls after the button as padding rather than opening a hole
   * between a piece and its own title.
   *
   * At `lg` the label takes the artwork's own height, which is what gives
   * the collections column something definite to scroll inside. Below it
   * the two stack and every height is natural again.
   *
   * The collections go beside the wall label only from `2xl`. Below it the
   * half is not wide enough to hold both: a 260px column at 1024px left
   * the label 110px and broke the title over two lines. So the axis flips
   * once, and each side of the flip is simple -- stacked and natural
   * height, or side by side and the artwork's height.
   *
   * The height arrives with the row, not before it. It is what caps the
   * collections scroller, and a fixed height under a stacked layout would
   * cap nothing and spill the overflow over the intro instead.
   *
   * The wall label is capped at a reading measure rather than allowed to
   * eat the half. Left to grow it pushed the collections against the far
   * gutter with a field of nothing between them; capped, the two read as
   * one block and the slack falls after the pair instead of through it.
   *
   * Capped only when there is something to sit beside it, and the row is
   * packed from the start rather than centred, so the title begins at the
   * same x on every slide. Centred, it stepped sideways as the band
   * advanced from a piece in three collections to one in none.
   */
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

        {/*
          The piece-title step, not the display one. The intro headline sits
          directly below this band and is the page's own voice; two headlines
          at the same size would argue with each other.
        */}
        <h2 className="font-serif text-[clamp(22px,2.4vw,32px)] leading-[1.05] font-normal text-text">
          {piece.title}
        </h2>

        {meta && <p className="text-[12px] text-faint">{meta}</p>}

        {piece.description && (
          <p className="line-clamp-3 max-w-[42em] text-[14px] text-dim">
            {piece.description}
          </p>
        )}

        {/*
          Outlined, not filled. The header already spends the filled accent on
          "+ Upload" for the owner, and the rule is one per screen.
        */}
        <Link
          to={`/piece/${piece.id}`}
          className={`${ICON_BUTTON_ACCENT} w-fit`}
        >
          View piece
          <ChevronRightIcon />
        </Link>
      </div>

      {/*
        Where else this piece hangs, beside the label rather than under it:
        the half is wider than the wall label needs, and a collection is the
        one thing a visitor looking at a piece might want next that the page
        cannot otherwise tell them.

        `CollectionGrid`, the same component the landing row and the
        collections index draw, in a column narrow enough that its
        `auto-fill` resolves to a single track -- so a collection looks like
        itself wherever it appears, and there is one place to change how.

        A share of the half rather than a fixed width, bounded at both
        ends. Fixed, it took the same 340px out of a 576px label at the
        bottom of `2xl` as out of a 1072px one at the top, and the wall
        label paid for it.

        `justify-center` with a `min-h-0` scroller: short enough and the
        whole thing centres beside the label, too long and the list shrinks
        and scrolls instead of pushing the band taller. Without `min-h-0` a
        flex child refuses to shrink and overflows the band instead --
        measured at 2492px of cards spilling out of a 637px band.
      */}
      {holding.length > 0 && (
        <div className="flex flex-col gap-3 2xl:w-[40%] 2xl:max-w-[340px] 2xl:min-w-[220px] 2xl:min-h-0 2xl:shrink-0 2xl:justify-center">
          <span className="shrink-0 text-[12px] uppercase tracking-eyebrow text-faint">
            {holding.length === 1 ? 'In a collection' : 'In collections'}
          </span>
          {/*
            Three regimes, and each needs its own cap. Under `lg` the band
            is stacked and the page scrolls, so the list may run as long as
            it likes. From `lg` the artwork is a fixed height but the label
            is not, so an unbounded list drags the band to 1007px beside a
            648px piece -- hence a viewport cap. From `2xl` the label has
            the artwork's height and the flex box does the capping, so the
            viewport one is dropped.
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

  /*
   * The picks the owner has just saved, ahead of a refetch that would tell
   * us the same thing. Null means "believe the pieces", which is what every
   * first load and every visitor uses.
   */
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
   * The dialog is a sibling of the band, not a child of it. However the top
   * layer paints it, a child is still a DOM descendant, so its events bubble
   * into the band's handlers -- an arrow key typed in the dialog's search
   * field would advance the carousel behind it, and a mouse crossing the
   * dialog would pause it.
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
          Full bleed, inner content capped -- the rule the header and footer
          already follow. The artwork runs to the left edge; the label carries
          its own gutter, which lands its right edge on the same measure as
          the sections below.

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

        {/*
          The row survives a single piece when the owner is looking: the gear
          is the only way into curation, and a gallery of one still has a
          spotlight to arrange.
        */}
        {(many || isOwner) && (
          <div className="mx-auto flex w-full max-w-content items-center gap-6 px-gutter pb-5">
            {many ? (
              <>
                {/*
                  Position, not progress. A rule filling over eight seconds
                  would make the timer legible and would also put continuous
                  motion on screen for as long as the page is open.
                */}
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
                  A word rather than a glyph. WCAG 2.2.2 wants an explicit way
                  to stop anything moving for more than five seconds, and a
                  pause mark at 16px is two hairlines almost touching -- the
                  mud the density icons had to be filled to escape. Nothing to
                  pause under reduced motion, where the timer never starts.
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

            {/*
              Set apart from the transport controls, the way the header sets
              sign-out apart from "+ Upload": the two sit together but are not
              the same kind of act. Everything to the left changes what you
              are looking at; this changes what the gallery shows everyone.
            */}
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
