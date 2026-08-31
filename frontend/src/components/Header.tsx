import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Role } from '../types';
import { InertLink } from './InertLink';
import { ThemeToggle } from './ThemeToggle';

interface NavItem {
  label: string;
  /** Internal route. */
  to?: string;
  /** In-page anchor, for sections that exist but have no route yet. */
  href?: string;
  active?: boolean;
}

/** A piece lives under the gallery, so it keeps Gallery marked current. */
const buildNavItems = (pathname: string): NavItem[] => [
  {
    label: 'Gallery',
    to: '/home',
    active: pathname === '/home' || pathname.startsWith('/piece'),
  },
  { label: 'Collections', href: '#collections' },
  // TODO: point at /tags once that route exists.
  { label: 'Tags', href: '#' },
];

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

const NavItemLink = ({ item, extra }: { item: NavItem; extra?: string }) =>
  item.to ? (
    <Link
      to={item.to}
      aria-current={item.active ? 'page' : undefined}
      className={navItemClasses(item, extra)}
    >
      {item.label}
    </Link>
  ) : (
    <a href={item.href} className={navItemClasses(item, extra)}>
      {item.label}
    </a>
  );

const OwnerSignIn = ({ className = '' }: { className?: string }) => (
  <InertLink
    className={`text-[13px] uppercase tracking-btn text-faint transition-colors duration-200 hover:text-accent ${className}`}
  >
    Owner sign in
  </InertLink>
);

export const Header = ({
  role,
  onUploadClick,
}: {
  role: Role;
  onUploadClick?: () => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navItems = buildNavItems(pathname);

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg-translucent backdrop-blur-[12px]">
      {/* Bar spans the viewport; its contents line up with the page
          content at the same 1400px measure. */}
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
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {role === 'owner' ? (
            <button
              type="button"
              onClick={onUploadClick}
              className="cursor-pointer border-none bg-accent px-5 py-2.5 text-[13px] uppercase tracking-btn text-on-accent transition-opacity duration-200 hover:opacity-90"
            >
              + Upload
            </button>
          ) : (
            <OwnerSignIn className="hidden sm:inline" />
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
          {role === 'visitor' && <OwnerSignIn />}
        </nav>
      )}
    </header>
  );
};
