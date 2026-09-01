# Current Feature

Collections that can be opened, and eventually edited.

Full specification in [`COLLECTIONS.md`](COLLECTIONS.md).

## Status

Pass 1 -- viewing -- is done. A collection has a page, an index, and real
links from everywhere it is named. Private collections are gated correctly
in all four places they could appear.

Pass 2 -- edition -- is specified in outline and not started.

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

### Pass 2: Edition -- not started

Owner controls inline on the collection page, not behind an edit mode.
Rename, description, publish/unpublish, cover, delete. Reordering by drag
and drop, on native HTML5 drag events with a keyboard fallback -- no new
dependency without the owner's approval.

Two things it must settle: add and remove need affordances of their own
since the page only shows pieces already in the collection, and
`PieceOwnerActions` hardcodes `isPublic: true`, so creating a collection
from a piece offers no visibility choice while the grid path does.

## Notes

- **Run it**: see `STATUS.md` §2.
- **Verified**: 151 checks across four suites, plus a live gating check with
  a `__gating_fixture__` collection, deleted by exact id afterwards. The
  gallery was confirmed untouched -- 11 pieces, *Testing* intact.
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
