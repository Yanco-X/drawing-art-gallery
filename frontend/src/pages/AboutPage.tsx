import { Suspense, lazy, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LanguageToggle } from '../components/LanguageToggle';
import type { Language } from '../components/LanguageToggle';
import { PageShell } from '../components/PageShell';
import { SectionState } from '../components/SectionState';
import {
  FIELD,
  ICON_BUTTON,
  ICON_BUTTON_ACCENT,
  LABEL,
  PRIMARY_BUTTON,
} from '../components/form-styles';
import { CheckIcon, EditIcon } from '../components/icons';
import { useAsync, useSession } from '../hooks';
import { whenDecoded } from '../lib/decode';
import { ABOUT_ORIGIN, pieceHref, sequenceState } from '../lib/origin';
import { ApiError, fetchAbout, setAboutPieces, setAboutText } from '../services';
import type { About, Piece } from '../types';

// Lazy and owner-only, as the spotlight's picker is.
const PiecePicksDialog = lazy(() => import('../components/PiecePicksDialog'));

// The API refuses a thirteenth, and a longer text.
const ABOUT_PIECES = 12;
const ABOUT_BODY = 6000;

const unreachable = (caught: unknown) =>
  caught instanceof ApiError
    ? caught.message
    : 'Could not reach the API. Is the backend running?';

// Which piece rises into the cover and which falls into the row, named for
// the view transition that trades them. Named only while it runs.
interface Swap {
  rising: string;
  falling: string;
}

const swapName = (swap: Swap | null, id: string) =>
  swap?.rising === id ? 'about-rising' : swap?.falling === id ? 'about-falling' : undefined;

const AboutCover = ({
  piece,
  order,
  swap,
}: {
  piece: Piece;
  order: string[];
  swap: Swap | null;
}) => (
  <Link
    to={pieceHref(piece.id, ABOUT_ORIGIN)}
    state={sequenceState(order)}
    className="group flex w-fit max-w-full flex-col gap-3 narrow:self-center"
  >
    {/* Both sizes auto and the ratio given, as on the piece page, so the
        height cap shrinks the width with it instead of letterboxing. The cap
        leaves the header, the caption and the row below in the first screen. */}
    <img
      src={piece.imageUrl}
      alt={piece.title}
      width={piece.width ?? undefined}
      height={piece.height ?? undefined}
      style={{
        aspectRatio: piece.aspectRatio,
        viewTransitionName: swapName(swap, piece.id),
      }}
      className="hatch max-h-[max(240px,calc(100svh-440px))] flat:max-h-[calc(100svh-var(--spacing-header)-6rem)] w-auto max-w-full border border-line object-contain transition-colors duration-200 group-hover:border-accent"
    />
    <span className="flex items-baseline gap-3">
      <span className="font-serif text-[18px] text-text">{piece.title}</span>
      {piece.year && (
        <span className="text-[12px] text-faint">{piece.year}</span>
      )}
    </span>
  </Link>
);

// A thumbnail does not leave the page: it trades places with the cover.
const AboutRow = ({
  pieces,
  swap,
  onProject,
}: {
  pieces: Piece[];
  swap: Swap | null;
  onProject: (id: string) => void;
}) => (
  // Edge to edge when stacked, where the column is the page's width.
  <ul
    aria-label="More work"
    style={{ viewTransitionName: swap ? 'about-row' : undefined }}
    className="-mx-gutter flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-gutter px-gutter pb-2 wide:mx-0 wide:scroll-px-0 wide:px-0"
  >
    {pieces.map((piece) => (
      <li key={piece.id} className="shrink-0 snap-start">
        <button
          type="button"
          onClick={() => onProject(piece.id)}
          title={piece.title}
          aria-label={`Show ${piece.title} as the cover`}
          className="block cursor-pointer border border-line bg-transparent p-0 transition-colors duration-200 hover:border-accent active:border-accent"
        >
          <img
            src={piece.thumbnailUrl ?? piece.imageUrl}
            alt=""
            loading="lazy"
            width={piece.width ?? undefined}
            height={piece.height ?? undefined}
            style={{
              aspectRatio: piece.aspectRatio,
              viewTransitionName: swapName(swap, piece.id),
            }}
            className="hatch block h-40 w-auto object-cover flat:h-28"
          />
        </button>
      </li>
    ))}
  </ul>
);

