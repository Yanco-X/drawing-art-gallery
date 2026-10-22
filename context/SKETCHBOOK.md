# Sketchbook

The public section for unfinished work -- doodles, sketches, drafts -- kept
off the gallery wall and still open to every visitor. Specified and built
2026-10-22.

---

## 1. The word

**Sketchbook.** One word for doodles, sketches and drafts alike: it is where
an artist keeps all three, and what a visitor expects to leaf through rather
than study. Considered and passed over: *Studies* (preparatory work, too
formal for a doodle), *Roughs* (trade jargon), *Scraps* and *Scribbles*
(apologetic), *Margins* (needs explaining).

The code says **sketchbook** throughout: `in_sketchbook`, `inSketchbook`,
`?sketchbook=true`, `/sketchbook`, `SketchbookPage`. The main wall stays
**the gallery**, as it already is in code: `GALLERY_ORDER`, curated order,
`/home`.

## 2. The states

Two independent properties of a piece:

| | Not waived | Waived |
|---|---|---|
| `in_sketchbook = false` | The gallery | Waived |
| `in_sketchbook = true` | The sketchbook | Waived |

- **Waiving works on either.** The reserve stays one list. Restoring returns
  a piece to whichever section its flag names, with no code for it: the flag
  never changed.
- **Moving between the gallery and the sketchbook is an edit, not a
  lifecycle step.** It is reversible and destroys nothing, so it rides on the
  existing `PATCH` rather than earning a route of its own as waive and
  restore did.

What each section keeps:

| | Gallery | Sketchbook |
|---|---|---|
| `curated_order` | Yes | Cleared on entry, never set |
| `spotlight_order` | Yes | Cleared on entry, refused |
| `about_order` | Yes | Yes, kept |
| Collections | Yes | Yes, kept |
| Focal point, tags, tiles, detailed view, visit counts | Yes | Yes |

Sketches may sit in collections beside finished pieces -- an artist showing
the studies for a work is ordinary -- and on the about page.

## 3. Schema

`pieces.in_sketchbook BOOLEAN NOT NULL DEFAULT false`, with a server default
so every existing row lands in the gallery. One migration, on top of
`c7d2e5a9f318`. No index: the filter runs over a couple of hundred rows.

Storage is untouched. A sketch goes through the same pipeline as a piece --
original, display, thumb, tile pyramid -- and costs the same, roughly 1.6
times its original.

## 4. Visibility

The sketchbook is public, so the visitor contract (`AUTH.md` section 1) does
not change. `inSketchbook` is a field the contract allows; nothing new is
hidden from anyone.

The one rule to hold: **the sketchbook list never returns a waived piece**,
exactly as the gallery list does not. `tests/smoke_visitor.py` gets a case
for it.

## 5. API

### `GET /api/pieces`

| Query | Returns | Order |
|---|---|---|
| none | The gallery: not waived, not in the sketchbook | `GALLERY_ORDER`, unchanged |
| `?sketchbook=true` | The sketchbook: not waived, in the sketchbook | `created_at` descending, then title |
| `?waived=true` (owner) | Every waived piece, from either section | `waived_at` descending, unchanged |

`waived=true` wins when both are sent. The default list keeps meaning the
gallery, so every caller that wants the gallery -- curation, the spotlight,
the random piece -- needs no change.

### `GET /api/pieces/<id>`

Unchanged. The payload gains `inSketchbook`.

### `POST /api/pieces`

An optional `inSketchbook` form field, `true` or `false`; anything else is a
400. A sketchbook upload takes no `position`, and sending one is a 400: it
would number a gallery the piece is not in. `_hang_at` numbers gallery
pieces only.

### `PATCH /api/pieces/<id>`

`inSketchbook`, a JSON boolean; anything else is a 400.

- **Into the sketchbook:** `curated_order` and `spotlight_order` cleared.
  `about_order` and collection membership kept.
- **Into the gallery:** arrives with `curated_order` null, waiting at the top
  of the gallery for a place, as a new upload or a restored piece does.
- **Unchanged value:** nothing happens.
- Allowed on a waived piece, where it decides where a restore lands. The UI
  only offers it on exhibited pieces.

### Elsewhere

- `PUT /api/spotlight` refuses a sketchbook piece with a 409, as it refuses a
  waived one.
- `PUT /api/curation/pieces`: the gallery it counts is `IN_GALLERY` pieces
  only, and a sketchbook id is refused with a 409 of its own. It needs one:
  the count only bounds the list's length, so without the check a sketch id
  would quietly be given a place.
- About, collections and visits: no change.

## 6. Frontend

### The page

`/sketchbook` renders `pages/SketchbookPage.tsx`: public, shaped like
`WaivedPage` -- eyebrow, a heading, one line of introduction -- over a
sortable `AllWorkSection`. Filter, sort, density and list memory all come
with it. The first order is the server's, newest first; the sort control
offers year, title and added, as the gallery's does.

An upload made on this page lands in its grid without a refresh, as the
landing page does for the gallery.

### Header

A public **Sketchbook** link between Collections and Yanco, active on
`/sketchbook`. A piece page keeps highlighting Gallery whatever the piece is:
the header does not know, and teaching it is not worth a fetch.

### Services and types

- `fetchSketchbook()`: `?sketchbook=true`.
- `fetchPublicPieces()`: the gallery and the sketchbook together, for the
  pickers that offer both.
- `inSketchbook` on `Piece`, `PiecePatch` and `NewPiece`.

### The piece page

