# Deployment Notes

Every security finding that stands between this gallery and its first public
request, with what to do about each one.

**Status:** Findings recorded 2026-09-09, from a full-repository sweep. **No
code has been changed.** Nothing in this document is exploitable today,
because the app runs on localhost. Every item here is a statement about the
day that stops being true.

This is a checklist to return to, not a spec. The reasoning behind the
systems it audits lives in [`AUTH.md`](./AUTH.md),
[`STORAGE.md`](./STORAGE.md) and [`WAIVED-PIECES.md`](./WAIVED-PIECES.md);
where a finding contradicts one of those, the contradiction is named.

---

## 1. How to read this

Findings carry an area prefix and a tier. The tier is the whole point of the
document -- it separates what is actually wrong from what is merely
undecided.

| Tier | Meaning |
|---|---|
| **BLOCKING** | The first public request must not happen until this is done. Each one is a full compromise or a total lockout |
| **HARDENING** | Do it in the first week. Not a hole today, but the thing that turns a small mistake into a large one |
| **NOTED** | Recorded so it is a decision rather than a rediscovery. No action required, or action only if something changes |

**The headline is that the auth boundary itself is clean.** Every mutating
route carries `@require_owner` in the correct decorator order, all six
viewer-dependent reads consult `is_owner()`, there is no SQL injection
surface, no mass assignment, and no over-serialization. The upload pipeline
validates by decoding rather than by trusting the client. No anonymous
caller can write anything, list a draft, reach the reserve, or read a waived
piece's metadata.

Which is the right way round: **the findings below are almost entirely about
configuration and deployment shape, not about missing checks.** The problem
is that the obvious deployment path -- copy `.env`, `docker compose up`,
`flask run` -- currently ships a working back door with a published
password.

---

## 2. The blocking list

Nine items. Work top to bottom; the order is deliberate, since 2.1 is
worthless if 2.2 is skipped.

- [ ] **2.1** `OWNER_API_TOKEN` absent from the production environment -- `CFG-1`
- [ ] **2.2** `frontend/.env.example` deleted, `backend/README.md` auth section corrected -- `CFG-2`
- [ ] **2.3** `FLASK_DEBUG=0`, and a generic 500 handler added -- `CFG-3`, `ERR-1`
- [ ] **2.4** `COOKIE_SECURE=1` behind real TLS -- `SESS-1`
- [ ] **2.5** `SECRET_KEY` set from a real secret, and made to fail loudly if absent -- `SESS-2`
- [ ] **2.6** Postgres and MinIO not published to the internet, and the `sketchyart`/`sketchyart` pairs changed -- `CFG-4`
- [ ] **2.7** Storage backend chosen deliberately; if `local`, `/media` must not serve `original.*` -- `STO-1`
- [ ] **2.8** A real WSGI server and a reverse proxy in front of Flask -- `INF-1`
- [ ] **2.9** `ProxyFix` configured, with the attempt store bounded -- `SESS-4`

---

## 3. Credentials and configuration

### CFG-1 -- The dev back-door token is live, and its value is published

**BLOCKING.**

[`backend/.env`](../backend/.env) sets `OWNER_API_TOKEN`. The same literal
value is committed in [`frontend/.env.example`](../frontend/.env.example),
which is tracked and public.

[`auth.py`](../backend/app/auth.py) accepts a matching `X-Owner-Token`
header as owner identity, alongside a real session. So on a deployed
instance with that variable set, this is a full compromise in one line:

```
curl -X DELETE https://gallery.example/api/pieces/<id> -H "X-Owner-Token: <the published value>"
```

Delete, waive, upload, publish drafts, read the reserve -- everything
`@require_owner` guards.

**The mechanism is not the problem and should not be changed.** It fails
closed when unset, compares with `hmac.compare_digest`, and
[`smoke_session.py`](../backend/tests/smoke_session.py) proves the whole app
works without it. [`AUTH.md`](./AUTH.md) §7 already wrote it down as a back
door with a removal condition. The problem is that the removal condition
lives only in prose, while three files nudge an operator into setting it.

**Proposal.** Do not delete the mechanism -- the four test suites depend on
it. Instead:

1. Leave `OWNER_API_TOKEN` unset in the production environment.
2. Make the app refuse to start with both a token configured and debug off,
   so production cannot silently acquire one. A four-line assertion in
   [`config.py`](../backend/app/config.py) turns a prose condition into an
   enforced one, which is the entire lesson of the `includePrivate` leak in
   `AUTH.md` §8.
