import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useHidingHeader, useSocials, useTheme } from '../hooks';
import { fetchPieces } from '../services';
import type { Role } from '../types';
import { ICON_BUTTON_ACCENT } from './form-styles';
import { ShuffleIcon, SignOutIcon } from './icons';
import { SocialLink, SocialsMenu } from './SocialsMenu';
import { ThemeToggle } from './ThemeToggle';

const MENU_ROW =
  'flex cursor-pointer items-center gap-2 self-start border-none bg-transparent ' +
  'p-0 text-[14px] uppercase tracking-nav text-muted transition-colors ' +
  'duration-200 hover:text-accent';

const SQUARE_ACCENT =
  'flex size-9 cursor-pointer items-center justify-center border border-accent ' +
  'bg-transparent text-accent transition-colors duration-200 ' +
  'hover:bg-accent hover:text-on-accent active:bg-accent active:text-on-accent';

interface NavItem {
  label: string;
  to: string;
  active?: boolean;
}

/** A piece lives under the gallery, so it keeps Gallery marked current --
    unless we are in the reserve, which owns its own pieces. */
const buildNavItems = (pathname: string, role: Role): NavItem[] => {
  const inReserve = pathname.startsWith('/waived');
  const items: NavItem[] = [
    {
      label: 'Gallery',
      to: '/home',
      active: !inReserve && (pathname === '/home' || pathname.startsWith('/piece')),
    },
    {
      label: 'Collections',
      to: '/collections',
      active: pathname.startsWith('/collections'),
    },
    { label: 'Yanco', to: '/about', active: pathname.startsWith('/about') },
  ];

  // The reserve and the counts are the owner's own views; a visitor is not
  // told they exist.
  if (role === 'owner') {
    items.push({
      label: 'Curate',
      to: '/curate',
      active: pathname.startsWith('/curate'),
    });
    items.push({ label: 'Waived', to: '/waived', active: inReserve });
    items.push({
      label: 'Metrics',
      to: '/metrics',
      active: pathname.startsWith('/metrics'),
    });
  }
  return items;
};

const navItemClasses = (item: NavItem, extra = '') =>
  [
    'transition-colors duration-200',
    item.active
      ? 'text-text border-b border-accent pb-0.5'
      : 'text-muted hover:text-accent',
    extra,
  ]
    .filter(Boolean)
    .join(' ');

// Every nav item is a real route; there is no in-page-anchor case to fall
// back to.
const NavItemLink = ({ item, extra }: { item: NavItem; extra?: string }) => (
  <Link
    to={item.to}
    aria-current={item.active ? 'page' : undefined}
    className={navItemClasses(item, extra)}
  >
    {item.label}
  </Link>
);

