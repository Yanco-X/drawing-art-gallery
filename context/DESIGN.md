---
name: SketchyArt Gallery
accent:
  accent: '#c9a86a'
  on-accent: '#0e0e10'
themes:
  dark:
    bg: '#0e0e10'
    bg-translucent: 'rgba(14,14,16,0.92)'
    surface: '#131316'
    line: '#1e1e22'
    text: '#e8e6e1'
    dim: '#b7b4ac'
    muted: '#8a8880'
    faint: '#57554f'
    danger: '#c96a5a'
    hatch: 'repeating-linear-gradient(45deg, #17171a 0px, #17171a 10px, #131316 10px, #131316 20px)'
  light:
    bg: '#f6f4ef'
    bg-translucent: 'rgba(246,244,239,0.92)'
    surface: '#fffdf8'
    line: '#e0dcd2'
    text: '#1c1b18'
    dim: '#4a4842'
    muted: '#6f6c63'
    faint: '#9a968b'
    danger: '#a33f2f'
    hatch: 'repeating-linear-gradient(45deg, #ece8e0 0px, #ece8e0 10px, #f4f1ea 10px, #f4f1ea 20px)'
swatches:
  dark: ['#2b2620 to #4a3d2a', '#1f2428 to #2e3a40', '#26202b to #3d2e44', '#202822 to #2c4033']
  light: ['#e8dcc6 to #cbb68c', '#d9e2e6 to #adc0c8', '#e2d7e6 to #c2aecb', '#d9e3da to #aec4b3']
typography:
  display:
    fontFamily: Instrument Serif
    fontWeight: '400'
    fontSize: clamp(36px, 6vw, 72px)
    lineHeight: '1.05'
  section-heading:
    fontFamily: Instrument Serif
    fontWeight: '400'
    fontSize: 22px
  wordmark:
    fontFamily: Instrument Serif
    fontSize: 24px
    letterSpacing: 0.02em
  card-title:
    fontFamily: Instrument Serif
    fontSize: 18px
  nav:
    fontFamily: Instrument Sans
    fontSize: 14px
    letterSpacing: 0.06em
    textTransform: uppercase
  body:
    fontFamily: Instrument Sans
    fontSize: 14px
  button:
    fontFamily: Instrument Sans
    fontSize: 13px
    letterSpacing: 0.08em
    textTransform: uppercase
  meta:
    fontFamily: Instrument Sans
    fontSize: 12px
  eyebrow:
    fontFamily: Instrument Sans
    fontSize: 12px
    letterSpacing: 0.24em
    textTransform: uppercase
  placeholder:
    fontFamily: ui-monospace
    fontSize: 11px
    letterSpacing: 0.05em
rounded:
  DEFAULT: 0
spacing:
  base: 2px
  scale: [2, 4, 8, 10, 12, 16, 20, 24, 28]
  gutter: clamp(20px, 5vw, 64px)
  intro-top: clamp(48px, 9vw, 120px)
  intro-bottom: clamp(32px, 5vw, 72px)
  section-sm: clamp(40px, 6vw, 80px)
  section-lg: clamp(56px, 8vw, 96px)
  content-max: 1400px
motion:
  hover: 200ms
  theme-swap: 300ms
  layout-reflow: 300ms cubic-bezier(0.2, 0, 0, 1)
---

## Brand & Style

The design system is rooted in the concept of a "Silent Curator." It prioritizes the artwork above all else, using a restrained framework that provides a backdrop rather than competing with the work on the wall.

The personality is quiet and editorial: a serif display face, sharp corners, hairline rules, and a single warm gold accent used sparingly. Nothing glows, nothing floats, nothing bounces. Where the previous system reached for tonal layers and ambient depth, this one reaches for a 1px line and a change of background. The restraint is the point -- every visual effect the UI does not spend is attention returned to the drawings.

The system ships two full themes of equal standing. Dark reads as a dim private viewing room; light reads as warm gallery paper, not as a white screen.

## Themes & Color

Every colour is a semantic token, defined once per theme. Components never reference a hex directly -- the only literal in component code is the accent, which is shared by both themes.

### Text hierarchy

Four steps, from loudest to quietest. Picking the right step is most of the work of styling text in this system.

