import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSocials } from '../hooks';
import { fetchPieces } from '../services';
import type { Role } from '../types';
import { ICON_BUTTON_ACCENT } from './form-styles';
import { ShuffleIcon, SignOutIcon } from './icons';
import { SocialLink, SocialsMenu } from './SocialsMenu';
import { ThemeToggle } from './ThemeToggle';

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

const ShowMeSome = ({ className = '' }: { className?: string }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const goSomewhere = async () => {
    const current = pathname.startsWith('/piece/') ? pathname.slice(7) : null;
    const pool = (await fetchPieces()).filter((piece) => piece.id !== current);
    if (pool.length === 0) return;
    navigate(`/piece/${pool[Math.floor(Math.random() * pool.length)].id}`);
  };

  return (
    <button
      type="button"
      onClick={goSomewhere}
      title="Take me to a random piece from the gallery"
      className={`${ICON_BUTTON_ACCENT} ${className}`}
    >
      <ShuffleIcon />
      Show me some!
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
  const { socials } = useSocials();
  const { pathname } = useLocation();
  const navItems = buildNavItems(pathname, role);

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg-translucent backdrop-blur-[12px]">
      {/* Below sm the gap is only the floor between the wordmark and the
          controls; at 24px a 360px phone scrolls sideways. */}
      <div className="mx-auto flex w-full max-w-content items-center justify-between gap-2 px-gutter py-5 sm:gap-6">
        {/* leading-none keeps the header its old height; the piece page's
            artwork cap subtracts it as a fixed 72px. */}
        <Link
          to="/home"
          className="flex items-center gap-2 font-serif text-[32px] leading-none tracking-wordmark text-text"
        >
          {/* 40px overhangs the 36px row by 2px a side, so the header keeps
              the height --spacing-header records. A 360px phone has no room. */}
          <img
            src="/logo-40.png"
            srcSet="/logo-40.png 40w, /logo-50.png 50w, /logo-60.png 60w, /logo-80.png 80w, /logo-120.png 120w"
            sizes="(min-width: 370px) 40px, 32px"
            alt=""
            className="size-8 min-[370px]:-my-0.5 min-[370px]:size-10"
          />
          <span>
            Yan<span className="italic text-accent">Curations</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-[clamp(16px,3vw,36px)] text-[14px] uppercase tracking-nav sm:flex">
          {navItems.map((item) => (
            <NavItemLink key={item.label} item={item} />
          ))}
          <SocialsMenu />
        </nav>

        <ShowMeSome className="hidden lg:flex" />

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {role === 'owner' && (
            <>
              <button
                type="button"
                onClick={onUploadClick}
                className="cursor-pointer border-none bg-accent px-5 py-2.5 text-[13px] uppercase tracking-btn text-on-accent transition-opacity duration-200 hover:opacity-90"
              >
                + Upload
              </button>
              <SignOut onSignOut={onSignOut} className="hidden sm:ml-6 sm:flex" />
            </>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label="Menu"
            className="flex cursor-pointer flex-col justify-center gap-[4px] border border-line px-3 py-2 text-muted transition-colors duration-200 hover:border-accent hover:text-accent sm:hidden"
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
          className="flex flex-col items-start gap-4 border-t border-line px-gutter py-5 text-[14px] uppercase tracking-nav sm:hidden"
        >
          {navItems.map((item) => (
            <NavItemLink key={item.label} item={item} extra="self-start" />
          ))}
          <ShowMeSome />
          {socials.length > 0 && (
            <div className="-mx-4 flex w-[calc(100%+2rem)] flex-col border-t border-line pt-2">
              {socials.map((social) => (
                <SocialLink key={social.id} social={social} />
              ))}
            </div>
          )}

          {role === 'owner' && (
            <button
              type="button"
              onClick={onSignOut}
              className="flex cursor-pointer items-center gap-2 self-start border-none bg-transparent p-0 text-[14px] uppercase tracking-nav text-muted transition-colors duration-200 hover:text-accent"
            >
              <SignOutIcon />
              Sign out
            </button>
          )}
        </nav>
      )}
    </header>
  );
};
