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

**OpenSeadragon**, approved by the owner under `AGENTS.md` §2. The earlier
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

## Pass 2 — planned

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

## Pass 3 — planned

The minimap, which is OpenSeadragon's navigator configured to match the
design system: 1px `line` border, `accent` for the viewport rectangle, hidden
at fit-scale and shown only once zoomed in.

## Open

- **`DESIGN.md` §accent needs rewriting.** It says the accent appears in
  "exactly six places" and closes the list. The New Collection button already
  made that untrue, and Detailed View makes it more so. The rule it should
  state is *the accent marks the one action a surface exists for* — Upload in
  the header, Add to gallery in the upload dialog, Save arrangement in
  arrange mode, Detailed View on a piece page.
- **No `Storage.read` test against S3.** The backfill exercised it against
  real MinIO 14 times, but no suite covers it.
- Tiles are not regenerated if an original is ever replaced. Nothing can
  replace an original today, so this is a note rather than a gap.
