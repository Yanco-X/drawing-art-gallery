/**
 * Where a piece was opened from, carried in the URL as `?from=<slug>`.
 *
 * The piece page's prev/next walk whatever list the visitor is actually in.
 * Opened from a collection that is the collection's curated order, not the
 * gallery's -- stepping out of a set you deliberately entered is the bug
 * this closes.
 *
 * In the URL rather than in router state, for the reason `?view=1` is:
 * router state does not survive a reload and cannot be sent to anyone, so a
 * shared link would quietly put the reader somewhere other than where the
 * sender was. It also means Back works without the page having to remember
 * anything.
 *
 * A slug rather than the pieces themselves: the collection route already
 * returns members in `display_order`, and an id list in a query string
 * would be both enormous and stale the moment the set was rearranged.
 */
export const ORIGIN_PARAM = 'from';

/**
 * The landing page, as an origin.
 *
 * A collection is reachable two ways -- the row on the landing page and the
 * Collections nav item -- and "back" means a different place for each. A
 * slug names a collection; this names the gallery, which has no slug of its
 * own. Distinguishable because no collection can take it: the backend
 * slugifies names, and a collection actually called "Home" would collide,
 * which is the one wrinkle in spending a slug-shaped value on a sentinel.
 */
export const HOME_ORIGIN = 'home';

/*
 * `from` is a trail, not a single step.
 *
 * It held one origin first, which lost the gallery on the way through a
 * piece: gallery, collection, piece, back put the reader on the collection
 * with no way back to the gallery, because the piece never knew where the
 * collection had come from. A second parameter naming the origin's origin
 * was the other answer, and it is one parameter per level of depth.
 *
 * A trail is one parameter at any depth, and reads as what it is --
 * `from=home/night-calls` is "the gallery, then Night Calls". The nearest
 * step is the list a page walks; the rest is what its own back link
 * inherits, so each page hands on exactly the trail behind it.
 *
 * `/` separates because a slug cannot contain one: the backend slugifies,
 * and every segment is a slug or the home sentinel.
 *
 * Segments are not encoded, and that is the right call rather than a lazy
 * one. Encoding a `/` gives `%2F`, which the query parser decodes back to
 * `/` on the way in -- so it destroys the separator it was meant to
 * protect, and cannot survive without double-encoding. Filtering is what
 * holds instead: a segment that is not slug-shaped is dropped, which also
 * means the trail never reaches `decodeURIComponent` to be thrown by. A
 * crafted `?from=100%` is a page that renders, not a `URIError`.
 *
 * Capped, because the trail comes from the URL and a crafted one should not
 * grow without limit. Four is past anything this site can produce.
 */
const MAX_TRAIL = 4;

/** What the backend's slugifier can produce, plus the home sentinel. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

/** The trail as read from the URL, oldest step first. */
export const readTrail = (value: string | null | undefined): string[] =>
  (value ?? '')
    .split('/')
    .filter((step) => SLUG.test(step))
    .slice(-MAX_TRAIL);

/** Back into a query value. */
export const serialiseTrail = (trail: string[]): string =>
  trail
    .filter((step) => SLUG.test(step))
    .slice(-MAX_TRAIL)
    .join('/');

/** The step just behind this page: the list it should walk. */
export const nearestStep = (trail: string[]): string | undefined =>
  trail[trail.length - 1];

/** What the page one step back inherits. */
export const behind = (trail: string[]): string[] => trail.slice(0, -1);

/** The piece route, carrying the trail when there is one. */
export const pieceHref = (id: string, from?: string) =>
  from ? `/piece/${id}?${ORIGIN_PARAM}=${from}` : `/piece/${id}`;

/** The collection route, likewise. `from` is an already-serialised trail. */
export const collectionHref = (slug: string, from?: string) =>
  from ? `/collections/${slug}?${ORIGIN_PARAM}=${from}` : `/collections/${slug}`;
