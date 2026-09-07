import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSession, useSpotlight } from '../hooks';
import { pickedIds, spotlightSlots } from '../lib/spotlight';
import type { Piece } from '../types';
import { ICON_BUTTON, ICON_BUTTON_ACCENT, SUBTLE_ACTION } from './form-styles';
import { ChevronLeftIcon, ChevronRightIcon, GearIcon } from './icons';

// Lazy, and owner-only. STATUS.md carries "the owner surface still ships to
// every visitor" as a known gap; a new owner dialog should not add to it.
const SpotlightDialog = lazy(() => import('./SpotlightDialog'));

/*
 * The band at the top of the gallery: one piece shown nearly whole, its
 * label beside it.
 *
 * Contained rather than cropped. A hero band elsewhere on the web fills its
 * half by cutting the image to fit, which is fine for photography and
 * beheads a portrait. The hatch carries whatever the piece does not, the
 * same way it does on the piece page.
 */
const BAND = 'h-[clamp(260px,44vh,420px)] lg:h-[clamp(360px,60vh,620px)]';

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

  return (
    <div className={`hatch flex items-center justify-center ${BAND}`}>
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
            className="max-h-full max-w-full object-contain"
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
}: {
  piece: Piece;
  position: number;
  total: number;
}) => {
  const meta = [piece.medium, piece.year].filter(Boolean).join(' · ');

  /*
   * Stacked slides make the row as tall as the longest label, so a short
   * one has slack to place. Centred beside the artwork, where the slack
   * splits evenly and is invisible; below it, hard against the top, so the
   * slack falls after the button as padding rather than opening a hole
   * between a piece and its own title.
   */
  return (
    <div className="flex flex-col justify-start gap-4 px-gutter py-10 lg:justify-center lg:py-12">
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
      <Link to={`/piece/${piece.id}`} className={`${ICON_BUTTON_ACCENT} w-fit`}>
        View piece
        <ChevronRightIcon />
      </Link>
    </div>
  );
};

export const Spotlight = ({ pieces }: { pieces: Piece[] }) => {
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
              className={`col-start-1 row-start-1 grid grid-cols-1 transition-opacity duration-200 motion-reduce:transition-none lg:grid-cols-[55fr_45fr] ${
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
