# Visit Metrics

How many people visit the gallery, on what, and what they look at. Counted
in-house, stored in the gallery's own Postgres, read on an owner-only page.

**Status:** Specified 2026-09-12. Backend built 2026-09-13 and covered by
`tests/smoke_visits.py`. Events sent from the frontend since 2026-09-14, with
the footer notice and opt-out. Dashboard at `/metrics` built 2026-09-14,
and the security review of the whole change passed the same day with the
limiter's eviction reworked on its finding. `AUTH.md` section 1 carries the
visitor's side. What remains is deployment: `DEPLOYMENT-NOTES.md` 2.9 and
`VIS-1`, and the yearly export in section 11.

No third-party script and no new service. Railway's own observability is
for keeping the site running -- CPU, memory, HTTP logs kept for days and not
aggregable -- and cannot answer any question below.

---

## 1. What it measures

| Metric | Meaning |
|---|---|
| Unique visitors | Distinct browsers in a range. Filterable by day, week, month, any range |
| Visits | Tab sessions in a range. One browser can make many |
| Device | `mobile` or `desktop`, per visitor |
| Piece views | Distinct visitors who opened each piece's page |
| Detailed view opens | Distinct visitors who opened each piece in the detailed view |
| Collection views | Distinct visitors who opened each collection |

Every count is "per unique visitor" unless it says visits.

---

## 2. Identity: a random visitor id

On first load the browser generates `crypto.randomUUID()` and keeps it in
`localStorage` under `sketchyart.visitor`. Every event carries it. The id is
random, derived from nothing, and is never joined to the owner's user row or
to anything else.

`localStorage` has no expiry. The same browser sends the same id tomorrow and
next year, which is what makes a week's or a month's uniques countable.

### When the id is lost

The browser mints a new one and the visitor counts as new. There is no way to
link the two ids, and that is the point: unlinkable is what makes it
anonymous. It is lost when:

- **Safari goes seven days without seeing the site.** Its tracking prevention
  clears script-written storage. The timer resets on every visit, so a weekly
  visitor keeps their id; one who stays away longer does not.
- The visitor clears site data, or browses privately.
- A second device or browser is a second id, always.

So every unique count is an **upper bound**: the truth is the same or a
little lower, never higher. No analytics without a login does better.

### Rejected: a daily salted hash of IP and User-Agent

Nothing stored on the device, which is its appeal. But the salt must rotate
daily and be destroyed -- a fixed salt makes the hash a reversible pseudonym
for an IP -- so the same person is a new visitor every day. Weekly and
monthly uniques and per-piece viewers across days become impossible, which
is most of section 1. It also puts the real client IP at the centre of the
numbers, and carrier NAT merges strangers while network switches split one
person. Worth revisiting only if a consent obligation ever rules out
device storage.

---

## 3. Schema

One table, `visit_events`, one row per event:

| Column | Type | Meaning |
|---|---|---|
| `id` | `UUID` | Like every other table; SQLite, which the suites run on, will not autoincrement a `BIGINT` |
| `visitor_id` | `UUID`, not null | The browser's random id |
| `kind` | `TEXT`, not null | `visit`, `piece_view`, `detailed_view`, `collection_view` |
| `piece_id` | `UUID`, nullable | FK `pieces.id`, `ON DELETE CASCADE` |
| `collection_id` | `UUID`, nullable | FK `collections.id`, `ON DELETE CASCADE` |
| `device` | `TEXT`, not null | `mobile` or `desktop` |
| `created_at` | `TIMESTAMPTZ`, not null | Server clock, UTC |

A check constraint ties `kind` to its target: `piece_view` and
`detailed_view` need `piece_id`, `collection_view` needs `collection_id`,
`visit` has neither.

**Raw rows, deduplicated when read.** No counter columns: "unique viewers of
this piece last month" is `COUNT(DISTINCT visitor_id)`, and any question
thought of later is a query rather than a migration. A row is about a hundred
bytes; a year of a gallery's traffic is megabytes.

**Deleting a piece or a collection deletes its stats**, by the cascade.
Waiving does not -- a waived piece's history stays until it is deleted.

