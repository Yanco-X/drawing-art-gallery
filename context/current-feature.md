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

**Pass 5 done on 2026-09-06.** `pieces.focal_zoom`: how much of a piece the
band shows, not only which part of it. 15 new API checks and 37 in a
browser.

**Pass 6 done on 2026-09-07.** The zoom became a multiple of fit rather than
of fill, because the band and the picker were framing the same piece
differently. One migration converts the values in place.

**Pass 7 done on 2026-09-07.** The band goes back to 50/50, which brings its
frame within a whisker of the picker's preview, and the label half -- now
wider than its content -- names the collections the piece is in.

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
follow. Split is 50/50 -- 55/45 at first, widened to 66/34 on the owner's call, and
back again in pass 7 once it was clear that a wider panel is a wider frame,
and a wide frame beside a tall portrait is more empty ground rather than
less.

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

**A fixed crop was the other half of the problem.** The focal point chose
which part of a piece survives; it could not choose how much. `cover` picks
the smallest scale that fills the frame, and for a tall portrait in a wide
slot that scale throws most of the drawing away -- the focal point was only
picking which part of the loss to keep. Most of this gallery is tall
portraits, so this was the common case, not the corner.

**A scale over `cover` does not work, and looked like it did.** The first
attempt was `transform: scale()` over the existing `object-fit: cover`. It
is wrong: `object-fit` crops at layout time and a transform only scales
what came out, so scaling below 1 draws the same crop smaller rather than
revealing more. On real artwork the difference is invisible -- a smaller
copy of a crop reads as "more of the piece" to the eye, and it fooled me
into shipping a demo that claimed the feature worked. A test image of
sixteen numbered bands settled it in one screenshot: the same bands at
every scale. Synthetic fixtures beat real content for questions of fact.

**So the zoom is spent over `contain`.** `contain` starts with the whole
piece in frame, so a scale has something to give back. This survives pass 6
unchanged; what did not is the unit the scale was expressed in.

**A percentage of fill -- superseded in pass 6.** Pass 5 anchored the stored
number to `fillRatio`, where `contain` and `cover` coincide, so that 100
rendered exactly what the band drew before the column existed. That reads
well and is wrong: `fillRatio` depends on the frame's aspect ratio, so one
number framed a piece differently in every window and in the picker. See
the pass 6 decisions below. It is now a multiple of fit.

**Null still means `cover`, with no arithmetic at all.** Every piece the
owner has never sized takes the old path: no measurement, no transform, an
exact fill guaranteed at every breakpoint. That keeps the arithmetic off
the landing page's first paint, where the band is the LCP element.

**The frame had to be measured -- and then did not.** While the zoom was a
percentage of fill, the band needed its own aspect ratio to know where
`cover` and `contain` met, and pure CSS cannot express it: `max()` across
two axes is not available, and the `min-width` plus `aspect-ratio` trick
that looks like it should work distorts the box instead -- tested, 165x110
where 165x660 was wanted. So `useFrameAspect` put a `ResizeObserver` on the
panel. Pass 6 removed the question and the hook with it. Recorded because
the CSS finding stands whatever the unit: there is no way to size a box to
"cover, times a factor" without knowing the frame.

**A multiple, not a crop rectangle.** Four numbers would describe the crop
exactly at one viewport and wrongly at every other. A point and a multiple
mean the same thing at any size -- provided the multiple is of something
that does not itself depend on the viewport, which took pass 6 to get right.

**Fill belongs to the frame, so a percentage of it is not portable.** The
owner reported that the picker's preview showed more of a piece than the
band did. It was not a rounding difference: measured on one window at
1906x885 the band's panel was 1.96:1 while the preview is 1.50:1, and
`fillRatio` -- the scale that turns `contain` into `cover` -- is
`max(pa/ia, ia/pa)`, so it came out 2.82 against 2.16. The same stored 86
rendered 41.3% of the piece's height in the band and 53.9% in the preview.

Fixing only the preview's constant would have made the two agree on the
owner's window and nowhere else, since the band's frame changes shape with
every window: its height is a `clamp()` and its width a share of the page.
Every visitor would have seen a different crop of the same piece.

