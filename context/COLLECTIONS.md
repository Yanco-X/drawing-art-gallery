# Collections: viewing and edition

Collections could be created but not opened: `CollectionCard`, the "View all"
link and the wall label's "In collections" names were all `InertLink` — they
rendered as links and did nothing.

This document specifies the two passes that finish the feature.

**Pass 1 — viewing. Implemented 2026-08-31.** The routes, the links, and the
visibility rules.
**Pass 2 — edition. Not started.** Rename, describe, publish, cover,
rearrange, delete.

Pass 1 is specified in full below. Pass 2 is sketched in §9 and gets its own
specification once pass 1 has been lived with.

---

## 1. Why viewing comes first

A collection is a reading experience before it is an editing surface. The
owner made *Testing* on 2026-08-31 and has not been able to look at it
since. Until the page exists there is nothing for the edit controls to sit
on, and no way to judge whether the arrangement they produce is any good.

So: open the collections first, live with them, then decide what editing
them should feel like.

---

## 2. Public and private

`collections.is_public` has existed since the initial schema and defaults to
`True`. The create dialog surfaces it as a checkbox — *Show this collection
in the gallery* — so unchecking it produces a private collection.

**A private collection is a draft.** A set being assembled over several
sittings, holding real pieces, with a real page, that is not ready to hang.
It belongs to the owner and to nobody else.

No private collection had ever existed in this database, which is why the
rules below went unenforced for so long without anything looking broken.

### The rule, stated once

> A private collection is visible to the owner and invisible to everyone
> else, everywhere it could appear.

Everywhere is four places. Three of them were wrong, and pass 1 fixed them.

| Place | Was | Is now |
|---|---|---|
| `GET /api/collections` | Public only, `?includePrivate=1` for all | Unchanged — was already right |
| `GET /api/collections/<slug>` | Returned any collection to anyone | 404 unless public or owner |
| A piece's `collections` block | Public only, even for the owner | All of them for the owner |
| The landing row and the index | Never asked for private ones | Owner asks with the token |

The first was a leak and the other two a disappearance: a private collection
was reachable by anyone holding its slug, and unreachable from the UI by the
person who made it.

### Why 404 rather than 403

The same reasoning as a waived piece in
[`WAIVED-PIECES.md`](WAIVED-PIECES.md) §3: 403 confirms the collection
exists. For a draft the owner has deliberately not published, the response
should not admit there is anything at that slug at all.

### Marking a private collection in the UI

Once the owner can see private collections, the owner needs to tell them
apart at a glance, or the gallery starts lying about what visitors see.

A `Private` eyebrow — 11–12px, uppercase, `tracking-eyebrow`, `text-faint` —
on the card and in the page header. The same marker `PieceCard` already
draws for `Waived`, reused rather than invented, because it says the same
kind of thing: this is here, and it is not on the wall.

---

## 3. Routes

Two new routes, both public in the sense that they need no owner token to
resolve — what they *contain* is gated per §2.

| Route | Page |
|---|---|
| `/collections` | `CollectionsIndexPage` — every collection the caller may see |
| `/collections/:slug` | `CollectionPage` — one collection and its pieces |

`Header`'s Collections nav item was `href="#collections"`, an in-page anchor
to the landing section. It became `to="/collections"`, with an `active` state
matching `/collections` and `/collections/:slug`, the way Gallery already
covers `/piece/:id`.

---

## 4. The collection page

Header, then the work. The header is a wall label for the set:

```
← Collections                                        (back)

COLLECTION · PRIVATE                                (eyebrow)
Testing                                             (serif h1)
What holds these together.                          (description)
3 pieces                                            (count)
────────────────────────────────────────────────────
[ the pieces, in display_order ]
```

The eyebrow reads `COLLECTION` for a public one and `COLLECTION · PRIVATE`
for a draft. Description and the rule above the grid are omitted when there
is no description — an empty block is louder than no block.

Pieces render through `AllWorkSection`, which already accepts `title` and
`emptyMessage`. Reused rather than rebuilt: it carries the density control,
the three states, and the masonry, and a collection's grid should not drift
from the gallery's.

### Order

`GET /api/collections/<slug>` returns `pieces` in `display_order` and the
page renders them in that order. Note the caveat in `MasonryGrid`: CSS
multi-column fills top-to-bottom, so a curated order reads down each column
rather than across each row. Acceptable for now, and recorded here because
curation is the whole point of a collection — if the order ever needs to
read left-to-right, that is the reason to replace the masonry.

### An empty collection

Reachable in pass 2 by removing the last piece, and today by creating a
collection from a piece page, which posts `pieceIds: []`.

The header renders normally, the count reads `0 pieces`, and the grid shows
`SectionState` with **"Nothing hangs here yet."** No cover exists, so the
card falls back to the gradient swatch it already draws when
`coverImageUrl` is null. Nothing special is required — this is specified so
that the state is deliberate rather than discovered.

---

## 5. The index