// A blank line starts a paragraph; a single line break stays one.
const AboutText = ({ body, lang }: { body: string; lang: Language }) => (
  <div
    lang={lang}
    className="flex max-w-[38em] flex-col gap-4 text-[15px] leading-relaxed text-dim"
  >
    {body
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph, at) => (
        <p key={at} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
  </div>
);

const EYEBROW: Record<Language, string> = { en: 'About', es: 'Sobre mí' };

const wordsIn = (page: About, language: Language) =>
  language === 'es' ? page.bodyEs : page.body;

const AboutPage = () => {
  const { role } = useSession();
  const isOwner = role === 'owner';
  const about = useAsync(fetchAbout);
  // Set by a save, ahead of any refetch.
  const [saved, setSaved] = useState<About | null>(null);
  const page = saved ?? (about.status === 'ready' ? about.data : null);

  const [language, setLanguage] = useState<Language>('en');
  const [editing, setEditing] = useState(false);
  // Both languages at once, so switching while editing loses neither.
  const [drafts, setDrafts] = useState<Record<Language, string>>({ en: '', es: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const [picking, setPicking] = useState(false);
  const fieldId = useId();

  const pieces = page?.pieces ?? [];
  const savedOrder = pieces.map((piece) => piece.id);
  // The reader's own arrangement, in this browser only, and only while the
  // picks it was made from are still the picks.
  const [projected, setProjected] = useState<{ from: string; ids: string[] } | null>(
    null,
  );
  const [swap, setSwap] = useState<Swap | null>(null);
  // Set from the tap, before the decode it waits on, so a second tap in
  // between cannot start a second trade.
  const trading = useRef(false);
  const order =
    projected && projected.from === savedOrder.join() ? projected.ids : savedOrder;
  const byId = new Map(pieces.map((piece) => [piece.id, piece]));
  const [cover, ...rest] = order.flatMap((id) => byId.get(id) ?? []);
  const changed =
    editing &&
    page !== null &&
    (drafts.en !== page.body || drafts.es !== page.bodyEs);
  const showPieces = pieces.length > 0 || editing;
  // A visitor is offered Spanish only once there are words to switch to.
  const bilingual = editing || Boolean(page?.body && page.bodyEs);
  const shown: Language = bilingual ? language : 'en';
  const draft = drafts[shown];

  const startEditing = () => {
    setDrafts({ en: page?.body ?? '', es: page?.bodyEs ?? '' });
    setError(null);
    setEditing(true);
  };

  const stopEditing = () => {
    if (changed) setDiscarding(true);
    else setEditing(false);
  };

  const saveText = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const next = await setAboutText({ body: drafts.en, bodyEs: drafts.es });
      setSaved(next);
      setDrafts({ en: next.body, es: next.bodyEs });
    } catch (caught) {
      setError(unreachable(caught));
    } finally {
      setBusy(false);
    }
  };

  const savePieces = async (pieceIds: string[]) => {
    setSaved(await setAboutPieces(pieceIds));
  };

  // The cover and a thumbnail trade places. The drawing coming up is decoded
  // at cover size first, or it would grow in blank.
  const project = async (id: string) => {
    const at = order.indexOf(id);
    if (at <= 0 || trading.current) return;
    const next = [...order];
    [next[0], next[at]] = [next[at], next[0]];
    const apply = () => setProjected({ from: savedOrder.join(), ids: next });

    const rising = byId.get(id);
    const falling = byId.get(order[0]);
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || !rising || !falling || !('startViewTransition' in document)) {
      apply();
      return;
    }

    trading.current = true;
    await Promise.all([
      whenDecoded(rising.imageUrl),
      whenDecoded(falling.thumbnailUrl ?? falling.imageUrl),
    ]);
    flushSync(() => setSwap({ rising: id, falling: falling.id }));
    const root = document.documentElement;
    root.dataset.aboutSwap = '';
    const done = () => {
      delete root.dataset.aboutSwap;
      setSwap(null);
      trading.current = false;
    };
    document.startViewTransition(() => flushSync(apply)).finished.then(done, done);
  };

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-content px-gutter pt-intro-top pb-section-lg">
        {about.status === 'error' && !page ? (
          <SectionState message={about.message} />
        ) : !page ? (
          <SectionState message="Loading…" />
        ) : (
          <div
            className={`grid gap-10 wide:gap-16 ${showPieces ? 'wide:grid-cols-2' : ''}`}
          >
            <div className="flex min-w-0 flex-col gap-6">
              <div>
                {/* Beside the eyebrow rather than a row of its own, so the
                    pieces column starts level with the page. */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[12px] uppercase tracking-eyebrow text-faint">
                    {EYEBROW[shown]}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {bilingual && (
                      <LanguageToggle value={shown} onChange={setLanguage} />
                    )}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={editing ? stopEditing : startEditing}
                        aria-pressed={editing}
                        className={`${ICON_BUTTON} aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-on-accent`}
                      >
                        {editing ? <CheckIcon /> : <EditIcon />}
                        {editing ? 'Done editing' : 'Edit page'}
                      </button>
                    )}
                  </div>
                </div>
                <h1 className="font-serif text-[clamp(28px,4vw,48px)] leading-[1.05] font-normal text-text">
                  Yanco.
                </h1>
              </div>

              {editing ? (
                <form onSubmit={saveText} className="flex flex-col gap-3">
                  <label htmlFor={fieldId} className={LABEL}>
                    The words on this page, in{' '}
                    {shown === 'es' ? 'Spanish' : 'English'}
                  </label>
                  <textarea
                    id={fieldId}
                    lang={shown}
                    value={draft}
                    onChange={(event) =>
                      setDrafts((now) => ({ ...now, [shown]: event.target.value }))
                    }
                    rows={16}
                    maxLength={ABOUT_BODY}
                    className={`${FIELD} resize-y leading-relaxed`}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[12px] text-faint">
                      A blank line starts a new paragraph. {draft.length} of{' '}
                      {ABOUT_BODY}. Save keeps both languages.
                    </span>
                    <button
                      type="submit"
                      disabled={busy || !changed}
                      className={PRIMARY_BUTTON}
                    >
                      {busy ? 'Saving…' : 'Save text'}
                    </button>
                  </div>
                  {error && (
                    <p role="alert" className="text-[12px] text-accent">
                      {error}
                    </p>
                  )}
                </form>
              ) : (
                <AboutText
                  key={shown}
                  body={wordsIn(page, shown)}
                  lang={shown}
                />
              )}
            </div>

            {/* First when stacked: the drawing is the introduction there. */}
            {showPieces && (
              <div className="flex min-w-0 flex-col gap-4 narrow:order-first">
                {cover ? (
                  <AboutCover piece={cover} order={order} swap={swap} />
                ) : (
                  <SectionState message="No pieces on the page yet." />
                )}
                {rest.length > 0 && (
                  <AboutRow pieces={rest} swap={swap} onProject={project} />
                )}
                {editing && (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPicking(true)}
                      className={ICON_BUTTON_ACCENT}
                    >
                      Choose pieces
                    </button>
                    <span className="text-[12px] text-faint">
                      The first is the cover; the rest run beneath it.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {isOwner && picking && (
        <Suspense fallback={null}>
          <PiecePicksDialog
            open={picking}
            picks={savedOrder}
            onClose={() => setPicking(false)}
            onSaved={() => setPicking(false)}
            title="About page"
            listLabel="On the page"
            max={ABOUT_PIECES}
            save={savePieces}
            emptyHint="Pick a cover first, then any others for the row beneath it."
            note="The first is the cover; the rest run beneath it."
          />
        </Suspense>
      )}

      <ConfirmDialog
        open={discarding}
        title="Discard your changes?"
        confirmLabel="Discard"
        onCancel={() => setDiscarding(false)}
        onConfirm={() => {
          setDiscarding(false);
          setEditing(false);
        }}
      >
        The words you changed, in either language, have not been saved.
      </ConfirmDialog>
    </PageShell>
  );
};

export default AboutPage;
