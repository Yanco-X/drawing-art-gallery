# Detailed View

A full-window mode for looking at a piece properly: zoom, pan, and a minimap
showing where you are in the drawing. Google Photos is the reference.

Asked for on 2026-09-01, and not mentioned in any earlier document.

The ordinary piece page **stays exactly as it is**. Detailed View is opened
deliberately from a button, never by clicking the artwork.

## The three sub-features

1. **Full-window mode** — the piece fills the browser window.
2. **Zoom and pan** — wheel or pinch to zoom, drag to move.
3. **Minimap** — a thumbnail with a rectangle marking the visible region,
   shown only while zoomed in.

## The fourth one, which came first

None of the three are worth building against the pixels we had.

`imageUrl` serves `display.webp`, capped at **1600px on the long edge**. The
originals run from 1080px to **4999 × 5001**. On a 3840 × 2160 monitor the
piece page's `max-h-[78vh]` box already works out to roughly 1685 device
pixels, so the display rendition was being scaled *up* slightly before any
zooming happened at all. Zooming into it would have produced a soft
enlargement — the exact opposite of the point, which is seeing graphite
texture.

So pass 1 is entirely about having something to zoom into.

## Decisions

**Full original resolution, delivered as tiles.** The owner asked for "the
max dimensions and resolution of the original file". The original is
archival and lives in the private bucket by design. A Deep Zoom pyramid
resolves the tension completely: every pixel of the original is reachable,
and the original file itself never leaves the private bucket. Verified —
a tile returns 200 to an anonymous request, the original still returns 403.

**Tiles rather than one large derivative.** A single full-resolution WebP
would have been far less work, and for a 2600px gallery it would have been
defensible. It is not defensible at 4999 × 5001: OpenSeadragon in
simple-image mode decodes the whole bitmap, which is **100 MB of RGBA** for
that piece. That is not slow, it is a crash on a phone. Tiles keep memory
flat regardless of how large the owner scans in future.

**OpenSeadragon**, approved by the owner under `AGENTS.md` §2. Two
package.json entries rather than one: `openseadragon` (6.1.0, which ships no
types) and `@types/openseadragon` (6.0.0, DefinitelyTyped), the second a
devDependency that never reaches the bundle. The earlier
recommendation was against it — correctly, for a 2560px cap, where it was a
cannon aimed at a sparrow. At full original resolution with a tile pyramid
it is the thing OpenSeadragon exists for, and its built-in navigator is
sub-feature 3 for free.

**Pillow, not libvips.** `vips dzsave` is the standard tool and it is
faster, but it is a system dependency on Windows. Deep Zoom is a simple,
frozen format and Pillow is already here. Measured on the real gallery, the
generator is fast enough that the extra dependency buys nothing.

**Each level is resampled from the full-resolution source**, not from the
level above it. Repeated halving compounds resampling error down the
pyramid, and fine graphite texture is the entire reason for zooming.

**No `.dzi` descriptor is written.** The descriptor carries dimensions, tile
size and overlap — all already on the piece row. Storing one would be a
second copy of the truth plus a fetch before the first tile. The API composes
the tile source instead.

**A base URL, not a URL template.** Every storage backend composes public
URLs by joining a prefix, so `base` stays one string join and the frontend
appends `/<level>/<column>_<row>.webp`. Braces in a key would have worked but
only by accident.

**Tiling cannot fail an upload.** It runs after the commit, and a failure
logs, clears the partial pyramid, and leaves the piece with
`tiles_ready = false`. The viewer falls back to the display rendition, which
is what every piece uploaded before this existed does anyway until the
backfill reaches it — so the fallback had to exist regardless, and once it
exists a failed build should use it too.

**Synchronous, no job queue.** There is no queue in this project and adding
one to serve a personal gallery would be a great deal of machinery for a
wait measured in seconds. See the timings below.

**A `tiles_ready` column rather than probing storage.** The answer is needed
on every read of a piece; a HEAD request per piece to discover it would be
absurd.

**Waiving keeps the pyramid.** Waiving is reversible and the owner can still
open a piece from the reserve. Rebuilding on restore would put a multi-second
wait on an action that is otherwise instant.

## Pass 1 — done 2026-09-01

Backend only, no UI.

- `tile_pyramid()` and `tile_level_count()` in `services/images.py`
- `services/tiles.py` — `write_tiles` / `clear_tiles`, shared by the upload
  route and the backfill so the two cannot disagree about where a tile goes
- `pieces.tiles_ready`, migration `a7f4d91c3b28`
- `Piece.tile_prefix` and `Piece.tile_key(level, column, row)`
- `width` / `height` on every piece payload; `tileSource` on the detail shape
- `Storage.read(key)` added to all three backends — the first thing in the
  project to read the private bucket back, which is what it has been holding
  those originals for
- Wired into `POST /api/pieces`, after the commit and non-fatal
- `scripts/backfill_tiles.py`, with `--dry-run` and `--force`
- `TileSource` in `frontend/src/types` — the contract, ahead of pass 2

