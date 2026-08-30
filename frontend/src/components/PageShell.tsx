import type { ReactNode } from 'react';
import { CURRENT_ROLE } from '../lib/session';
import { Header } from './Header';
import { SiteFooter } from './SiteFooter';

/** The frame every route shares: sticky header, content, footer pinned down. */
export const PageShell = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col transition-[background-color,color] duration-300">
    <Header role={CURRENT_ROLE} />
    <main className="flex flex-1 flex-col">{children}</main>
    <SiteFooter />
  </div>
);
