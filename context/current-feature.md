# Current Feature

First deployment: Railway for the app and Postgres, Cloudflare R2 for the
images.

## Status

**Decided 2026-09-12, work starting 2026-09-15.** Pass 1 is the production
shape: the frontend and backend built and served as one thing, settings that
fail loudly rather than quietly, and the images moved from MinIO to R2 by
configuration.

## The shape

* **One Railway service serves the API and the built site** from the same
  address, so nothing about the session cookie changes.
* **Postgres on Railway**, reached over its private network.
* **R2 holds the images**: a public bucket for thumbnails, display images and
  tiles behind `images.<domain>`, and a private bucket for originals. That is
  `STORAGE.md`'s two-bucket design with the endpoint pointed elsewhere; the
  frontend is untouched, because image addresses are composed at read time.
* **The domain is registered at Cloudflare**, which is what lets R2 serve the
  public bucket through it. The site's own record starts unproxied, so
  exactly one proxy -- Railway's edge -- sits in front of Flask.

## Pass 1: the work

* A production web server and start command, and a build recipe that compiles
  the frontend and runs the backend as one image.
* Flask serves the built site, with deep links such as `/piece/…` falling
  back to the app.
* Startup refuses to run when a production setting is unsafe, and one
  catch-all error response returns JSON without internals.
* `Cache-Control: private, no-store` on API responses. Owner and visitor get
  different answers from the same address, so nothing in front may cache them.
* An `Origin` check on the routes that change something.
* `postgresql+psycopg://` for the database address Railway hands out.
* Bucket setup at startup becomes skippable: hosted buckets are created in a
  dashboard, and R2 does not implement the policy call the app makes.
* Pinned backend dependency versions, so the server rebuilds to what was
  tested.

Then: move the gallery across (a database dump and restore, plus 3,654 image
files), rehearse on Railway's free address, and attach the domain last.

**The pre-launch checklist lives in `DEPLOYMENT-NOTES.md`** -- what must be
done before the first public request, and what follows in the first week. It
is git-ignored and exists only on the owner's machine.

## Decisions

**Railway with R2, rather than Railway alone.** Railway's buckets are
private-only, and the detailed view builds tile addresses from a single
public base, so a Railway-only setup would need a Flask route carrying every
image byte. R2 serves them directly, at no traffic cost, and needs no new
code. At gallery traffic both cost about the same; the difference is code and
what happens under a spike.

**The images sit on a sibling subdomain**, which is why the `Origin` check is
in pass 1 rather than in the first week: `SameSite` is same-site, not
same-origin.

**One rule decides the client's address.** `client_ip()` already serves both
the sign-in limit and the visit counter, so production turns on
`TRUST_X_REAL_IP` only once the edge is proven to overwrite a forged header.
Tested on the first deploy, before the domain is attached.

**Cloudflare in front of the site is deferred.** It is a switch, not a
migration, once the domain is there. Taking it moves the client's address to
another header, and both limiters have to change in the same pass.

**Nothing is decided by default.** The storage backend, debug, the cookie
flags and the secret are set deliberately in Railway's variables, not
inherited from a development default.

## Open questions

* **The domain name.** `yancurations.com` is the candidate; free on `.com`,
  `.art` and `.gallery` as of 2026-09-15.
* **The local `visit_events` rows** -- carried across with the dump, or
  production starts clean. Starting clean is the recommendation: they are the
  owner's own browsing.
* **Scheduled volume backups on the Hobby plan.** Confirm at setup.
* **What Railway's edge does with a forged `X-Real-IP`**, which decides
  `TRUST_X_REAL_IP` and the visit counter's per-client limit.
* **The spend cap figures**, alert and hard limit.

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
- **2026-09-07**: Piece page reflowed. Back and prev/next moved into the top
  of the wall label rail, and the artwork's height cap moved from the image
  to the image and its Detailed view button together.
- **2026-09-07**: Year derived from the date made, in both the upload form
  and the edit dialog. `lib/year.ts` holds the rule; `YearField` is shared.
- **2026-09-08**: Agent UI testing rule written down. `AGENTS.md` section 5:
  the owner does the browser testing, an agent stops at the typecheck and
  the build.
- **2026-09-08**: **Gallery filter, sort and list memory -- done.** The
  filter band with text, year and collection criteria; three sort keys
  opening sideways into the header row; and a store that keeps both, plus
  the scroll position and the last-viewed marker, across a trip to a piece
  and back.
- **2026-09-09**: Security sweep of the whole repository, recorded in the
  git-ignored `DEPLOYMENT-NOTES.md`.
- **2026-09-12**: Credentials taken out of the repository and rotated.
- **2026-09-12**: Visit metrics specified in `context/METRICS.md`.
- **2026-09-12**: Hosting decided -- Railway for the app and Postgres,
  Cloudflare R2 for the images.
- **2026-09-13**: Visit metrics built. `POST /api/visits`, the owner
  dashboard at `/metrics`, and a `client_ip()` helper shared with the
  sign-in limit.
- **2026-09-15**: This file cleared for the deployment feature.
