# Authentication, and what a visitor may do

Real sessions for the owner, and the first written statement of what the
public half of the gallery is.

**Status:** Implemented 2026-09-02, in two passes. The backend carries
sessions, the seed command, the tombstone and the closed leak, verified by
287 checks across seven suites. The frontend carries the session context, the
gesture, the lazy dialog, the tombstone page and `noindex`, verified in a
real browser over CDP. The owner token is gone from the bundle.

Two things arrive together and belong in one document, because neither is
meaningful alone. The gate has existed since the beginning -- eleven
endpoints carry `@require_owner` and six read paths branch on `is_owner()`
-- but the credential that opens it ships inside the JavaScript bundle, so
the rules describe a site rather than defend one. This feature replaces the
credential, and writes down the rules it is finally defending.

Extends [`project-overview.md`](./project-overview.md). The read-gate rules
it formalises were introduced by [`WAIVED-PIECES.md`](./WAIVED-PIECES.md) §3
and [`COLLECTIONS.md`](./COLLECTIONS.md). The hiding strategies were
evaluated in
[`gallery-admin-access-handoff.md`](./gallery-admin-access-handoff.md).

---

## 1. The visitor contract

The public promise of the site, stated positively. Everything not on this
list requires the owner.

### A visitor may

| | |
|---|---|
| See the gallery | The landing page: intro, collections, all exhibited work |
| Read any wall label | Title, description, medium, year, created date, dimensions, tags |
| Open the detailed view | Full zoom and pan, to the original's true resolution |
| Fetch renditions directly | `thumb.webp`, `display.webp` and every tile answer an anonymous request by URL |
| Browse public collections | The index, and any public collection in its curated `display_order` |
| See a piece's public memberships | The `collections` array, filtered to public ones |
| Move through the work | Prev/next, `?view=1` deep links, collection slugs that survive a rename |
| See where the artist is | The socials menu. There is nothing private in it -- a link the owner is not ready to share is not added |

### A visitor may not

| | |
|---|---|
| Write anything | Every mutation answers 401 |
| Reach the reserve | `GET /api/pieces?waived=true` answers 401 |
| Reach a waived piece | `GET /api/pieces/<id>` answers 410 -- see §2 |
| Reach a draft collection | `GET /api/collections/<slug>` answers 404 |
| List draft collections | `GET /api/collections?includePrivate=1` answers 401 -- see §8 |
| Learn a draft exists from a piece | Private memberships are filtered out, not marked hidden |
| Touch an archival original | Private bucket, 403 anonymously |

### Full resolution is deliberate

The tile pyramid is public and reaches native size, so a visitor can see
every mark at the resolution it was drawn at. That is the point: it is the
closest thing the web has to standing in front of the work.

It follows that the pixels are not protected. The archival file never leaves
the private bucket, but that is a fact about the file, not about the image.
Recorded here so nobody later reads it as an oversight and caps the pyramid
to "fix" it.

---

## 2. Absence, refusal, and the tombstone

The existing rule, which stands: **a thing the visitor may not have is not
there.** 403 confirms that something sits at the address, which is the one
fact being withheld. Waived pieces and draft collections 404 rather than
403, and always have.

The tombstone is a deliberate exception, and the reasoning is what makes it
one rather than a hole.

Someone who bookmarked a piece and returns after it was waived **already
knows it was there**. They saw it. Withholding from them protects no secret
and only makes the gallery look broken. So:

| Case | Answer |
|---|---|
| Waived piece | **410 Gone**, with the title |
| Deleted piece | 404, silence |
| Unknown id | 404, silence |
| Draft collection | 404, silence |
| Collection turned private | 404, silence |

The split is not arbitrary and does not need a new column to hold it. A
piece carries `waived_at`, which is a record that it was once exhibited. A
collection carries nothing that says it was ever public, so the site cannot
claim it was. Turning a collection private is returning it to draft, which
is a different act from taking a piece off the wall.

410 conventionally implies permanence and waiving is reversible, which is
the one thing wrong with it. It is still right: the alternative is a 404
carrying a body that contradicts its own status line, which is worse to read
and worse to test.