| Token | Role | Dark | Light |
|---|---|---|---|
| `text` | Primary -- headline, piece titles, wordmark, active nav | `#e8e6e1` | `#1c1b18` |
| `dim` | Section headings ("Collections", "All work") | `#b7b4ac` | `#4a4842` |
| `muted` | Nav links, control labels | `#8a8880` | `#6f6c63` |
| `faint` | Meta, counts, eyebrow, footer, "View all" | `#57554f` | `#9a968b` |

### Surface and structure

| Token | Role | Dark | Light |
|---|---|---|---|
| `bg` | Page background | `#0e0e10` | `#f6f4ef` |
| `bg-translucent` | Sticky header behind a 12px blur | `rgba(14,14,16,0.92)` | `rgba(246,244,239,0.92)` |
| `surface` | Raised panels (collection cards) | `#131316` | `#fffdf8` |
| `line` | Every border and divider in the UI | `#1e1e22` | `#e0dcd2` |
| `danger` | Irreversible actions, and only those | `#c96a5a` | `#a33f2f` |
| `hatch` | Diagonal placeholder for missing artwork | see frontmatter | see frontmatter |

In the light theme `surface` and `bg` are nearly identical. The 1px `line` border is doing almost all of the work of defining a card -- get it wrong and the light theme collapses into a flat sheet.

### Accent

`#c9a86a`, a muted gold, shared by both themes. On-accent text is `#0e0e10`.

It is the only accent in the system and appears in exactly six places: hover borders, the active nav underline, the Upload button, active control states, the italic "Art" in the wordmark, and form focus with its required marks and errors. Adding a second accent colour, or spending this one on decoration, breaks the system.

### Danger

The one sanctioned exception to "no second colour", and it is a semantic token rather than an accent: it names a consequence, appears only where an action cannot be undone, and is never decorative. At the time of writing that is exactly two places -- the "Delete piece" hover state and the confirming button in a destructive dialog.

Unlike the accent, it is defined per theme: `#c96a5a` on the dark ground, `#a33f2f` on the light one. A single red cannot carry on both. Both clear WCAG AA against their own background (5.2:1 and 5.8:1).

The reasoning is worth keeping. Reusing the gold would have made "Delete permanently" look identical to "Add to gallery", and the muscle memory that gold means *proceed* is exactly what a destructive step needs to interrupt.

### Collection swatches

Four gradients at 135 degrees, cycled by index, used only as a placeholder where a collection has no cover image. They are decorative and carry no meaning -- do not use them to identify a collection. Values are in the frontmatter.

## Typography

Two families, loaded from Google Fonts today and to be self-hosted before production.

* **Instrument Serif** (400, with italic) -- display headline, section headings, collection and card names, wordmark.
* **Instrument Sans** (400-600) -- all UI and body text.
* **System monospace** -- the `[ artwork ]` placeholder label only.

Sizes in use: 11, 12, 13, 14, 18, 22, 24, `clamp(22px, 2.4vw, 32px)` for a piece title, and `clamp(36px, 6vw, 72px)` for the display headline. Resist adding steps -- the piece title deliberately takes 22 as its floor rather than introducing a new fixed size.

Letter-spacing carries meaning and pairs with case:

| Tracking | Applied to | Case |
|---|---|---|
| `0.02em` | Wordmark | Mixed |
| `0.06em` | Nav, control labels, collection counts | Uppercase, except control labels |
| `0.08em` | Buttons, footer, "Owner sign in" | Uppercase |
| `0.24em` | Eyebrow | Uppercase |

Line-height is `1.05` on the display headline and default everywhere else.

## Layout & Spacing

Fluid, with no media queries in the content regions. Horizontal padding and headline size scale with `clamp()`; the collections grid and masonry reflow by column count on their own.

* Content regions are capped at **1400px** and centred, with `clamp(20px, 5vw, 64px)` horizontal gutters.
* The header and footer span the full viewport -- their background and border are edge to edge -- but their **inner content is capped to the same 1400px** so it lines up with the page below.
* Collections use `repeat(auto-fill, minmax(220px, 1fr))` at a 16px gap.
* The masonry is CSS multi-column with a 20px column gap. See Components for density values.
* Spacing steps: 2, 4, 8, 10, 12, 16, 20, 24, 28. Section rhythm uses the fluid values in the frontmatter.

