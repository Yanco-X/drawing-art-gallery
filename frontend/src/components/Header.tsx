import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSocials } from '../hooks';
import type { Role } from '../types';
import { SignOutIcon } from './icons';
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

  // The reserve is the owner's own view; a visitor is not told it exists.
  if (role === 'owner') {
    items.push({ label: 'Waived', to: '/waived', active: inReserve });
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
      <div className="mx-auto flex w-full max-w-content items-center justify-between gap-6 px-gutter py-5">
        <Link
          to="/home"
          className="font-serif text-[24px] tracking-wordmark text-text"
        >
          Sketchy<span className="italic text-accent">Art</span>
        </Link>

        <nav className="hidden items-center gap-[clamp(16px,3vw,36px)] text-[14px] uppercase tracking-nav sm:flex">
          {navItems.map((item) => (
            <NavItemLink key={item.label} item={item} />
          ))}
          <SocialsMenu />
        </nav>

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
