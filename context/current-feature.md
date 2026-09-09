# Current Feature

Gallery filter: a control beside the "All work" heading that narrows the
grid by typed text, by year, and by collection.

Asked for on 2026-09-08. The classic content filter, built in small passes.
This pass is the shape of it -- a button, a floating panel, and three
criteria. More criteria follow.

## Status

**Pass 1 in progress.** The button, the row, and the three criteria
below. No backend change and no new dependency: the landing page already
holds every piece and every collection, so this is a filter over rows in
hand.

## What it does

* **A `Filter` button beside the "All work" heading**, in the section header
  row where the density control already sits. It opens a band beneath the
  header and above the grid.
* **Typed text narrows on every field**, not just the title: title,
  description, medium, year, tags, and the names of the collections a piece
  belongs to. Applied as typed, with no apply step.
* **Year is a multi-select dropdown**, a checkbox per year, so several can
  be held at once. Only years actually present are offered.
* **Collections are a multi-select dropdown**, a checkbox each with its
  count. A piece matches if it is in any checked collection.

## Decisions

**Criteria combine with AND, values within a criterion with OR.** Ticking
2021 and 2022 shows both years; ticking 2021 and the Night Calls collection
shows 2021 pieces that are also in Night Calls. This is what a filter is
usually taken to mean, and the alternative -- everything OR'd together --
widens the result as you add criteria, which reads as broken.

**A row in the page, not a panel over it.** Built as a floating
`.menu-panel` under its button first, and changed the same day. The panel
worked; it covered the drawings, and on a gallery the work is the one thing
the interface may not sit on top of. Opening in flow pushes the grid down,
which costs a scroll and nothing else, and the button still hides the whole
thing when it is not wanted.

**So it is a layout reflow, not a surface arriving**, and it takes the
budget the masonry already spends on density changes -- 300ms on
`cubic-bezier(0.2, 0, 0, 1)` -- rather than the dialog's 8px rise. Nothing
is arriving over anything. `grid-template-rows: 0fr -> 1fr` does it, since
height cannot transition from `auto`, with the child as the clipper so the
card inside keeps a margin that gets clipped too.

**Year and Collections are dropdowns, not rows of checkboxes.** Flat lists
made the band taller every year the gallery gains; three compact controls
keep it one line whatever the data does. A native `<select multiple>` was
not an option -- it renders as a permanently open scrolling box rather than
a dropdown, needs ctrl-click for a second value, and cannot be styled to
this set. So the trigger is a button dressed as a field and the menu is real
checkboxes, which is also what a screen reader can read without every state
being maintained by hand.

**A dropdown floating over the grid is fine where the band was not.** The
band covered the drawings for as long as it was open; a menu is small,
transient, and opened deliberately. It takes `.menu-panel`, the same surface
the socials dropdown uses.

**Which cost the band's clip a condition.** `overflow: hidden` is what makes
the collapse look like one, and it would clip a menu opening out of the
band -- the menu would simply not be there. So the clip lifts 300ms after
the row opens, on a discrete transition, and returns in the same frame on
close. Without `allow-discrete` an older browser un-clips immediately and
the content spills for 300ms while the row grows: a cosmetic fault on the
way in, against a dropdown nobody can see.

**Shut, the row is `inert`.** Collapsed content is still focusable and still
hit-tested; `inert` is what takes it out of the tab order without
unmounting. The spotlight's inactive slides had to close the same trap.

**It stays mounted while shut**, so a typed query survives being hidden.
Unmounting would clear the filter every time the row was closed, which is
not what closing a row means.

**Layout goes on a child of `.filter-row`, never on the element itself.**
A `flex` utility on that element beats the `grid` the class needs --
Tailwind emits `@layer utilities` after `@layer components`. The same rule
guards `.menu-panel`, where the failure was an invisible sheet of buttons
over the control beneath it.

**Filtering runs in the browser over the list already fetched**, the same
argument the picker's filter makes: the gallery is small, a round trip per
keystroke would be slower, and the filter keeps working while the API does
not.

**Collection membership costs no request.** `GET /api/collections` carries
`pieceIds` and the landing page already asks for it, so a piece's
collections are a lookup over rows the page is holding. This is what the
spotlight's label already does.

**A separate hook from the picker's `usePieceFilter`.** That one is
title-only with a single year, sitting in a picker's control column. This
one searches every field and holds sets. They are different filters with
different shapes, and folding them together would have meant changing the
picker to serve the gallery. Worth revisiting once this one settles.

**The filter is opt-in.** `AllWorkSection` also draws the collection page
and the reserve; passing `collections` is what turns the control on, so
those two are untouched by this pass.

## Open questions

**Whether the filter belongs in the URL.** Local state for now, which is
less machinery. A query string would make a filtered view shareable and
survive a reload, and the collections work already argued that a set worth
looking at is worth linking to. Deferred rather than decided -- it is a
change of shape, not an addition, so it is cheaper to make once the criteria
have stopped moving.

**Tags are searched but have no control of their own.** Typing a tag name
finds its pieces, which is most of what `STATUS.md` section 10 wanted from
tag filtering. A checkbox list of tags is the obvious next criterion.

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
- **2026-09-07**: Piece page reflowed. Back and prev/next moved into the top
  of the wall label rail, and the artwork's height cap moved from the image
  to the image and its Detailed view button together.
- **2026-09-07**: Year derived from the date made, in both the upload form
  and the edit dialog. `lib/year.ts` holds the rule; `YearField` is shared.
- **2026-09-08**: Agent UI testing rule written down. `AGENTS.md` section 5:
  the owner does the browser testing, an agent stops at the typecheck and
  the build.