**The tombstone says the title and nothing else.** No image, no wall label,
no date, no reason. The visitor arrived holding the link, so the title tells
them nothing they did not have; the rest is the gallery's, and waiving was
the act of taking it down. The owner's reasons stay the owner's.

```json
410 { "error": "This work is no longer exhibited.", "title": "Untitled Study VII" }
```

The page offers a route back into the gallery. A "similar works" panel would
hang here later and is out of scope: similarity needs something to compare
on, and tags are the only candidate the data model has.

---

## 3. Sessions

**Flask-Login, cookie-backed.** The session id lives in Flask's signed
cookie; Flask-Login stores the user id in it and reloads the row per request
through `user_loader`.

Chosen over JWT because a one-user gallery needs no statelessness, and a
token in JavaScript is the problem being solved rather than a different
shape of solution. Chosen over hand-rolling the same cookie because
`login_user(user, remember=True)` and its long-lived remember cookie are
exactly the lifetime asked for, and because a conventional path costs
nothing if accounts ever become real. Its two headline features --
`@login_required` and redirect-to-login -- are both unused here: the site
needs *owner*, not merely *signed in*, and an API returns 401 rather than
redirecting.

| Setting | Value | Why |
|---|---|---|
| `HttpOnly` | on | JavaScript never reads the credential |
| `SameSite` | **Lax** | Not Strict. Strict withholds the cookie on inbound links, so arriving from Discord or a note would show the owner a logged-out gallery until they navigated internally |
| `Secure` | config-driven | Off over local http, on in production |
| Lifetime | permanent, remember cookie | Closing the tab does not sign out |

**`SECRET_KEY` is a new required config value.** It signs the session
cookie; rotating it signs the owner out everywhere. Absent, a new key is
minted per process, so sessions simply do not survive a restart -- annoying
rather than unsafe, which is the right way round for a missing secret.

### CSRF

**Covered by `SameSite=Lax` plus method discipline.** Lax withholds the
cookie from cross-site POST, PATCH, PUT and DELETE, and every mutation in
the API is one of those. A cross-site GET carries the cookie and cannot
mutate anything.

Two conditions keep that true, and both are worth stating because breaking
either silently reopens the hole:

1. **No mutation ever moves to GET.** Not planned, and there is no reason to.
2. **The API stays same-origin with the site.** If deployment splits them,
   the cookie needs `SameSite=None`, Lax stops protecting anything, and a
   CSRF token scheme becomes mandatory rather than optional.

Deployment is undecided, so the code assumes same-origin -- which is what
the Vite proxy already gives in development -- and the flags are config.

---

## 4. Identity

**One owner. Password only, no username field.**

The `users` table exists, has never been written to, and is where the owner
row goes. `email` is unique and non-null, so it is seeded with the owner's
real address and used as an identifier rather than as a login field: no
migration, nothing shown in the UI, and the right identifier already in
place if the magic-link option is ever revisited.

`role` stays as the hook for a second account. Nothing else is built for
one: no registration, no password reset, no email flow. There is one artist.

**Seeding is a Flask CLI command** that prompts for the password and writes
a Werkzeug hash (`generate_password_hash`, scrypt by default). A password
never appears in `.env`, in a migration, or in the repository. Flask-Login
does not handle passwords; Werkzeug ships with Flask and does.

### Rate limiting

Five failed attempts per IP per fifteen minutes, held in memory. No
dependency, no table, and it resets on restart -- acceptable when the thing
being protected is one password on a site with one user.

**It must fail open on identifying the client.** Behind any reverse proxy,
`request.remote_addr` is the proxy, so every attempt on earth lands in one
bucket and a stranger's typos lock the owner out. This needs `ProxyFix`
reading `X-Forwarded-For`, and that cannot be configured correctly until
deployment is decided. Until then the limiter counts what it can see and
never refuses a request it cannot attribute.

---

## 5. The way in

The gallery shows no sign that an owner exists. No sign-in link, no login
route in the router, nothing in the header. The constraint is from
[`gallery-admin-access-handoff.md`](./gallery-admin-access-handoff.md) §1
and it is the reason the existing inert link is deleted rather than wired
up.