3. Change the local development value anyway, since the published one is
   burned.

### CFG-2 -- Two tracked files give instructions that reintroduce the hole

**BLOCKING**, and the cheapest item in this document.

[`frontend/.env.example`](../frontend/.env.example) is entirely dead --
nothing in `frontend/src` reads `VITE_OWNER_TOKEN`, confirmed by grep and by
inspecting the built bundle. Its only remaining effect is publishing a
credential and instructing a future reader to inline a token into the
JavaScript bundle, which is exactly the hole `AUTH.md` was written to close.

[`backend/README.md`](../backend/README.md) is materially wrong in two
places: its auth section still says real authentication does not exist and
that write endpoints return 503 when the token is unset (they return 401,
per [`auth.py`](../backend/app/auth.py)), and its setup steps tell the
operator to set `OWNER_API_TOKEN`. Sessions have existed since 2026-09-02.

[`backend/.env.example`](../backend/.env.example) has the mirror problem: it
describes `OWNER_API_TOKEN` as *the* auth mechanism, carries `FLASK_DEBUG=1`,
and has **no `SECRET_KEY` line and no `COOKIE_SECURE` line at all**. Copy it
to a server and you get the debugger exposed, a session key that changes
every restart, and cookies over plaintext.

**Proposal.** Delete `frontend/.env.example` and the stale
`frontend/.env.local`. Rewrite the backend template around sessions, with
`SECRET_KEY` and `COOKIE_SECURE` present and commented, `FLASK_DEBUG=0` as
the default, and `OWNER_API_TOKEN` documented as development-only. Correct
the README's auth section. This is documentation work, it is upstream of
`CFG-1`, and it costs nothing.

### CFG-3 -- `FLASK_DEBUG=1` is the shipped default

**BLOCKING.**

Set in both [`backend/.env`](../backend/.env) and the tracked
[`.env.example`](../backend/.env.example), read at
[`config.py`](../backend/app/config.py), spent at
[`run.py`](../backend/run.py).

On a public host this is remote code execution. Any unhandled exception
serves Werkzeug's interactive traceback, and from there the debugger console
runs arbitrary Python. Even with the console locked it prints source, local
variables, file paths and the SQLAlchemy URL -- database credentials
included.

Reaching an unhandled 500 is not hard, because there is no generic error
handler (see `ERR-1`). `POST /api/pieces` with an absurd `year` passes
`_parse_year` in [`pieces.py`](../backend/app/api/pieces.py), Postgres
refuses it at INSERT, and the exception propagates.

**Proposal.** `FLASK_DEBUG=0` in production, defaulted to `0` in the
template so the safe value is the one that gets copied. Pair it with
`ERR-1`.

### CFG-4 -- Postgres and MinIO are published on all interfaces with a guessable password

**BLOCKING** if the compose file ever runs on a public host.

[`docker-compose.yml`](../backend/docker-compose.yml) publishes `5432`,
`9000` and `9001`, with `sketchyart`/`sketchyart` as both the Postgres
credentials and the MinIO root account. Docker's `ports:` binds `0.0.0.0`
and writes its own iptables rules, so it goes around a host firewall rather
than through it.

That is `psql postgresql://sketchyart:sketchyart@host:5432/sketchyart` --
the entire database including `users.password_hash` -- or the MinIO console
on `:9001` with the same pair, which is read and write access to the private
originals bucket. The credentials are documented in the compose file itself
and in the backend README.

The same defaults are baked into [`config.py`](../backend/app/config.py) as
fallbacks for `DATABASE_URL`, `S3_ACCESS_KEY` and `S3_SECRET_KEY`, so an
environment that forgets to set them still gets `sketchyart`.

**Proposal.** This file is correct for a laptop and should stay that way;
the fix is not to harden it but to never deploy from it. If a compose file
does end up on the server: bind published ports to `127.0.0.1` explicitly,
generate real credentials, and take the MinIO console off the public
internet entirely. Separately, change the config fallbacks from working
defaults into a startup failure -- a missing database URL should stop the
process, not quietly connect to a guessable one.

### CFG-5 -- No `.gitignore` at the repository root

**HARDENING.**