There are two breakpoints in the system, and no others:

* **640px** -- below this the header collapses (see Components).
* **1024px** -- below this the piece page stacks its artwork and wall label into one column. A fluid `auto-fit` was rejected here because it would give the label equal width to the artwork, which inverts the hierarchy.

## Elevation & Depth

There is no elevation model. **No shadows anywhere.**

Depth comes from exactly two devices: a 1px `line` border, and the `surface` against `bg` split. Every border in the UI is `1px solid` in the `line` token -- there are no 2px borders, no coloured borders except the accent on hover, and no dividers that are not this.

## Shapes

**Border radius is 0 everywhere.** Buttons, cards, thumbnails, controls, inputs. The sharp corners are a deliberate identity choice, not an oversight, and they are the single easiest thing to destroy by reaching for a familiar `rounded-*` utility.

## Motion

The motion budget is deliberately small.

| Duration | Applied to |
|---|---|
| 200ms | Hover transitions -- border colour and text colour |
| 300ms | Theme swap (background and colour) |
| 300ms `cubic-bezier(0.2, 0, 0, 1)` | Masonry reflow when grid density changes |

No stagger, no scale, no entrance animations. Motion acknowledges an action and gets out of the way.

All motion must be skipped under `prefers-reduced-motion: reduce`.

## Components

### Header

Sticky at `top: 0`, `z-index: 10`, 12px backdrop blur, `bg-translucent` background, bottom border in `line`. Padding `20px` vertical.

* **Wordmark** -- "Sketchy" in `text` plus "Art" in accent italic, Instrument Serif 24px.
* **Nav** -- Gallery / Collections / Tags, 14px uppercase. Active item is `text` with a 1px accent bottom border and 2px of padding beneath; inactive items are `muted` and go accent on hover. The nav sits left of centre; this is a natural result of a three-cluster `space-between` row and is correct.
* **Theme toggle** -- 1px `line` border, transparent fill, glyph plus label. **The label names the theme currently active, not the one it switches to.** The accessible name states the action.
* **Owner state** -- a solid accent "+ Upload" button. **Visitor state** -- an "Owner sign in" text link in `faint`.
* **Below 640px** -- the nav collapses behind a menu button drawn as three 1px bars, the toggle drops to its glyph, and "Owner sign in" moves into the menu panel.

### Intro

Optional. Eyebrow in `faint` at 12px / `0.24em`, then the display headline capped at `14em` with `text-wrap: pretty`. Shown on the root gallery view; hidden on filtered and collection routes.

### Collection card

1px `line` border, `surface` background, 20px padding, 12px column gap, border goes accent on hover over 200ms. Contains a 90px cover strip at 85% opacity (the cover image, or a gradient swatch as fallback), then a 4px-gap block of the name in Instrument Serif 18px and the count in 12px uppercase `faint`.

### Piece card

A 10px-gap column: thumbnail, then a 2px-gap block of title (14px `text`) and meta (12px `faint`, formatted `{medium} · {year}`).

The thumbnail carries a 1px `line` border that goes accent on hover, and its `aspect-ratio` comes from the piece's stored image dimensions. The `hatch` gradient sits behind the image so a slow or failed load shows the placeholder rather than a hole; on error the `[ artwork ]` monospace label is shown.

**Aspect ratios must be persisted at upload time, never measured in the browser.** The masonry reserves each card's height from that value; deriving it after load would reflow the entire grid as images arrive.

### Masonry grid

CSS multi-column. Children use `break-inside: avoid` and a 20px bottom margin.

Reading order runs top-to-bottom down each column rather than left-to-right across rows. This is an accepted trade-off of the CSS-columns approach; a JS or grid masonry would be required to change it.

Density is a persisted user preference:

| Density | `columns` | At 1400px content |
|---|---|---|
| Airy | `3 380px` | 3 columns |
| Comfortable | `4 290px` | 4 columns |
| Dense | `5 230px` | 5 columns |

The second value is a *threshold* for how many columns fit, not the rendered column width -- actual width is `(container - gaps) / count`. All three stay visually distinct down to roughly a 1200px viewport; below that the available width genuinelyñ cannot support three separate column counts and they begin to coincide.

