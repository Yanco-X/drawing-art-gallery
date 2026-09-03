# Current Feature

Authentication, and the visitor contract.

Asked for on 2026-09-02. The owner token ships inside the JavaScript bundle,
so whoever opens the gallery is the owner. This replaces the credential and
writes down, for the first time, what the public half of the site is.

## Status

Specified, not built. Full specification in [`AUTH.md`](./AUTH.md), settled
across a design conversation on 2026-09-02. The owner reads that before any
code is written.

## Goals

- **Real sessions.** Flask-Login, cookie-backed, permanent via the remember
  cookie. `is_owner()` and `require_owner` in `app/auth.py` are the only
  things replaced.
- **One owner, password only.** A row in the unused `users` table, seeded by
  a prompted CLI command. No registration, no reset, no email flow.
- **An invisible way in.** No sign-in link anywhere. Five clicks on the
  footer copyright mark open a lazily-loaded dialog; a hashed unlinked path
  is the spare key.
- **The visitor contract, positively stated** -- and enforced by a fifth
  suite, `tests/smoke_visitor.py`, that walks every route with no
  credentials.
- **A tombstone for a waived piece.** 410 and the title, so a bookmark
  returns an explanation rather than a 404.
- **The `includePrivate=1` leak closed.** It is not owner-gated today.

## Decisions

Argued in full in [`AUTH.md`](./AUTH.md) §10. The ones that shaped
everything else:

**Cookie, not JWT.** A one-user gallery needs no statelessness, and a token
in JavaScript is the problem being solved rather than a different shape of
solution. Flask-Login over hand-rolling the same cookie, for `remember=True`
and for a conventional path if accounts ever become real.

**`SameSite=Lax`, not Strict.** Strict withholds the cookie on inbound
links, so arriving from Discord or a note would show the owner a logged-out
gallery until they navigated internally. Lax still blocks cross-site
mutations, because every mutation is POST, PATCH, PUT or DELETE -- which is
also why no CSRF token scheme is needed while the API stays same-origin.

**A tap gesture, not a hotkey.** The owner edits and uploads from a phone,
where a keyboard sequence does not exist. A `click` fires for a mouse and a
tap alike, so one code path serves both.

**The hiding is cosmetic and its failure mode is cosmetic.** The listener
ships in the bundle and `POST /api/session` answers anyone who guesses it.
The worst case of discovery is a password box, which a visible login would
have offered on arrival. Everything real is behind it.

**410 for a waived piece, 404 for a private collection.** A piece carries
`waived_at`, which is a record that it was once exhibited; a collection
carries nothing that says it was ever public. The split falls out of the
data rather than needing a new column.

**Unlisted, not private.** `noindex` plus per-bot `robots.txt` rules. The
decision is cheap in one direction and irreversible in the other, so it
starts closed.

**The dev token stays, and is written down as a back door.**
`OWNER_API_TOKEN` keeps the 210 existing checks running unmodified. It must
be unset in production, and that condition lives in `AUTH.md` §7 rather than
in anyone's memory.

## Deferred

- **Deployment and origin.** Undecided. The code assumes same-origin and
  puts the cookie flags in config. If production splits the origins, CSRF
  tokens become mandatory and `ProxyFix` is needed for the rate limiter.
- **Waived derivatives.** Still anonymously fetchable by URL. A
  storage-layout problem that a login does not fix; its own session.
- **Code-splitting the owner surface.** Worth doing as a performance pass,
  not a security one. After this feature, which gives it the runtime role it
  needs.
- **Open Graph tags and the share image.** Their own pass.
- **Tags that do something.** Still the feature after this one.

## Notes

- **Run it**: see `STATUS.md` §2.
- **New config**: `SECRET_KEY` in `backend/.env`. It signs the session
  cookie, and rotating it signs the owner out everywhere.
- **New dependency**: Flask-Login, approved on 2026-09-02. Werkzeug already
  ships with Flask and does the password hashing.
- **Verify with screenshots.** `STATUS.md` §11 is pointed about the last
  visual feature shipping with a blank minimap the owner found by hand.

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