**No secondary indexes.** A year of rows is a sequential scan measured in
milliseconds. Add one on `created_at` when the dashboard is measurably slow.

---

## 4. The four events

| Kind | Sent from | When |
|---|---|---|
| `visit` | app start | Once per tab: a `sessionStorage` flag stops a reload or navigation resending it |
| `piece_view` | `PiecePage` | Each time the page shows a piece, including prev/next |
| `detailed_view` | `PiecePage`'s `openViewer` | Each open, including a `?view=1` arrival |
| `collection_view` | `CollectionPage` | Each time a collection loads |

Repeats are stored as they happen and collapsed by the query. The frontend
does no deduplication beyond the `visit` flag.

**Device is decided on the server** from the User-Agent, by one regex
(`Mobi|Android|iPhone|iPad`), and only the word is stored -- never the UA.
iPadOS reports itself as desktop Safari and is counted as desktop; accepted.

---

## 5. Backend

A new blueprint, `api/visits.py`, with `VisitEvent` in `models.py`.

### `POST /api/visits` -- public

```json
{ "visitorId": "uuid", "kind": "piece_view", "pieceId": "uuid" }
```

`collectionId` in place of `pieceId` for `collection_view`; neither for
`visit`.

- **Malformed answers 400**: unknown `kind`, a missing or non-UUID id, a
  target that does not match the kind.
- **Well-formed answers 204, always** -- stored or not. It is dropped
  silently when the caller is the owner (`is_owner()`), the User-Agent looks
  like a bot (`bot|crawl|spider|slurp|headless`), the piece is missing or
  waived, or the collection is missing or not public. A different answer for
  a private collection would confirm it exists.
- It is the first visitor-callable write. It is `POST`, carries no cookie
  requirement, and cannot change anything but its own table.

The path avoids the words ad-block lists match on -- analytics, track,
beacon, collect, metrics. Check it against uBlock Origin before launch.

### Limits

Abuse is the app's problem; a flood is not. A request that reaches Flask
has already spent bandwidth and a worker, so DDoS is the edge's job --
Railway's L3/L4 mitigation and WAF, with Under Attack Mode switched on during
an incident. Cloudflare in front is the upgrade path, taken when an attack or
the bandwidth bill asks for it, not before.

What the route enforces:

| Limit | Value | Over it |
|---|---|---|
| Content-Length | Required | 411 |
| Body size | 1 KB | 413, before parsing |
| Per client IP | 60 events a minute | 429 |
| Global | 10,000 events an hour | Dropped, 204 |

- **Per IP** uses `AttemptLimiter`, keyed by `client_ip()`: Railway's
  `X-Real-IP` when `TRUST_X_REAL_IP=1`, the socket address otherwise. The
  login limiter reads the same helper. A visitor clicking through pieces as
  fast as they can makes about 30 a minute.
- **Global** is a fixed-window counter, not `AttemptLimiter`: that keeps a
  list of timestamps per key, and a 10,000-entry list rebuilt per request
  would be expensive exactly when under attack. It stops a many-IP flood
  filling the table; real events in that hour are lost with the fake ones,
  which is acceptable because counts during an attack mean nothing anyway.
- **`AttemptLimiter` is a fixed window per key** -- one timestamp and a
  count, so memory is bounded by keys, not by events. Over its key bound it
  drops expired windows, then idle keys oldest first, and never a key that
  is blocking someone: a flood of fresh addresses cannot lift a block on the
  password. The login limiter gains the same.
- Limits are per worker and reset on deploy. Shared state would need Redis,
  a service this does not justify.

Both limits must be verified against the deployed edge before launch --
tracked in `DEPLOYMENT-NOTES.md`.

### `GET /api/visits/summary` -- owner

`@require_owner`, like every owner-only route.

Query: `from` and `to` as `YYYY-MM-DD`, inclusive, and `tz` as an IANA name.
`tz` is validated with `zoneinfo.ZoneInfo`; the range may not be inverted or
longer than 366 days. Anything else is a 400. Days are bucketed in `tz`, so
"today" ends at the owner's midnight, not UTC's.

It also computes the previous period of the same length, for comparison.

