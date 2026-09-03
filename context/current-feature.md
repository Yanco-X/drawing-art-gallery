# Current Feature

Socials: a menu of where the artist can be found, curated by the owner.

Asked for on 2026-09-02: a SOCIALS dropdown in the header, each option
carrying the platform's icon and a redirect icon, with the owner able to add
and edit the links.

## Status

**Done, in two passes on 2026-09-02.** Pass 1 put the dropdown on screen
against a hard-coded array. Pass 2 replaced it with a `socials` table, two
routes, and a manage dialog -- 287 checks across seven suites, and the
dialog driven in a real browser over CDP.

Next feature is tags as a filter over the gallery -- see `STATUS.md`
section 10. The header still scrolls sideways between 640 and ~860px for
the owner; deferred on the owner's call.

## Decisions

**Two routes, not five.** `GET /api/socials` and `PUT /api/socials`. The
dialog edits a list and saves it once, so the API takes a list and writes it
once. Reordering comes free, a half-finished edit cannot half-apply, and
rows are matched by id so an edit keeps its row.

**No visibility flag.** A link the owner is not ready to share is simply not
added, and deleting one is a click. A flag would have bought a second
visitor rule to write down and test for a case that has never come up.

**Marks are code, not data.** The table stores a key; the drawing lives in
`components/platform-icons.tsx`. An uploaded SVG would mean accepting a
format that can carry script, then sanitising, storing and serving it, to
avoid a one-line addition to that file. An unknown platform gets a generic
link mark and still works.

**One registry, three jobs.** The same list gives the menu its mark, the
dialog its picker, and a pasted url its platform. Keeping them together is
what stops the picker offering something the menu cannot draw.

**Platform marks live apart from `icons.tsx`.** They copy someone else's
shape and keep rounded corners the house set forbids. Separate file,
separate rule, stated once.

## Notes

- **Run it**: see `STATUS.md` section 2. New migration `e5b71c94f0a2`.
- **A `javascript:` url was accepted at first.** The check tested for `://`
  before prepending `https://`, so `javascript:alert(1)` was rewritten into a
  valid https url with an odd host. Found by the suite, not by review.
- **The pass-1 Instagram link was carried into the database** so nothing was
  lost when the hard-coded array was deleted.
- **Some marks are impressionistic at 16px**, DeviantArt most of all. Each is
  one path string; a better drawing is a one-line swap.
- **`+ Add` was dead, and the browser check had said it worked.** The
  platform picker's panel carried Tailwind's `grid` alongside `.menu-panel`;
  utilities cascade after components, so `display: grid` beat
  `display: none` and left an invisible 176x134 sheet of buttons over the
  Add button. The check missed it because it called `.click()` on the
  element, which bypasses hit testing entirely -- a real mouse event at the
  button's coordinates landed on the panel instead. Verify clickability with
  `elementFromPoint` or a dispatched mouse event, not with `.click()`.

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