### Timings, measured on the real gallery

Writes are parallelised across 8 workers. The first backfill ran serially and
took 18.5s on the largest piece; roughly two thirds of that was waiting on
MinIO round trips rather than generating anything.

| Piece | Pixels | Levels | Tiles | Time |
|---|---|---|---|---|
| Yankito Night Calls | 4999 × 5001 | 14 | 547 | 12.3s |
| khyunee | 3048 × 4064 | 13 | 265 | 6.5s |
| Savy Relax | 2850 × 4096 | 13 | 289 | 5.5s |
| typical ~2700px | — | 13 | 179 | ~3.5s |
| the 1080–1440px scans | — | 12 | 47–58 | ~1.1s |

Generation is now the bottleneck rather than storage. Overlapping the two
would help further and is not worth the complexity at these numbers.

### Cost

**2,605 tiles, 16.6 MB** for the whole gallery — less than half what the 14
originals occupy. The public bucket went from 4.6 MB to 21.2 MB. Against
~950 GB free this is not a consideration, and it will not become one.

## Pass 2 — done 2026-09-01

Full-window shell and zoom/pan.

- A **solid accent, full-width button** directly beneath the artwork,
  spanning the image column, with `Full resolution · 4999 × 5001` in `faint`
  beneath it. Visible to **everyone**, so it cannot live in
  `PieceOwnerActions`, which is owner-gated. Needs a new expand glyph in
  `icons.tsx` — an arrows-to-corners mark rather than a magnifier, because
  this opens a window; the zooming happens once inside.
- A `<dialog showModal()>` overlay: top-layer stacking, Escape and focus
  trapping come from the platform, and the enter/exit transition already
  exists from the modal pass. The piece page stays mounted underneath, so
  closing returns to it with scroll position intact.
- OpenSeadragon in a **lazy chunk**, loaded when the viewer opens. The bundle
  is 298 KB; adding 250 KB to every page load to serve a viewer most visits
  never open would be a bad trade.
- Opens on `display.webp` — already cached by the page behind it, so the
  first frame is instant — then swaps to tiles.
- Falls back to `display.webp` when `tileSource` is null.
- A fullscreen toggle inside the overlay. `requestFullscreen` on the dialog
  element works; seizing the whole screen unprompted does not.
- Prev/next stay live, resetting zoom on navigation, so the viewer is a
  browsing mode rather than a detour.

### Decided 2026-09-01

**Chrome fades on idle.** Close, zoom, fullscreen and prev/next share a top
rail that fades after about two seconds of stillness and returns on any
pointer move, tap or keypress. The artwork gets the whole window, which is
the point of the mode.

Two rules keep that from becoming an accessibility problem: the rail must
return on **keyboard focus** as well as pointer movement, or a keyboard user
loses the controls entirely; and under `prefers-reduced-motion` it should
stay put rather than fade. A control that is invisible and cannot be
summoned is not restraint, it is a bug.

**The viewer has a URL — `?view=1` on the piece route.** Opening pushes it,
so Back closes the viewer rather than leaving the page, and a link can be
sent that opens straight into the zoomable view. That matters more for this
feature than most: "look at this closely" is the thing worth sending
someone.

A query parameter rather than a route (`/piece/:id/view`) because a route
would unmount the piece page underneath, and preserving it — scroll position
included — is why the overlay was chosen in the first place.

Two subtleties to get right:

- Opening **pushes** a history entry so Back pops it. Closing with Escape or
  the close button should therefore `navigate(-1)` rather than pushing a
  second entry, or the history fills with alternating states and Back stops
  meaning anything.
- Landing directly on `/piece/:id?view=1` must open the viewer once the
  piece resolves, not before. The dialog cannot mount against a piece that
  is still loading, and a piece that 404s must drop the parameter rather
  than opening an empty viewer.

**The minimap stays in pass 3.** It is close to free — OpenSeadragon's
navigator is a config flag — but the decision is to ship the viewer, use it,
and let actual use settle how the minimap should look before styling it.

### Built

- `DetailedView.tsx` — the dialog, OpenSeadragon, the fading rail
- `DetailedViewButton.tsx` — the filled action and the dimensions line
- `PAGE_ACTION` in `form-styles.ts`, and seven glyphs in `icons.tsx`
- `?view=1` handling in `PiecePage`, with the push/back rules above

**`PAGE_ACTION` is a new style, not a change to `ICON_BUTTON_ACCENT`.** That
one is outlined and its comment argues, correctly for its own case, that
solid accent belongs to focus, required marks and confirming buttons. This
is a different case — the one action a page exists for — so it got its own
entry rather than bending the existing one. `DESIGN.md` §accent now
describes both, and the rule that separates them.

**Verified.** Every tile the viewer will ask for was checked against
storage: OpenSeadragon computes a level's grid as
`ceil(scale * width / tileSize)` while the generator wrote
`ceil(ceil(width / 2^k) / tileSize)`. Those agree for all 52 levels across
four pieces, and 18 sampled tiles — corners, middles and edges at six
levels — all return 200, with one past the last column returning 404. The
URL template in `DetailedView.tsx` is the same string the test built.

