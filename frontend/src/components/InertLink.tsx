import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';

interface InertLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
}

/**
 * A link with no destination yet.
 *
 * Routing is out of scope for this UI pass, but collection cards, piece
 * cards, "View all" and "Owner sign in" are all links in the design. This
 * keeps them focusable and hoverable while swallowing the navigation, so
 * they neither 404 nor jump the page to the top.
 *
 * Replace with react-router's <Link to="..."> as each route lands.
 */
export const InertLink = ({ children, onClick, ...rest }: InertLinkProps) => (
  <a
    href="#"
    onClick={(event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      onClick?.(event);
    }}
    {...rest}
  >
    {children}
  </a>
);