**Anchoring to fit takes the frame out of the arithmetic.** `contain` fits
the whole piece whatever the shape, so a scale over it means the same amount
of artwork everywhere. `framePiece` no longer takes a frame at all: the
scale is the stored number over 100. Verified across four shapes -- 1.96,
1.45, 1.00 and the preview's 1.50 -- all rendering 54.1% of the piece.

**Which invariant to hold was the real choice.** Something has to vary when
the frame does. A percentage of fill held the horizontal constant and let
the vertical drift; a multiple of fit does the reverse. This gallery is
mostly tall portraits, where the height is where the faces are and the
width is where the hatch is. Losing a face is worse than a wider strip of
empty ground, so the vertical is the one to pin.

**The measurement went away with it.** `useFrameAspect` existed only to find
where cover and contain met for the band's particular shape. Nothing asks
that question any more, so the hook and its `ResizeObserver` are gone -- the
band's LCP path is back to reading a stored number and nothing else.

**Existing values were converted, not reset.** One data migration multiplies
each stored zoom by the fill ratio for the picker's 3:2 preview, which is
the shape the owner was judging against when they chose the number. The one
sized piece went 86 to 185, and the preview still shows it exactly as it
did. A reset would have been easier and would have thrown away a decision
the owner had already made.

**100 became a floor rather than a middle.** Under the old unit 100 meant
"fills" and both directions were useful. Under the new one 100 is the whole
piece and there is nothing below it worth having -- a piece smaller than the
frame in both directions only shrinks into the hatch. So the range is
100-500 rather than 40-250.

**A wider panel is a wider frame, which is the opposite of what 66/34 was
for.** The split was widened in the tuning pass to give the artwork more
room, on the reasoning that the artwork is the subject. For a tall portrait
that is backwards: the panel's height is fixed by the band, so widening it
only adds ground beside the piece. Measured at 1906x885 the 66/34 panel was
1.96:1 against the picker's 1.50:1, and the piece sat in a strip with 52% of
the frame's width as hatch. At 50/50 the panel is 1.485:1 -- 946x637 against
the preview's 416x277 -- and the hatch matches the preview to within a point
and a half.

Pass 6 had already made the *amount* of artwork identical everywhere. This
is about the ground around it, which is the part a fixed-shape preview
cannot promise. It does not make the promise exact at every window; it makes
the common window the one the preview is drawn for.

**The label half was already too big for its label.** Title, year, a
three-line description and one button do not fill half a band, and the gap
was more obvious once the half grew. Collections are the one thing a visitor
looking at a piece plausibly wants next that the page does not otherwise
offer -- the piece page has them, the band did not.

**Membership rides on a request the page already makes.** `pieceIds` on the
collection summary, not `collectionIds` on the piece. Both would have worked
and cost about the same in bytes, but `Collection.piece_links` is already
`lazy="selectin"` and `GET /api/collections` eager-loads it besides, so those
ids are in memory already -- `piece_count` is their length. Putting it on the
piece would have meant touching `piece_to_dict`, which every list shares, and
`Piece.collection_links` is lazy there: exactly the query-per-row the
detail-shape docstring warns about.

**A draft stays a draft with no new rule.** `GET /api/collections` already
drops private collections for a visitor, so their ids never reach the band
and there is nothing for it to filter. The visibility decision stays in the
one place that was already making it.

**`CollectionGrid`, not a bespoke row.** The first attempt was a column of
small covers built for the band. It worked and was wrong: a collection
already has a look, drawn by `CollectionCard` on the landing row and the
index, and a second one would be a thing to keep in sync by hand -- it had
already drifted to a different cover size, no Private marker, and the count
as a bare number. Reusing the grid also settles the layout: a 260px column
makes its `auto-fill` resolve to one track, so the row becomes a column
with no second component.

**Beside the wall label, not under it, and the axis flips exactly once.**
The half is wider than a title and three lines need. Two columns need room
though: a fixed 260px column at 1024px left the label 110px and broke the
title over two lines, so the row only arrives at `2xl` and below it the two
stack at natural height.