```json
{
  "range": { "from": "2026-09-01", "to": "2026-09-30", "tz": "Europe/London" },
  "visitors": { "unique": 412, "visits": 690, "previousUnique": 301, "previousVisits": 455 },
  "devices": { "mobile": 260, "desktop": 158 },
  "daily": [ { "date": "2026-09-01", "unique": 14, "visits": 19 } ],
  "pieces": [ { "id": "uuid", "title": "Heron", "viewers": 88, "detailedViewers": 31 } ],
  "collections": [ { "id": "uuid", "name": "Birds", "slug": "birds", "viewers": 40 } ]
}
```

`daily` has a row for every day in the range, zeros included, so the chart
has no gaps to invent. `pieces` and `collections` list everything with at
least one view in the range; the page sorts. Device counts are distinct
visitors per device, so they can sum to slightly more than `unique`.

---

## 6. Frontend

- `lib/visitorId.ts` -- reads or mints the id, and answers whether counting
  is off (section 7).
- `recordEvent()` and `fetchVisitSummary()` in `services/pieces.ts`, like
  every request. `recordEvent` is `fetch` with `keepalive: true`, never
  awaited, errors swallowed: a failed count must never break a page.
- `pages/MetricsPage.tsx` at `/metrics`, gated on `role !== 'owner'` the
  way `WaivedPage` is. A link in the owner's header beside Waived.

### The page

- Range presets -- today, 7 days, 30 days, 12 months -- and two native
  `<input type="date">` for anything else. The browser's
  `Intl.DateTimeFormat().resolvedOptions().timeZone` is sent as `tz`.
- A headline row: unique visitors, visits, returning ratio, device split.
  Each beside the previous period: "412, up 37% on the previous 30 days".
- A daily chart of unique visitors and visits. Plain SVG, no chart library.
- A pieces table: title, viewers, detailed viewers, detailed-view rate.
  Sortable by each column, viewers by default. Titles link to the piece.
- A collections table: name, viewers, share of unique visitors.
- The headline is labelled "unique visitors" with a hint that it means
  unique browsers and is an upper bound -- section 8 in one line.

---

## 7. Privacy

**Stored:** a random id, the event kind, what was viewed, a device word, a
timestamp. **Never stored:** IP address, User-Agent, referrer, anything
typed, anything linking the id to a person.

**Counting is off** -- no id minted, no event sent -- once the visitor
presses **Don't count mine** in the footer, which sets
`sketchyart.visits.off` and removes the id. The same button turns it back on.

The footer carries one line saying the gallery counts anonymous visits, kept
on this site only, with that button beside it.

**Browser signals are not honoured**, decided 2026-09-14 after a first pass
did. Global Privacy Control means "do not sell or share my data", which this
design satisfies outright, and Brave sends it on every site by default -- so
honouring it made every Brave visitor invisible, the owner's own browser
included. Do Not Track is retired; Firefox dropped it in 2025.

**Why this is enough.** Since 5 February 2026 the UK's Data (Use and Access)
Act exempts first-party analytics used only for statistics about the site,
provided visitors are told and can object for free; the footer does both.
The EU's strict reading still wants consent for device storage, and France's
CNIL exempts audience measurement of this shape. Not legal advice -- if a
consent obligation ever applies, section 2's rejected option is the fallback.

**Visitor contract.** When built, `AUTH.md` section 1 gains a line under "A
visitor may": send a visit event, which records the random id and what was
viewed, nothing else.

---

## 8. Reading the numbers

Read them as **trends and rankings, not headcounts**. The errors are small
and consistent, so comparisons hold up far better than any single figure.

### Trust most

- **Daily unique visitors.** A lost id only matters across a gap, and a day
  barely has one. The most accurate headline.
- **Rankings.** Lost ids inflate every piece about equally, so "Heron is the
  most viewed" holds even if each count runs a little high.
- **Trends.** This month against last month carries the same kind of error on
  both sides, and it mostly cancels.

### Read with care

- **Monthly and yearly uniques** are "at most this many browsers". Compare
  them with the same length of range at another time, never with a daily
  figure.
- **Never add daily uniques to make a weekly one.** Someone who came Monday
  and Tuesday counts twice. The page counts distinct ids across the whole
  range; a hand-made sum will disagree with it.