const ShowMeSome = ({
  className = '',
  compact = false,
}: {
  className?: string;
  /** The glyph alone, in a 36px square, for a phone's row. */
  compact?: boolean;
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Filled until the piece opens, so a tap is seen to have landed.
  const [going, setGoing] = useState(false);

  const goSomewhere = async () => {
    setGoing(true);
    try {
      const current = pathname.startsWith('/piece/') ? pathname.slice(7) : null;
      const pool = (await fetchPieces()).filter((piece) => piece.id !== current);
      if (pool.length === 0) return;
      navigate(`/piece/${pool[Math.floor(Math.random() * pool.length)].id}`);
    } finally {
      setGoing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={goSomewhere}
      title="Take me to a random piece from the gallery"
      aria-label={compact ? 'Show me some!' : undefined}
      data-going={going || undefined}
      className={`${compact ? SQUARE_ACCENT : ICON_BUTTON_ACCENT} data-going:bg-accent data-going:text-on-accent ${className}`}
    >
      <ShuffleIcon />
      {!compact && 'Show me some!'}
    </button>
  );
};

const SignOut = ({
  onSignOut,
  className = '',
}: {
  onSignOut?: () => void;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onSignOut}
    aria-label="Sign out"
    title="Sign out"
    className={`flex h-9 w-9 cursor-pointer items-center justify-center border border-line bg-transparent text-muted transition-colors duration-200 hover:border-accent hover:text-accent ${className}`}
  >
    <SignOutIcon />
  </button>
);

export const Header = ({
  role,
  onUploadClick,
  onSignOut,
}: {
  role: Role;
  onUploadClick?: () => void;
  onSignOut?: () => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { hidden, reveal } = useHidingHeader(menuOpen);
  // Never away with its menu open, or with the focus inside it.
  const away = hidden && !menuOpen;
  const { socials } = useSocials();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const navItems = buildNavItems(pathname, role);
  const isOwner = role === 'owner';
  const isDark = theme === 'dark';

  return (
    <header
      onFocus={reveal}
      className={`sticky top-0 z-10 bg-bg-translucent backdrop-blur-[12px] transition-transform duration-300 ease-reflow motion-reduce:transition-none ${
        away ? '-translate-y-full' : ''
      }`}
    >
      {/* Below sm the gap is only the floor between the wordmark and the
          controls; at 24px a 360px phone scrolls sideways. */}
      <div className="mx-auto flex w-full max-w-content items-center justify-between gap-2 px-gutter py-5 sm:gap-6">
        {/* leading-none keeps the header its old height; the piece page's
            artwork cap subtracts it as a fixed 72px. */}
        <Link
          to="/home"
          className="flex items-center gap-2 font-serif text-[32px] leading-none tracking-wordmark text-text"
        >
          {/* 48px overhangs the 36px row by 6px a side, inside the header's
              py-5, so the height --spacing-header records is unchanged. A
              360px phone has no room. */}
          <img
            src="/logo-40.png"
            srcSet="/logo-40.png 40w, /logo-50.png 50w, /logo-60.png 60w, /logo-80.png 80w, /logo-120.png 120w"
            sizes="(min-width: 370px) 48px, 32px"
            alt=""
            className="size-8 min-[370px]:-my-1.5 min-[370px]:size-12"
          />
          <span>
            Yan<span className="italic text-accent">Curations</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-[clamp(16px,3vw,36px)] text-[14px] uppercase tracking-nav lg:flex">
          {navItems.map((item) => (
            <NavItemLink key={item.label} item={item} />
          ))}
          <SocialsMenu />
        </nav>

        {/* Its label only from 1280px: with Yanco in the nav, the row
            beside it has no room for the words below that. */}
        <ShowMeSome compact className="hidden lg:flex xl:hidden" />
        <ShowMeSome className="hidden xl:flex" />

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Three 36px squares fit beside the wordmark from 390px; a
              narrower phone keeps it in the menu panel. */}
          <ShowMeSome compact className="hidden min-[390px]:flex lg:hidden" />
          {/* A phone's row has no room for the wordmark, Upload and this
              together, so for the owner it waits in the menu there. */}
          <div className={isOwner ? 'hidden lg:flex' : 'flex'}>
            <ThemeToggle />
          </div>

          {isOwner && (
            <>
              <button
                type="button"
                onClick={onUploadClick}
                aria-label="Upload"
                title="Upload"
                className="flex size-9 cursor-pointer items-center justify-center gap-1.5 border-none bg-accent p-0 text-[13px] whitespace-nowrap uppercase tracking-btn text-on-accent transition-opacity duration-200 hover:opacity-90 lg:size-auto lg:px-5 lg:py-2.5"
              >
                <span
                  aria-hidden="true"
                  className="text-[18px] leading-none lg:text-[13px]"
                >
                  +
                </span>
                <span aria-hidden="true" className="hidden lg:inline">
                  Upload
                </span>
              </button>
              <SignOut onSignOut={onSignOut} className="hidden lg:ml-6 lg:flex" />
            </>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label="Menu"
            className="flex size-9 cursor-pointer flex-col items-center justify-center gap-[4px] border border-line text-muted transition-colors duration-200 hover:border-accent hover:text-accent lg:hidden"
          >
            <span aria-hidden="true" className="block h-px w-4 bg-current" />
            <span aria-hidden="true" className="block h-px w-4 bg-current" />
            <span aria-hidden="true" className="block h-px w-4 bg-current" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          className="flex flex-col items-start gap-4 border-t border-line px-gutter py-5 text-[14px] uppercase tracking-nav lg:hidden"
        >
          {navItems.map((item) => (
            <NavItemLink key={item.label} item={item} extra="self-start" />
          ))}
          <ShowMeSome className="min-[390px]:hidden" />
          {socials.length > 0 && (
            <div className="-mx-4 flex w-[calc(100%+2rem)] flex-col border-t border-line pt-2">
              {socials.map((social) => (
                <SocialLink key={social.id} social={social} />
              ))}
            </div>
          )}

          {isOwner && (
            <>
              {/* Names the theme in force, as the toggle does. */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
                className={MENU_ROW}
              >
                <span aria-hidden="true" className="w-4 text-center leading-none">
                  {isDark ? '☾' : '☀'}
                </span>
                {isDark ? 'Dark' : 'Light'}
              </button>
              <button type="button" onClick={onSignOut} className={MENU_ROW}>
                <SignOutIcon />
                Sign out
              </button>
            </>
          )}
        </nav>
      )}
      <div
        aria-hidden="true"
        className="pencil-stroke pointer-events-none absolute inset-x-0 -bottom-1 h-2 opacity-80 [--stroke-src:var(--sa-rule-1)]"
      />
    </header>
  );
};
