# Current Feature

Collections that can be opened and edited. Both passes are done.

Full specification in [`COLLECTIONS.md`](COLLECTIONS.md).

## Status

Done. A collection has a page and an index, real links from everywhere it is
named, correct private-draft gating, and a full owner edit surface.

Next feature is editing a piece -- see `STATUS.md` §10.

## Goals

### Pass 1: Viewing -- done 2026-08-31

- `/collections/:slug` -- `CollectionPage`, a wall label for the set then
  its pieces in `display_order`, through the shared `AllWorkSection`.
- `/collections` -- `CollectionsIndexPage`, every collection the caller may
  see.
- `CollectionCard`, "View all" and the wall label's "In collections" names
  stopped being `InertLink`.
- `Header`'s Collections item points at the route instead of an anchor.
- Private collections: 404 on the detail route for a visitor, visible to
  the owner in the list, on the index, and on a piece's page. Marked with a
  `Private` eyebrow so the owner can tell a draft from a published set.
- `CollectionGrid` extracted so the landing row and the index cannot drift.
  `PageMessage` extracted for not-found and unavailable.

### Pass 2: Edition -- done 2026-08-31

- **Edit details** -- name, description, visibility in one dialog, one
  `PATCH`. `slug` is never sent, so a rename keeps the URL.
- **Arrange mode** -- order, membership and cover in one mode and one
  `PUT`. Drag or arrow keys to reorder, `x` to remove, a thumbnail dialog to
  add, a pill to pick the cover. Nothing is written until Save.
- **Delete** -- `ConfirmDialog` at danger tone, stating that the pieces
  survive and only the grouping goes.
- `coverPieceId` added to the collection payload. `coverImageUrl` alone
  could not tell the arrange grid which piece was the cover without parsing
  an id back out of a URL, and a null id with a non-null URL is the honest
  way to say "no cover chosen, showing the first member".
- `PieceOwnerActions` no longer hardcodes `isPublic: true`, closing the last
  inconsistency between creating a collection from the grid and from a piece.
- `PieceTile` added for handling pieces rather than looking at them, and
  `form-styles.ts` so new dialogs share one form vocabulary.

## Notes

- **Run it**: see `STATUS.md` §2.
- **Verified**: 154 checks across four suites, plus by-hand runs against the
  live stack with `__gating_fixture__` and `__pass2_fixture__` collections,
  each deleted by exact id. The gallery was confirmed untouched afterwards.
- **Arrange uses a plain grid, not the masonry.** The masonry fills
  top-to-bottom down each column, which is unreadable when the sequence is
  what you are editing. The display grid still reads down columns -- the one
  loose thread, and the reason to revisit the masonry if curated order ever
  needs to read across rows.
- **Still open elsewhere**: no `PATCH /api/pieces/<id>`, tags inert, no auth.

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