Only `backend/` and `frontend/` carry one. Both are correct, and nothing has
leaked -- the full history was checked: no `.env` was ever committed, and the
only env files ever tracked are the two templates. But there is no net under
anything credential-shaped dropped at root level, and a deployment pass is
exactly when key files, certificates and provider configs appear.

**Proposal.** Add a root `.gitignore` covering `.env*`, `*.pem`, `*.key`,
`*.p12` and the usual editor droppings, before the deployment work starts
rather than after.

---

## 4. Storage and the archival original

### STO-1 -- Under the `local` backend, archival originals are served to anyone

**BLOCKING** if `STORAGE_BACKEND=local`, which is the default in
[`config.py`](../backend/app/config.py).

[`app/__init__.py`](../backend/app/__init__.py) registers
`/media/<path:key>` with no gate of any kind. It serves everything under the
piece prefix, including `<piece-id>/original.<ext>`.

[`AUTH.md`](./AUTH.md) §1 states a visitor may not touch an archival
original -- "Private bucket, 403 anonymously". **That is true only under
`s3`.** Under `local` the promise is simply not kept.

Reaching it: take any `id` from the public `GET /api/pieces` payload and
request `/media/<id>/original.jpg`. `original_ext` is not serialized, but
`ALLOWED_FORMATS` in [`images.py`](../backend/app/services/images.py)
permits six values, so it is at most six guesses per piece. What comes back
is the full-resolution archival file **with its EXIF intact** -- the
original is stored byte-for-byte, so GPS coordinates from a phone photo are
in it. The same URL reaches a waived piece's original, which no other route
will hand over.

**This is not the deferred issue in `AUTH.md` §11.** That one is about
derivatives and tiles sitting in the public bucket, and it is an accepted
consequence of the pyramid carrying every pixel. The archival file leaving
the private store is a different object and is on nobody's accepted list.

**Why the test suite cannot see it.**
[`smoke_visitor.py`](../backend/tests/smoke_visitor.py) runs with
`STORAGE_BACKEND = "memory"`, so the route does not exist while the suite
named after the visitor contract is asserting the visitor contract.

**Proposal.** Two halves, and the second matters more than the first:

1. Decide the backend deliberately rather than by default. `s3` in
   production, which is the intended phase-2 path and closes this outright.
2. Fix the route regardless, because a default that is only safe when
   overridden is not safe. Either refuse keys matching `/original.` for
   non-owners, or serve `/media` only for public variants and put originals
   behind an owner check. Then add a visitor-suite case that runs against
   `local` -- the gap here is as much a testing gap as a code one.

### STO-2 -- Two path guards that are correct today and fragile tomorrow

**NOTED.**

`LocalStorage._path` in [`storage.py`](../backend/app/storage.py) confines
writes with a `startswith` prefix test, which in the general case would
accept a sibling directory such as `uploads-evil`. `S3Storage._bucket_for`
routes to the private bucket on the substring `/original.`.

Neither is reachable. Every key is built by `Piece.key()` or `tile_key()` in
[`models.py`](../backend/app/models.py) from a server-generated UUID and a
fixed variant name; no client string reaches a storage key anywhere in the
codebase. Path traversal on `/media` is closed separately by
`send_from_directory`, which routes through Werkzeug's `safe_join`.

**Proposal.** No action now. Recorded because both are one careless key
format away from real -- a prefix test that becomes a traversal, and a
substring test that routes an original into the public bucket. If a key ever
takes user input, these two lines are where to look first.

---

## 5. Sessions and cookies

### SESS-1 -- `COOKIE_SECURE` defaults to off

**BLOCKING.**

[`config.py`](../backend/app/config.py) reads `COOKIE_SECURE` with a default
of `"0"`. Unset in production, the session and remember cookies travel over
plaintext HTTP and anyone on the network path takes the owner's session.

The danger is that it is invisible: everything works perfectly without it.

**Proposal.** `COOKIE_SECURE=1` in the production environment, and present
in the template so it is not discovered by absence. Consider deriving it
from debug being off rather than from its own variable, so the two cannot
disagree.

### SESS-2 -- `SECRET_KEY` is silently minted per process

**BLOCKING**, and its severity is higher than `AUTH.md` estimated.

[`config.py`](../backend/app/config.py) falls back to
`secrets.token_hex(32)` when the variable is absent. `AUTH.md` §3 judges
this "annoying rather than unsafe", and for one development process that is
right.

