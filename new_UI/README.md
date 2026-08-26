# Handoff: SketchyArt Gallery — Landing / Gallery Dashboard

## Overview
The public landing view of **SketchyArt Gallery**, a personal gallery webapp for storing, organizing, and showing hand-drawn artwork. This view is what a visitor lands on: a header bar, an optional editorial intro, a row of collection cards, tag filters, and a masonry grid of artwork pieces. It also has an owner state (adds an Upload action) and a light/dark theme toggle.

Scope is **UI only** — no upload, auth, routing, filtering, or data layer.

## About the Design Files
The files in this bundle are **design references created in HTML** — a prototype showing intended look and behavior, not production code to copy. The task is to **recreate this design in the target codebase's existing environment** (React, Vue, Svelte, SwiftUI, etc.) using its established component patterns, styling approach, and libraries. If no codebase exists yet, pick the framework that best fits the project (React + Vite + Tailwind is a reasonable default for this kind of app) and implement it there.

`SketchyArt Gallery.dc.html` is a self-contained HTML prototype: open it in a browser to see the design live. Its markup is inline-styled on purpose (prototype constraint) — in production, move these values into the codebase's theme/token system rather than copying inline styles.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and hover states are final-intent. Recreate the UI closely. Artwork thumbnails are deliberate placeholders (hatched boxes reading `[ artwork ]`) — replace with real `<img>` elements at the same aspect ratios.

## Screens / Views
Single view, five regions, stacked vertically in a `min-height: 100vh` flex column with the footer pushed down (`margin-top: auto`).

Content regions share: `max-width: 1400px`, `width: 100%`, `margin: 0 auto`, horizontal padding `clamp(20px, 5vw, 64px)`.

### 1. Header bar
- Sticky (`top: 0`, `z-index: 10`), `backdrop-filter: blur(12px)`, background = theme `bgTranslucent`, `border-bottom: 1px solid` theme `line`.
- Padding `20px clamp(20px, 5vw, 64px)`. `display: flex; align-items: center; justify-content: space-between; gap: 24px`.
- **Wordmark** (left): "Sketchy" + "Art". Instrument Serif 24px, `letter-spacing: 0.02em`. "Art" is `#c9a86a` and italic. Links to home.
- **Nav** (center): Gallery / Collections / Tags. Instrument Sans 14px, uppercase, `letter-spacing: 0.06em`, `gap: clamp(16px, 3vw, 36px)`. Active item ("Gallery") uses theme `text` with `border-bottom: 1px solid #c9a86a; padding-bottom: 2px`. Inactive items use theme `muted`; hover → `#c9a86a`.
- **Right cluster**: `display: flex; align-items: center; gap: 16px`.
  - **Theme toggle button**: `1px solid` theme `line`, transparent bg, padding `8px 12px`, `gap: 8px`. Glyph (`☾` dark / `☀` light) at 14px + label ("Dark" / "Light") at 12px uppercase `letter-spacing: 0.08em`, color theme `muted`. Hover → border and text `#c9a86a`.
  - **Owner state only**: "+ Upload" button — solid `#c9a86a`, text `#0e0e10`, 13px uppercase `letter-spacing: 0.08em`, padding `10px 20px`, no border, no radius.
  - **Visitor state only**: "Owner sign in" text link, 13px uppercase `letter-spacing: 0.08em`, color theme `faint`.

### 2. Intro (optional, toggleable)
- Padding `clamp(48px, 9vw, 120px) … clamp(32px, 5vw, 72px)`.
- Eyebrow: "A personal gallery" — 12px, uppercase, `letter-spacing: 0.24em`, color theme `faint`, `margin-bottom: 16px`.
- Headline: "Drawings, kept quietly in one place." — Instrument Serif 400, `font-size: clamp(36px, 6vw, 72px)`, `line-height: 1.05`, `max-width: 14em`, `text-wrap: pretty`.