### The trigger

**Five clicks within three seconds on the `© 2026` mark** in
[`SiteFooter.tsx`](../frontend/src/components/SiteFooter.tsx).

A `click` fires for a mouse and a tap alike, so one code path serves desktop
and phone. A keyboard sequence was rejected outright: the owner edits and
uploads from a phone, where a hotkey does not exist.

The copyright mark was chosen against four criteria -- present on every
route, inert, does not look tappable, and nobody would poke it. It is a
plain `<span>` inside `PageShell`'s footer, so it satisfies all four. The
header wordmark is more reachable, being sticky, but everything up there is
already a link or a control, and five taps would navigate or toggle five
times.

The scroll to reach the footer does not matter. The remember cookie means
this gesture runs a handful of times a year -- a new device, a cleared
browser, a lapsed cookie -- so the thing to optimise for is *impossible to
find by accident*, not *convenient*.

Two mobile details: `touch-action: manipulation` so rapid taps do not fire
Safari's double-tap zoom, and `user-select: none` so five clicks do not
leave the text highlighted on desktop. **Both are applied to the whole
footer**, not to that one span: a single element carrying styling nothing
else in the app carries is a tell.

### The spare key

An unlinked path, compared as a hash of `location.pathname` rather than as a
literal string, so the path itself is not in the bundle. It exists for the
day the gesture does not work somewhere, or the footer changes and the
handshake is forgotten. It is never listed in `robots.txt`: a disallow line
is an advertisement.

### What the hiding is, and is not

**It is cosmetic, and its failure mode is cosmetic.** The listener ships in
the bundle. Anyone who reads minified JavaScript can find a click counter,
and `POST /api/session` answers 401 to anybody who guesses it, so the
*existence* of authentication was never hideable.

The worst case of discovery is that a stranger taps the copyright and is
shown a password box -- which an ordinary login page would have handed them
on arrival. Everything real lives behind that box: the hash, the attempt
limit, the `HttpOnly` cookie, and every endpoint that refuses regardless of
what the interface shows.

Two cheap things keep the cost of discovery up, and neither is load-bearing:

- **The dialog is a lazy chunk**, 1.8 KB that downloads only when something
  opens it. The sign-in call moved to `services/keyhole.ts`, imported by
  nothing else, so it lands in that chunk rather than in the shared one:
  the main bundle contains no request carrying a password field. Vite
  already ships production source maps off.
- **Nothing is named what it is.** No shipped chunk, component or literal
  says `admin` or `login`.

**How far that actually goes, stated honestly.** The main bundle still
contains `Sign out`, and alongside it `+ Upload`, `Waived`, `Restore`,
`Waive`, `Delete` and every other owner control, because they are all
statically imported. A reader searching that bundle learns there is an
owner surface within seconds -- from the upload modal, not from the word
`Sign out`. Hiding the one string while the other twenty ship would be
theatre, so it was not done. What genuinely closes that gap is the
code-splitting pass in section 11, and until it lands the claim this file
makes is the narrow one: **the password field is not in the bundle a
visitor downloads.** Nothing more.

The obscurity is a bonus. It is not a reason to choose a weak password.

---

## 6. Discoverability

**Unlisted, not private.** The gallery is public on the internet and the
owner shares the link on socials; it stays out of search results and image
search.

| | |
|---|---|
| `<meta name="robots" content="noindex">` | The reliable one. Survives being linked, which is why it is the primary control |
| `robots.txt` | Per-bot rules. Blocks the training crawlers that honour it -- `GPTBot`, `Google-Extended`, `CCBot`, `Bytespider` |

A `robots.txt` disallow is **not** used to hide pages: a disallowed URL can
still be listed if linked from elsewhere, and blocking the fetch prevents
the crawler from ever seeing the `noindex` that would have worked.

The decision is deliberately asymmetric. Unlisted to findable is a one-line
change and a sitemap. Findable to unlisted is slow, partial, and permanent
in the ways that matter: caches, the Internet Archive, reposts, and anything
already ingested into a training set, which does not come back out.