Under a multi-worker WSGI server it is worse than annoying: **each worker
mints a different key**, so a cookie signed by one worker is rejected by the
next. The owner is signed out at random depending on which worker answers --
indistinguishable from a bug, and the natural response is to keep retyping
the password, which then trips the rate limiter. It also means there is no
single lever to revoke every session at once.

**Proposal.** Set a real key from a secret store. More importantly, make the
absence fatal in production rather than papered over -- raise when debug is
off and the variable is missing. A missing secret should stop the process,
not degrade into an intermittent fault.

### SESS-3 -- Nothing invalidates an issued session

**HARDENING**, worth doing before the site is public.

`logout_user()` in [`session.py`](../backend/app/api/session.py) clears the
client's cookies and nothing else. There is no server-side session record,
and `User` carries no session token, so Flask-Login's alternative-token path
is unused.

Two consequences. A captured remember cookie stays valid for its full 60-day
lifetime whatever the owner does. And **changing the password via
`flask set-owner` does not sign anyone out** -- so if the password is ever
changed *because* compromise is suspected, the attacker keeps their session
and the one action that felt like a fix did nothing.

**Proposal.** Add a `session_token` column to `users`, return it from
`User.get_id()`, and rotate it on password change. It is a small migration
and it converts "change the password" into an action that actually ends
sessions. Shortening the 60-day remember lifetime is a separate, cheaper
mitigation and a worse one.

### SESS-4 -- The rate limiter inverts behind a proxy

**BLOCKING**, bundled with `INF-1` because neither can be fixed alone.

[`session.py`](../backend/app/api/session.py) keys attempts on
`request.remote_addr`, and `ProxyFix` appears nowhere in the codebase.

`AUTH.md` §4 anticipates this and says the limiter must fail open on an
unattributable client -- and [`ratelimit.py`](../backend/app/ratelimit.py)
does exactly that. But the guard only fires when the key is *falsy*, and
behind a reverse proxy `remote_addr` is a perfectly truthy string: the
proxy's own address, shared by every visitor on earth.

So the protection becomes the attack. Six wrong passwords from anywhere lock
the owner out of their own gallery for fifteen minutes, renewable
indefinitely at one request per window. The owner's only way in is a single
`curl` away from being closed permanently.

**The fix carries its own risk.** Trust `X-Forwarded-For` and `_attempts`
becomes an unbounded dictionary keyed by an attacker-controlled string --
memory exhaustion by header rotation.

**Proposal.** Do the two together, once the proxy is chosen: configure
`ProxyFix` with the exact hop count that deployment implies -- never a guess
-- and at the same time cap the attempt store and evict expired entries. Add
a per-account limit alongside the per-IP one, so a distributed attempt is
still bounded and a single spoofed header cannot lock out the only user.

### SESS-5 -- Sign-in timing difference

**NOTED.** [`session.py`](../backend/app/api/session.py) short-circuits when
no owner row exists, skipping the hash comparison. Measurably distinguishes
"no owner seeded" from "wrong password", and tells an attacker nothing usable
against a seeded instance. Recorded so it is not filed as a finding again.

---

## 6. CSRF and deployment topology

### CSRF-1 -- The protection holds, and one of its stated conditions is wrong

**BLOCKING as a constraint on the deployment decision**, rather than as code
to change now.

The design in [`AUTH.md`](./AUTH.md) §3 was verified and it works: every
mutation is POST, PATCH, PUT or DELETE, no mutation is a GET, and there is
no CORS configuration anywhere in the backend. `SameSite=Lax` is doing its
job.

The correction matters. `AUTH.md` §3 condition 2 says "the API stays
same-origin with the site". **`SameSite` is same-*site*, not
same-*origin*** -- and the gap between those two words is where this breaks
without anyone noticing. Deploy the API at `api.gallery.example` and the
site at `gallery.example` and they are cross-origin but same-site, so:

- the cookie is still sent, so nothing appears broken and no one learns the
  condition was violated;
- Lax stops protecting against anything hosted on any subdomain of the
  registrable domain;
- and `POST /api/pieces` accepts `multipart/form-data`, which is a
  form-submittable content type -- so a plain HTML form on a sibling
  subdomain uploads as the owner, with no CORS preflight to stop it.

Splitting to a genuinely different domain fails the other way: the cookie
stops being sent and the owner surface stops working entirely.