Changing density animates via FLIP: positions are captured, the reflow is applied, and each card is played from its old offset back to zero on `transform` only. `columns` is not an animatable property, so nothing else would work.

### Density control

A single group with one 1px `line` border and hairline dividers between options -- deliberately *not* three separate chips, so it reads as one control. Options are 12px with `0.06em` tracking and chip padding, sentence case. The active option is filled accent with `on-accent` text.

### Piece page

Not present in the original handoff -- designed against this system as a **gallery wall label**. The artwork keeps the room; the metadata sits beside it, small and quiet, separated by a hairline rather than boxed in a panel. No new visual vocabulary was introduced.

* **Layout** -- a two-column grid, `minmax(0, 1fr)` for the artwork and a fixed `320px` rail. Below 1024px the two stack and the dividing rule turns from a left border into a top border.
* **Artwork** -- capped at `78vh` so a tall portrait still sits beside its label instead of pushing it below the fold, and centred in its column, since the cap often leaves it narrower than the column and hugging one edge would strand the rule. 1px `line` border and the `hatch` behind it, exactly as in the grid.
* **Wall label** -- title at `clamp(22px, 2.4vw, 32px)` serif, then `{medium} · {year}` in 12px `faint`. Below that, optional blocks separated by `line` rules: description, tags, and the collections a piece belongs to. Each block is labelled in 12px uppercase `faint`.
* **Blocks are omitted entirely when empty.** A heading with nothing under it is louder than no heading. Descriptions are blank in the current data, so that block simply does not render.
* **Tags render as static bordered chips, not links** -- there is no tag route to point at, and a chip that looks clickable but is not is worse than a plain one.
* **Prev/next** -- neighbours in gallery order, sharing the back-link row above the artwork and right-aligned against it. Same treatment as the back link (13px uppercase, `0.08em`, `faint`, accent on hover), so the row reads as one set of quiet actions. Piece titles move to the tooltip and the accessible name; at this size the labels alone carry the action, and keeping them short is what lets the control stay above the fold. Ends are open rather than wrapping, and the unavailable side renders disabled at 40% opacity rather than being omitted, so the row does not reflow between pieces.
* **Not found** -- an unknown id gets the eyebrow-plus-headline treatment from the intro, at a reduced size, with a link back.

### Upload modal

The first form in the system, so it defines the form vocabulary the rest will inherit. Built on a native `<dialog>`: focus trapping, Escape, an inert background and top-layer stacking come from the platform rather than from a hand-rolled trap.

* **Panel** -- `surface` on a 1px `line` border, `min(94vw, 940px)` wide, capped at `90vh` with the body scrolling inside. Header and footer are divided by hairlines, not by elevation. The backdrop is `black/70` under a 3px blur, echoing the sticky header.
* **Two columns above 640px** -- artwork left, fields right, stacking below. The image is given the larger half because it is the subject.
* **Drop zone** -- `hatch` when empty, which is already the system's mark for absent artwork, so nothing new was invented. `line` border turning `accent` on hover and while a file is dragged over it. On drop it becomes the preview, `object-contain` under a 420px cap, with filename and size in 12px `faint` below.
* **Field labels use `muted`, not `faint`.** Meta text is allowed to recede; an instruction is not. This is the one place the eyebrow letterform (12px, uppercase, `0.24em`) is paired with a louder colour, and the reason is legibility.
* **Inputs** -- `bg` inside a `surface` panel, so the recess reads as a change of background rather than an inset shadow. 1px `line` border, radius 0, 14px `text`, placeholders in `faint`. Focus takes an `accent` border *and* a 1px `accent` outline: a border change alone is too quiet at this line weight, and an outline is a focus ring, not elevation.
* **Tag chips** -- typed into the field and committed with Enter or comma; Backspace on an empty field removes the last. Same bordered chip as the wall label, but interactive here, so they take the `accent` hover the static ones do not. Duplicates collapse case-insensitively because the backend slugifies.
* **Required marks** -- an `accent` asterisk. The sixth and last place the accent is spent.
* **Errors** in `accent`, bottom-left, `role="alert"`, and cleared by any edit -- a message that outlives the problem it describes reads as though the form is still refusing.
* **Actions** -- bordered ghost "Cancel", solid `accent` "Add to gallery". Both disable during upload, and Escape is refused mid-request so a stray keypress cannot abandon work already in flight.