`/collections` is the landing row without the truncation: the same
`CollectionCard` in the same grid, showing every collection the caller may
see. For the owner that includes drafts, each marked per §2.

Empty state: **"No collections yet."**, matching the landing section.

---

## 6. The three links that stopped being inert

| Component | Became |
|---|---|
| `CollectionCard` | `<Link to={'/collections/' + slug}>` |
| `CollectionsSection` "View all" | `<Link to="/collections">` |
| `PieceWallLabel` "In collections" | `<Link to={'/collections/' + slug}>` |

The wall label's links came right for free once the route existed —
`CollectionRef` already carried `slug`.

The grid itself moved into `CollectionGrid`, shared by the landing row and
the index so the two cannot drift. `PageMessage` was extracted for the
not-found and unavailable states.

`InertLink` survives this pass. "Owner sign in" and the Tags nav item are
still inert, which is what it is for.

---

## 7. Frontend fetching

`fetchCollections` stays honest as *what a visitor sees*. `fetchAllCollections`
already exists and sends the owner token with `?includePrivate=1`.

The landing row and the index choose between them on `CURRENT_ROLE`. The
choice is made once, in a module-level function per page, so it can be
passed to `useAsync` as a stable dependency rather than an inline arrow —
the trap documented in `useAsync`.

A new `fetchCollection(slug)` returns `Collection | null`, mirroring
`fetchPiece`: null on 404, because a collection that does not exist — or is
private while the caller is not the owner — is an expected answer for this
page, not a failure.

---

## 8. Verification

Five checks added to `tests/smoke_collections.py`, extending the existing
`== visibility ==` block. The suite already covered list filtering and
`includePrivate=1`.

| Check | Result |
|---|---|
| A private collection 404s on the detail route without the token | pass |
| The same slug resolves with the token | pass |
| A public collection resolves either way | pass |
| A piece in a private collection reports it to the owner | pass |
| The same piece reports nothing to a visitor | pass |

Suite totals after this pass: collections 51, uploads 35, waived 37,
integration 28 — **151 checks**, up from 146.

Also verified against the live stack by hand: a private collection named
`__gating_fixture__` was created, checked in all four places from §2 with and
without the owner token, then deleted by its exact id. The gallery was
confirmed untouched afterwards — 11 pieces exhibited, 0 waived, *Testing*
still holding *Savy Relax / Night Calls V / Untitled Study V* in that order.
Marker discipline per `STATUS.md` §8.

---

## 9. Pass 2, sketched

Owner controls sit **inline on the collection page**, not behind an edit
mode — the owner's call, consistent with `PieceWallLabel`, which shows
owner actions in place.

| Action | Endpoint |
|---|---|
| Rename, edit description | `PATCH /api/collections/<id>` — send `name` alone; omitting `slug` keeps the URL stable |
| Publish / unpublish | `PATCH` with `isPublic` |
| Choose a cover | `PATCH` with `coverPieceId` — must be a member, the API enforces it |
| Reorder, add, remove | `PUT /api/collections/<id>/pieces` — replaces the list, rewrites `display_order` |
| Delete | `DELETE /api/collections/<id>` — pieces survive, only the grouping goes |

**Reordering is drag and drop** — the owner's call, chosen over reusing the
picking-mode vocabulary from creation. Built on native HTML5 drag events
with a keyboard-accessible fallback, not a library: `AGENTS.md` §2 rules out
new dependencies without approval, and that approval has not been given.

Two things pass 2 must settle that pass 1 does not:

- Drag and drop covers reorder. Add and remove need their own affordances,
  since the collection page only shows pieces already in the collection.
- `PieceOwnerActions` hardcodes `isPublic: true` when creating a collection
  from a piece page, so that path offers no visibility choice while the grid
  path does. Inconsistent; resolve it with the rest of the edit surface.

---

## 10. Out of scope

- **Authentication.** Per `STATUS.md` §7, the gate is a statement of intent.
  The rules in §2 are written so they become true the moment sessions land,
  and nothing here depends on the gate actually holding today.
- **Editing a piece's metadata.** Still no `PATCH /api/pieces/<id>`.
- **Tags.** Still inert.
- **Reordering from the landing row.** Collections have no order of their
  own beyond `created_at` — a decision to revisit if the gallery ever holds
  enough of them to need one.

---

## 11. Decisions

| Decision | Made | Why |
|---|---|---|
| Keep private collections | 2026-08-31 | A draft set is genuinely useful in a gallery meant to be lived in, and the machinery already exists |
| View before edition | 2026-08-31 | A collection is a reading experience first; there is nothing to hang edit controls on until the page exists |
| Owner controls inline, not behind a mode | 2026-08-31 | Consistent with `PieceWallLabel`; fewer clicks |
| Drag and drop for reorder | 2026-08-31 | Owner preference over reusing picking mode; native events, no library |
| 404 rather than 403 for a private collection | 2026-08-31 | Same reasoning as a waived piece — 403 confirms it exists |
| `Private` eyebrow reused from `Waived` | 2026-08-31 | Says the same kind of thing, and the vocabulary is already established |
