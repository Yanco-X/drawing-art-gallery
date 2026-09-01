# Waived Pieces

A two-stage removal for artwork. A piece is withdrawn from the gallery
before it can be destroyed, and the withdrawal is reversible.

**Status:** Implemented 2026-08-31. Verified by 37 dedicated checks plus
the existing suites (127 total), and against real PostgreSQL and MinIO.

Extends the data model in [`project-overview.md`](./project-overview.md)
and the storage design in [`STORAGE.md`](./STORAGE.md). This document covers
only what waiving adds.

---

## 1. The state machine

```
   exhibited  ──waive──▶  waived  ──delete──▶  gone
       ▲                    │
       └──────restore───────┘
```

Three rules define the feature:

1. **A waived piece is not in the gallery.** It has no card, no place in
   prev/next, and no membership in any collection.
2. **Only the owner reaches it.** A visitor asking for a waived piece by id
   gets a 404.
3. **Delete requires waiving first.** There is no path from exhibited to
   gone in one step, and that is enforced by the API rather than by the UI.

The third rule is the reason the feature exists. Deletion destroys the
original along with the derivatives, and the only remaining copy is whatever
happens to be on the owner's disk. Putting a deliberate stop between "I am
finished with this" and "this is unrecoverable" is worth one extra click.

### On the word

"Waived" is the owner's term and is used throughout. Museums call the
equivalent holding a *reserve collection*: catalogued, kept, not on the wall.
Worth knowing if the vocabulary is ever revisited, but the code follows the
owner's language.

---

## 2. Schema

One column on `pieces`:

| Column | Type | Meaning |
|---|---|---|
| `waived_at` | `TIMESTAMPTZ`, nullable | Null is exhibited. Set is waived. |

**A timestamp rather than a boolean.** Same storage, same query cost, but it
also answers *when*, which gives the reserve view a sort order, supports
"waived three days ago" in the UI, and leaves room for an age-based purge
policy without a second migration.

`Piece.is_waived` is a derived property, never a column -- the database keeps
the fact, the boolean is read from it.

**Migration:** its own revision. Every existing row is exhibited because the
column arrives null, so there is no backfill.

---

## 3. Visibility

Soft deletion fails when the flag is added and the read paths are missed.
There are only two left after §4, and both are explicit:

| Read | Behaviour |
|---|---|
| `GET /api/pieces` | Exhibited only. `?waived=true` returns the reserve, owner-gated, newest waived first |
| `GET /api/pieces/<id>` | Waived and not the owner: **404** |

**404 rather than 403.** A 403 confirms the piece exists, which is exactly
the fact being withheld.

### The read gate

`app/auth.py` gains `is_owner() -> bool` -- the same token comparison as
`require_owner`, without raising. `require_owner` is rewritten in terms of
it, so one function still knows how owner identity works and the whole
mechanism is replaced in one place when real sessions land.

Reads become viewer-dependent for the first time here: the same URL returns
different results depending on who asks.

---

## 4. Collections

**Waiving removes the piece from every collection it belongs to.** The join
rows are deleted, not filtered.

This was the owner's call over the alternative -- keeping the rows and
hiding them behind a filter -- and it is the better design for a reason
worth recording. Filtering leaves a *convention*: every present and future
query touching `collection_pieces` has to remember to exclude waived
members, and `Collection.pieces`, `piece_count` and `resolved_cover` each
need their own filter. Deleting the rows leaves an *invariant*: a row in
`collection_pieces` means the piece is exhibited, maintained by the schema
rather than by anyone's discipline.

The cost is that restore is not automatically lossless, which §6 addresses.

**Cover pieces.** If the waived piece is a collection's cover, the cover is
cleared and falls back to the first remaining member. This is the same rule
[`_set_membership`](../backend/app/api/collections.py) already enforces --
a cover that is not a member would render a face the collection does not
contain -- applied to the other way of ceasing to be a member.

**Display order gaps are fine.** Removing a member leaves `0, 1, 3, 4`.
`display_order` is not unique and only feeds `ORDER BY`, and the next
membership replacement rewrites positions contiguously.

---

## 5. API

```
POST   /api/pieces/<id>/waive      owner   409 if already waived
POST   /api/pieces/<id>/restore    owner   409 if not waived
DELETE /api/pieces/<id>            owner   409 unless waived
GET    /api/pieces?waived=true     owner   the reserve
```

**Waive and restore are their own verbs**, not a `PATCH` body. They are
state transitions with side effects on other tables, which reads better as
an action than as a field assignment -- and it avoids coupling this feature
to the metadata `PATCH` that still does not exist.

**The delete guard is the load-bearing part.** A rule the frontend alone
enforces is not a rule; the two-stage flow has to hold for anything holding
the owner token, including scripts and future clients.

`tests/integration_live.py` deletes its fixture through the API and will
need to waive first. That is an improvement: the suite starts exercising the
real path. `scripts/import_uploads.py` uses `session.delete()` directly and
is unaffected.

---

