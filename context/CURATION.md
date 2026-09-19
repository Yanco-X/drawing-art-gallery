# Curation

The owner's hand-set orders, and the page that sets them: the gallery's
pieces, and the collections themselves. Built 2026-09-19. The order of the
pieces *inside* a collection is not this feature and stays in the
collection's own arrange mode (`COLLECTIONS.md`).

## 1. The order

- **One number per row**, `pieces.curated_order` and
  `collections.curated_order`, from zero. A column rather than a table, for
  the reason `spotlight_order` is one.
- **Null means not placed yet.** New uploads, restored pieces and new
  collections arrive null and wait above every placed row, newest first.
  Nothing runs on creation to put them on top; the sort does it.
- **The gallery is `curated_order` ascending, nulls first, then `created_at`
  descending, then title** -- `GALLERY_ORDER` in `api/pieces.py`, used by
  `GET /api/pieces` and the save's response. Collections follow the same
  rule with name for title -- `COLLECTION_ORDER` in `api/collections.py`.
- **A waive clears a piece's place**, beside its spotlight slot, so "set
  means exhibited" holds. A restore leaves it null, which is the owner's
  rule: a restored piece returns at the top.
- **Both migrations placed every row in the order the lists already
  showed**, newest first, so nothing moved on the day they landed. Waived
  pieces stayed null; draft collections were placed with the rest.

## 2. What follows the order

- **The gallery's default sort**, named "Curated" in the sort row. Year, A-Z
  and Last upload override it; Curated puts it back. Inside a collection the
  same button means the collection's own order.
- **The wall's layout.** The masonry reads across the rows since this
  feature: the first pieces are the top row at any width (`DESIGN.md`,
  Masonry grid). It used to fill down each column, which made "third" a
  different place on every screen.
- **Walking pieces** from the gallery, since a walk follows the list as the
  visitor saw it.
- **The spotlight's empty slots**, the owner's rule: picks first, then the
  gallery from the top. `spotlightSlots` fills from the list as it arrives.
- **Every picker** that lists the gallery -- Add work, the spotlight dialog.
- **The collections** on the landing page and the Collections page, and the
  collections the spotlight names for a piece.

## 3. Saving

`PUT /api/curation/pieces` with `{"pieceIds": [...]}`, and
`PUT /api/curation/collections` with `{"collectionIds": [...]}`, both
`[owner]`, first to last. Each answers with its list as it now stands.

- **Set semantics.** Anything left out loses its place and waits at the top.
  That is also what keeps something added while the page was open from being
  buried by the save: the page never knew about it, so it stays unplaced, on
  top.
- **Refused whole**: not an array, a malformed id, a duplicate, an unknown id
  (404), a waived piece (409), or more ids than there are rows -- each list
  is bounded by what it orders.
- **Drafts are ordered with the published collections**, so publishing one
  does not ask for it to be placed again.
- **No GET.** `curatedOrder` rides on every piece and collection, for the
  owner only. A visitor gets null: the gaps a waive leaves in the pieces'
  numbering would say where withdrawn pieces hung, and numbers counted across
  draft collections would say where drafts sit. The list's own order is all a
  visitor's page needs. Found by the security review.

## 4. The page

`/curate`, owner only, `Curate` in the nav. `CurationPage` loads both lists
and switches between Pieces and Collections; `CurationBoard` is the whole
interface for either, told by the page what a tile, the preview and the
"start from" choices are for its subject.

- **A same-size grid, not the masonry.** The masonry places pieces by their
  heights, so a move there shifts others unpredictably; here position 37 is
  always in the same spot. Pieces are shown whole; collections by their
  cover. Position on an accent badge. Three tile sizes, the gallery's density
  control, remembered separately from the gallery's.
- **Four ways to move**, because a dozen items is easy and two hundred is
  where the interaction matters:
  1. **Drag**, with dnd-kit since 2026-09-19. The tile lifts and follows the
     pointer, its slot stays as an outline, and the grid slides aside to
     show where it will land. Mouse lifts past 6px, so a click still picks
     and places; touch lifts on a quarter-second press, so a swipe still
     scrolls. Dragging a picked item carries every picked item: the lifted
     one shows the count, and the rest gather round it on release. The
     page loads as its own chunk, so the library never reaches a visitor.
     **The drop hands over to the board's FLIP**, which starts from where
     each tile is drawn at that moment (`useFlipReflow`'s returned capture):
     tiles the drag already slid into place stay put, and only what still
     has to move does. dnd-kit's own settling animation is switched off, so
     nothing slides twice.
  2. **Pick and place**, for long moves, and on a phone without holding.
     The check box picks; Ctrl-click and Shift-click pick one or a range.
     With items picked, a click on the left or right half of another
     puts them there, in the order they already stood. The bar at the foot
     offers To top, To bottom and To position.
  3. **Type a position**: the badge is a button; Enter moves the item there.
  4. **Keys**: arrows nudge a focused item a step, Space picks it, Enter on
     another item places the picks before it.
- **Start from** reorders the whole pending list by one rule, as a starting
  point for arranging by hand: pieces by newest or oldest upload, year either
  way, or title; collections by newest or oldest, name, or most pieces. It is
  one undoable move and saves nothing.
- **Preview** shows the page's own grid, in the pending order, numbered,
  inert so a card cannot open its page: the gallery's masonry at this
  window's width and the chosen density, or the collections grid.
- **Nothing is saved until Save.** Every move can be undone, Ctrl+Z included,
  and Discard is itself undoable. Unplaced items carry a "New" tag until a
  save places them.
- **Each pending order is kept on the device** (`sketchyart-curation-draft`
  and `sketchyart-curation-draft-collections`) until it is saved or matches
  the saved order again. The router is a plain `BrowserRouter` and cannot
  hold a navigation, so a click on the nav mid-session would otherwise lose
  the work. On return, anything added since joins at the top and anything
  gone since drops out. Undo history is not kept, and switching subject
  starts it afresh.

## 5. A position at upload

The upload form's **Position in the gallery**, counting from 1. Empty is the
top, unplaced, as before. A number hangs the piece there in the upload's own
transaction, and past the end is the end.

- **It numbers the whole gallery as it stands**, which is exactly what a
  save on the curation page does with the piece dragged to that place. The
  pieces waiting at the top keep their places and lose their New tag.
- **Refused whole** for anything but a whole number from 1, before any file
  is written.