Two honest limits, recorded so the word is not read as a promise:

- **Sharing on socials publishes a copy of the preview image.** Platforms
  fetch it, cache it on their own CDN, and ignore `noindex`. Public posts
  are themselves scraped.
- **Waiving does not un-index anything.** A crawler that took a copy keeps
  it, and the tombstone does not reach it.

Open Graph tags -- so a shared link unfurls as the gallery rather than a
bare URL -- are **out of scope here** and belong to their own pass. Unfurl
bots read OG and ignore `noindex`, so the two are compatible; the share
image should be chosen deliberately, since every platform posted to keeps a
copy.

---

## 7. Backend

### The replacement point

[`auth.py`](../backend/app/auth.py) keeps both functions and both names.
`is_owner()` stops comparing a header and starts asking Flask-Login;
`require_owner` is unchanged in shape. Nothing else in the backend learns
how identity is established -- that was the design in the first place and
this is the payment.

**`OWNER_API_TOKEN` survives as a development and test credential.**
`is_owner()` returns true for a valid session *or* a matching token, so the
four existing suites keep running unmodified rather than having every owner
request rewritten.

> **This is a back door and it must be unset in production.** It is written
> here rather than left in a conversation because a temporary exception that
> lives only in someone's memory is a permanent one. When deployment is
> decided, `OWNER_API_TOKEN` is absent from the production environment, and
> `require_owner` already refuses when no token is configured.

### Routes

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/session` | Password in, session cookie out. Rate limited. 401 on failure, with no distinction between reasons |
| `DELETE` | `/api/session` `[owner]` | Logout. Clears session and remember cookie |
| `GET` | `/api/session/me` | `{ "role": "owner" }` or `{ "role": "visitor" }` |

Named for the resource rather than for the act, which keeps `login` and
`auth` out of shipped strings.

---

## 8. The leak this fixes

`GET /api/collections?includePrivate=1` is **not owner-gated**.
[`collections.py`](../backend/app/api/collections.py) carries the comment
"Visitors never see unpublished collections. Owners pass `?includePrivate=1`"
above code that never asks who is calling. Anyone appending the parameter
gets every draft's name, slug, description, piece count and cover thumbnail.

The detail route still 404s, so a draft's contents are safe. Its existence,
name and cover are not -- and existence is exactly what §2 withholds.

`GET /api/pieces?waived=true` answers 401 for the same shape of parameter.
Two identical situations, two different answers, and the drift went
unnoticed because the rule lived in a comment. It is the clearest argument
for §1 existing as a document with a test file named after it.

**Fixed as part of this feature:** the parameter answers 401 for a
non-owner, matching `?waived=true`.

---

## 9. Frontend

### The role becomes runtime state

`CURRENT_ROLE` in [`session.ts`](../frontend/src/lib/session.ts) is a
module-level constant evaluated at import. Real sessions make the role
asynchronous, and that breaks more than it looks like it does.

**The marker is trusted on first paint, and corrected a moment later.**
`Role` stayed `owner | visitor` -- a third case would have pushed into
`Header`'s prop and every consumer that only ever cares about two -- and the
context carries `known` alongside it.

A visitor is resolved from the first paint and makes no auth request at all.
The owner would otherwise see every owner control blank on every load and
then appear, so the marker is believed immediately and `GET /api/session/me`
confirms or downgrades. The cost is that someone else on the owner's own
machine sees owner controls for a few hundred milliseconds; the backend
refuses everything they press, so the failure is cosmetic and brief, against
a flash the owner would see every single time.

**`fetchVisibleCollections` stops working as written.**
[`pieces.ts`](../frontend/src/services/pieces.ts) picks
`fetchAllCollections` or `fetchCollections` at module scope precisely so the
result can be handed straight to `useAsync`. With the role unknown at
import, the choice moves into the pages, wrapped in `useMemo` -- the pattern
[`PiecePage.tsx`](../frontend/src/pages/PiecePage.tsx) already demonstrates.

**Visitors make no auth requests at all.** `GET /api/session/me` runs only
when a `localStorage` marker says this browser has signed in before. A
visitor's network tab shows no trace of the system, and the hidden trigger
forces the check regardless, which covers the cleared-browser case.

**The token leaves the bundle.** `VITE_OWNER_TOKEN` and `OWNER_TOKEN` are
deleted, and the sixteen `X-Owner-Token` headers in `pieces.ts` go with
them. Cookies are sent by default on same-origin requests, so nothing
replaces them.

### `ApiError` gains a status

[`pieces.ts`](../frontend/src/services/pieces.ts) throws `ApiError` with a
message and per-field details and **no status code**, so nothing downstream
can tell 401 from 500. This feature needs the distinction twice -- for the
410 tombstone and for a lapsed session -- and it is a gap regardless.

`fetchPiece` currently collapses 404 to `null`. Three answers now exist and
it returns a discriminated union rather than overloading `null`:

```ts
type PieceResult =
  | { state: 'found'; piece: Piece }
  | { state: 'gone'; title: string }
  | { state: 'missing' };