**Proposal.** Add an `Origin` header check on mutating routes and stop
depending on getting the topology exactly right. It is roughly six lines in
one place, it survives every deployment shape, and it removes a footgun that
is silent in exactly the configuration someone is most likely to reach for.
Then correct the sentence in `AUTH.md` §3 so the document stops asserting
the stricter condition.

### CSRF-2 -- Clickjacking looks related and is not

**NOTED.** There are no framing headers, but a cross-site iframe does not
receive a `SameSite=Lax` cookie, so a framed gallery renders as a visitor
with no owner controls to hijack. `X-Frame-Options` is still worth setting
(see `HDR-1`) -- as hardening, not as a hole.

---

## 7. Error handling and information disclosure

### ERR-1 -- No generic exception handler

**BLOCKING**, paired with `CFG-3`.

[`errors.py`](../backend/app/errors.py) registers handlers for `ApiError`,
404 and 405. Anything else -- a database error, a storage failure, a plain
bug -- falls through to Werkzeug's default, which returns **an HTML error
page from a JSON API**, and with debug on, the full interactive traceback.

The frontend degrades acceptably (`pieces.ts` collapses it to "Request
failed (500)"), so this is a server-side leak rather than a broken UI.

**Proposal.** One 500 handler that logs the exception server-side and
returns `{"error": "..."}` with no internals. It closes the leak, makes the
API's content type consistent, and is what makes `CFG-3` survive someone
flipping debug back on to diagnose something.

### ERR-2 -- `/api/health` names the storage backend

**NOTED.** [`app/__init__.py`](../backend/app/__init__.py) returns
`{"status": "ok", "storage": "local"|"s3"}` unauthenticated. It tells a
prober whether `/media/<key>` is registered, which is the entry point for
`STO-1`. Trivial alone, a small assist to the finding above it.

**Proposal.** Once `STO-1` is fixed this is noise. If you want it gone,
return only `{"status": "ok"}` and keep the detail behind the owner check.

---

## 8. Input handling and the upload pipeline

### IN-1 -- The pipeline is correct, and the EXIF result is version-dependent

**NOTED**, with one cheap hardening step.

[`images.py`](../backend/app/services/images.py) decodes with Pillow,
decides the format from `image.format` rather than the filename or
`Content-Type`, and applies `exif_transpose` before deriving. That matches
[`STORAGE.md`](./STORAGE.md) §6 exactly.

**The EXIF-stripping claim looked wrong and turned out to be fine, which is
worth writing down because it is not fine by construction.**
`exif_transpose` *preserves* `im.info["exif"]` minus the orientation tag,
and resize, convert and crop all carry `info` forward. Some Pillow versions'
WebP encoder fall back to `im.info["exif"]` when no `exif=` keyword is
given -- which would have carried GPS coordinates into `display.webp`,
`thumb.webp` and every tile in the public bucket. The installed encoder
(Pillow 12.3.0) reads `encoderinfo` only, so **the derivatives are clean.**

But [`requirements.txt`](../backend/requirements.txt) pins `Pillow>=11.0`
with no upper bound, so a privacy guarantee currently rests on encoder
behaviour that the code never asserts and a routine upgrade could change.

**Proposal.** Pass `exif=b""`, `icc_profile=None` and `xmp=b""` explicitly
in `_to_webp`. Three keyword arguments make the guarantee independent of the
Pillow version, and they are the difference between "verified once" and
"true by construction".

### IN-2 -- No decompression-bomb ceiling

**HARDENING**, owner-only today.

`Image.MAX_IMAGE_PIXELS` is never set, so Pillow's default applies: a
warning around 89 megapixels, an error only above 179. A 40 MB PNG -- inside
`MAX_CONTENT_LENGTH` -- decodes to hundreds of megabytes, and `tile_pyramid`
in [`tiles.py`](../backend/app/services/tiles.py) then resamples the
full-resolution source once per level and writes thousands of tiles
synchronously inside the request.

`POST /api/pieces` is owner-gated, so this is a footgun rather than an
attack -- unless `CFG-1` hands someone the token, at which point it is a
one-request denial of service.

**Proposal.** Set an explicit `MAX_IMAGE_PIXELS` sized to the real work. The
largest piece in the gallery is 5000x5001, so a ceiling around 50-80
megapixels is generous and still refuses a bomb long before it costs the
process.

### IN-3 -- Missing field bounds

**HARDENING.** All owner-only, and all end in a 500 rather than corruption
-- which makes them `ERR-1`'s problem as much as their own.

- `_parse_year` in [`pieces.py`](../backend/app/api/pieces.py) accepts any
  integer, including values Postgres refuses at INSERT.
- `title` is trimmed but never checked against its `String(255)` column.
- `description` is unbounded `Text`.

`_parse_focal`, `_parse_focal_zoom`, `_parse_created_date` and the socials
validators are all properly bounded. `_clean_url` in
[`socials.py`](../backend/app/api/socials.py) judges the scheme *before*
prepending `https://`, which is the non-obvious half and is correct.

**Proposal.** Bound year to something like 1900-2200, cap title at 255 and
description at a sane maximum, and return the API's own 400 rather than
letting the database raise.

---

## 9. Invariants

### INV-1 -- A waived piece can be put back into a public collection

**HARDENING.** Owner-triggered only, and the UI cannot currently produce it.

`_set_membership` in [`collections.py`](../backend/app/api/collections.py)
validates that piece ids exist but never checks `waived_at`. Reachable
through `POST /api/collections` and `PUT /api/collections/<id>/pieces`.

The asymmetry is the tell: `set_piece_collections` in
[`pieces.py`](../backend/app/api/pieces.py) explicitly refuses, with the
message "Restore this piece before adding it to collections". Two paths
write those rows and only one enforces the rule.

The consequence is that the invariant
[`WAIVED-PIECES.md`](./WAIVED-PIECES.md) §4 was specifically chosen to
buy -- "a row in `collection_pieces` means the piece is exhibited" -- does
not hold. A waived piece would appear in a public collection's payload to
any visitor, with title, description, tags and thumbnail, while
`GET /api/pieces/<id>` still answers 410 for the same piece. The tombstone
becomes decorative.

**Proposal.** Add the `waived_at` check to `_set_membership`, matching the
refusal `set_piece_collections` already gives. It is a few lines, and it
restores the invariant that the delete-the-rows design in
`WAIVED-PIECES.md` §4 was chosen to guarantee rather than merely encourage.

---

## 10. Infrastructure, headers, dependencies

### INF-1 -- There is no production deployment story at all

**BLOCKING**, and arguably the root of half this document.

No Dockerfile, no reverse-proxy config, no process manager, and **no WSGI
server in [`requirements.txt`](../backend/requirements.txt)** -- no
gunicorn, no waitress. Deploying as things stand means `flask run`, which is
the Werkzeug development server: single-threaded, explicitly not for
production, and with `CFG-3` unfixed it serves the interactive debugger to
the internet.

It is also what leaves `SESS-4` unresolvable -- `ProxyFix` cannot be
configured correctly until the number of proxy hops is a known fact.

**Proposal.** Settle deployment before anything else on this list, because
several items cannot be finished without knowing the answer. Minimum viable
shape: a real WSGI server (waitress on Windows, gunicorn elsewhere), TLS
terminated at a reverse proxy, the API and the site served same-origin so
`CSRF-1` stays simple, and the database and object storage reachable only
from the application host.

### HDR-1 -- No security headers are set

**HARDENING.** No CSP, `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options` or HSTS anywhere -- no `after_request`, no Talisman. None
is exploitable given the rest, but two are worth specific attention.

**`Referrer-Policy` has a payoff unique to this site.** Without it, the
owner following an external link *while on the unlinked spare path* leaks
that path in the `Referer` header. `SocialsMenu` already sets
`rel="noreferrer noopener"`, so the socials menu is covered; a
document-level policy covers everything else.

**CSP is complicated by the fonts.**
[`index.html`](../frontend/index.html) loads Instrument Serif and Instrument
Sans from two Google origins, so every visitor's browser announces itself to
Google on every page load -- which for a gallery whose whole discoverability
stance is "unlisted" is worth noting on its own terms, separately from CSP.
The file already carries a note to self-host before production.

**Proposal.** Self-host the two fonts, which resolves the privacy point and
simplifies the CSP to `default-src 'self'` plus whatever the object storage
origin needs. Then add the header set at the reverse proxy or in a single
`after_request`. Set HSTS last and deliberately -- it is hard to walk back.

### DEP-1 -- Dependency state

**NOTED**, as of 2026-09-09. Everything is current: Pillow 12.3.0,
Flask 3.1+, flask-login, SQLAlchemy 2.0+, psycopg 3, boto3; React 19,
Vite 8, react-router 7, OpenSeadragon 6. Nothing outdated, nothing with a
known-bad pin.

`npm audit` reports five advisories, four rated high. **Most do not apply
here, and the count is misleading:**

| Advisory | Applies? |
|---|---|
| React Router -- `deserializeErrors()` constructor injection | No. SSR hydration only; this is a client-rendered SPA |
| React Router -- RSC mode CSRF bypass | No. RSC mode is not in use |
| React Router -- inefficient route matching DoS | Possibly. The only one plausibly reachable |
| Vite -- `server.fs.deny` bypass on Windows | No. Dev server only, never shipped |
| Vite -- launch-editor NTLM hash disclosure | No. Dev server only |

[`requirements.txt`](../backend/requirements.txt) uses unbounded `>=` ranges
throughout and there is no lockfile, so two installs a month apart can
resolve differently. That is a reproducibility and supply-chain gap rather
than a vulnerability -- and it is what makes `IN-1`'s Pillow caveat matter.

**Proposal.** Run `npm audit fix` -- it is a clean upgrade and removes the
noise so a real advisory is visible next time. Pin backend dependencies with
compiled requirements before the first deploy, so the server can be rebuilt
to the exact set that was tested.

---

## 11. Checked and found clean

Recorded so nobody spends the effort twice, and so a future regression has a
baseline to fail against.

| Area | Result |
|---|---|
| Mutating routes | Every `POST`/`PATCH`/`PUT`/`DELETE` under `app/api/` carries `@require_owner`, in the correct decorator order |
| Viewer-dependent reads | All six branch on `is_owner()` correctly. `?waived=true` and `?includePrivate=1` are the only visibility-widening parameters, and both gate |
| Absence over refusal | Holds throughout. 410 on a waived piece is the only exception and is the documented one |
| Over-serialization | None. No user, email, password hash or `user_id` reaches any payload. Private memberships are filtered. Originals appear in no payload |
| SQL injection | None. Every query uses `select()` with bound parameters. No `text()` interpolation, no string-built SQL |
| Mass assignment | None. `update_piece` and `update_collection` assign from explicit key lists. `parse_uuid` rejects malformed ids before any query |
| Path traversal | `/media` is closed by `send_from_directory`. No client string reaches a storage key anywhere |
| Upload validation | Decodes with Pillow rather than trusting extension or `Content-Type`. EXIF stripped from derivatives, verified against the installed encoder |
| Frontend bundle | Verified against `frontend/dist`, not only by reading imports: no owner token, no source maps, and `POST /api/session` with a password field exists **only** in the lazy `Keyhole` chunk. The two `password` hits in the main bundle are React's own input-type tables. `AUTH.md` §5's narrow claim is accurate |
| Git history | No `.env` or credential file has ever been committed. The only tracked env files are the two templates |

---

## 12. Deliberately deferred

Not findings. Recorded in [`AUTH.md`](./AUTH.md) §11 as accepted, and
re-listed so they are not rediscovered as new:

- **Waived derivatives stay anonymously fetchable.** The public bucket
  policy matches the whole bucket rather than a prefix, so a link to a
  waived piece's `display.webp`, `thumb.webp` or tiles keeps working. A
  storage-layout problem that a login does not fix. **Note that `STO-1` is
  not this** -- the archival original leaving the private store is a
  different object and is not accepted.
- **The tile pyramid reaches native resolution, deliberately.** The pixels
  are not protected and are not meant to be.
- **The owner surface ships in the main bundle.** `+ Upload`, `Waived`,
  `Restore`, `Delete` and the rest are statically imported. Code-splitting
  it is a performance pass, not a security one -- lazy chunks hide nothing
  from anyone looking.
- **No CSRF token.** See `CSRF-1`, which narrows the condition under which
  that stays acceptable.

---

## 13. Sources

Findings merged from two passes on 2026-09-09: a full read of
`backend/app/`, `backend/scripts/`, `frontend/src/`, the migrations and the
config against the specs in `context/`; and a second pass over git history,
the built bundle in `frontend/dist`, `npm audit` and the deployment
artefacts. Where the two overlapped they agreed.

Nothing here was verified by running the application against a hostile
client -- these are findings from reading the code and inspecting the build.
A live check against a staging deployment is the natural next step once
`INF-1` is settled.