### Destructive confirmation

Deleting a piece removes the row, the original, and both renditions, with no undo. The design carries that weight in three places rather than one.

* **The affordance is quiet and out of the way.** "Delete piece" is the last item in the wall label rail, below a hairline, at 13px uppercase `faint` -- the same treatment as the back link. It never appears in the top row beside prev/next, where a cursor is already moving between pieces. Hover is the only place it takes `danger`; at rest it is as quiet as the metadata around it.
* **Owner only.** The prop is omitted for visitors, so the block does not render at all rather than rendering disabled.
* **The dialog does the persuading.** Native `<dialog>`, 480px, no close ×. Omitting the × means the first focusable element is Cancel, so the dialog opens with focus on the safe choice and a stray Enter does nothing. Escape and backdrop clicks cancel, and both are refused mid-request.
* **It names the piece and states the consequence** in two short paragraphs: what is removed from where, then that it cannot be undone and what the owner is left with. Generic "Are you sure?" copy is not enough when the thing being destroyed is the only copy.
* **The confirming button is outlined, not filled.** A filled button is an invitation and this is not one. It fills on hover, which is the moment the choice is actually being made.

### Footer

Top border in `line`, 28px vertical padding, content split left and right and allowed to wrap. Both strings are 12px `faint`.

## Implementation Notes

* **Tailwind CSS v4.** Tokens live in `@theme inline` in `frontend/src/index.css`, mapping to plain custom properties defined under `:root` and `:root[data-theme="light"]`. `inline` is what makes utilities resolve the variable at the use site, which is what allows a live theme swap.
* **Theme is stamped on `<html>` as `data-theme`** by an inline script in `index.html` that runs before first paint, so there is no flash of the wrong palette. It resolves stored choice, then `prefers-color-scheme`, then dark.
* **Storage keys**: `sketchyart-theme` (`"dark"` | `"light"`) and `sketchyart-grid-density` (`"airy"` | `"comfortable"` | `"dense"`). A theme is written only on an explicit toggle -- writing on mount would freeze the OS-derived default for a visitor who never chose.
* **A no-JS fallback** honours `prefers-color-scheme` through a media query guarded as `:root:not([data-theme="dark"])`.

### Inline style exceptions

`coding-preferences.md` forbids inline styles, and the rule holds everywhere a value is known ahead of time. Three values in this UI are resolved at runtime and cannot be expressed as static utility classes, because Tailwind only emits classes it can see in the source:

1. `aspect-ratio` on a piece thumbnail -- a continuous value from stored image dimensions.
2. `columns` on the masonry -- selected from the density map at runtime.
3. The collection swatch gradient -- selected by card index.

Cases 2 and 3 draw from a fixed, enumerable set and *could* be rewritten as static class lookups. Case 1 cannot. These are the only sanctioned exceptions; anything else uses a token.

## Accessibility

* The `faint` token does not meet WCAG AA for normal text in either theme -- roughly 2.6:1 dark and 2.7:1 light, against a 4.5:1 bar. It carries meta, counts, the eyebrow and the footer, all at 12px. This is a deliberate aesthetic choice and is documented here so it is a decision rather than an accident. Raising it to `#807d75` (dark) and `#6e6a60` (light) would clear 4.5:1 and is a two-line change.
* Accent gold on the light background is roughly 1.9:1, which matters where it is used as light-theme nav hover text.
* Controls that toggle carry `aria-pressed`; the density group carries `role="group"` and a label; the menu button carries `aria-expanded` and `aria-controls`.
* All motion is skipped under `prefers-reduced-motion: reduce`.

## Deviations From The Prototype

Recorded so they are not mistaken for drift:

1. **Header and footer inner content is capped at 1400px.** The prototype left them full-bleed, which put the wordmark outside the headline's left edge above 1400px.
2. **Density values were retuned** from `4 320px` / `5 300px`. Inside the 1400px cap those both collapsed back to three columns, making all three densities render identically.
3. **The density control is new.** The prototype exposed density as a developer knob with no UI.
4. **Tag filter chips are not currently shown.** Pieces still carry tags; the chip row was removed pending real filtering work.
5. **A per-image failure fallback was added**, which the prototype did not design.
