import type { ReactElement } from 'react';
import { Glyph } from './icons';

/*
 * Platform marks, and the registry that ties them to a stored key.
 *
 * Apart from `icons.tsx` because these follow a different rule. That set is
 * drawn to this design -- square corners, no fill, hairlines. These copy
 * someone else's shape, because a brand is recognised or it is nothing:
 * Instagram keeps its rounded corners, YouTube keeps its pill.
 *
 * They are code, not data. The database stores only the key -- "instagram",
 * "artstation" -- and the drawing lives here in the bundle. Accepting an
 * uploaded SVG instead would mean taking a file format that can carry
 * script, sanitising it, storing it and serving it, all to avoid a one-line
 * addition to this file. A platform with no mark here still works; it shows
 * `LinkIcon` and reads as a link, which is what it is.
 *
 * Some of these are impressionistic at 16px -- DeviantArt's angular mark in
 * particular. Each is one path string; a better drawing is a one-line swap.
 */

export const InstagramIcon = () => (
  <Glyph>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="17" cy="7" r="1.2" fill="currentColor" stroke="none" />
  </Glyph>
);

export const XIcon = () => (
  <Glyph>
    <path d="M4.5 4l15 16M19.5 4l-15 16" />
  </Glyph>
);

export const BlueskyIcon = () => (
  <Glyph>
    <path d="M12 13.5C7 13.5 3.5 10 4.5 6.5 5.5 3.5 10 6 12 13.5Z" />
    <path d="M12 13.5c5 0 8.5-3.5 7.5-7-1-3-5.5-.5-7.5 7Z" />
  </Glyph>
);

export const ArtStationIcon = () => (
  <Glyph>
    <path d="M4.5 17.5h11l-2.5-4.5H7z" />
    <path d="M11.5 4.5 19.5 17.5" />
  </Glyph>
);

export const DeviantArtIcon = () => (
  <Glyph>
    <path d="M17 3v4.3l-4 7.4h4V19l-2.5 2H7v-4.3l4-7.4H7V5l2.5-2z" />
  </Glyph>
);

export const TumblrIcon = () => (
  <Glyph>
    <path d="M13.5 3.5c0 3 1.5 4.5 4 4.5v3h-4v6c0 1.8 1.2 2.3 3.2 1.7V21c-4 1-6.2-.8-6.2-3.8v-6H8V8.5c2.5-.8 4-2.4 4.4-5Z" />
  </Glyph>
);

export const YouTubeIcon = () => (
  <Glyph>
    <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
    <path d="M10.5 9.2 15.8 12l-5.3 2.8Z" />
  </Glyph>
);

export const PatreonIcon = () => (
  <Glyph>
    <circle cx="14.5" cy="9.5" r="5.5" />
    <path d="M4.5 4v16" />
  </Glyph>
);

export const KofiIcon = () => (
  <Glyph>
    <path d="M4 7h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" />
    <path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16" />
    <path d="M8 3.5v1.5M12 3.5v1.5" />
  </Glyph>
);

export const CaraIcon = () => (
  <Glyph>
    <path d="M17.5 7.5A6.5 6.5 0 1 0 17.5 16.5" />
  </Glyph>
);

export const EmailIcon = () => (
  <Glyph>
    <rect x="3" y="5" width="18" height="14" />
    <path d="M3 7.5 12 13.5 21 7.5" />
  </Glyph>
);

/** The stand-in for a platform with no mark drawn for it. */
export const LinkIcon = () => (
  <Glyph>
    <path d="M10 14a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-6-6l-1.5 1.5" />
    <path d="M14 10a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 6 6L12.5 17" />
  </Glyph>
);

export interface Platform {
  key: string;
  label: string;
  icon: () => ReactElement;
  /** Hostnames that identify this platform when a url is pasted. */
  hosts: string[];
}

/*
 * One list, three jobs: the mark beside a link in the menu, the choices in
 * the manage dialog, and the hostnames that let a pasted url name its own
 * platform. Keeping them together is what stops the picker offering a
 * platform the menu cannot draw.
 */
export const PLATFORMS: Platform[] = [
  { key: 'instagram', label: 'Instagram', icon: InstagramIcon, hosts: ['instagram.com'] },
  { key: 'artstation', label: 'ArtStation', icon: ArtStationIcon, hosts: ['artstation.com'] },
  { key: 'cara', label: 'Cara', icon: CaraIcon, hosts: ['cara.app'] },
  { key: 'deviantart', label: 'DeviantArt', icon: DeviantArtIcon, hosts: ['deviantart.com'] },
  { key: 'x', label: 'X', icon: XIcon, hosts: ['x.com', 'twitter.com'] },
  { key: 'bluesky', label: 'Bluesky', icon: BlueskyIcon, hosts: ['bsky.app'] },
  { key: 'tumblr', label: 'Tumblr', icon: TumblrIcon, hosts: ['tumblr.com'] },
  { key: 'youtube', label: 'YouTube', icon: YouTubeIcon, hosts: ['youtube.com', 'youtu.be'] },
  { key: 'patreon', label: 'Patreon', icon: PatreonIcon, hosts: ['patreon.com'] },
  { key: 'kofi', label: 'Ko-fi', icon: KofiIcon, hosts: ['ko-fi.com'] },
  { key: 'email', label: 'Email', icon: EmailIcon, hosts: [] },
  { key: 'link', label: 'Other', icon: LinkIcon, hosts: [] },
];

const BY_KEY = new Map(PLATFORMS.map((platform) => [platform.key, platform]));

export const markFor = (platform: string): (() => ReactElement) =>
  BY_KEY.get(platform.toLowerCase())?.icon ?? LinkIcon;

export const labelForPlatform = (platform: string): string =>
  BY_KEY.get(platform.toLowerCase())?.label ?? platform;

/**
 * Which platform a pasted url belongs to.
 *
 * Matches the hostname and any parent of it, so `www.instagram.com` and a
 * regional subdomain both land on the same key. Returns null when nothing
 * matches, which the dialog treats as "you pick".
 */
export const platformFromUrl = (raw: string): string | null => {
  const url = raw.trim();
  if (!url) return null;
  let host: string;
  try {
    host = new URL(url.includes('://') ? url : `https://${url}`).hostname.toLowerCase();
  } catch {
    return null;
  }
  const bare = host.replace(/^www\./, '');
  const found = PLATFORMS.find((platform) =>
    platform.hosts.some((known) => bare === known || bare.endsWith(`.${known}`)),
  );
  return found?.key ?? null;
};
