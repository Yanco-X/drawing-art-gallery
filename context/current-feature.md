# Current Feature

Editing a piece after upload.

Specified in `STATUS.md` §10 as it stood on 2026-09-01, built from there,
and now recorded here.

## Status

Done. A piece's wall label can be corrected without re-uploading it.

Next feature is tags that do something -- see `STATUS.md` §10.

## Goals -- done 2026-09-01

- **`PATCH /api/pieces/<id>` `[owner]`** taking `title`, `description`,
  `medium`, `year`, `createdDate` and `tags`. Only keys present in the body
  are touched, so a partial write cannot blank the rest; null or an empty
  string does clear an optional field, because that is an edit rather than
  an omission.
- **An Edit details dialog** on the piece page, in `PieceOwnerActions`
  beside Collections and Waive.
- `_parse_year` and `_parse_created_date` pulled out of `create_piece` and
  shared with the new route, so upload and edit cannot disagree about what
  counts as a year.
- `TagInput` extracted from `UploadModal` and used by both forms.

## Decisions

**Tags are editable.** The owner's framing was "those details I enter when
uploading a piece", and tags are one of them. The earlier recommendation was
to leave them out until they do something; overruled, and reasonably -- a
control that is already offered at upload should not disappear at edit.
It does mean tag curation still has no consequence, which is why the next
feature is tags.

**The image is not replaceable.** Swapping the bytes behind an id means
re-deriving both renditions and invalidating every URL already handed out.
Correcting a label is a different act from replacing the artwork.

**A waived piece can be edited.** Correcting a label has nothing to do with
whether the work is on the wall, and the reserve is exactly where something
would be tidied up before going back.

**The year is sent as the raw input string.** `Number('soon')` is NaN and
`JSON.stringify` turns NaN into null, so a typed number would have silently
erased a mistyped year instead of refusing it. The API parses and rejects.

**A piece has no slug**, so unlike a collection there is no rule needed to
protect its address across a rename. `STATUS.md` §3 listed one; it was
wrong, along with `width_px`, `height_px`, `content_type` and `file_size`,
none of which exist. Corrected against the live schema.

## Notes

- **Run it**: see `STATUS.md` §2.
- **Verified**: 170 checks across four suites -- uploads went 35 to 51.
  Exercised live with an uploaded `__edit_fixture__` piece: partial edits
  left other fields alone, null and empty string cleared, tags replaced
  wholesale, and a mistyped year was refused rather than silently cleared.
  The fixture was waived and deleted, and the two tag rows it minted were
  removed. The gallery was confirmed untouched.
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
