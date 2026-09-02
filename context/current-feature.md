# Current Feature

Choosing a piece's collections while uploading it.

Asked for on 2026-09-01: "when uploading a new piece, I could be able to
also decide there to which collections can I add that piece, so not only to
add it only when the piece already exists but also during the upload".

## Status

Done. The upload form offers the collections the new work should join, and
they are joined by the same request that creates it.

Next feature is tags that do something -- see `STATUS.md` §10.

## Goals -- done 2026-09-01

- **`POST /api/pieces` takes repeated `collectionIds` form fields**, joined
  inside the transaction that writes the row.
- **A collection picker in the upload dialog**, under the drop zone, listing
  drafts as well as published collections.
- **`CollectionPicker` extracted** from `PieceOwnerActions`, which had it
  private while three flows now need it.
- The POST response moved to the detail shape, so it carries `collections`.

## Decisions

**One request, not two.** The obvious shortcut was to upload, then `PUT
/api/pieces/<id>/collections` with what was ticked. Two writes means a piece
can land in the gallery having silently missed its collections, with nothing
in the response saying so -- and the owner would find out by noticing an
absence, which is the hardest kind of bug to notice. Restore already made
this call for the same reason and left `_join_collections` and
`_load_collections` behind, so upload reuses them rather than inventing a
second membership path.

**A refused id fails the whole upload.** The join sits inside the existing
try block, so an unknown or malformed collection id rolls the row back and
deletes the objects already written for it. The alternative -- store the
piece and ignore the bad id -- would quietly discard something the owner
asked for.

**Drafts are offered.** Uploading is an owner act, and gathering new work is
most of what a private collection is for. Excluding them would have made the
picker useless for the case it is most useful in.

**Pieces append, they do not insert.** `_append_to` puts the piece at the
end of each collection, which is what it already does on restore and on the
piece page. Ordering is what arrange mode is for.

**No "start a new one" field here**, unlike the piece page's Collections
dialog. That field creates the collection before the piece exists; if the
upload then failed -- a bad file, a dropped connection -- an empty
collection would be left behind with nothing to say why. The picker offers
what exists, and the Collections page makes new ones.

**The submit button names the count**, the way Restore does: "Add to gallery
and 2 collections". Ticks sitting further up a scrolled form are not
confirmation.

**An error and an empty gallery are different answers.** If the collection
fetch fails the picker says so rather than showing "No collections yet",
which would be a lie about an unreachable API.

## Notes

- **Run it**: see `STATUS.md` §2.
- **Verified**: 183 checks across four suites -- uploads went 51 to 64. The
  new block covers an upload with no `collectionIds`, an upload into a
  public and a private collection at once, the piece landing at the end
  rather than the front, and three refusals -- unknown id, malformed id,
  the same id twice -- each asserting that nothing was stored and no row
  was created. `integration_live.py` was re-run against the real stack after
  the response-shape change; the gallery is untouched at 14 rows.
- **Still open elsewhere**: tags inert, no auth, waived derivatives remain
  fetchable by URL.

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