```

### A lapsed session mid-action

The owner is editing a wall label, the cookie has expired, the `PATCH`
returns 401. The API client recognises 401 globally and opens the dialog
over whatever is on screen.

**It does not flip the role.** Flipping it would unmount `PieceOwnerActions`
and take the half-written label with it -- the two halves of the original
promise, "surface the login" and "keep what was typed", cannot both happen
if the interface changes underneath. So the role is left alone, the edit
dialog stays mounted underneath, and only dismissing the sign-in without
signing in gives up the role.

The failed request is not replayed. Retrying automatically would mean making
every call site replayable, for a case that happens rarely; the owner presses
Save again.

### Header

`OwnerSignIn` is deleted from
[`Header.tsx`](../frontend/src/components/Header.tsx), and `InertLink` went
with it: that component existed for this one call site and had no other
caller left. Signed in, the slot becomes `Sign out` -- which reveals nothing,
because by then the only person seeing it is the owner. A visitor gets
nothing in its place, not even a hint of a door.

STATUS §10 currently says that inert link "is where a real login would
hang". That sentence is superseded: an invisible admin surface and a sign-in
link in the header are not both possible.

---

## 10. Decisions

| Decision | Rationale |
|---|---|
| Cookie session, not JWT | One user needs no statelessness; a token in JS is the problem being solved |
| Flask-Login over hand-rolled | `remember=True` is the asked-for lifetime; convention costs nothing if accounts become real |
| `SameSite=Lax`, not Strict | Strict shows the owner a logged-out gallery when arriving from an inbound link |
| Password only, no username | One owner. `users.email` is an identifier, not a login field |
| Seed by CLI, prompted | A password belongs in neither `.env` nor a migration |
| In-memory rate limit | No dependency, no table; proportionate to one password on a one-user site |
| Dev token retained | Keeps the existing suites running unmodified. Written down as a back door, with the removal condition |
| 410 for a waived piece | The visitor already saw it; withholding protects nothing and looks broken |
| 404 for a private collection | Nothing in the row says it was ever public, so the site cannot claim it was |
| Tombstone shows the title only | The visitor arrived holding the link; the rest was taken off the wall on purpose |
| Tap gesture, not a hotkey | The owner uploads and edits from a phone |
| The footer copyright mark | Inert, on every route, and nobody pokes it |
| Styling applied to the whole footer | One element styled unlike anything else is a tell |
| Hashed spare path | Keeps the literal out of the bundle; never listed in `robots.txt` |
| `noindex` over `robots.txt` disallow | Disallow does not de-index, and blocks the crawler from seeing the tag that would |
| Unlisted first | The decision is cheap one way and irreversible the other |
| Three role states | Two states means owner controls flash before the answer arrives |
| `/me` gated on a local marker | A visitor's network tab shows no trace of the system |
| The marker is believed on first paint | The alternative blanks every owner control on every load, to prevent something the backend already refuses |
| A 401 does not flip the role | Flipping it unmounts the edit dialog and loses what was typed |
| The failed request is not replayed | Every call site would have to become replayable, for a rare case |
| Sign-in call in its own services module | Imported only by the lazy dialog, so no password field ships to visitors |
| `Sign out` stays in the main bundle | Hiding one owner string while twenty others ship is theatre; the code-splitting pass is the real fix |

---

## 11. Out of scope

- **Waived derivatives stay anonymously fetchable.** The public bucket
  policy matches `sketchyart/*` rather than a prefix, so a link to a waived
  piece's `display.webp`, `thumb.webp` or tiles keeps working. §1 lists the
  renditions as anonymously fetchable and this is the honest consequence.
  It is a storage-layout problem, it does not get fixed for free by adding a
  login, and it is deliberately deferred to its own session. Carried since
  [`WAIVED-PIECES.md`](./WAIVED-PIECES.md) §11.
- **Code-splitting the owner surface.** Every visitor currently downloads
  the upload modal, arrange mode, drag-and-drop, the dialogs,
  `CollectionPicker` and `TagInput` for a gallery they can only look at.
  Worth doing, as a **performance** pass rather than a security one -- lazy
  chunks sit on the same CDN with predictable names and hide nothing from
  someone looking. It is a refactor across 37 components and belongs after
  this feature, which is what makes the role runtime state it needs.
- **Open Graph tags and the share image.** §6.
- **CSRF tokens.** §3 -- unnecessary while same-origin, mandatory if
  deployment splits the origins.
- **Magic link.** An email service, deliverability and a token table for one
  user. The variant worth keeping: a Flask CLI command that prints a signed
  short-lived URL, needing no email at all. Parked until deployment settles
  whether there is shell access.
- **Cloudflare Access or mTLS.** Genuinely stronger, and it assumes the
  owner surface is a path prefix. It is not: `GET /api/pieces` is public and
  `POST /api/pieces` is not, on the same URL. Edge rules would have to
  discriminate by method.
- **Multiple accounts, registration, password reset.**
- **"Similar works" on the tombstone.** §2. Blocked on tags doing something.

---

## 12. Verification

### A suite named after the contract

`tests/smoke_visitor.py` -- the fifth suite. It walks every route with no
credentials at all and asserts §1 line by line. Sessions get a sixth,
`tests/smoke_session.py`: a file named after the contract should test the
contract, and signing in is not a visitor act. The visitor rules are
currently tested incidentally, scattered through the suites that own each
feature; nothing tests *visitor* as a thing, which is how the
`includePrivate` leak survived.

- Every row of "may" answers 200 with the expected shape
- Every row of "may not" answers 401, 404 or 410 as listed
- A draft collection is absent from the list, absent from the index, and
  404s by slug
- A piece in a draft collection reports no membership
- `?includePrivate=1` and `?waived=true` both answer 401

The mutation checks are walked from the url map rather than listed by hand,
so a mutation added later is covered by this suite the day it is written.

### Session checks

`smoke_session.py` runs with `OWNER_API_TOKEN` empty. It is the one place
that proves the gallery does not depend on the development credential:
what holds the door in production is only what passes there.

- The right password sets a cookie; a wrong one answers 401 and says nothing
  about why
- Six failed attempts from one IP answer 429 on the sixth
- A session cookie satisfies every `@require_owner` endpoint
- Logout clears the session and the remember cookie, and the next mutation
  answers 401
- With `OWNER_API_TOKEN` unset, the token path is dead and only the session
  works
- A waived piece answers 410 with its title to a visitor and 200 to the
  owner

### In a browser, over CDP

Driven headless against the real stack, screenshots taken -- STATUS §11 is
pointed about the last visual feature shipping with a blank minimap that the
owner found by hand, with this route available the whole time and unused.

Confirmed as a visitor: the header carries no sign-in and no upload; zero
requests to `/api/session`; zero requests carrying `includePrivate`; five
clicks on the copyright mark opens the dialog; a wrong key shows the API's
own refusal; the waived piece renders its tombstone by name and an unknown
id renders "Not found"; the spare path opens the dialog and lands on `/home`.

**Still to be done by hand, because it needs the password:** signing in,
the owner controls appearing, `Sign out`, and the session surviving both a
reload and a closed browser. Also the gesture on a real phone.