- **Neighbours.** The piece's section picks the list it walks: waived,
  sketchbook or gallery -- `fetchWaivedPieces`, `fetchSketchbook`,
  `fetchPieces`. A collection trail still wins, so a sketch opened in a
  collection walks the collection.
- **Back link,** first match: the collection in the trail, the about page,
  Waived, **← Sketchbook**, then ← All work.
- **Tag shelf.** Shows the neighbours carrying the tag, so a sketch's shelf
  holds sketches. Its "see all" narrows the sketchbook instead of the
  gallery: the list key `TagShelf` hands to `narrowToTag` becomes a prop.
- **Wall label.** A "Sketchbook" eyebrow, where a waived piece shows
  "Waived".

### Owner actions

- **Move to sketchbook** and **Move to the gallery** on the piece page,
  through `ConfirmDialog`. The copy says what moves with it: leaving the
  gallery gives up the spotlight and the piece's place in the gallery order;
  its collections and its place on the about page stay. Coming back, it
  waits at the top of the Curate page.
- The waive dialog says "leaves the sketchbook" for a sketch.

### Upload

A **Goes to** choice: Gallery or Sketchbook. Sketchbook hides "Position in
the gallery", the submit button reads "Add to sketchbook", and the success
prompt says the piece is in the sketchbook. The landing page ignores a
sketchbook upload; the sketchbook page takes it.

### Pickers

| Picker | Offers |
|---|---|
| Spotlight (`PiecePicksDialog`) | Gallery |
| About picks (`PiecePicksDialog`) | Gallery and sketchbook |
| Add work, new collection (`AddWorkDialog`, `NewCollectionDialog`) | Gallery and sketchbook |
| Curation board | Gallery |
| Tag and medium suggestions (`TagInput`, `MediumInput`) | Gallery and sketchbook |
| Random piece (`Header`) | Gallery |

`PiecePicksDialog` serves both the spotlight and the about page, so where it
takes its pieces from becomes a prop.

### Metrics

`GalleryCounts`: the Pieces tile counts the gallery and its note reads
"N in the sketchbook, M waived". Tags and mediums count over the gallery and
the sketchbook together. The visit tables need nothing.

## 7. The existing "Sketch & Drafts" collection

Its pieces move into the sketchbook with the new action. The collection can
stay -- a collection of sketches is an ordinary thing now -- or be deleted.
The owner's call; no script.

## 8. Decisions

| Decision | Date | Why |
|---|---|---|
| A flag on pieces, not a collection marked "off the wall" | 2026-10-22 | A collection flag breaks at the edges: a sketch opened from any other link has no neighbours and a back link to the gallery, and a piece in two collections is ambiguous |
| Independent of `waived_at` | 2026-10-22 | Waive and restore keep working unchanged, and a restore lands in the right section for free |
| A `PATCH` field, not a route | 2026-10-22 | The move is reversible and destroys nothing; no new route means no new boundary to audit |
| Sketches may join collections and the about page | 2026-10-22 | Owner: showing rough sketches beside finished pieces is normal |
| Newest first, with the gallery's sort controls | 2026-10-22 | Nothing to curate, and the owner still re-sorts as on the gallery |
| Detailed view kept | 2026-10-22 | Owner: sketches are treated like finished pieces; skipping tiles would add a branch for about a third of the storage |

## 9. Out of scope

- Hand-ordering the sketchbook, which would be a second tab on Curate.
- A sketchbook teaser on the landing page.
- Marking sketches on cards inside a collection. Only the wall label marks
  them.
- Lighter processing for sketches: no tiles, smaller originals.
- Header highlighting by the section of the piece being viewed.

## 10. Verification

- **`tests/smoke_sketchbook.py`**, in-memory like `smoke_collections.py`:
  - the default list holds no sketch;
  - `?sketchbook=true` holds only sketches, newest first;
  - neither list holds a waived piece;
  - an upload with `inSketchbook` arrives unplaced, and one with a
    `position` as well is refused;
  - moving in clears `curated_order` and `spotlight_order` and keeps
    `about_order` and the collections;
  - moving back arrives unplaced;
  - the spotlight refuses a sketch, and so does curation;
  - waive then restore returns a piece to the sketchbook;
  - a non-boolean `inSketchbook` is a 400.
- **`tests/smoke_visitor.py`**: a visitor's `?sketchbook=true` holds no
  waived piece, and `?waived=true&sketchbook=true` is still a 401 -- which
  otherwise rests only on the order of the branches in `list_pieces`.
- Done 2026-10-22: sketchbook 23/23, visitor 50/50, and the suites around it
  unchanged. The security agent found nothing; the second visitor check above
  was its one suggestion.
- **The security agent** on the backend change -- a new list parameter on
  `GET /api/pieces` -- with `graphify affected "require_owner"` and
  `graphify affected "is_owner"` in its prompt, per `AGENTS.md` section 9.
- Typecheck, `eslint`, `npm run build`. The owner tests the UI.

## 11. Build order

1. **Backend:** the migration, model, serializer, list filter, upload,
   `PATCH`, the spotlight and curation refusals, the tests, then the
   security pass.
2. **Reading:** services and types, the page, the route and the header link,
   the piece page.
3. **Owner flows:** the upload choice, the move action, the pickers, the
   counts.
4. **Docs:** a `MAP.md` row and vocabulary entry, and a line in
   `WAIVED-PIECES.md` that a restore returns a piece to its section.

**Cost:** one column, one migration, about 6 backend and 14 frontend files,
one new page and one new test file. No new route, no new table, no change to
the visitor contract.
