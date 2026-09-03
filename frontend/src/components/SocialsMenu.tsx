import { useEffect, useRef, useState } from 'react';
import type { Social } from '../types';
import {
  ChevronDownIcon,
  ExternalIcon,
  InstagramIcon,
  LinkIcon,
} from './icons';

/*
 * Platform to mark. A platform with nothing drawn for it still gets a row
 * and a generic link icon rather than an empty space, which is what lets
 * pass 2 accept a platform this file has never heard of.
 */
const MARKS: Record<string, () => React.ReactElement> = {
  instagram: InstagramIcon,
};

const markFor = (platform: string) => MARKS[platform.toLowerCase()] ?? LinkIcon;

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
      className="flex items-center gap-3 px-4 py-3 text-[13px] tracking-btn text-muted uppercase transition-colors duration-200 hover:text-accent"
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
export const SocialsMenu = ({ socials }: { socials: Social[] }) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

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

  if (socials.length === 0) return null;

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

      {open && (
        <div
          className="absolute top-full left-0 z-20 mt-4 min-w-[200px] border border-line bg-surface py-1"
          onClick={() => setOpen(false)}
        >
          {socials.map((social) => (
            <SocialLink key={social.id} social={social} />
          ))}
        </div>
      )}
    </div>
  );
};
