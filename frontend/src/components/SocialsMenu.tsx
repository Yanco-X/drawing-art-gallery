import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useSession, useSocials } from '../hooks';
import type { Social } from '../types';
import { ChevronDownIcon, EditIcon, ExternalIcon } from './icons';
import { markFor } from './platform-icons';

// Only the owner ever opens this, so it stays out of the bundle a visitor
// downloads -- the same argument as the sign-in dialog.
const SocialsDialog = lazy(() =>
  import('./SocialsDialog').then((module) => ({
    default: module.SocialsDialog,
  })),
);

const ROW =
  'flex items-center gap-3 px-4 py-3 text-[13px] tracking-btn uppercase ' +
  'transition-colors duration-200';

/**
 * One row. Shared with the mobile menu, which lists the links directly
 * rather than nesting a dropdown inside a dropdown.
 */
export const SocialLink = ({ social }: { social: Social }) => {
  const Mark = markFor(social.platform);
  return (
    <a
      href={social.url}
      target="_blank"
      rel="noreferrer noopener"
      className={`${ROW} text-muted hover:text-accent`}
    >
      <Mark />
      <span className="flex-1">{social.label}</span>
      {/* The leaving-arrow is the row's second glyph and sits at the far
          edge: it says where the click goes, not what the row is. */}
      <span className="text-faint">
        <ExternalIcon />
      </span>
    </a>
  );
};

/**
 * The header's Socials menu.
 *
 * A button rather than a link, because there is no page behind it. The
 * chevron is the only thing distinguishing it from its neighbours in the
 * nav, and it is what says a click opens something rather than goes
 * somewhere.
 */
export const SocialsMenu = () => {
  const { socials, replace } = useSocials();
  const { role } = useSession();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const isOwner = role === 'owner';

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Nothing to point at and nothing to manage: a visitor gets no button at
  // all rather than one that opens an empty panel.
  if (socials.length === 0 && !isOwner) return null;

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-haspopup="true"
        // uppercase and tracking spelled out rather than inherited from the
        // nav: preflight resets a button's font but not its case, so it
        // would sit in the row reading Socials beside GALLERY.
        className={`flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[14px] tracking-nav uppercase transition-colors duration-200 ${
          open ? 'text-accent' : 'text-muted hover:text-accent'
        }`}
      >
        Socials
        <span
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {/* Rendered whether or not it is open, so closing can be animated:
          unmounting would take the element away in the same frame and there
          would be nothing left to fade. `display: none` keeps the links out
          of the tab order while it is shut. */}
      <div
        data-open={open}
        onClick={() => setOpen(false)}
        className="menu-panel absolute top-full left-0 z-20 mt-4 min-w-[200px] border border-line bg-surface py-1"
      >
        {socials.map((social) => (
          <SocialLink key={social.id} social={social} />
        ))}

        {isOwner && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={`${ROW} w-full cursor-pointer border-none bg-transparent text-faint hover:text-accent ${
              socials.length > 0 ? 'mt-1 border-t border-line pt-3' : ''
            }`}
          >
            <EditIcon />
            <span className="flex-1 text-left">Manage</span>
          </button>
        )}
      </div>

      {isOwner && editing && (
        <Suspense fallback={null}>
          <SocialsDialog
            open={editing}
            socials={socials}
            onClose={() => setEditing(false)}
            onSaved={(saved) => {
              replace(saved);
              setEditing(false);
            }}
          />
        </Suspense>
      )}
    </div>
  );
};
