export const ORIGIN_PARAM = 'from';

// No collection can take this: a collection actually named "Home" would
// collide with the sentinel.
export const HOME_ORIGIN = 'home';

const MAX_TRAIL = 4;

// Segments are filtered to slug shape rather than encoded: %2F decodes
// back to `/` on the way in, destroying the separator it would protect.
// Filtering also keeps the trail away from `decodeURIComponent`, so a
// crafted `?from=100%` renders a page rather than throwing a `URIError`.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export const readTrail = (value: string | null | undefined): string[] =>
  (value ?? '')
    .split('/')
    .filter((step) => SLUG.test(step))
    .slice(-MAX_TRAIL);

export const serialiseTrail = (trail: string[]): string =>
  trail
    .filter((step) => SLUG.test(step))
    .slice(-MAX_TRAIL)
    .join('/');

export const nearestStep = (trail: string[]): string | undefined =>
  trail[trail.length - 1];

export const behind = (trail: string[]): string[] => trail.slice(0, -1);

export const pieceHref = (id: string, from?: string) =>
  from ? `/piece/${id}?${ORIGIN_PARAM}=${from}` : `/piece/${id}`;

export const collectionHref = (slug: string, from?: string) =>
  from ? `/collections/${slug}?${ORIGIN_PARAM}=${from}` : `/collections/${slug}`;
