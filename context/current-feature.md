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

**Pass 3 done on 2026-09-06.** The band fills its half with `object-fit:
cover`, aimed by a focal point the owner drags onto each piece in the Edit
details dialog. Twelve new checks.

**Pass 4 done on 2026-09-06.** The five slots are dragged into order in the
curation dialog, reusing the collection arranger's gesture. No backend
change -- `PUT /api/spotlight` already took an ordered list. 49 browser
checks, including a real drag driven through `Input.setInterceptDrags`
rather than a synthesised `DragEvent`.

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

**Contained, not cropped -- superseded in pass 3.** Pass 1 argued that
cropping to fill reads as editorial photography and beheads a portrait. That
was true of a *centred* crop, which is the only kind available without a
focal point; see the cover decision below. What survives the change is the
rejected alternative: sizing the artwork panel from each piece's
`aspectRatio` would make the label change width on every advance.

**Full bleed, inner content capped.** The band spans the viewport, the
artwork panel running to the left edge with no gutter, and the grid inside
is capped at 2400px and centred -- the rule the header and footer already
follow. Split is 66/34 in the artwork's favour -- 55/45 at first, widened on the
owner's call -- the same reasoning that gives the upload modal's image the
larger half: it is the subject.

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

**Cover with a focal point, not contain with a zoom.** Contain left hatch
bars down both sides of every portrait, and raising the zoom did not close
them -- the panel is wider than the work, so the slack is horizontal while
a scale eats the vertical. Measured, 1.14 cost 12.3% of the height, which
is heads and feet, and took nothing off the bars. Cover fills the panel by
definition; the only thing wrong with it was that a centred crop beheads a
portrait, which is exactly what a focal point fixes. The two had to arrive
together.

**The focal point belongs to the piece, not to the spotlight.** It is a
fact about the artwork -- where the face is -- and any surface that crops
can read it. Putting it on the spotlight entry would have made it
unavailable to the picker tiles, and lost it whenever a piece left the
band.

**Two integers, not a cropped rendition.** Baking a hero crop per piece
would mean a pipeline stage, a second copy of every image and a backfill
over the archived originals. `object-position` costs thirty bytes in a
payload the page already fetches, and the browser spends it while drawing
an image it was drawing anyway. This was the explicit ask: no traffic or
compute overhead.

**Null means centre; 50 means centred on purpose.** Nothing reads the
difference today. It costs nothing to keep and cannot be recovered once
every row says 50.

**The gesture is the collection arranger's, not a better one.** A pointer-
capture reorder would animate the rows apart and work under touch, which
native drag and drop does not. It would also be the second way to reorder a
list in one application, and the owner has already learned the first. The
arranger's HTML5 drag, its `text/plain` payload, its lifted-row opacity and
its accent drop outline came over unchanged; only the axis differs, so the
keys are up and down instead of left and right. If this gesture is ever
worth replacing, both surfaces should be replaced together.

**Only the picks are draggable.** A filler's place is `created_at DESC`.
Letting one be dragged would have to mean either promoting it to a pick --
two actions wearing one gesture -- or storing a slot with holes in it, which
`spotlight_order` cannot express: it is a contiguous index, and picks first
is what lets an empty spotlight mean the newest five with nothing stored
behind it. So fillers stay listed, numbered and inert.

**Below two picks the whole affordance goes.** One pick has nothing to be
ordered against, so the grips, the grab cursor, `draggable`, the tab stop
and the instruction line all disappear together rather than sitting there
dead. A control that is present and does nothing is worse than one that is
absent.

**No backend change.** `PUT /api/spotlight` has always taken the whole
ordered list and rewritten the indices in one transaction, and reordering
the same five ids is a case its suite already covered. Dragging changes the
array the Save button was already sending.

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
- **Drag was verified as a real drag**, not a synthesised `DragEvent`.
  `Input.setInterceptDrags` plus `Input.dispatchDragEvent` puts the
  browser's own drag pipeline in the loop, which is the part that could
  fail inside a `<dialog>`; dispatching a `DragEvent` from page script
  would only have re-tested React's handlers.
- **Focus survives the reorder** on its own. React moves the same DOM node
  because the row is keyed by piece id, and the browser keeps focus on it,
  so no refocus is needed after an arrow press. Measured rather than
  assumed -- moving a focused node is not obviously focus-preserving.
- **`ArrowUp`/`ArrowDown` must call `preventDefault`** even when the move
  is refused at the ends, or the press scrolls the control column instead.
- **Frontend source is LF; the markdown in `context/` and `STATUS.md` is
  CRLF.** There is no `.gitattributes`. `grep -c $''` reports a match on
  every line of an LF file under MSYS, so it cannot be used to tell them
  apart; reading the bytes in Python is what settles it.
- **The focal picker uses pointer capture**, so the mark keeps tracking
  once the pointer leaves the frame and touch and mouse are one path.
  `touch-none` is not optional with it -- without it a drag scrolls the
  dialog instead of moving the point.
- **A near-miss worth recording.** The band appeared to ignore a saved
  focal point: slide one still rendered `50% 50%`. It was correct. Two
  pieces share the title *Night Calls IX*, the spotlight had been curated
  by hand, and slide one was the other one -- which has no focal point.
  Comparing by id rather than by title is what settled it.
- **`tests/smoke_uploads.py` deletes `pid` partway through**, so anything
  appended to that suite needs its own upload rather than reusing it.
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