- **Mobile's share drifts up over long ranges.** Safari's seven-day rule
  sheds mobile ids more often than desktop ones. Over a week the split is
  accurate; over a year it leans mobile.

### The ratios say more than the totals

- **Visits / unique visitors** is how often people come back. 1.0 is everyone
  once; 2.5 is people returning. Rising means the gallery holds people.
- **Detailed viewers / viewers**, per piece, is how gripping a piece is up
  close. Modest views with a high rate is a piece people stop and study --
  the one number no generic analytics tool gives.
- **Collection viewers / unique visitors** is whether collections are found
  and used, or the landing page is all anyone sees.

### Small numbers are noisy

At a few dozen visitors a day, one shared link can double a day. Look at a
week or a month before concluding anything, and read a one-day spike as an
event -- the post that landed -- not a trend.

### What is excluded, and what is not

- **The owner, only while signed in.** Browsing signed out on a phone counts
  as a visitor. Signing in once per device fixes it; the remember cookie
  keeps it that way.
- **Most bots.** Crawlers mostly run no JavaScript and send nothing, and the
  User-Agent filter catches most of the rest. A determined fake can still get
  through, so an absurd spike on one piece from nowhere is more likely noise
  than fame.
- **Visitors who opted out** by the footer button. They are invisible by
  design, and a slight undercount against the upper bound above.

---

## 9. Build order

1. **Backend.** Model and migration, `api/visits.py` registered in
   `api/__init__.py`, tests: every drop rule in section 5, 400 on each bad
   field, the cascade on delete, and a `tests/smoke_visitor.py` case for the
   summary refusing a visitor.
2. **Events.** `lib/visitorId.ts`, `recordEvent`, the four call sites, the
   footer line and button.
3. **Dashboard.** `MetricsPage` and its route and header link.
4. **Security agent** on the change, with `graphify affected` for
   `require_owner` and `is_owner` in the prompt -- it adds a public write.
5. `AUTH.md` section 1 gains its line; `STATUS.md` records the feature.

Typecheck and `npm run build` after each frontend step. The owner tests the
page.

---

## 10. Decisions

| Decision | Why |
|---|---|
| In-house over a hosted tool | Every metric wanted is gallery-specific or cheap to count; no monthly cost, no third-party script, first-party requests |
| Random id over a daily hash | Only way to get uniques across weeks and months and per-piece viewers across days |
| Raw event rows, no counters | Any question later is a query; counters drift |
| Device from the UA on the server, UA not stored | One regex, no client field to validate, nothing fingerprintable kept |
| 204 for every well-formed event | A different answer would reveal a private collection or a waived piece |
| Stats cascade on delete, survive waive | Deleted means gone; waived is reversible and its history should come back with it |
| Owner excluded on the server | `is_owner()` is already the single place identity is decided |
| No chart library | A line of days and a few bars are a few dozen lines of SVG |
| Chart draws visitors in the accent and visits in a per-theme gray token, `chart-quiet` | The gray that stays distinguishable from the gold differs by ground -- `muted` on light, `faint` on dark -- measured with the dataviz palette validator, not eyeballed; the chart's table view relieves the gold's low contrast |
| Browser privacy signals not honoured | GPC means "do not sell or share", which the design satisfies; Brave sends it on every site, so honouring it hid every Brave visitor. The footer button is the opt-out |

---

## 11. Out of scope

Referrers, countries, time spent on a piece, spotlight clicks, a retention
purge, and new-versus-returning visitors. Each is a column or a query on top
of this table when it is wanted, not before.

### Pinned for later: the yearly export

Wanted, not urgent. An automated export of a year of `visit_events`, sent to
the owner by email, run ahead of each year's end -- plus a manual download
from the metrics page.

The 366-day cap limits what one dashboard query spans, not what is kept:
rows are never deleted, so nothing is lost if the export is late. The export
is the owner's archive, and the prerequisite for any retention purge later.

Needs, when picked up: a scheduled job (Railway runs cron services), an
email provider and its credentials in `backend/.env`, and a file format --
CSV is the default, readable anywhere.
