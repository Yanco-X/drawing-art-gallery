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

**Pass 2 done on 2026-09-06.** Curation: `pieces.spotlight_order`, one
route, a gear in the control row, and a lazy dialog reusing the collection
picker. 35 new checks, and the whole loop -- pick, save, reload -- driven in
a real browser as the owner.

## Decisions

**The newest five stay the default, and the default is stored nowhere.**
Nothing picked means no rows carry a slot, which is exactly the state the
feature shipped in. An empty `PUT` is the way back to it.

**Hand-picked first, then filled from the newest unpicked.** The owner picks
up to five; whatever is short is made up from the top of `GET /api/pieces`,
which is already newest-first. So the fill rule is a slice, not a query.

**One route, and no GET.** `spotlightOrder` rides along on every piece in the
pieces payload, so the band works out its own five from the list the landing
page already fetches. A `GET /api/spotlight` would have spent the one
property pass 1 was built around -- that the band costs no request.

**A column, not a join table.** `pieces.spotlight_order`, nullable. The
spotlight is at most five rows and carries nothing of its own; a table would
be an id and a foreign key to say what one integer says. Not unique, because
`PUT` rewrites the list in one transaction and a unique index would make an
ordinary reorder collide with itself partway through.

**Waiving clears the slot.** The alternative -- keeping it so a restore puts
the piece back where it was -- means the dialog shows four picks while five
are stored, because the picker only lists exhibited work. An invisible slot
that cannot be seen or cleared is worse than re-picking after a restore.
This is the rule waive already follows for collection membership, one step
louder because the spotlight is the most prominent part of the gallery.

**The dialog shows the filled slots, not just the picks.** Filling is the
feature. A rule you can only verify by closing the dialog and looking at the
page is a rule that will be reported as a bug.

**The sixth pick is refused rather than swapping out the first.** Quietly
evicting something the owner chose is worse than declining to add one more.

**Pass 1 shipped with no curation at all**, deliberately: `GET /api/pieces`
already orders `created_at DESC, title`, so the band was `slice(0, 5)` and
cost no migration, no route and no owner surface. Socials went the same way
-- a hard-coded array on screen first, a table once the shape was proven.
Pass 2 kept every line of that as the default and added picking on top of
it, which is why the empty case still stores nothing.

The two candidates weighed for pass 2 were a `spotlight` flag on a
collection, which would have inherited arrange mode and the picker whole,
and a nullable column on the piece. The column won: a collection carries a
name, a slug, a description and a visibility rule, none of which the
spotlight has any use for, and one marked collection would have shown up in
the collections grid needing to be hidden.

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
- **A `<dialog>` rendered inside the band was a real bug, caught by
  reasoning rather than by clicking.** The top layer paints it out of flow,
  but it is still a DOM descendant, so its events bubble into the band's
  handlers -- an arrow key in the dialog's search field advanced the
  carousel behind it. It is a sibling now.
- **Hover cannot pause a band behind a modal.** Opening the dialog moves the
  pointer off the section, firing the mouse-leave that releases the hold.
  The hook takes a separate `suspended` flag for the case where something
  covers the band entirely.
- **The owner UI cannot be driven headlessly without the local marker.**
  `SessionProvider` only calls `/api/session/me` when `sketchyart-owner` is
  in localStorage -- a visitor makes no auth request at all. Setting the
  marker plus an `X-Owner-Token` header over CDP is how a headless session
  becomes the owner; the token alone does nothing, because the app never
  asks.
- **`PieceTile` does not crop to 4:3, and never has.** `DESIGN.md` says the
  picker tiles are uniform; measured, they come out 155x155, 155x257,
  155x205. `aspect-[4/3]` is set and computed, but the tile is a flex item
  whose `h-full` image resolves against an indefinite height and falls back
  to its intrinsic size. Pre-existing -- the "New collection" picker
  measures identically -- so it is recorded here rather than fixed inside
  this feature. See `STATUS.md` §11.

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