## 6. Restore, and the collection picker

Restoring opens a dialog offering the collections the piece may join:

```
POST /api/pieces/<id>/restore
{ "collectionIds": ["...", "..."] }     // absent or empty: gallery only
```

**Multiple choice.** `CollectionPiece` is many-to-many and a checkbox list
costs no more than a radio list; restricting to one would only mean
restoring twice for a piece that belonged in two.

**One request, one transaction.** The restore and the membership both land
or neither does. There is no window where a piece is back but its curation
half-failed.

**Appended to the end** of each collection it joins, and rearranged later
through the existing `PUT .../pieces` if the owner wants it elsewhere.

**Validation mirrors `_set_membership`** so the two behave alike: unknown
ids return 404 naming exactly which, duplicates are rejected rather than
silently collapsed.

The picker fetches with `?includePrivate=1`, because a piece being restored
may well belong in a set that is not published yet.

**With no collections** -- the current state -- the dialog degrades to a
plain restore with a quiet "no collections yet" line. It must not look
broken before any exist.

### Why ask instead of remember

Recording the old membership and restoring it automatically was considered
and rejected. Asking at the moment of restore is less machinery, and it is
also more correct: the owner has the context then, and a piece coming back
after months away may not belong where it used to. Restore is expected to be
rare, which makes a prompt cheap and an automatic mechanism hard to justify.

---

## 7. What waiving discards, and saying so

Because §4 deletes membership, waiving is not purely reversible, and the
dialog says what is being given up:

> *Night Calls IX* will be removed from the gallery, and from
> **Night Calls** and **Charcoal Portraits**.

Not an alarming confirmation -- naming a consequence, so the curation loss
is chosen rather than discovered. With no collection membership the sentence
shortens and the dialog stays trivial to dismiss.

The pairing is deliberate: waive states the curation it drops, restore
offers to rebuild it.

---

## 8. Frontend

| Surface | Behaviour |
|---|---|
| `/waived` | Owner-only route, its own nav entry. A separate URL rather than a gallery toggle, so the gallery query stays one thing |
| Piece page, exhibited | **Waive piece**. Delete is not offered at all |
| Piece page, waived | **Restore** and **Delete permanently** |
| Prev/next | Walks within one state -- the gallery never steps into the reserve |

`ConfirmDialog` gains `tone: 'default' | 'danger'`. Waive and restore are
not destructive and should not wear the danger outline; only "Delete
permanently" keeps it.

The restore button states its own outcome -- "Restore" with nothing ticked,
"Restore to gallery and 2 collections" with something.

---

## 9. Design

**No new tokens.** A waived piece takes a `WAIVED` eyebrow in `faint` above
its title and reduced opacity on the card, both existing vocabulary. The one
sanctioned exception to the single-accent rule has already been spent on
`danger`; a second would stop being an exception.

---

## 10. Decisions

| Decision | Rationale |
|---|---|
| `waived_at` timestamp, not a boolean | Answers *when* for free; sort order and future purge policy |
| Membership deleted, not filtered | Replaces a convention everyone must remember with an invariant the schema keeps |
| Cover cleared when its piece is waived | Same rule membership replacement already enforces |
| Restore prompts for collections | Less machinery than remembering, and the owner has the context at that moment |
| Multiple collections at restore | The relation is many-to-many; a checkbox list costs nothing extra |
| Delete guarded server-side | A rule only the UI enforces is not a rule |
| 404, not 403, for a waived piece | 403 confirms the piece exists |
| Waive names the collections it drops | The curation loss should be chosen, not discovered |

---

## 11. Out of scope

- **Moving objects out of the public bucket.** A waived piece's `thumb.webp`
  and `display.webp` stay anonymously fetchable by URL, because the bucket
  policy matches `sketchyart/*` rather than a prefix. Anyone who saw the
  piece while it was exhibited keeps a working link. This is a storage-layout
  gap that outlives authentication and should be revisited when sessions
  land -- doing it now would be a lock on an open door, since the owner
  token ships inside the JavaScript bundle.
- **Real authentication.** Waiving is owner-gated the same way every other
  mutation is, and is understood to be a statement of intent rather than a
  guarantee while the token is public.
- **Uploading straight to the reserve.** Not requested. The state machine
  makes it nearly free later and the endpoint shape will not need to change.
- **Automatic re-curation on restore.** See §6.

---

## 12. Verification

Backend, added to the existing suites:

- A waived piece is absent from `GET /api/pieces`
- It 404s for a visitor and resolves for the owner
- It appears in `?waived=true`, newest first
- `DELETE` is refused while exhibited and allowed once waived
- Waiving clears membership, and clears a cover pointing at it
- A collection reports the reduced count and falls back to the next cover
- Restore round-trips, with and without collection ids
- Restore with an unknown collection id 404s and names it

Browser, against real PostgreSQL and MinIO: waive from the piece page,
confirm the card leaves the grid, find it under `/waived`, restore it into a
collection, and delete it from the reserve.