The lazy chunk works: OpenSeadragon is a separate 348 KB file (87 KB
gzipped) and the main bundle grew only 8 KB, from 298.8 KB to 306.7 KB.

**Not verified at the time: the visual.** The geometry, the URLs and the
build were proven; how it *looked* was not. This was recorded as "no browser
automation on this machine", which was wrong — `STATUS.md` §8 documents
driving Chrome over CDP with Node's built-in `WebSocket`, and Chrome is
installed. The route was available and went unused.

## Pass 3 — done 2026-09-02

The minimap: OpenSeadragon's navigator, mounted into our own element and
dressed to match the system.

Held back from pass 2 rather than folded in, so that how it looks and when
it appears were decided against a viewer that had been used.

### Decisions

**Mounted via `navigatorId`, not `navigatorPosition`.** Given an element,
OpenSeadragon sets the control anchor to `NONE` and *skips* the inline
border and background it otherwise writes onto the navigator. So the frame
is ours rather than an override, and placement is ordinary CSS.

**It fades on its own clock, sooner than the rail** — 2s against 3s.

The first version did not fade at all, on the reasoning that the minimap is
feedback you need *while panning*, which is exactly when the rail goes. The
owner corrected it in use, and the correction was right: that argument
confuses "zoomed in" with "panning". Someone who has zoomed in to study a
passage moves the mouse away and stops, and at that moment a panel sitting
on the artwork is noise. It returns on the next movement.

Two clocks rather than one because the two overlap the work differently: the
minimap sits *on* the drawing, the rail sits at the edges, so the minimap
clears first.

It is still gated on zoom as well — shown only past `getHomeZoom() * 1.05`,
since "where am I" is not a question when the whole piece is visible. The 5%
margin is not fussiness: floating point and the spring animation both leave
the resting zoom a hair off the home zoom, and an exact comparison makes the
minimap flicker while the view settles.

**`wheel` counts as activity.** Zooming with the wheel moves no pointer, so
without it the chrome faded out from under the very gesture that needed it.

**Hiding is not motion.** It still happens under
`prefers-reduced-motion` — someone who asked for less animation wants an
uncluttered view no less than anyone else. The stylesheet drops the fade for
them, per the standing rule that motion is skipped rather than shortened.

The 5% margin is not fussiness — floating point and the spring animation
both leave the resting zoom a hair off the home zoom, and an exact
comparison makes the minimap flicker while the view settles.

**The display region's border is overridden to 1px.** OpenSeadragon hardcodes
`borderWidth = 2` and writes it inline; this design has no 2px borders.
`!important` earns its place here, since only an important rule beats an
inline style. OpenSeadragon's geometry still reckons on 2px, so the
rectangle sits a pixel out — invisible at 180px wide, and worth less than
introducing a border weight the rest of the UI does not use.

A hairline alone was too quiet to find against a dark drawing, so the region
also carries a 16% accent wash. The border keeps it precise; the wash is
what makes it read.

**`box-sizing: content-box` on the display region.** Preflight sets
`border-box` on everything, but OpenSeadragon sizes that element assuming
its border sits outside the width it sets. Without the override the region
is short by its own border on each axis.

**The navigator has to be told to draw.** `Navigator` sets
`_resizeWithViewer = false` whenever its control anchor is `NONE`, which is
precisely what handing it an element through `navigatorId` does. That flag
gates the only call it ever makes to `updateSize()` — and `updateSize()` is
what runs `viewport.resize()`, `goHome()` and `world.draw()`. Left alone it
paints its frame and its display region over an empty world: a blank box
with a rectangle floating in it, which is exactly how it shipped and how the
owner found it.

The draw is hung off the navigator's *world* `add-item` event, not an `open`
handler. The navigator never opens — the main viewer calls
`navigator.addTiledImage()` directly, and only the main viewer ever raises
`open` — so an `open` listener there waits forever. `world.update(true)` and
`world.draw()` follow the resize explicitly, because `updateSize()` returns
early when the container size has not changed and would otherwise do nothing
on any later call.

**Two elements, not one.** OpenSeadragon mutates the element it is handed —
appending its `navigator` class and writing inline styles. React owns the
wrapper, whose className changes every time the minimap shows or hides, and
re-applying it would wipe OpenSeadragon's mutations. The inner element takes
no changing props, so React renders it once and never touches it again.

## Open

- **The visual has never been checked by automation**, though it could have
  been — see `STATUS.md` §8. The blank minimap shipped because of it: a
  single screenshot would have shown an empty box. Pass 3's fix has been
  confirmed by the owner in use, not by a check.
- **No `Storage.read` test against S3.** The backfill exercised it against
  real MinIO 14 times, but no suite covers it.
- Tiles are not regenerated if an original is ever replaced. Nothing can
  replace an original today, so this is a note rather than a gap.
