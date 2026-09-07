# Current Feature

Spotlight: a carousel band at the top of the landing page, showing one piece
almost whole beside its label.

Asked for on 2026-09-03, modelled on the hero band at artsy.net -- the piece
displayed nearly entire on the left, its title and an action on the right,
segmented rules beneath marking position.

## Status

**Pass 1 done on 2026-09-03.** The band, the hook, two chevrons, and the
`DESIGN.md` section. No backend change, no new dependency, no new
breakpoint. Driven in a real browser over CDP: hit testing, the tab order,
both themes, and the stacked layout at 420px.

Curation is pass 2 and is deliberately not designed yet.

## Decisions

**The newest five, not a curated set.** `GET /api/pieces` already orders
`created_at DESC, title`, so the spotlight is `allPieces.slice(0, 5)` -- no
migration, no route, no owner surface. Socials went the same way: a
hard-coded array on screen first, a table once the shape was proven. A
freshly uploaded piece is prepended by the landing page, so it enters slot
one without a refetch.

Curation is the known pass 2, and there are two candidates already argued:
a `spotlight` flag on a collection, which inherits arrange mode and the
picker whole, or a nullable `pieces.featured_order`. Neither is chosen.

**Contained, not cropped.** The band shows the piece nearly entire, which
means `object-contain` over the `hatch` ground, exactly as the piece page
treats artwork. Artsy crops to fill; that reads as editorial photography
and beheads a portrait. A tall piece therefore sits centred with hatch
either side, and that is correct -- the alternative, sizing the artwork
panel from each piece's `aspectRatio`, makes the text panel change width on
every advance.

**Full bleed, inner content capped.** The band spans the viewport, the
artwork panel running to the left edge with no gutter, and the grid inside
is capped at 2400px and centred -- the rule the header and footer already
follow. Split is 55/45 in the artwork's favour, the same reasoning that
gives the upload modal's image the larger half: it is the subject.

This is a deviation from "content regions are capped at 2400px" and is
recorded in `DESIGN.md` rather than left to be discovered.

**Outlined accent, not filled.** "View piece" is `ICON_BUTTON_ACCENT`. The
header's "+ Upload" is already the filled action on this page for the
owner, and the rule is at most one per screen. Artsy's own button is
outlined, so nothing is lost.

**No caption over the artwork.** Artsy needs one because its headline is
editorial copy rather than the work's name. The title is already in the
right panel here; an overlay would say it twice.

**Crossfade only.** 200ms on opacity, on the existing hover budget. No
slide and no scale -- there is no horizontal translate anywhere in the
motion table, and inventing one for a carousel is the drift that section
exists to prevent.

**Autoplay at eight seconds, on the owner's call**, against the quieter
instinct. It pauses on hover and on focus within the band, stops for good
on any manual advance, and does not start at all under
`prefers-reduced-motion` -- skipped, not shortened, per the standing rule.

**The pause control is a word, not a glyph.** WCAG 2.2.2 requires a
mechanism to pause anything moving for more than five seconds, and it wants
an explicit one. A pause mark at 16px is two 1.5-unit bars almost touching
-- the same mud that forced the density icons to be the set's one filled
exception. That exception was granted for columns, not extended. `PAUSE` /
`PLAY` at 12px uppercase `0.08em` in `faint` costs no new glyph and no new
rule. It is hidden under reduced motion, where there is nothing to pause.

**Segments are static.** Filling the active rule left to right over eight
seconds would make the timer legible, and it would also put continuous
motion on screen for as long as the page is open. Position, not progress.

**The chevrons wrap; the piece page's do not.** `PieceNav` leaves its ends
open and renders the unavailable side disabled, because a gallery is a
sequence with a first and a last. A spotlight is a loop -- it has to be, or
autoplay would run to the end and stop with no way back short of clicking.
The two rules look contradictory and are not: one is a walk, the other a
cycle.

## Notes