### 3. Collections
- Section header row: `display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 24px`. Left: "Collections", Instrument Serif 400 22px, color theme `dim`. Right: "View all" link, 13px, theme `faint`.
- Grid: `repeat(auto-fill, minmax(220px, 1fr))`, `gap: 16px`.
- **Collection card**: `1px solid` theme `line`, background theme `surface`, `padding: 20px`, flex column `gap: 12px`, `transition: border-color .2s`, hover border `#c9a86a`. Contains:
  - Swatch block: `height: 90px`, `opacity: .85`, a 135° two-stop gradient (per-collection, see Design Tokens). This stands in for a cover image — in production use the collection's cover thumbnail.
  - Name: Instrument Serif 18px, theme `text`.
  - Count: `"{n} pieces"`, 12px uppercase `letter-spacing: 0.06em`, theme `faint`.

### 4. All work (grid + tag filters)
- Header row same pattern as Collections but `flex-wrap: wrap`. Left: "All work". Right: tag chip row, `display: flex; gap: 8px; flex-wrap: wrap`.
- **Tag chip**: 12px, `letter-spacing: 0.06em`, padding `6px 12px`, `1px solid` theme `line`, color theme `muted`; hover border + text `#c9a86a`. No active/selected state is designed yet — add one (suggest filled `#c9a86a`, dark text) when filtering is implemented.
- **Masonry grid**: CSS multi-column — `columns: 4 320px; column-gap: 20px`. Children use `break-inside: avoid; margin-bottom: 20px`. (A JS masonry lib is unnecessary; CSS columns fill top-to-bottom per column, which is acceptable here. If strict left-to-right ordering matters, switch to a JS/grid masonry.)
- **Piece card**: flex column `gap: 10px`.
  - Thumbnail: `width: 100%`, per-piece `aspect-ratio` (`3/4`, `2/3`, `4/5`, `1/1`, `16/10`), `1px solid` theme `line`, background = theme `hatch` diagonal stripe, centered 11px monospace label `[ artwork ]` in theme `faint`. Hover border `#c9a86a`, `transition: border-color .2s`.
  - Title: 14px, theme `text`.
  - Meta: `"{medium} · {year}"`, 12px, theme `faint`.

### 5. Footer
- `border-top: 1px solid` theme `line`, padding `28px clamp(20px, 5vw, 64px)`, `display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap`.
- Left: "SketchyArt Gallery — the silent curator", 12px uppercase `letter-spacing: 0.08em`, theme `faint`. Right: "© 2026", 12px, theme `faint`.

## Interactions & Behavior
- **Theme toggle** — the only working interaction. Click flips dark ⇄ light, writes the choice to `localStorage` under key `sketchyart-theme` (`"dark"` | `"light"`), and restores it on mount. Root container animates with `transition: background .3s, color .3s`; theme swap otherwise instant. Consider honoring `prefers-color-scheme` as the initial value when nothing is stored.
- **Hover states** — collection cards, piece thumbnails, tag chips: border → `#c9a86a` over 200ms. Nav and toggle: text → `#c9a86a`.
- **Everything else is inert** — nav links, "View all", tag chips, cards, Upload, and Owner sign in are visual only. Wire to routes/handlers when implementing.
- **No loading, empty, or error states are designed.** Needed for production: skeleton for the grid, empty state for a gallery with no pieces, per-image load/failure fallback.
- **Responsive**: fully fluid, no media queries. Horizontal padding and headline size scale with `clamp()`; collections grid and masonry reflow by column count; header nav gap compresses; footer wraps. On narrow phones the header row gets tight — when implementing, collapse nav into a menu below ~640px and consider hiding the toggle label (keep the glyph).

## State Management
Minimal:
- `theme: "dark" | "light"` — component state, persisted to `localStorage["sketchyart-theme"]`, read on mount. In production hoist to app-level theme context/provider.
- `role: "visitor" | "owner"` — comes from auth in production; drives Upload vs. Owner sign in.
- `showIntro: boolean` — prototype-only toggle; in production the intro likely shows on the root gallery route and hides on filtered/collection routes.
- `gridDensity: "airy" | "comfortable" | "dense"` — prototype-only knob mapping to `columns` (`3 380px` / `4 320px` / `5 300px`). Ship as a user preference or drop it.

Data needs: list of collections (`{ id, name, pieceCount, coverImage }`) and list of pieces (`{ id, title, medium, year, imageUrl, aspectRatio, tags[] }`). Aspect ratio should come from stored image dimensions so the grid doesn't reflow after images load.

## Design Tokens