**Both columns are bounded, and for opposite reasons.** The collections
column is a share of the half -- 40%, floored at 220px and capped at 340 --
because a fixed width takes the same bite out of a 576px label as out of a
1072px one. The wall label is capped at a 26rem measure because, left to
grow, it pushed the collections against the far gutter with a field of
nothing between them; the owner's word for it was "isolated".

**The cap is conditional and the row packs from the start.** Capping the
label unconditionally shrank it on every slide, and centring the pair made
the title step sideways as the band advanced from a piece in three
collections to a piece in none. A carousel that moves its own title while
crossfading reads as a bug, so the title begins at the same x on every
slide and the slack falls after the pair.

**Flexbox cannot cap a column; only the height can.** `align-items:
stretch` grows a line to fill but never shrinks it below its content, so a
wrapping row left the scroller unbounded -- measured, twelve collections at
2492px spilling out of a 637px band. The label taking the artwork's height
at `2xl` is what gives the column something definite to be capped against,
which is why the height and the row arrive together: a fixed height under a
stacked layout would cap nothing and spill over the intro instead.

**Nothing at all when empty.** A piece in no collection renders no heading
and no rule. Most pieces are in nothing, and an empty state would be five
slides of apology.

**It did not make the band taller.** Stacked slides take the height of the
longest label, so a block added to one slide could have grown the whole
band and changed the artwork panel's shape -- the thing pass 6 and 7 were
about. Measured: the label is 637 against the band's 692, unchanged.

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
- **The preview and the band are checked against each other**, not each
  against its own arithmetic. `check-agree.mjs` derives the share of the
  piece in frame from the rendered CSS -- fit, scale, natural size, frame
  size -- so it cannot agree with a bug by sharing it. It reads the band at
  three window shapes and the picker at a fourth, and fails if they differ
  by more than half a percent.
- **A test that asserts "an unsized piece" ages badly.** Two checks broke
  when the owner set a zoom on the piece holding slot 0. They now read what
  is stored and assert the rendering matches it, which is what they meant.
- **The collections block is checked against the API, not against itself.**
  `check-collections.mjs` recomputes the expected names from
  `/api/pieces` and `/api/collections` and compares them with the rendered
  links, for all five slots, as a visitor and as the owner.
- **It also counts requests.** The claim is that naming collections costs
  nothing, so the check asserts `/api/collections` is fetched exactly as
  often as `/api/pieces` and that no piece is fetched individually.
  Counted as a ratio rather than against 1, because the dev server mounts
  twice under StrictMode -- and snapshotted before the probe does any
  fetching of its own, which was the first version's mistake.
- **The band's slide 0 is not `pieces[0]`.** The list is newest-first; the
  band shows the curated order. A test that wrote to `d[0]` and then read
  the band was measuring two different pieces. Logging the `alt` is what
  caught it -- the second time this exact confusion has cost a debugging
  round, after the two pieces sharing a title in pass 3.
- **`getBoundingClientRect` is the post-transform box.** Comparing a
  computed `transform-origin` against it measures a scaled element against
  its own scale. `offsetWidth` / `offsetHeight` are the layout box.
- **`getComputedStyle` resolves `transform-origin` to pixels** but leaves
  `object-position` in percent, so the two can only be compared through the
  element's size.
- **Escaping through a heredoc ate a `
` again**, turning a Python string
  literal into a syntax error. Payloads with escapes go in a file written
  by the editor tool, never inline in a shell command.
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
- **`PieceTile` tiles follow each piece's own ratio, not the `aspect-[4/3]`
  the box sets.** The box is a flex item, so `min-height: auto` floors it at
  the image's intrinsic height and outranks the aspect ratio, which computes
  correctly and loses. Measured at 144px wide: 144x201, 144x144, 144x240,
  against the 144x108 a 4:3 box would give. Raised with the owner and
  **settled 2026-09-07** as the look to keep -- the gallery has no landscape
  work, so cropping to 4:3 cost every piece and bought nothing the picker
  needed. See `DESIGN.md`, "Picking pieces". The class is inert; nothing
  depends on it.

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