- Slides are `role="region"`, `aria-roledescription="carousel"`. Inactive
  slides take `inert` so their button leaves the tab order. Left and right
  arrows advance when focus is inside. The live region is `off` while
  playing and `polite` once stopped, per the APG pattern.
- The active slide is the LCP element: `fetchpriority="high"`, not lazy.
  The rest take `src` only once adjacent or visited, so five full-size
  renditions do not download on load. `imageUrl`, not `thumbnailUrl` --
  the 600px grid rendition will not hold at this size.
- Load failure reuses the piece card's fallback: hatch behind, the
  `[ artwork ]` monospace label on error.
- Zero pieces renders nothing. One piece renders the piece with no
  chevrons, no segments and no autoplay.
- Landing page only. Collection and filtered routes do not get a band.
- **The stacked slides were the risk, and they held.** Five layers in one
  grid cell is the same shape as the socials bug -- an invisible sheet over
  a live control. `elementFromPoint` at the centre of the "View piece" link,
  every segment and both chevrons returned the intended element, and only
  one of the five links was outside an `[inert]` subtree. `inert` is doing
  the work; `pointer-events-none` is belt and braces for browsers without it.
- **Only two renditions download on load**, confirmed by counting `img`
  elements carrying a `src`. The set of wanted slides grows and never
  shrinks, so stepping back does not refetch.
- **A JSX comment placed before the root element of a `return` is a parse
  error**, not a comment -- it makes the return two children. It belongs
  above the `return`, or inside the element. Cost one broken dev-server
  render mid-session.

## History

- **2026-05-05**: Feature goals initialized based on the 3-phase landing spec.
- **2026-08-25**: Landing page rebuilt against the `new_UI` design system.
- **2026-08-26**: Piece detail view designed and built. Collections schema
  and API implemented; PostgreSQL confirmed as the database.
- **2026-08-26**: Storage adapter, image pipeline, and upload endpoints.
- **2026-08-30**: `pieces.original_filename` dropped. Upload modal built.
  The eleven existing images imported, and the gallery switched off mock
  data onto PostgreSQL and MinIO.
- **2026-08-31**: Waived pieces implemented. Collection creation added,
  from the grid and from a piece.
- **2026-08-31**: Collections view. Two routes, three links made real, and
  the private-collection rules enforced for the first time.
- **2026-08-31**: UI pass -- intro padding and display type reduced, and the
  content cap raised to 2400px with density switched from column counts to
  card widths, so a large monitor gains columns instead of margin.
- **2026-08-31**: Collections edition. Details dialog, arrange mode with
  native drag and drop, cover selection, and delete.
- **2026-09-01**: Piece editing. `PATCH /api/pieces/<id>` and an Edit
  details dialog, closing the gap pinned on 2026-08-30.
- **2026-09-01**: Curating on upload. `collectionIds` on the upload
  endpoint, a picker in the upload dialog, and `CollectionPicker` shared
  between restore, edit and upload.
- **2026-09-01**: Detailed View, pass 1. Deep Zoom pyramids at upload and
  backfilled from the archived originals.
- **2026-09-01**: Detailed View, passes 2 and 3. The OpenSeadragon overlay,
  `?view=1`, the minimap, and the `DESIGN.md` accent rule rewritten.
- **2026-09-02**: Authentication specified. `context/AUTH.md`, and the
  admin-access handoff moved into `context/`.
- **2026-09-02**: Authentication pass 1, the backend. Flask-Login sessions,
  the `set-owner` command, the 410 tombstone, the `includePrivate` leak
  closed, and two new suites -- 257 checks across six.
- **2026-09-02**: Authentication pass 2, the frontend. The session context,
  the footer gesture, the lazy dialog, the tombstone page, `noindex`, and
  `CURRENT_ROLE` and the owner token both deleted.
- **2026-09-02**: The tags placeholder page removed. Tags become a filter
  over the gallery rather than a route of their own.
- **2026-09-02**: Socials, both passes. The dropdown, the `socials` table,
  two routes, twelve platform marks, and a manage dialog.