### Accent (shared by both themes)
`--accent: #c9a86a` (muted gold). Used for hover borders, active nav underline, the Upload button, and the italic "Art" in the wordmark. On-accent text: `#0e0e10`.

### Dark theme
| Token | Value | Use |
|---|---|---|
| `bg` | `#0e0e10` | page background |
| `bgTranslucent` | `rgba(14,14,16,0.92)` | sticky header |
| `surface` | `#131316` | collection cards |
| `line` | `#1e1e22` | all borders/dividers |
| `text` | `#e8e6e1` | primary text |
| `dim` | `#b7b4ac` | section headings |
| `muted` | `#8a8880` | nav, chips |
| `faint` | `#57554f` | meta, footer, eyebrow |
| `hatch` | `repeating-linear-gradient(45deg, #17171a 0, #17171a 10px, #131316 10px, #131316 20px)` | thumbnail placeholder |

### Light theme
| Token | Value | Use |
|---|---|---|
| `bg` | `#f6f4ef` | page background |
| `bgTranslucent` | `rgba(246,244,239,0.92)` | sticky header |
| `surface` | `#fffdf8` | collection cards |
| `line` | `#e0dcd2` | all borders/dividers |
| `text` | `#1c1b18` | primary text |
| `dim` | `#4a4842` | section headings |
| `muted` | `#6f6c63` | nav, chips |
| `faint` | `#9a968b` | meta, footer, eyebrow |
| `hatch` | `repeating-linear-gradient(45deg, #ece8e0 0, #ece8e0 10px, #f4f1ea 10px, #f4f1ea 20px)` | thumbnail placeholder |

### Collection swatch gradients (placeholder cover art, 135°)
Dark: `#2b2620→#4a3d2a`, `#1f2428→#2e3a40`, `#26202b→#3d2e44`, `#202822→#2c4033`
Light: `#e8dcc6→#cbb68c`, `#d9e2e6→#adc0c8`, `#e2d7e6→#c2aecb`, `#d9e3da→#aec4b3`

### Typography
- Display / headings / collection names: **Instrument Serif** 400 (italic variant used for "Art").
- UI / body: **Instrument Sans** 400–600.
- Monospace (placeholder label only): system `ui-monospace, Menlo, monospace`.
- Scale in use: 11, 12, 13, 14, 18, 22, 24, `clamp(36px, 6vw, 72px)`.
- Letter-spacing: `0.02em` wordmark · `0.06em` nav/chips/counts · `0.08em` buttons/footer · `0.24em` eyebrow. Uppercase everywhere letter-spacing ≥ `0.06em` except collection counts' sibling text.
- Line-height: `1.05` on the headline; default elsewhere.

### Spacing / geometry
- Spacing scale: 2, 4, 8, 10, 12, 16, 20, 24, 28 px, plus fluid `clamp(20px, 5vw, 64px)` (gutter), `clamp(40px, 6vw, 80px)` / `clamp(56px, 8vw, 96px)` (section bottoms), `clamp(48px, 9vw, 120px)` (intro top).
- **Border radius: 0 everywhere.** Sharp corners are intentional.
- **No shadows.** Depth comes from 1px borders and the `surface`/`bg` split. Preserve this.
- Borders: always `1px solid` theme `line`.
- Transitions: `200ms` on hover border color; `300ms` on theme background/color.

## Assets
None bundled. Fonts load from Google Fonts (Instrument Serif, Instrument Sans) — self-host in production. All artwork and collection covers are CSS placeholders (hatch pattern, gradients) and must be replaced with real images. No icon library is used; the theme toggle uses the text glyphs `☾` / `☀` — swap for the codebase's icon set (e.g. Lucide `moon`/`sun`).

## Screenshots
Reference captures in `screenshots/` (top of page and the masonry grid, in both themes):
- `01-theme.png` — dark, above the fold
- `02-theme.png` — light, above the fold
- `01-grid.png` — dark, "All work" grid
- `03-grid.png` — light, "All work" grid

## Files
- `SketchyArt Gallery.dc.html` — the full prototype. Open directly in a browser. Layout and styling live in the markup near the top of the file; theme tokens, dummy collections, dummy pieces, and the toggle logic live in the `<script>` class at the bottom (`THEMES`, `collections`, `pieces`, `toggleTheme`).
- `support.js` — prototype runtime only. **Not part of the design; do not port.**
