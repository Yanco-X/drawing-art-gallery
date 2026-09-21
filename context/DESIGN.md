---
name: YanCurations
accent:
  accent: '#c9a86a'
  on-accent: '#0e0e10'
themes:
  dark:
    bg: '#202021'
    bg-translucent: 'rgba(32,32,33,0.92)'
    surface: '#232326'
    line: '#2b2b2f'
    text: '#e8e6e1'
    dim: '#b7b4ac'
    muted: '#97958d'
    faint: '#62605a'
    danger: '#d77868'
    hatch: 'repeating-linear-gradient(45deg, #262629 0px, #262629 10px, #232326 10px, #232326 20px)'
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
  dark: ['#37322c to #554835', '#2c3135 to #39454b', '#332d38 to #48394f', '#2c342e to #374b3e']
  light: ['#e8dcc6 to #cbb68c', '#d9e2e6 to #adc0c8', '#e2d7e6 to #c2aecb', '#d9e3da to #aec4b3']
typography:
  display:
    fontFamily: Instrument Serif
    fontWeight: '400'
    fontSize: clamp(28px, 4vw, 48px)
    lineHeight: '1.05'
  section-heading:
    fontFamily: Instrument Serif
    fontWeight: '400'
    fontSize: 22px
  wordmark:
    fontFamily: Instrument Serif
    fontSize: 32px
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
  header: 77px
  intro-top: clamp(28px, 4vw, 64px)
  intro-bottom: clamp(24px, 3.5vw, 48px)
  section-sm: clamp(40px, 6vw, 80px)
  section-lg: clamp(56px, 8vw, 96px)
  content-max: 2400px
motion:
  hover: 200ms
  theme-swap: 300ms
  layout-reflow: 300ms cubic-bezier(0.2, 0, 0, 1)
---

## Brand & Style

The design system is rooted in the concept of a "Silent Curator." It prioritizes the artwork above all else, using a restrained framework that provides a backdrop rather than competing with the work on the wall.

The personality is quiet and editorial: a serif display face, sharp corners, hairline rules, and a single warm gold accent used sparingly. Nothing glows, nothing floats, nothing bounces. Where the previous system reached for tonal layers and ambient depth, this one reaches for a 1px line and a change of background. The restraint is the point -- every visual effect the UI does not spend is attention returned to the drawings.

The system ships two full themes of equal standing. Dark reads as a dim private viewing room; light reads as warm gallery paper, not as a white screen.

**The dark ground was lifted from `#0e0e10` to `#202021` on 2026-09-08**, and the rest of the dark palette was re-derived from it. The reason is the work: every piece here is graphite on white or pale grey paper, so a near-black page put a bright rectangle on a near-black field, and reading a wall of them was tiring. A gallery dims the room, it does not black it out.

The method is worth keeping, because "lighten the background" is not one change. Every dark token was positioned against the old ground, so raising it broke three things at once: `line` fell to 1.02:1 and borders became invisible, while `surface` and `hatch` ended up *darker* than the page they sit on -- cards and placeholders reading as holes rather than as raised things.

So the tokens at or below `muted` were re-derived to hold the exact contrast ratio they had against the old ground, and the loud end -- `text` and `dim` -- was left alone and allowed to soften. That split is the whole idea: the quiet end carries structure and legibility and must not degrade, while the loud end is precisely what was too loud. `text` fell from 15.5:1 to 13.1:1 and `dim` from 9.3:1 to 7.9:1, which is the change working rather than something to correct.

`danger` was re-derived too, to `#d77868`. Left alone it fell to 4.4:1 and quietly stopped clearing AA, which is not a thing to discover later on the one control that cannot be undone.

### Logo

The owner's drawn figure, arms out. **Added 2026-09-18.** `logos/` holds the files as supplied. The header's exports are copies in `frontend/public/`; the favicons are derived and live in `frontend/public/brand/`, per the asset kit's layout.

| File | Size | Used for |
|---|---|---|
| `brand/favicon.ico` | 16, 20, 24, 32, 40, 48, 64 | Browser tabs, desktop and phone |
| `brand/favicon-192.png` | 192 | The phone home screen: `apple-touch-icon` on iOS, the 192 icon on Android |
| `brand/favicon-32.png` | 32 | Served as an explicit PNG candidate beside the ICO |
| `logos/favicon-*.png`, `favicon.ico` | as named | The kit's full-body exports. Superseded, kept as supplied |
| `logo-1024.png` | 977 x 1024 | Not served |
| `logo.png`, `logo-lines-only.png` | 4648 x 4872 | Masters |

* **The favicons are the head alone, not the figure. Changed 2026-09-20.** The full-body mark loses the face at 16-32px and reads as a grey smudge, which the kit's brief names as a known limitation. The crop is measured off the alpha channel rather than judged by eye: the head occupies x 979-4161 and y 36-2700, and the arms do not enter until y 2850, so there is a 150px band below the jaw to cut in. Two earlier attempts failed there and are worth not repeating -- one cut at y 2646, straight along the jaw stroke, which left the chin with no outline; the next squared the frame by cropping 191px off each side, which sliced the curved silhouette flat and read as damage. The head is 3182 wide by 2754 tall, so a square has roughly 15% vertical slack that nothing can fill without cutting the outline or pulling the arms in. It is padded, not cropped.
* **The ICO carries every size Windows asks for**, which is 16px times the display scale: 20 at 125%, 24 at 150%, 32 at 200%. With only 16/32/48 in the file a scaled monitor made the browser resample an already-tiny bitmap, and that is what read as blurry. It is declared `sizes="any"`, not `32x32` -- the latter tells a browser the file holds one image.
* **Each size is reduced in two steps with its contrast restored afterwards.** A single resample from the master lands thin lineart as mid-grey. The same treatment is wrong for the header's exports, where the figure is small in frame and the adjustment thins the strokes instead of deepening them.

* **The header has its own exports**, `frontend/public/logo-{40,50,60,80,120}.png`, offered as one `srcset` so each screen fetches the one that matches it. The mark is 48px since 2026-09-20, so 1x takes the 50 and 1.5x the 80; only a 3x phone comes up short and stretches the 120. Made from `logos/logo.png` in a single Lanczos resample, the figure at full height on a square canvas. The 192 was tried first and looked soft: the browser shrank an already-shrunk file by an odd factor. A new master means re-exporting all five.
* **The filled drawing, not the lines-only one.** Every served file is the figure filled white inside its black line. On dark the fill is what carries it: drawn in `text` at header size, the lines alone faded to a faint scribble, while the filled figure still reads as a figure. On light the fill disappears into the paper and the drawing looks as drawn.
* **Tabs.** On a dark tab strip the 16px figure is a clear white silhouette. On a light one the fill meets the white tab and only its grey edge shows. That comes from the drawing at 16px, not from the markup.
* **iOS paints a home-screen icon's transparency black.** The white fill keeps the figure legible as a white cut-out on black. A drawing on paper there would take an opaque 180px export on `bg`.

### Rules and dividers

The owner's own pencil strokes, photographed and extracted, standing in for the hairline on the page's structural lines. **Added 2026-09-20.** Eleven freehand strokes and their rotations live in `pencil-lines/` as supplied; the ones a page actually uses are copies in `frontend/public/brand/lines/`. [`context/docs/yancurations-ui-assets.md`](docs/yancurations-ui-assets.md) is the kit's own brief and binds anything new -- height limits, the variation policy, and what must never be done to a stroke.

**Masked, never painted.** `@utility pencil-stroke` in `index.css` fills an element with `currentColor` and masks it with the stroke's PNG. One file therefore serves both themes and picks up whatever text colour its surface defines; each use sets `--stroke-src` and its own height and opacity. As an `<img>` or a `background-image` each stroke would need a second file for the dark theme and could not be toned per surface.

**Three weights, and they are a hierarchy.** Page chrome is 8px at `.8`, section boundaries 6px at `.7`, dividers inside a component 4-5px at `.65`. Below 4px the graphite grain flattens into plain grey and the asset stops earning its bytes; above about 14px a stroke reads as a smear rather than a line.

| Where | Stroke |
|---|---|
| Header, bottom | `rule-1`, the heaviest -- one structural line per page |
| Footer, top | `rule-5`, mirrored |
| Spotlight, bottom | `rule-6` |
| Landing page, Collections to All work | `rule-7`, mirrored |
| Wall label's edge, stacked | `rule-3` |
| Wall label's edge, beside the artwork | `divider-v-3`, down the whole column |
| Wall label's inner rules | `divider-4`, the lightest |
| Tag drawer's edge | `divider-v-2` |
| Tag drawer's header | `divider-3` |

**No stroke appears twice within one viewport.** That is the reason the kit holds eleven rather than one: a repeated wobble reads as a texture, which is the failure a hand-drawn rule exists to avoid. A new rule takes an unused stroke, or an existing one mirrored with `scaleX(-1)`. The vertical strokes are lossless 90-degree rotations of the horizontal ones, so `rule-3` and `rule-v-3` are the same wobble and count as the same stroke -- though at the compressions they are used at, perpendicular, they do not read as one.

**A rule straddles the boundary it marks**, half above it and half below, so it reads as drawn *on* the edge rather than resting above it. This is why `--spacing-header` is 76px and not 77: the header's rule hangs outside its box and is no longer part of its height.

**Between two sections a rule sits inside the gap they already leave.** `SectionRule` pulls up by `--spacing-rule-gap`, exactly half a section gap at every width, and gives the other half back, so adding one costs no vertical space at all. Its gutter is on a wrapper: a mask paints across padding, so padding on the stroke itself would stretch it rather than inset it.

**Everything else keeps its hairline.** Dialogs, chips, form fields, table rows, the curation board. The rule is one system per *surface*, not one system everywhere -- a page-structural rule and a chip border sit at different altitudes, and the kit has no corner strokes to draw a box with. A stroke is never a focus indicator either: the taper thins it at the ends and the irregular edge cannot hold the contrast a focus ring has to.

## Themes & Color

Every colour is a semantic token, defined once per theme. Components never reference a hex directly -- the only literal in component code is the accent, which is shared by both themes.

**Each theme declares its `color-scheme`**, so the parts the browser draws itself -- scrollbars, date pickers, checkboxes, the focal slider -- are drawn for the same ground. **Added 2026-09-18.** Undeclared, Chrome guessed dark for the page's own scrollbar from its background and drew every scrollbar inside the page light, which the tag drawer's list made plain.

### Text hierarchy

Four steps, from loudest to quietest. Picking the right step is most of the work of styling text in this system.

| Token | Role | Dark | Light |
|---|---|---|---|
| `text` | Primary -- headline, piece titles, wordmark, active nav | `#e8e6e1` | `#1c1b18` |
| `dim` | Section headings ("Collections", "All work") | `#b7b4ac` | `#4a4842` |
| `muted` | Nav links, control labels | `#97958d` | `#6f6c63` |
| `faint` | Meta, counts, eyebrow, footer, "View all" | `#62605a` | `#9a968b` |

One more token borrows from this ladder without being text: `chart-quiet`, the series drawn for context beside an accent one on the metrics chart. It is `faint` on dark and `muted` on light, because the gray that stays distinguishable from the gold differs by ground -- measured with a palette validator, and recorded in `METRICS.md` section 10 rather than judged by eye.

### Surface and structure

| Token | Role | Dark | Light |
|---|---|---|---|
| `bg` | Page background | `#202021` | `#f6f4ef` |
| `bg-translucent` | Sticky header behind a 12px blur | `rgba(32,32,33,0.92)` | `rgba(246,244,239,0.92)` |
| `surface` | Raised panels (collection cards) | `#232326` | `#fffdf8` |
| `line` | Every border and divider in the UI | `#2b2b2f` | `#e0dcd2` |
| `danger` | Irreversible actions, and only those | `#d77868` | `#a33f2f` |
| `hatch` | Diagonal placeholder for missing artwork | see frontmatter | see frontmatter |

In the light theme `surface` and `bg` are nearly identical. The 1px `line` border is doing almost all of the work of defining a card -- get it wrong and the light theme collapses into a flat sheet.

### Accent

`#c9a86a`, a muted gold, shared by both themes. On-accent text is `#0e0e10`.

It is the only accent in the system. Adding a second accent colour, or spending this one on decoration, breaks it.

**The rule is that the accent marks the one action a surface exists for, plus the places the interface has to point at itself.** It is not a list of six locations. An earlier version of this section enumerated six and declared the list closed; it was out of date within a fortnight, because a closed list cannot survive a new page, and each addition then looked like a violation rather than the rule working.

Two kinds of use, and they behave differently:

**Filled** -- solid `accent` with `on-accent` text -- is the principal action of a surface, and there is at most one per screen. The header's "+ Upload" for the owner, "Add to gallery" confirming the upload dialog, "Save arrangement" ending arrange mode, and "Detailed view" on a piece page, which for a visitor is the only thing that page offers. Two filled buttons in view at once means one of them is not the principal action; make it outlined.

**Outlined or hairline** -- `accent` on a border, a rule, or text -- is the interface pointing at something: hover borders, the active nav underline, active control states, form focus with its required marks and errors, the picked-tile number in a picker, the minimap's viewport rectangle, and the italic "Curations" in the wordmark. These may repeat, and often do.

`ICON_BUTTON_ACCENT` is the outlined box and `PAGE_ACTION` is the filled one; both live in `components/form-styles.ts`. Reach for an existing one before writing a third.

### Danger

The one sanctioned exception to "no second colour", and it is a semantic token rather than an accent: it names a consequence, appears only where an action cannot be undone, and is never decorative. At the time of writing that is exactly two places -- the "Delete piece" hover state and the confirming button in a destructive dialog.

Unlike the accent, it is defined per theme: `#d77868` on the dark ground, `#a33f2f` on the light one. A single red cannot carry on both. Both clear WCAG AA against their own background (5.3:1 and 5.8:1).

The reasoning is worth keeping. Reusing the gold would have made "Delete permanently" look identical to "Add to gallery", and the muscle memory that gold means *proceed* is exactly what a destructive step needs to interrupt.

### Collection swatches

Four gradients at 135 degrees, cycled by index, used only as a placeholder where a collection has no cover image. They are decorative and carry no meaning -- do not use them to identify a collection. Values are in the frontmatter.

## Typography

Two families, served from `frontend/public/fonts` through `src/fonts.css`, so no visitor's browser reports to Google.

* **Instrument Serif** (400, with italic) -- display headline, section headings, collection and card names, wordmark.
* **Instrument Sans** (400-600) -- all UI and body text.
* **System monospace** -- the `[ artwork ]` placeholder label only.

Sizes in use: 11, 12, 13, 14, 18, 22, 24, `clamp(22px, 2.4vw, 32px)` for a piece title, and `clamp(36px, 6vw, 72px)` for the display headline. Resist adding steps -- the piece title deliberately takes 22 as its floor rather than introducing a new fixed size.

Letter-spacing carries meaning and pairs with case:

| Tracking | Applied to | Case |
|---|---|---|
| `0.02em` | Wordmark | Mixed |
| `0.06em` | Nav, control labels, collection counts | Uppercase, except control labels |
| `0.08em` | Buttons, footer, menu rows | Uppercase |
| `0.24em` | Eyebrow | Uppercase |

Line-height is `1.05` on the display headline and default everywhere else.

## Layout & Spacing

Fluid, with no media queries in the content regions. Horizontal padding and headline size scale with `clamp()`; the collections grid and masonry reflow by column count on their own.

* Content regions are capped at **2400px** and centred, with `clamp(20px, 5vw, 64px)` horizontal gutters.
* The header and footer span the full viewport -- their background and border are edge to edge -- but their **inner content is capped to the same 2400px** so it lines up with the page below.
* The cap is deliberately above a 1920px laptop, so a large monitor gains columns rather than margin. Long text is not at risk from it: every headline and paragraph carries its own em-based measure (`max-w-[14em]`, `max-w-[16em]`, `max-w-[42em]`), so prose stays readable at any container width.
* Collections use `repeat(auto-fill, minmax(220px, 1fr))` at a 16px gap.
* **On the landing page, on a phone either way up, they are a row that scrolls sideways**, since 2026-09-19 (below 640px only at first; a phone on its side joined it the same day, through the `phone` variant). There the grid is one column, and the collections came between the spotlight and the wall a whole card's height each, so a visitor met them before the pieces. The row runs edge to edge, snaps a card to the gutter, and sizes each card to `min(280px, 72vw)` so the next one peeks in and says the row goes on. The collections index and the curation preview keep the grid; they are about the collections.
* **The spotlight's collections are the same row, since 2026-09-20**, inset rather than edge to edge: behind their toggle they sit in the clipper that animates the reveal, and the bleed would be cut off at the gutter. Two things let a finger scroll it instead of turning the band: `spokenFor` in `lib/swipe.ts` already hands a stroke to any sideways scroller under it, and **`touch-pan-y` moved off the band's `<section>` onto the artwork and the label's words** -- a browser intersects `touch-action` down the tree, so a band that forbids sideways panning forbids it for the row inside it as well. The row carries `overscroll-behavior-x: contain`, so a flick that runs out of cards does not reach the browser's swipe-back where the band no longer blocks it.
* The masonry places each piece itself, 20px between columns and between cards, and reads across the rows. See Components for density values.
* Spacing steps: 2, 4, 8, 10, 12, 16, 20, 24, 28. Section rhythm uses the fluid values in the frontmatter.

There are two breakpoints in the system, and no others:

* **640px** -- below this the header collapses (see Components).
* **1024px** -- below this the piece page stacks its artwork and wall label into one column. A fluid `auto-fit` was rejected here because it would give the label equal width to the artwork, which inverts the hierarchy.

## Elevation & Depth

There is no elevation model. **No shadows anywhere.**

Depth comes from exactly two devices: a 1px `line` border, and the `surface` against `bg` split. Within a component that still holds absolutely -- every border is `1px solid` in the `line` token, with no 2px borders and no coloured borders except the accent on hover.

**The page's structural lines are the exception, since 2026-09-20**, and they are drawn rather than ruled: the header's and footer's edges, a section boundary, the rule beside a wall label. Those are pencil strokes -- see *Rules and dividers*. The two do not mix on one surface.

## Shapes

**Border radius is 0 everywhere.** Buttons, cards, thumbnails, controls, inputs. The sharp corners are a deliberate identity choice, not an oversight, and they are the single easiest thing to destroy by reaching for a familiar `rounded-*` utility.

## Motion

The motion budget is deliberately small.

| Duration | Applied to |
|---|---|
| 200ms | Hover transitions -- border colour and text colour |
| 300ms | Theme swap (background and colour) |
| 300ms `cubic-bezier(0.2, 0, 0, 1)` | Masonry reflow when the density, the sort or the filter changes -- and, over the same span, a card arriving or leaving fades |
| 300ms `cubic-bezier(0.2, 0, 0, 1)` | The filter band and the sort options opening and closing, and the piece page's tag drawer and tag row -- one axis, nothing else. The drawer's rail narrowing and its title scaling ride the same span |
| 200ms `cubic-bezier(0.2, 0, 0, 1)` | A dialog opening and closing -- opacity, and an 8px rise |
| 200ms `cubic-bezier(0.2, 0, 0, 1)` | A menu panel opening and closing -- opacity, and an 8px drop |
| 200ms | One spotlight slide crossfading into the next -- opacity, nothing else |
| 300ms `cubic-bezier(0.2, 0, 0, 1)` | The wall and the spotlight arriving, on first paint and on a return, and each drawing arriving in its frame as it loads -- opacity, nothing else |
| 300ms `cubic-bezier(0.2, 0, 0, 1)` | One piece giving way to the next on the piece page: a view transition, the artwork carried into the next one's place and the Detailed view button resized with it, while the rest crossfades. Stepped -- Previous, Next or an arrow key -- the old drawing also moves 64px the way the reader is leaving, and the new one arrives from the other side |

| 300ms `cubic-bezier(0.2, 0, 0, 1)` | The privacy page's language toggle: its accent block glides to the chosen language, and the text in that language arrives -- opacity, nothing else, through `.arrives` |

No stagger and no scale. Motion acknowledges an action and gets out of the way.

**A control's own marker may travel between its options**, added 2026-09-19 at the owner's request for the language toggle. The block moves within the control's border and nothing around it does, so it is feedback on the press, not content sliding -- the rule below still holds for content.

**A carousel does not license a slide.** The spotlight crossfades because there is no horizontal translate anywhere in this table, and adding one for the sake of a familiar pattern is exactly the drift this section exists to prevent. Opacity was already the sanctioned way for one surface to replace another.

**Opening in the page is a reflow, not an entrance.** The filter band takes the masonry's 300ms rather than the dialog's 200ms and 8px, because nothing is arriving over anything -- the page makes room and the content below moves down. That is the same act as a density change, and it should cost the same. The 8px rise is reserved for a surface that covers what was under it; spend it on something that pushes instead and the two stop meaning different things.

Height cannot be transitioned from `auto`, so the band is a grid going `grid-template-rows: 0fr` to `1fr`. That is machinery rather than design, and it is recorded because the obvious `height` transition does not work and the next person will reach for it. The sort options are the same trick turned on its side, `grid-template-columns`, for the same reason.

**A surface arriving over the page is the sanctioned entrance**, added 2026-09-01 for dialogs and extended to menu panels on 2026-09-02. Something that covers what was under it and appears in a single frame reads as a jump cut rather than as a thing opening. It is 8px and an opacity, on the same budget as a hover -- deliberately below the threshold where it would feel like an effect.

The 8px goes the way the surface came from: a dialog rises, a menu hanging below its button drops. Nothing else animates in. This is a rule about surfaces, not a licence to animate the page.

The exit is the part that needs modern CSS: `close()` removes the element in the same frame, so `display` and `overlay` transition with `allow-discrete` to hold it in the top layer long enough to fade, and `@starting-style` supplies the pre-open values. Browsers without either show and hide the dialog outright, which is what happened before.

A menu panel needs the same treatment for the same reason, minus `overlay` -- it is not in the top layer. The tag field's suggestion list is the one menu that is, being a popover, so it takes `overlay` as the dialog does -- see Upload modal. It stays mounted and toggles `display` through `data-open`, so `display: none` keeps its links out of the tab order while it is shut, and `allow-discrete` holds the element long enough to fade on the way out. Both live in `index.css` rather than in the components: the exit cannot be written as utility classes without becoming unreadable, and the two entrances belong next to each other.

All motion must be skipped under `prefers-reduced-motion: reduce`.

## Components

### Header

Sticky at `top: 0`, `z-index: 10`, 12px backdrop blur, `bg-translucent` background, and a `rule-1` pencil stroke straddling its bottom edge. Padding `20px` vertical.

* **Wordmark** -- "Yan" in `text` plus "Curations" in accent italic, Instrument Serif 32px. **Renamed 2026-09-17** from "Sketchy" plus "Art" at 24px; the page title and the footer took the new name with it. **The mark** stands 8px before it, 48px square since 2026-09-20 (40px when **added 2026-09-18**, see Logo), overhanging the 36px row by 6px a side. The overhang sits inside the row's own 20px padding, so the header keeps its 76px either way. Below 370px it is 32px, the wordmark's own size: a 360px phone has no room for more. The pair is one link.
* **Row gap** -- 24px from 640px up, 8px below. On a phone it is only the floor between the wordmark and the controls, and a 360px phone needs the 16px to fit the mark.
* **Nav** -- Gallery / Collections / Yanco / Socials, 14px uppercase, plus Curate, Waived and Metrics for the owner. Active item is `text` with a 1px accent bottom border and 2px of padding beneath; inactive items are `muted` and go accent on hover. The nav sits left of centre; this is a natural result of a `space-between` row and is correct.
* **"Show me some!"** -- a random piece, for visitors and the owner alike. **Added 2026-09-17.** It sits in the row's free space between the nav and the controls on the right, as `ICON_BUTTON_ACCENT`: outlined accent that fills on hover, an invitation rather than the header's one filled action, which is the owner's Upload. A tooltip says where it goes. It draws from the exhibited pieces, never the one already on screen, and arrives with no origin, so that piece walks the whole gallery. From 1280px it is in the row with its label; **from 1024px to 1280px it is the 36px square**, since Yanco joined the nav on 2026-09-19 and took the room the label needed -- measured from the fonts, the visitor's row keeps 84px to spare at 1024px. **Below 1024px, since 2026-09-19**, it is a 36px accent-outlined square carrying only the shuffle glyph, first of the controls on the right, from 390px up; a narrower phone has no room beside the wordmark and keeps it in the menu panel. Up to 1024px, where the menu button holds the nav, it keeps that square in the row -- which closed the gap it once had between 640px and 1024px. A touch screen never hovers, so it fills while pressed and stays filled until the random piece opens, which is also what tells a tap on a slow connection that it landed.
* **Socials** is a button, not a link, and carries a chevron -- the only thing marking it apart from its neighbours, and what says a click opens rather than goes.
* **Theme toggle** -- 1px `line` border, transparent fill, glyph plus label. **The label names the theme currently active, not the one it switches to.** The accessible name states the action.
* **Owner state** -- a solid accent "+ Upload" button, then a 36px square sign-out button set 40px apart from it. The gap is deliberate: the two are next to each other but are not the same kind of act, and a mis-click ends the session someone was about to upload into.
* **Visitor state** -- nothing. No sign-in link, no hint that an owner exists; `AUTH.md` §5 has the reasoning.
* **On a phone it gives its height back while the reader scrolls down**, since 2026-09-19, and **again after two seconds of stillness** -- reading is not scrolling, and the row is worth more to the drawing than to a nav nobody is looking at. It returns the moment they scroll up or come within its own height of the top. It slides up out of the screen over 300ms on the reflow curve -- a translate, no fade -- and a direction counts only after 8px of travel, so a finger's tremor does not flicker it. Held open while its menu is -- the stillness timer does not fire behind an open menu -- and brought back when the focus lands inside it. **At the top it never hides**, whether the reader is still or not: there is no scroll up from there to bring it back. A phone either way up (`hooks/useHidingHeader.ts`, the `phone` variant's query); on a phone on its side the 77px row was a quarter of a 290px window. Things that stick below it (`top-header`) keep their offset, so the Curate board's toolbar leaves a gap above it on a phone while the header is away.
* **Below 1024px** -- the nav collapses behind a menu button drawn as three 1px bars, the toggle drops to its glyph, and the socials and sign-out move into the menu panel, where they can carry labels. **Every control on the right is a 36px square there, 8px apart on a phone**, so a third fits: measured from the fonts, the wordmark, its mark and three squares need 390px. **Moved from 640px on 2026-09-19**, in any orientation: with Yanco in the nav the full row no longer fitted a tablet or a phone turned sideways, and a phone browser answers a row wider than the screen by zooming the whole page out to show it -- every page then filled the left half of the screen with the rest blank, which is how it was found.
* **The owner's phone row, since 2026-09-19.** The wordmark, Upload and the toggle did not fit side by side below about 430px: the toggle slid under the wordmark and "+ Upload" broke onto two lines. Below 1024px (640px until the same day), Upload is a 36px filled square carrying only the "+" (named "Upload" for a screen reader), and the owner's toggle moves into the menu panel as a labelled row above Sign out. A visitor's row keeps its toggle; it has no Upload to make room for.

### Landscape

**A phone turned on its side takes the desktop's layout, since 2026-09-19.** Held that way it is 700-930px across and under 400px down, and the stacked phone layout spent that height on a column of blocks while the width went unused. Custom variants in `index.css` carry it, used in place of `lg:` / `max-lg:` wherever a page switches shape:

* **`wide`** -- 1024px and up, or at least 640px across, under 512px down and landscape. The side-by-side layouts: the spotlight's artwork beside its label, the piece page's artwork beside its rail, the about page's two columns.
* **`narrow`** -- everything else below 1024px: the stacked layouts, and what only they need, such as the spotlight band fitting the slide on show and the collections toggle. The two never both apply.
* **`flat`** -- the sideways phone alone, for heights: the desktop's `clamp()`s assume a tall window, and a 440px floor in a 390px window is a band nobody sees whole. The spotlight band takes the height below the header, the piece's artwork that less the room for its button, the about cover likewise, and the about page's thumbnails drop to 112px. Defined after `wide`, so its rules come later and win.
* **The piece page on its side keeps the stacked page's placements inside the side-by-side one.** The back link and the spotlight star move out of the artwork's gutters into the rail, beside Previous and Next, and the Detailed view button follows them; the rail narrows to 260px. The artwork, centred in what is left, may then take the window's height less 40px -- with the header sliding away on the first scroll, that is all of the height there is. Before, the header, the gutters and the button under it left the drawing about 100px tall.
* **`phone`** -- a phone either way up: under 640px, or on its side. For what is about being on a phone rather than about the layout's shape: the landing page's collections row.
* **Some phone choices stay on `lg` / `max-lg`.** The spotlight's collections wait behind their toggle, and its View piece gives way to tapping the artwork, below 1024px in any orientation: on a phone on its side the collections, shown whole beside a short label, left a blank under the artwork. They are a question of phone or desktop, not of the layout's shape.
* **The header does not use them.** Its row needs the width whatever the orientation, so it keeps the menu button up to 1024px (see Header).
* **Nothing else needed it.** The grids and the masonry size to the width they are given; they were only ever wrong in landscape because the header's overflow had shrunk the whole page.

### About page

The artist's own page, at `/about`, named "Yanco" in the nav. **Added 2026-09-19.** A short introduction in the owner's words beside the pieces they choose to be introduced by.

* **Two columns in the `wide` shape** -- from 1024px, and on a phone turned sideways: the words on the left, the pieces on the right. Stacked otherwise, the pieces come first and the cover is centred -- on a phone the drawing is the introduction, and the words follow it.
* **The pieces are a cover and a row, both in the first screen.** The first pick hangs whole, as on the piece page, capped at the window's height less 440px -- the header, the page's top padding, its caption and the row beneath -- so the row is seen without scrolling. Never under 240px. Its title and year sit beneath it, and it opens the piece. The rest run in a row of 160px-high thumbnails beneath it that scrolls sideways and snaps, edge to edge below 1024px. **Changed 2026-09-19** twice on the owner's call: first from 75% of the window, which pushed the row below the fold, then smaller again with the thumbnails raised from 112px to 160px.
* **A thumbnail trades places with the cover** instead of leaving the page, since 2026-09-19. Tapped, it rises into the cover's frame as the cover sinks into its slot in the row, a view transition over 450ms: the two groups fly to each other's frames, growing and shrinking, and nothing fades -- each shows its cover-size capture, so neither is a thumbnail stretched up, and the row slides to its new height with them. The drawing coming up is decoded at cover size before the trade starts, or it would grow in blank. The arrangement is the reader's own and lives in the browser alone: nothing is written, a reload restores the owner's order, and a save of new picks discards it. Without view transitions, or under reduced motion, the trade is instant.
* **Opened from here, a piece comes back here.** The cover opens its piece with `?from=about` and the page's current order as the sequence, so the piece page walks the about page's picks and its back link reads "← Yanco", as a collection's reads its name. The origin is carried to the neighbours, so it survives the walk. `home` and `about` are reserved as collection slugs, or a collection named either would be taken for the page.
* **The words are plain text**, paragraphs split by blank lines and single breaks kept, at 15px in `dim` under a 38em measure. No markup is interpreted: what the owner types is what a visitor reads.
* **English and Spanish**, since 2026-09-19, by the privacy page's toggle, now `LanguageToggle` and shared by both. It sits beside the eyebrow, which is "About" or "Sobre mí", with the owner's Edit button after it, so the pieces column starts level with the page instead of under a row of controls. A visitor is offered the toggle only when both languages have words; English is the default, as on the privacy page. The words carry their `lang`.
* **Editing happens on the page**, behind an owner-only "Edit page" toggle that fills in accent while on. The language toggle picks which language the textarea edits; both drafts are kept while switching, and one Save writes both. The words become a textarea with a live count against the 6000-character limit and their own Save. "Choose pieces" opens the spotlight's picker, generalised as `PiecePicksDialog`: pick up to twelve, drag to order, the first is the cover. "Done editing" with unsaved words asks before discarding them.
* **With nothing picked** the page is the words alone, in one column. A visitor never sees an empty slot.
* **Seeded with a first draft** by the migration, for the owner to rewrite, so the page is never blank on the day it ships.

### Back to top

A 44px square in the bottom-right corner, at the gutter, that takes the reader back to the top of the page. **Added 2026-09-19**, for phones first: the wall will be hundreds of pieces long, and a thumb should not have to scroll all the way back. It does no harm on a desktop, so it is on every page and at every width.

* **The header's material** -- `line` border, `bg-translucent` with the same 12px blur, a chevron pointing up in `muted` that goes accent on hover or press. A tool on top of the page, not part of any section.
* **Shown only past the first screen**, fading and rising 8px into place over 300ms; before that, the top is already in view. Hidden, it is `visibility: hidden` as well, so it leaves the tab order.
* **Sticky at the foot of `main`, not fixed.** At the bottom of the page it comes to rest just above the footer instead of over it, because the footer's last line is the keyhole's trigger. It takes no height; the button hangs up out of a zero-height strip.
* **Smooth scroll**, instant under reduced motion. It sits under the Curate board's sticky action bar (`z-index` 4 against 5), which has the better claim to that corner while pieces are picked.

### Icon buttons

The theme toggle's treatment, generalised: 1px `line` border, transparent fill, icon plus label, 12px uppercase at `0.08em`, going accent on hover. Destructive actions go `danger` on hover instead and are never filled. Used where an action changes something and must not read as a link -- the owner's actions on a piece are the first place.

**Icons are drawn in `components/icons.tsx`, not imported.** A 24-unit `viewBox` rendered at 16px puts a 1.5-unit stroke at exactly one device pixel, so an icon is the same hairline as every border in the system. `fill: none`, `stroke: currentColor`, square caps, so an icon inherits every hover and disabled state already on the button and never needs styling twice.

Deliberately not an icon font or a package -- several hundred kilobytes for five glyphs, and `AGENTS.md` §2 rules out new dependencies without asking. Deliberately not Unicode dingbats either: ✎ and its neighbours render as colour emoji on Windows, and there are no emoji in this project.

**Three weights, in `components/form-styles.ts`.** `ICON_BUTTON` is the default, `line` border going accent on hover. `ICON_BUTTON_ACCENT` is bordered in accent and fills on hover, and while pressed, since a touch screen has no hover (**2026-09-19**) -- a useful action inside a section, like "+ New collection". `PAGE_ACTION` is filled from the start and full width: the one action a page exists for, at most one per screen. See Accent for which is which. `ICON_BUTTON_DANGER` and `ICON_BUTTON_INERT` cover the destructive and the unavailable.

### Spotlight

The band above the intro on the landing page: the first five pieces of the gallery, one at a time, shown nearly whole beside its label. Added 2026-09-03, modelled on the hero band at artsy.net.

* **Full bleed, inner content capped.** The section spans the viewport; the grid inside it is capped at 2400px and centred. This is the header and footer rule, not the content-region rule, and it is the one place a *content* region takes it -- recorded under Deviations.
* **Split 50/50**, collapsing to one column below 1024px. No new breakpoint. It went 55/45, then 66/34 to give the artwork more room, and back to 50/50 on 2026-09-07 -- because a wider panel is a *wider frame*, and a wide frame beside a tall portrait is more empty ground, not less. At 50/50 the band's frame lands within a whisker of the picker's 3:2 preview at a typical window (1.485 against 1.502), so the hatch the owner sees while choosing is the hatch the page shows. What the half gives up in artwork width it gets back in a label panel with room for the collections block.
* **The ground around a letterboxed piece is the page's own**, `bg`, not the hatch. **Changed 2026-09-19** on the owner's call: a zoomed piece sits on the page rather than in a striped frame. The focal picker's previews use the same ground, inside a hairline so their edge still reads on the dialog's surface.
* **The artwork answers a hover**, added 2026-09-20. Its link fills the whole band, so that page-coloured ground around a letterboxed piece is clickable with nothing to show for it -- a pointer cursor over what looks like empty page. It takes the accent border the grid's cards take, on `focus-visible` as well, since a hover-only affordance leaves a keyboard with no equivalent.
* **The band's bottom edge is a `rule-6` pencil stroke**, added 2026-09-20, replacing the hairline that was there. See *Rules and dividers*.
* **A piece opened from the band is shown again on return**, added 2026-09-20. Both ways out record the slide -- the artwork and *View piece* -- and the band opens on that piece when the reader comes back, once per visit, so turning it by hand afterwards sticks. It keeps its own map in `lib/returnMemory.ts`: the wall below stores a piece and a scroll position under the same key, and the two would overwrite each other. The restore goes through `show` rather than `go`, because `go` clears `playing` -- it is what a person pressing an arrow calls -- and restoring through it would have paused the band on every return.
* **Cover, aimed by a per-piece focal point.** `object-fit: cover` at `clamp(440px, 72vh, 780px)` beside the label and `clamp(320px, 52vh, 500px)` above it, with `object-position` from the piece's stored focal point. The artwork fills its half outright; nothing is letterboxed.

  This replaced contain plus a zoom on 2026-09-06, and the reasoning is worth keeping, because contain looked like the safer choice. Every piece here is portrait or square while the panel is wider than it is tall, so a contained fit was limited by height and left hatch bars down both sides. Scaling past the fit did not close them: it ate the axis that was already full. Measured, a 1.14 scale cost 12.3% of the height -- heads and feet -- and took nothing off the bars. **No zoom value fills a bar**, because the slack and the crop are on different axes.

  Cover fills the panel by definition. What made it unsafe before was only that the crop was centred, and centre-cropping a portrait beheads it. A focal point is what makes cover safe, so the two arrived together and neither works without the other.
* **The focal point is a fact about the piece, not about the band.** `focalX` and `focalY`, two nullable percentages on the piece row, null meaning centre. Stored as numbers rather than baked into a cropped rendition: a second derivative per piece would cost a pipeline stage, another copy of every image and a backfill, where two integers cost about thirty bytes in a payload the page already fetches and are spent at paint time, on an image the browser is drawing anyway. Any other cropping surface can read the same pair.
* **The title takes the piece-title step**, `clamp(22px, 2.4vw, 32px)`, not the display step. The intro headline sits directly beneath and is the page's own voice; two headlines at the same size argue with each other.
* **The action is outlined.** `ICON_BUTTON_ACCENT`, because the header already spends the filled accent on "+ Upload" for the owner and the rule is one per screen.
* **The artwork is itself the way in**, since 2026-09-19, named "View <title>" for a screen reader. Below 1024px it is the only way: View piece is hidden there, and the collections toggle has the row to itself, or the row goes when there is nothing to toggle. A phone reader taps the drawing, which is what a thumb reaches for anyway, and the label under it stays short. From 1024px the button stays as well, so the picture and the button both open the piece.
* **No caption over the artwork.** The title is already in the label; an overlay would say it twice.
* **Slides stack in one grid cell**, not absolutely. From 1024px the band takes the height of the tallest, so it never resizes as it advances, and the stacked layout needs no fixed height of its own. The label is centred beside the artwork and top-aligned below it, so the slack a short label leaves falls as padding rather than as a hole between a piece and its title.
* **Indicators are position, not progress.** One hairline per slide, `line` going `accent` for the current one, each a button with 12px of padding above and below so a 1px rule is still a target. A rule that filled over eight seconds would make the timer legible and would also put continuous motion on screen for as long as the page is open.
* **Autoplay at eight seconds**, paused by hover and by focus landing inside the band, and ended for good by any deliberate advance -- a band that moves on eight seconds after someone chose a slide is taking the choice back. It does not start at all under `prefers-reduced-motion`.
* **Only a real pointer hovers, and only keyboard focus holds, since 2026-09-20.** A phone synthesises a hover and a focus from every tap, and the hold swaps the indicator while the tap is still in flight; a browser reads a page that changes under a tap as a hover being revealed and drops the click. The first tap on the collections toggle did nothing, every tap after it worked, and swiping to another piece brought the dead first tap back -- the hover and the focus leave with the old slide. `pointerType === 'mouse'` on enter and leave, `:focus-visible` on focus. The cost is that a tap no longer pauses the band by accident; the `PAUSE` control is the deliberate way, and it always was.
* **The pause control is the word `PAUSE`, not a glyph.** WCAG 2.2.2 wants an explicit way to stop anything moving for more than five seconds. A pause mark at 16px is two 1.5-unit bars almost touching, which is the mud the density icons had to be filled to escape; that exception was granted for columns and is not extended here. Hidden under reduced motion, where there is nothing to pause.
* **Inactive slides are `inert`**, which keeps their "View piece" link out of the tab order and out of hit testing. Verified with `elementFromPoint` and a dispatched mouse event, not with `.click()`.
* **Zero pieces renders nothing. One piece renders the piece**, with no indicators, no chevrons and no timer.
* **A swipe on the band steps it**, left for the next, right for the previous, by the piece page's rule (`lib/swipe.ts`). **Added 2026-09-19.** On the band only, unlike the arrow keys, which work from anywhere on the page: a swipe lower down is somebody reading the wall, not steering the picks.
* **The band turns like pages on a phone, and nudges wider.** **Added 2026-09-19.** Below 1024px the slide on show follows the finger once a stroke has shown itself sideways (10px of travel decides, and the decision holds), with the neighbour it is heading for alongside it. Let go past the swipe's threshold and both carry on from under the finger, one out and one in, the full width; short of it they spring back. No fade on a phone, because two drawings crossing through each other is not a page being turned. From 1024px a step is a 32px nudge under the crossfade, 300ms either way. Buttons, dots and autoplay take the same turn, from the side the move comes from. The band is `touch-action: pan-y pinch-zoom`, so a sideways stroke is the band's and an upright one still scrolls the page. Both neighbours now load ahead, not only the next, since a finger can pull either into view. Reduced motion keeps the instant swap and does not follow the finger.
* **Below 1024px the band fits the slide on show, either way up.** Sharing the tallest slide's height left a short label over a gap as tall as the collection card it lacked. The hidden slides are lifted out of the flow (`absolute`), so only the current slide sizes the band. Everything under the band moves when the height changes, which is the trade-off the owner chose over the empty space. The band clips while the outgoing slide fades, so a taller outgoing slide does not show over the controls. Changed 2026-09-19. It replaces the earlier `content-start` fix, which moved the gap below the label rather than closing it. It is keyed to being on a phone, not to the stacked layout: on a phone on its side the slides are side by side, and while it followed the layout one slide's open collections left every other slide standing over their height.

**Curation, added 2026-09-06.** The band shows the first five of the gallery until the owner says otherwise; hand-picked pieces take the first slots, in whatever order the owner dragged them into, and whatever is left is filled from the top of the gallery, skipping what is picked. Nothing picked is the default and is stored nowhere. **Since 2026-09-19 the fill follows the curated order** (`CURATION.md`); it was the newest work before, when the gallery was newest first.

* **A gear at the far right of the control row, owner only**, set apart by 40px. This is the header's rule about "+ Upload" and sign-out: the two sit together but are not the same kind of act. Everything to the left of the gap changes what you are looking at; the gear changes what the gallery shows everyone.
* **The control row survives a single piece for the owner.** With one piece there are no indicators and no chevrons, but the gear is the only way into curation and a gallery of one still has a spotlight to arrange.
* **The dialog is the picking vocabulary, not a new one** — 94vw by 92vh, the 80/20 split, `PiecePickerGrid` with its numbered badges, and the title and year filters in the control column. The name field is what collection creation has that this does not.
* **It shows all five slots, not just the picks.** Picked slots carry the accent badge; filled ones carry an outlined number and the word "Curated". Filling is the whole point of the feature, and a rule you can only verify by closing the dialog and looking at the page is a rule that will be mistaken for a bug.
* **The picks are dragged into order, with the collection arranger's gesture.** Native drag and drop, the `text/plain` payload Firefox needs before it will start a drag at all, the lifted row at 40% and an accent outline on the row it will land in -- and the same arrow-key fallback, down the list here rather than across a grid, so the keys are up and down. A second vocabulary for a job the owner has already learned elsewhere is one to unlearn. The `move` helper both arrangers were about to own a copy of now lives in `lib/order.ts`.
* **Only picks move.** A filler's place is its place in the curated gallery, set on the curation page, and nothing in this list can change it, so fillers are listed, numbered and inert: a drop onto one is refused by the browser rather than by a rule the owner has to read. Below two picks there is nothing to order at all, and the grips, the drag and the instruction line go with it rather than sitting there dead.
* **The sixth pick is refused, not swapped in.** Silently evicting something the owner chose is worse than not adding one more, so the tile simply does not take and the column says every slot is taken.
* **The dialog is a sibling of the band, never a child.** However the top layer paints a `<dialog>`, it is still a DOM descendant of wherever it sits, so its events bubble: as a child, an arrow key typed in the search field advanced the carousel behind it.
* **Autoplay stops while the dialog is open**, through a suspend flag rather than the hover hold. Opening the dialog takes the pointer off the band, which fires the mouse-leave that would release a hold and set the band running behind the cover.
* **The band arrives by fading, since 2026-09-18** -- on first paint and on a return, the same opacity-only arrival as the wall, and each rendition fades into its frame as it loads. See Masonry grid.

### Focal picker

Where a piece's crop is aimed, in the Edit details dialog. Added 2026-09-06 with the spotlight's move to cover.

* **Two views of one pair of numbers**: the whole artwork with a mark on it, and beneath it the band's own shape cropping live. Choosing on the full image and judging the crop are different jobs, and a control that only did the first would have the owner saving and reloading to find out what they picked.
* **The preview uses the band's real ratio**, roughly 3:2, not a round number. A preview at the wrong shape lies about what will be cut.
* **A phone preview beside it**, at 8:9, because the band stacks below 1024px and becomes the full width over `clamp(320px, 52vh, 500px)` -- close to 8:9 on any upright phone. The two frames share one height (the columns split 27:16), so the owner compares the crops at a glance. One focal point and one zoom serve both; each screen gets its own preview, not its own setting. Added 2026-09-19.
* **The mark is a hairline cross, not a filled dot.** A dot covers the exact detail being aimed at, and this set has no filled marks outside the density icons.
* **It replaced a static preview**, which showed the artwork beside a line explaining that the artwork does not change -- true, and nothing to do. The crop is the one thing about the image this dialog can set, and setting it still does not touch the file.
* **Pointer capture, not window listeners.** The element keeps receiving moves once the pointer leaves it, the browser cleans up a cancelled gesture, and touch and mouse are one code path. `touch-none` is required with it: without it a drag scrolls the dialog instead of moving the point.
* **Arrow keys move it**, 2% a press and 10% with Shift, on a focusable frame carrying its coordinates in its accessible name. 1% a press would be forty presses to cross a piece.
* **A zoom slider under the preview**, because the preview is the only thing it visibly changes. 100% is the whole piece in frame and 200% is twice as close; the line beneath says what share of the piece survives, which is true of the band as well as of the preview. An unsized piece parks the slider where filling this preview lands, so the first drag does not jump.
* **The zoom is spent over `contain`, not over `cover`.** `object-fit` crops at layout time and a transform only scales what came out, so a scale over `cover` draws the same crop smaller instead of revealing more -- measured with a test image of numbered bands, which showed the same bands at every scale. Over `contain` the whole piece starts in frame and the scale has something to give back.
* **A multiple of fit, not of fill, so no surface needs to know its own shape.** Fill belongs to the frame; the band's frame is `clamp()`-sized and the picker's preview is 3:2, so a percentage of fill framed the same piece differently in each -- 41.3% of its height in the band against 53.9% in the preview, on one window. Over `contain` the scale is simply the stored number, and every surface and every visitor sees the same amount of the drawing. What varies is the hatch beside it, which is what a wider frame honestly means.
* **The preview promises the artwork, not the ground around it.** It is 3:2 while the band is whatever the window makes it, so the share of the piece in frame matches exactly and the ground around it does not. Only the first of those is worth promising.
* **A native range input**, styled to a hairline track and a square thumb in `index.css`. It brings keyboard stepping and its value in the accessibility tree; none of that is worth rebuilding for one field.
* **"Fill" clears it back to null** rather than writing a number, the same reasoning as "Centre". Null is the one framing that needs no frame to know: it fills whatever shape it is given.
* **"Centre" clears it back to null** rather than writing 50, so a piece that was never placed stays distinguishable from one deliberately centred.

* **The label is two columns from `2xl`**: the wall label, and a column naming the collections the piece is in. The half is wider than a title and three lines of description need, and a collection is the one thing a visitor looking at a piece plausibly wants next that the page cannot otherwise tell them.
* **Drawn by `CollectionGrid`**, the same component the landing row and the collections index use, so a collection looks like itself wherever it appears and there is one place to change how. **It carries the landing page as its origin, since 2026-09-19**, as the row further down the same page does: opened from the band, a collection offers "← Gallery" back to it, and a piece opened from there walks that collection and comes back through it. A column narrow enough makes its `auto-fill` resolve to a single track, which is what turns the row into a column without a second component.
* **The column is a bounded share of the half** -- 40%, never under 220px, never over 340px. Fixed, it took the same width out of a 576px label at the bottom of `2xl` as out of a 1072px one at the top, and the wall label paid for it.
* **The wall label is capped at a 26rem measure when something sits beside it**, and the row packs from the start rather than centring. Uncapped, the label ate the half and pushed the collections against the far gutter with a field of nothing between them. Centred, the title stepped sideways as the band advanced from a piece in three collections to a piece in none -- so the cap is conditional and the start is fixed.
* **The axis flips once, at `2xl`, and the label takes the artwork's height with it.** Below that the half cannot hold both -- a 260px column at 1024px left the wall label 110px and broke the title over two lines -- so the collections sit under the label at natural height instead. The height arrives with the row because it is what caps the scroller; a fixed height under a stacked layout would cap nothing and spill the overflow over the intro.
* **A long list scrolls rather than growing the band**, and each width caps it differently. Under `lg` the band is stacked and the page scrolls, so the list runs as long as it likes. From `lg` the artwork has a fixed height and the label does not, so an unbounded list dragged the band to 1007px beside a 648px piece -- hence a `32vh` cap. From `2xl` the label has the artwork's height and the flex box caps it, so the viewport cap is dropped. `min-h-0` is not optional there: without it a flex child refuses to shrink, and a long list measured 2492px spilling out of a 637px band.
* **It costs no request.** `GET /api/collections` carries `pieceIds` and the landing page already asks for it, so membership is a filter over rows the page is holding. A draft never reaches a visitor because that route drops private collections before the band sees them.
* **Nothing is shown for a piece in no collection** -- no heading, no rule, no empty state. It is not a gap to be filled; most pieces are in nothing.
* **Below 1024px the collections wait behind a toggle**, since 2026-09-19: "In a collection" (or "In 3 collections") with a chevron, beside View piece, outlined in `line` so the accent stays on the way into the piece. Open, the cards reveal beneath by the grid-row technique and the band grows with them, since it fits the slide on show. Stacked, the cards sat between the artwork and the wall and pushed the pieces down. Shut, the reveal is `visibility: hidden` as well, so its links leave the tab order. Each slide keeps its own open state. From 1024px nothing changes: the cards sit beside or under the label as before.

### Intro

Optional. Eyebrow in `faint` at 12px / `0.24em`, then the headline capped at `14em` with `text-wrap: pretty`. Shown on the root gallery view; hidden on filtered and collection routes.

**On the landing page it is deliberately quieter than the other headings**, at `clamp(22px, 2.6vw, 34px)` with its own padding rather than the `intro-top` / `intro-bottom` tokens. It follows the spotlight band, and a full display headline immediately under a piece shown at 72vh reads as a second, competing hero. The shared tokens and the display step are left alone because six other headings spend them -- the collection, collections index, piece, waived and message pages.

### Collection card

1px `line` border, `surface` background, 20px padding, 12px column gap, border goes accent on hover over 200ms. Contains a 90px cover strip at 85% opacity (the cover image, or a gradient swatch as fallback), then a 4px-gap block of the name in Instrument Serif 18px and the count in 12px uppercase `faint`.

### Piece card

A 10px-gap column: thumbnail, then a 2px-gap block of title (14px `text`) and meta (12px `faint`, formatted `{medium} · {year}`).

The thumbnail carries a 1px `line` border that goes accent on hover, and its `aspect-ratio` comes from the piece's stored image dimensions. The `hatch` gradient sits behind the image so a slow or failed load shows the placeholder rather than a hole; on error the `[ artwork ]` monospace label is shown.

**Aspect ratios must be persisted at upload time, never measured in the browser.** The masonry reserves each card's height from that value; deriving it after load would reflow the entire grid as images arrive.

* **The card the reader last opened is marked on their return**, added 2026-09-08, by a 1px `accent` outline set 2px outside the thumbnail's frame. An outline rather than a border, because the border is already spoken for -- it goes `accent` on hover, and a marked card wearing the same accent border would read as permanently hovered. The offset ring is the focus ring's vocabulary, which is this set's existing way of pointing at one thing among many without touching the artwork.
* **And named, not only drawn.** A ring is colour alone, so the marked card carries a `sr-only` "(last viewed)" after its title. The `faint` token is already documented as failing AA; a marker that exists only as a hairline of gold would be worse.
* **Coming back returns the reader to where they were.** Opening a piece records the scroll position against the list's pathname, and arriving back spends it. Recorded on the act of opening a piece rather than on every scroll, which is what lets arriving from the header start at the top while arriving back from a piece does not -- a position stored continuously cannot tell those two apart.
* **The position is spent once; the marker is not.** A second return starts where the reader chose to be, while "which one was I looking at" stays answerable for as long as the list is on screen.
* **The restore re-asserts for up to half a second**, because the page is not its final height when the grid first paints -- on the landing page the collections row arrives on its own request and adds a band above the grid. **Since 2026-09-18 the landing page waits for that row before restoring at all**: the tag shelf's handoff lands on the wall's own top, and scrolled before the row arrived it was pushed 173px down the page. It gives up the instant the reader scrolls, wheels or types: someone who has started reading has said where they want to be, and outranks a remembered position.

### Masonry grid

Laid out by `MasonryGrid` itself, since 2026-09-19: each piece in turn goes under the shortest column, leftmost on a tie, placed absolutely by `left` and `top` with 20px between columns and between cards. `lib/masonry.ts` holds the arithmetic.

**It reads across the rows.** The first pieces are the top row, left to right, at any window width, so the curated order means the same on every screen and the owner's first picks are always the first thing seen. The cards stay in that order in the DOM, so tab order and a screen reader follow it too. Heights come from each piece's stored proportions plus its caption as the browser measured it; an estimate stands in for the first frame.

**Until 2026-09-19 it was CSS multi-column**, which fills down each column first: position 2 sat under position 1, and the top row was the first piece of every column -- a different set at every window width. That was an accepted trade-off while the order was simply newest first. Curation made it wrong.

Density is a persisted user preference:

| Density | Narrowest column | 1792px content | 2272px content |
|---|---|---|---|
| Airy | `380px` | 4 columns | 5 columns |
| Comfortable | `290px` | 5 columns | 7 columns |
| Dense | `230px` | 7 columns | 9 columns |

The value is the narrowest a column may be, and the grid fits as many columns as the container allows -- the count CSS multi-column arrived at, kept when the layout moved out of CSS. Density therefore means *how wide a piece should be*, not how many sit across -- which is what lets one setting hold on a laptop and a 32-inch monitor at once. Rendered width is still `(container - gaps) / count`, so it exceeds the threshold rather than matching it.

**Each step denser earns at least one more column, since 2026-09-19** -- while the columns that gives stay 200px or wider. Fit alone gave two settings the same wall at some widths: a phone on its side, about 700px of wall, fitted two columns at both Comfortable and Dense, so the control did nothing between them. Now it is 1 / 2 / 3 there, and 2 / 3 / 4 at a 1024px window where Comfortable and Dense also matched. The 200px floor is what keeps a phone held upright at one column at every density, up to a 440px-wide phone; wide screens are unchanged, since fit already separates them. `steppedColumnCount` in `lib/masonry.ts`.

All three stay visually distinct down to roughly a 1200px viewport; below that the available width genuinely cannot support three separate column counts and they begin to coincide.

Changing density animates via FLIP: positions are captured, the reflow is applied, and each card is played from its old offset back to zero on `transform` only. A new layout lands in one frame, and FLIP is what makes it travel.

**And from its old size, since 2026-09-19.** A card used to glide to its new place already at its new width, which read as a jump inside the movement. It now also scales from the size it was drawn at, from its top-left corner, on the same 300ms. One scale for both axes, taken from the width: a caption does not grow with its image, and text squeezed on one axis reads worse than text briefly the wrong size. The Curate board's tile sizes use the same hook, so they resize the same way.

**Sorting and filtering reflow the same way, since 2026-09-18.** They are the same act as a density change -- the wall rearranges in one frame -- so they take the same 300ms on the same curve, from the same hook, and a card that stays slides to its new place. Two things a density change never has: a card that arrives fades in, having no old position to slide from, and a card that leaves fades out where it stood, so a narrowing reads as the wall closing over the pieces it drops rather than as pieces blinking out. The fades are opacity alone, the way one spotlight slide replaces another. A retarget mid-flight sets off from where the card is, not from where it was headed, so typing into the search does not make the wall stutter.

**The wall arrives by fading, since 2026-09-18** -- on first paint and on a return alike. A grid that had nothing on it is arriving rather than changing, so the FLIP hook leaves it alone and the arrival is a plain opacity transition on the wrapper, run from insertion by `@starting-style`. Each drawing then fades into its frame as it loads, over the hatch that was already there, so a wall filling in from the network is drawings settling rather than popping. Both are opacity alone on the reflow budget: nothing rises, because nothing is covering anything.

### Density control

A single group with one 1px `line` border and hairline dividers between options -- deliberately *not* three separate chips, so it reads as one control. Options are 12px with `0.06em` tracking and chip padding, sentence case. The active option is filled accent with `on-accent` text.

**Not shown below 640px, since 2026-09-19.** A phone's column is narrower than two of even the densest columns, so every density gives the same single column and the control would change nothing. The Curate board keeps its own, where the three sizes do differ on a phone.

Each option carries an icon drawn as the columns it produces -- two wide, three, then four narrow -- so the control shows its own effect. These are the one *filled* icon in the set: a 3-unit column drawn as an outline is two hairlines almost touching, which at 16px is mud. Below 640px the labels drop and the icons carry it alone, so the buttons take an explicit `aria-label` -- `display: none` takes a label away from a screen reader as well as from the screen.

### Gallery filter

Narrowing the wall, added 2026-09-08. A `Filter` button in the "All work" header beside the density control, and a band of criteria that opens beneath the whole header and above the grid.

* **It opens in the page, not over it.** Built first as a panel floating under its button, and changed the same day. The panel worked and covered the drawings, and on a gallery the work is the one thing the interface may not sit on top of. In flow it pushes the grid down, which costs a scroll and nothing else. The button still hides the whole thing when it is not wanted, which was the point of a panel in the first place.
* **A band, not a permanent row.** The criteria are four controls and will be more. Left on screen they would push the gallery down the page for everyone, forever, to serve something used occasionally.
* **The button takes outlined accent while something is filtered**, and carries the count of what is showing. The interface pointing at itself, which may repeat; filled would claim to be the action the page exists for. The count rather than a dot, because how much is being hidden is worth knowing without reopening the band to find out.
* **Year, Collections and Tags are multi-select dropdowns.** Flat checkbox lists made the band taller every year the gallery gains; compact controls hold it to one line whatever the data does. A native `<select multiple>` is the obvious reach and the wrong one -- it renders as a permanently open scrolling box rather than a dropdown, wants ctrl-click for a second value, and cannot be styled to this set. So the trigger is a button dressed as a field and the menu is real checkboxes, which is also what a screen reader reads without every state being maintained by hand.
* **A closed trigger names its single pick.** "2021" rather than "1 selected": shorter, and it says *which*, which is what a closed control is there to answer. Beyond one it counts -- "2 years".
* **Tags joined them on 2026-09-17.** The options are read off the pieces rather than the tags table, so none leads to an empty wall. A piece passes if it carries any ticked tag, as with years and collections: ticks within a criterion widen, criteria narrow.
* **`.menu-panel` is now a control's menu as well as the nav's.** Those dropdowns use the socials surface unchanged. A menu floating over the grid is fine where the band was not: it is small, transient, and opened deliberately, where the band was large and covered work for as long as it stood.
* **Which cost the band's clip a condition.** `overflow: hidden` is what makes the collapse look like a collapse, and it clips a menu opening out of the band -- the menu is simply not there. The clip lifts 300ms after the row opens, on a discrete transition, and returns in the same frame on close. Where `allow-discrete` is unsupported the clip lifts at once and content spills for 300ms while the row grows: a cosmetic fault on the way in, chosen over a dropdown nobody can see.
* **Clear is an icon button, not a text action.** It began as `SUBTLE_ACTION`, the 12px `faint` text button, and sat immediately beside the 12px `faint` count -- two quiet strings, one of them secretly clickable and neither looking like a control. Given the same bordered box every other control in the band wears, with the close glyph, it reads as the thing it is. `SUBTLE_ACTION` is still right where it sits under the label of what it undoes, which is why the constant was left alone and only this use changed.
* **Shut, the band is `inert`.** Collapsed content is still focusable and still hit-tested. This is the trap the spotlight's inactive slides had to close, and the same answer.
* **It stays mounted while shut**, so a typed query survives being hidden. Unmounting would clear the filter every time the band was closed, which is not what closing a band means.
* **Narrowed to nothing is not an empty gallery**, and says so: "No work matches these filters", with a `Clear filters` action beside it. The way out is named rather than left to be worked out. This is the one `SectionState` that carries an action.
* **A narrowed list stays narrowed.** Opening a piece and coming back used to reset the filter and the sort, because the section remounts on every navigation and both were component state. They are now kept in the same store that remembers the scroll and the marker, keyed by pathname, and handed to the hooks as their *initial* state -- so a return renders the narrowed, sorted list in one pass rather than showing the whole gallery for a frame and correcting itself.
* **And open, if it was open.** The bar itself keeps the position it was left in, not just its values -- a bar that shuts while the reader is looking at a piece has tidied up after them. It costs no animation: the row renders at full size on the first frame, and a transition only runs on a change. The sort options do the same, which is why that control's open flag is owned by the section rather than by itself.
* **And stays narrowed beyond the round trip.** Unlike the scroll, which is spent on the way back, this does not expire: leave the gallery, come back later in the session, and the filter is still on. That is safe because it is visible -- both buttons wear the accent while they hold something, and the filter's carries the count of what is being hidden -- where a remembered scroll offset would be invisible and disorienting. It is the same split as the marker, which also outlives the trip that recorded it.
* **The element carrying `.filter-row` takes no display utility**, for the reason `.menu-panel` does not: utilities cascade after components and a `flex` there beats the `grid` the class needs. Layout goes on a child.
* **Narrowing and widening move the wall the way a density change does**, with the dropped and returning pieces fading -- see Masonry grid.

### Gallery sort

Ordering the wall, added 2026-09-08. A `Sort` button in the "All work" header, and three options that open sideways from it into the row. On the gallery and inside a collection both.

* **It opens sideways, into the row, not down or over.** The header is mostly empty -- a heading at one end and three controls at the other -- so the options grow leftwards into space that was already there. Nothing is covered and nothing is pushed down. This works because the control cluster is the far item of a `space-between` row and so is pinned to the right edge: widening it moves its left edge and nothing else.
* **Below 640px it opens down instead**, on a line of its own under the Sort and Filter buttons, the full width of the column and wrapping if it must, with the same 300ms reveal turned upright. **Since 2026-09-19**: a phone's row has no space beside the buttons, and the sideways reveal clipped the options to a sliver. The pair stays one component; below `sm` its wrapper is `display: contents`, so the options can take their own line in the cluster.
* **Which is a third answer to the same question.** A dialog covers, the filter band pushes, this one fills. All three exist because the gallery beneath is the one thing that may not be covered, and the right answer depends on how much room the control needs -- three buttons fit in a row that a search field, three dropdowns and a count do not.
* **Curated, then three keys: Year, A-Z, Last upload.** Picking the active one again turns it round; picking another starts it at the direction people mean first -- newest year, A first, newest upload.
* **Title flips its own label rather than wearing an arrow.** "Z-A" is the plainest way to say a reversed alphabet, and "A-Z up" is not a phrase anybody uses. Year and Last upload keep their noun and take the arrow, since Year reversed is still Year.
* **Curated is the default, and is no key at all.** It is whatever order the list arrived in: the owner's curated order on the gallery (`CURATION.md`) and the collection's own order inside one. Sorting is an override, and the Curated button puts the curation back -- a sort that silently discarded an arrangement somebody dragged into place would be the feature destroying the more expensive one. **Until 2026-09-19** the default had no button and a `Reset` link restored it; naming it made the link redundant.
* **Pieces that cannot answer go last in both directions.** A piece with no year is not a piece from year zero. Reversing them along with everything else would park the unknowns at the top half the time, which reads as broken rather than as sorted.
* **Sorting needed a field the payload did not carry.** `createdDate` is when the work was drawn; "Last upload" wants when it arrived, which is `created_at` on the row and was not being serialised. The list order could not stand in for it, because a collection arrives in curated order and its array positions say nothing about when anything was uploaded. One additive field, no migration.
* **Shut, the options are `inert`**, so three buttons at zero width leave the tab order and hit testing rather than sitting there invisible.
* **The sort survives leaving the page**, in the same store and on the same terms as the filter -- see Gallery filter. A collection remembers its own, so sorting the gallery leaves a collection's curated default alone.
* **Reordering moves the wall the way a density change does** -- see Masonry grid.

### Piece page

Not present in the original handoff -- designed against this system as a **gallery wall label**. The artwork keeps the room; the metadata sits beside it, small and quiet, separated by a hairline rather than boxed in a panel. No new visual vocabulary was introduced.

* **Layout** -- a two-column grid, `minmax(0, 1fr)` for the artwork and a fixed `320px` rail. Below 1024px the two stack and the dividing rule moves from the rail's left edge to its top, taking a different stroke with it -- `divider-v-3` beside, `rule-3` above. From `xl` an open tag drawer adds a third column beside them and the rail narrows to `272px` -- see *A tag another piece shares opens a shelf*, below.
* **From `lg` the rail is two rows** -- the navigation, then the wall label -- at zero row gap, so the edge beside the artwork reads as one unbroken rule. It is literally one since 2026-09-20: a grid item spanning both rows carries a single stroke, rather than each row carrying its own. Two strokes stacked would meet taper to taper and thin the line over some 70px in the middle of the column. Spanning the rows also leaves the track arithmetic to grid, which is what keeps the rule in step with the rail's animated width when the tag drawer opens. The rows are explicit, `auto 1fr`, because the artwork spans both of them: against `auto` rows grid hands a spanning item's height to every row it crosses, which inflated the first to some 300px of nothing, dropped the piece title from 215px down the page to 511px, and tore a hole in that rule.
* **Artwork** -- centred in its column, since the cap often leaves it narrower than the column and hugging one edge would strand the rule. 1px `line` border and the `hatch` behind it, exactly as in the grid.
* **The height cap covers the artwork and its button together**, not the image alone: `max(320px, 100vh - 226px)` from `lg`, and `100vh - 294px` below it, where the navigation sits back above the drawing and costs another 67px.

  It was `78vh`, set when nothing sat beneath the image. A percentage cannot hold that promise once something does -- the chrome around the artwork is a fixed height, header and page padding above, the Detailed view button and its dimensions line below, while `78vh` grows with the window. The two agreed at about a 900px viewport and disagreed everywhere else, which is how the button came to sit five pixels below the fold on a 1080p laptop, on square pieces as much as on tall ones: at the cap the image is the same height whatever shape the piece is.

  Subtracting the chrome instead gives the artwork whatever the page does not need -- larger on a big monitor than `78vh` ever allowed, smaller on a short one, and the button always in view. Measured at 20px of slack below the caption at every width from 390px to 1920px and every height from 660px to 986px. The 320px floor stops a landscape phone reducing the drawing to a stamp. **Changed 2026-09-07.**
* **Wall label** -- title at `clamp(22px, min(2.4vw, 11.2cqi), 32px)` serif, measured against the rail. The `cqi` term is 32px at the rail's usual width, so it only bites when the rail narrows for the tag drawer: the title scales down with the column and keeps its line breaks rather than wrapping further. Then `{medium} · {year}` in 12px `faint`. Below that, optional blocks separated by `divider-4` strokes -- the lightest in the kit, because a heavy one repeated four times down a rail turns it into a ledger: description, tags, and the collections a piece belongs to. Each block is labelled in 12px uppercase `faint`.
* **Blocks are omitted entirely when empty.** A heading with nothing under it is louder than no heading. Descriptions are blank in the current data, so that block simply does not render.
* **A pick wears a star.** **Added 2026-09-18.** A piece in the spotlight carries a solid five-point star, 28px in `accent`, with "In the Spotlight!" as its tooltip and accessible name. It sits in the artwork's right gutter from `lg`, level with the back link in the left one -- on the frame the drawing hangs in, not on the drawing, which was tried first and put a gold mark on the paper. Below `lg` it goes up into the row above the artwork beside the back link, as the back link itself does. It is the one solid accent mark that is not an action -- a status -- and the one glyph besides the density icons that is filled: an outlined star at that size is a scribble.
* **Platform marks are the one place this set copies someone else's shape.** They live in `components/platform-icons.tsx`, apart from `icons.tsx`, because they break the house rules on purpose -- Instagram keeps its rounded corners, YouTube its pill. A brand is recognised or it is nothing. Everything else in `icons.tsx` is still square-cornered, unfilled and drawn to this design.

* **A tag another piece shares opens a shelf of the pieces that share it.** **Added 2026-09-18.** Chips were static until then, because there was nowhere for one to point and a chip that looks clickable but is not is worse than a plain one. The shelf is the somewhere, and it keeps the reader on the piece: sending them to the gallery was the obvious move, and the owner turned it down. A tag only this piece carries stays a plain label, since its shelf would hold the piece already up. The chips that open one take the accent hover, as the upload modal's do, and the open one wears the accent. There are still no tag pages.

  **From `xl` the shelf is a drawer that pushes the page over.** It is 240px, hangs from the header and runs to the window's edge: its right margin goes out by the gutter as it opens, so the gutter becomes part of its width. The rail narrows from 320px to 272px and the title scales down with it. Measured with the drawer open, no piece lost any width at 1900×920, 1536×730, 1440×800 or 1280×650, square or portrait: the room came out of the gutters beside the artwork, which the height cap leaves wide, and the centred artwork simply moves over. Below 1280px there is not the room -- a drawer there took some 40% off a square piece at 1024px -- so below `xl` the shelf opens under the tags instead, as a row of pieces that scrolls sideways, and the piece does not move at all.

  Pushing rather than covering, because an overlay needs a shadow or a scrim to stand off the page and this system has neither. A column that joins the layout needs only the hairline the rail already has.

  **It is pulled out, not faded in.** The drawer slides out from the window's edge with its contents riding its leading edge, and the rail and the artwork give way over the same 300ms on the same curve -- measured in step to within 1%. The owner asked for exactly that when the first build appeared at full width in one frame while the page moved on its own.

  **A piece picked from the shelf opens in place, and the shelf stays open.** The pick hands on the tag's pieces as the walk, the way a filtered wall does, so prev/next and the arrow keys then step through the tag, and the mark moves down the list with them. Walking on to a piece without the tag closes the shelf for good, not until the next piece that happens to carry it. Escape and the shelf's own × close it and give focus back to the chip.

  **"See all in gallery" hands the reader on**, narrowed to the tag. It wears the gallery glyph, a masonry wall in miniature, and dropped its "the" for it: with the icon, the full phrase broke over two lines in the drawer's 208px. The rest of the filter is cleared so the wall shows what the shelf showed, the sort is kept, the filter band opens to say why, and the page lands on the wall rather than at the top, with the piece they came from marked.
* **Back sits at the top left of the artwork, and prev/next at the top of the rail.** Not in a row above the artwork. **Moved 2026-09-07**, with the cap above and for the same reason: that row cost 68px off the top of every piece page and helped push the artwork's own action below the fold, while the rail beside it ran half empty. Here they cost the drawing nothing and are still the first thing above the fold. Reclaiming the row alone would not have been enough -- it buys 68px against a 69px overrun, which lands the caption exactly on the fold and only looks fixed on a taller window.
* **Back is in the artwork's left gutter from `lg`, which costs nothing.** It was in the rail with prev/next for a day, and that put it at the far right of the page -- against the one convention nobody thinks about, which is that back is top left and a cursor goes there by reflex. **Corrected 2026-09-08.** The height cap leaves the artwork much narrower than its column, so the gutter either side of it was already empty; the link sits in it and takes no height at all.
* **The artwork column is `1fr auto 1fr` from `lg`**, rather than padding wide enough for the link. There is no width to guess at, the outer tracks share the slack evenly so the artwork stays centred on the page instead of being pushed off by whatever the label measures, and a track cannot overlap its neighbour -- a wide piece squeezes the gutters rather than running under the link, which is what absolute positioning would have allowed the first landscape upload to do.
* **Below `lg` back and prev/next share a row above the artwork**, because the rail falls underneath it there and reaching Next by scrolling past the whole drawing is worse than the row ever was. Back is rendered in both places and hidden in one: the two sit in different columns at `lg` and in one row below it, which no single grid placement expresses. `hidden` rather than opacity, so the unused copy leaves the tab order with the screen.
* **Prev/next** -- neighbours in whichever list the reader is actually in, and the same treatment as the back link beside them: `ICON_BUTTON`, the bordered 12px uppercase box at `0.08em` in `muted`, going accent on hover. So the pair reads as one set of quiet actions, and as the same kind of thing as the owner's actions further down the rail.
  **Below 640px Previous is shortened to "← Prev"**, since 2026-09-19, so the back link, the spotlight star and both steps share one row above the artwork instead of two. Measured from the fonts, "← All work" and the two steps need 375px; a back link named for a collection of more than about 15 characters, or a narrower phone, wraps the steps onto a line of their own as before. Arrows alone were tried first; the owner preferred to keep the words. Each link keeps its accessible name, "Previous piece: <title>".
* **A swipe is a phone's arrow keys.** **Added 2026-09-19.** One finger across the page, at least 56px and half again as far across as up or down: left for the next, as a page turns, right for the previous. It takes the arrows' path exactly, so the arrival slides in from that side. Nothing is prevented, so a stroke that is mostly vertical scrolls as it always did, and two fingers are a pinch. A stroke that starts in a dialog -- the viewer pans -- or on anything that scrolls sideways, as the tag row does, is left to it. `lib/swipe.ts` holds the rule; the spotlight uses the same one.
* **On a phone the page itself is carried.** **Added 2026-09-19.** Below 1024px the article -- the piece and its label -- follows the finger, and past the threshold a copy of it carries on off that edge while the page itself waits just past the other one, and the next piece comes in from there as soon as it has arrived -- overlapping the copy on its way out, as the spotlight's slides do. **Changed the same day**: the first version slid the page itself out and brought the next in only once it had gone, and the last 200ms of a decelerating exit, the old page creeping off an otherwise empty screen, read as the next piece being slow to appear. No view transition and no fade on this path. Short of the threshold it springs back, and towards a piece that does not exist it gives a quarter of the stroke and springs back. From 1024px nothing changes: the view transition's 128px slide under a crossfade was already the subtle version. The copy is a fixed, inert clone that removes itself when its slide ends. The page waits off screen as a held animation, and anything that is not the next piece arriving -- Back before it lands -- releases it, so a turn can never leave the page out of sight. `main` clips sideways overflow, or a phone would widen the page to hold the slide.
* **Both neighbours' drawings are fetched ahead** on every piece page. **Added 2026-09-19**, after the first phone test: the next piece waited off screen for its display rendition to download, which read as the swipe being slow. With the drawing already in hand the arrival waits only on the piece's own request, 12ms locally. It costs two display renditions per piece viewed, and makes the arrow keys and buttons land sooner too.

  This bullet described them as bare 13px `faint` text until 2026-09-07. They have been bordered boxes for considerably longer, and the boxes are what is kept -- the text was the specification, the boxes were the build, and the build won on use. Recorded rather than quietly corrected, because the two had disagreed long enough that the document was the unreliable one.

  Piece titles move to the tooltip and the accessible name; at this size the labels alone carry the action, and keeping them short is what fits both controls inside the 288px the rail has once its padding is taken. Ends are open rather than wrapping, and the unavailable side takes `ICON_BUTTON_INERT` -- the same box at 40% opacity and without a pointer cursor -- rather than being omitted, so the pair does not reflow between pieces.

* **A piece opened from a collection walks that collection**, in its curated order, and the back link is named for it -- "← Night Calls", not "← All work". **Added 2026-09-08.** Prev/next used to walk the whole gallery whatever list you had come from, so stepping through a set you had deliberately entered dropped you out of it at the first click, and Back then claimed to return you somewhere you had never been.
* **Where you came from rides in the URL, as `?from=`, and it is a trail rather than a step.** `from=home/night-calls` is "the gallery, then Night Calls": the nearest step is the list a page walks, and the rest is what its own back link inherits, so each page hands on exactly the trail behind it. A second parameter naming the origin's origin was the alternative, and that is one parameter per level of depth. Steps are collection slugs, plus `home` for the gallery, which is the one origin with no slug of its own. Router state was the alternative and is worse in the way that matters: it cannot be sent to anyone, so a shared link would quietly put the reader in gallery order while the sender was in a set. The same argument `?view=1` already makes. This once also said router state does not survive a reload; it does, because it lives in the tab's history, and the narrowed walk below relies on exactly that. A slug rather than the ids themselves, because the collection route returns members in `display_order` already, and an id list in a query string would be both enormous and stale the moment the set was rearranged. Steps are not percent-encoded and are filtered to slug shape instead: encoding a `/` gives `%2F`, which the query parser decodes back to `/` on the way in, destroying the separator it was meant to protect. Filtering also keeps the trail away from `decodeURIComponent`, so a crafted `?from=100%` renders a page rather than throwing a `URIError`. The trail is capped at four steps, which is past anything this site can produce.
* **A stale origin degrades rather than breaks.** The set is fetched alongside the gallery list, not instead of it, so a `from` naming a deleted collection, one private to this reader, or one that no longer holds this piece falls back to gallery order and an "← All work" link. It costs one request on a piece opened from a collection, which is the price of a wrong link being worth less than a right one instead of being worth nothing.
* **A waived piece ignores it.** Waiving drops collection membership, so the reserve is the only list left to walk however the piece was reached.
* **One piece gives way to the next in a single motion.** **Added 2026-09-18.** Stepping to a neighbour used to be three cuts, each in its own frame: the label changed, the frame resized around the old drawing, and the new drawing landed when it had loaded. Now the page holds the piece it has until the next one's image has decoded, then swaps the two inside a view transition: the artwork is carried -- moved and resized -- into the new one's place while everything around it crossfades, 300ms on the reflow curve. The same swap brings the first piece up in place of the loading line. The wait for the image is capped at 800ms, after which the piece goes up and its drawing follows; an edit to the piece already up goes straight through, since nothing is arriving. Inside the detailed view the swap is immediate, as the viewer draws its own tiles and a named artwork would render above it for the length of the transition. A browser without view transitions gets the held swap without the crossfade, which is still one cut instead of three.

  **A stepped move has a direction.** Reached by Previous, Next or an arrow key, the old drawing moves 64px the way the reader is leaving as it fades, and the new one arrives from the other side, so stepping along the wall reads as the wall going past. The direction is set by the control that starts the move and taken once by the swap that lands it, keyed by the piece it points at: a move reached any other way -- Back, a link, "Show me some!" -- has none and crossfades. 64px rather than a sweep, because a carousel is not what this is; it was 48px for an hour and read as too little between a tall piece and a square one. The number is a tuning knob.

  **The Detailed view button stretches to the new drawing's width, in place, and does not fade.** It is named, so it is its own group rather than part of the page's crossfade, and its label is named apart from it: a named descendant is left out of its parent's capture, so the box is captured as a flat accent rectangle -- which stretches cleanly -- while the label is captured on its own, stays sharp, and only re-centres. Named as one element it had been captured text and all, and that capture was scaled to the moving width and crossfaded, which read as the button fading rather than growing. The dimensions line beneath it is not named and crossfades with the page, since its text changes.

  **← and → step the wall from the keyboard**, on the piece page, unless a field has the caret or the viewer is open, where the arrows already pan the canvas. Alt, Ctrl and Cmd leave them to the browser, and a held key is one step, not a run. The same rule, from `lib/traverse.ts`, steps the spotlight on the landing page -- **since 2026-09-18** on the page rather than on the band, which had answered the arrows only while it held focus.
* **A narrowed or sorted list is walked as it was shown.** **Added 2026-09-17.** With a filter or a sort on, opening a piece hands its page the order on screen, and prev/next -- in the rail and in the viewer -- walk that rather than the gallery: a wall narrowed to four pieces steps through those four. It is a snapshot of the moment the piece was opened. A piece edited out of the filter stays in the walk it is on, and one waived or deleted since drops out of it.

  **The spotlight hands on its order the same way, since 2026-09-18.** "View piece" from the band carries the picks in the band's order, so a piece opened there walks the spotlight and not the wall: the band is a set the owner arranged, and stepping out of it at the first click would be the collection problem over again.

  It rides in router state, not the URL -- the opposite of the trail, for the opposite reason. A filter is the reader's view rather than a place, so a link sent to someone else should not carry it; they walk the gallery or the set, which is where the link points. Nothing is handed on while no filter or sort is on, since the page finds the same order itself, and a waived piece walks the reserve regardless.

  **Pinned 2026-09-17: a sorted collection walks in its sorted order**, not in the curated order promised above. Which of the two should win is to be settled later; until then the order on screen does.
* **Not found** -- an unknown id gets the eyebrow-plus-headline treatment from the intro, at a reduced size, with a link back.

### Collection page

* **Back offers the gallery as well as the index, when the gallery is where the reader came from.** A collection is reachable two ways -- the row on the landing page and the header's Collections item -- and "back" means a different place for each. Arriving from the landing page and being returned to the collections index is the small displacement that makes a site feel like it moved while you were reading. **Added 2026-09-08.**
* **And only then.** Someone who came through the header has no gallery to return to, and a second button would be inventing a history they do not have. The index is always offered, because a set always belongs to the list of sets.
* **The gallery sits first.** It is the truer "back" when it is there at all; the index is the step up rather than the step back.
* **The trail survives a trip through a piece.** Gallery, collection, piece, back returns the reader to the collection with the gallery still offered. It did not at first -- the origin held one step, so the piece never knew where the collection had come from and the gallery button vanished on the way back. Recorded because it was shipped that way for an afternoon and reported as a bug within the hour, which is the correct verdict: a back row that changes depending on how you got to the same page reads as broken, not as economical.

### Curation page

The owner's page for the gallery's order, `/curate`. **Added 2026-09-19.** The behaviour, and the reasons for it, are in `CURATION.md`; these are the visual rules.

* **An owner page like Waived and Metrics**: eyebrow, serif headline, one line of muted copy, then the work.
* **A toolbar that sticks under the header**, `bg-translucent` with the header's blur and a `line` rule beneath: the count and the save state on the left, the density control, Undo, Discard and the one filled action, Save order, on the right. Unsaved state is said in accent; saved in `faint`.
* **Tiles are `PieceTile` with the drawing whole**, `object-contain` on the hatch, so a portrait is not cropped to a band while its place is being judged. **The frame holds its 4:3 here, since 2026-09-19**: the drawing is taken out of flow, so it cannot floor the frame's height the way it does in the pickers, and every tile is the same size -- the grid is regular, and the gap a drag opens is exactly one tile. Position on an accent badge at the top left, the pick box at the top right, "New" outlined in accent at the bottom left.
* **Picked is the accent border and a filled pick box**, the collection pickers' selected state.
* **A drag lifts the tile itself**, since 2026-09-19, with dnd-kit. The tile rides under the pointer outlined in accent on `bg`, carrying its number and, for a group, a count; no shadow and no tilt, which the rules forbid. Where it came from, an accent outline holds the slot, and the grid slides aside around it as the pointer moves, on the 300ms reflow curve, so where it will land is always on screen. Picked tiles carried along drop to 40% until they gather. On release the tile settles into the slot and the board's FLIP takes over from where every tile is drawn, so nothing slides twice. On a phone a press held for a quarter second lifts it, so a swipe still scrolls.
* **Where picked pieces will land is a 2px accent line in the gap**, before or after the tile under the pointer, for pick and place. It replaces the arrangers' outline on the target, which never said which side.
* **Pieces or Collections**, a switch under the headline in the same bordered-group drawing at button size: what is being ordered, above the tools that order it. Each keeps its own unsaved order.
* **Arrange and Preview are a switch in the toolbar**, drawn as the density control is: a bordered group, the active one filled in accent. The preview is the page's own grid -- the gallery's masonry, or the collections grid -- inert, with the arrange badges numbering it, because a preview drawn any other way would be a claim about the wall rather than the wall.
* **Start from is a native select** in the toolbar, reading "Start from..." and returning to it after each use: it is an action, not a setting. What it does is undoable like any move.
* **The pick bar sticks to the foot of the screen** while anything is picked, outlined in accent: what is picked and how to place it on the left, To top, To bottom, To position and Clear on the right.

### Upload modal

The first form in the system, so it defines the form vocabulary the rest will inherit. Built on a native `<dialog>`: focus trapping, Escape, an inert background and top-layer stacking come from the platform rather than from a hand-rolled trap.

* **Panel** -- `surface` on a 1px `line` border, `min(94vw, 940px)` wide, capped at `90vh` with the body scrolling inside. Header and footer are divided by hairlines, not by elevation. The backdrop is `black/70` under a 3px blur, echoing the sticky header.
* **Two columns above 640px** -- artwork left, fields right, stacking below. The image is given the larger half because it is the subject.
* **Drop zone** -- `hatch` when empty, which is already the system's mark for absent artwork, so nothing new was invented. `line` border turning `accent` on hover and while a file is dragged over it. On drop it becomes the preview, `object-contain` under a 420px cap, with filename and size in 12px `faint` below.
* **Field labels use `muted`, not `faint`.** Meta text is allowed to recede; an instruction is not. This is the one place the eyebrow letterform (12px, uppercase, `0.24em`) is paired with a louder colour, and the reason is legibility.
* **Inputs** -- `bg` inside a `surface` panel, so the recess reads as a change of background rather than an inset shadow. 1px `line` border, radius 0, 14px `text`, placeholders in `faint`. Focus takes an `accent` border *and* a 1px `accent` outline: a border change alone is too quiet at this line weight, and an outline is a focus ring, not elevation.
* **Tag chips** -- typed into the field and committed with Enter or comma; Backspace on an empty field removes the last. Same bordered chip as the wall label, but interactive here, so they take the `accent` hover the static ones do not.

  **Tags are lowercase, since 2026-09-17.** The field lowers a tag as its chip is made, and the API lowers it again before storing, so the table never holds a capital however a tag arrives; a migration lowered the ones already there. Only case is merged -- a misspelling stays a tag of its own until the piece is retagged.

  **Tags already in use are offered, added 2026-09-17.** Focusing the field opens a list of every tag the gallery's pieces carry, A-Z, less the ones this piece has; typing narrows it to the tags that contain the text. Click one, or reach it with the arrows and Enter, and the list stays open for the next. Enter or comma with nothing highlighted still commits exactly what was typed, so a new tag costs nothing extra. Escape closes the list and not the dialog around it, and removing a chip leaves the field focused, so the list stays open and takes the removed tag back. It is re-read on every focus, because the upload dialog stays mounted between pieces and a tag given to one should be offered for the next.

  The list is a popover in the top layer, not an absolute menu: both dialogs scroll their body, and the field sits at the foot of the upload form, where a menu would be clipped at the footer. CSS anchor positioning holds it under the field at the field's width and flips it above when the window runs out below. A browser without anchor positioning shows it at the window's top-left -- usable, and only ever in the owner's forms.
* **A derived value is stated, not boxed.** Where one field already answers another, the answer is shown as its label plus plain 14px `text` -- no border, no `bg` recess, nothing focusable. An input invites typing and there must be nothing to type, or the two can disagree. It keeps the field's vertical padding so a stated value and a box beside it sit on one line.

  **Year is the first of these, added 2026-09-07, and it changes kind.** A date made carries a year, so where one is picked the year is read off it; where none is, the year is an ordinary input. Two controls for one fact had been two ways to disagree and nothing reconciled them -- the gallery holds a piece dated 2024-08-05 whose wall label shows no year, because the box beside the date was left empty.

  Deriving it *always* was tried first and was wrong. `input[type=date]` demands a complete date, and a sketchbook is full of work whose year is known and whose day is not; two pieces are recorded exactly that way, and always deriving would have blanked them and forced an invented day onto every older drawing. So the form shows the two precisions the data model already has -- `year` coarse, `created_date` fine, the fine implying the coarse -- and the year stays typeable exactly while nothing else claims it. That is what makes disagreement impossible rather than merely discouraged. `lib/year.ts` holds the rule; `YearField` is shared by the upload form and the edit dialog, which collect the same things by design.
* **Position in the gallery** sits last in the details column, under Tags: a number field whose placeholder says `Top`, the default, and a `faint` line saying what empty and a number each do. It began under the collections and moved the same day at the owner's word; the details column had the room. **Added 2026-09-19**; `CURATION.md` §5 has the rule.
* **Required marks** -- an `accent` asterisk. Pointing at something the form needs, so hairline rather than filled.
* **Errors** in `accent`, bottom-left, `role="alert"`, and cleared by any edit -- a message that outlives the problem it describes reads as though the form is still refusing.
* **Actions** -- bordered ghost "Cancel", solid `accent` "Add to gallery". Both disable during upload, and Escape is refused mid-request so a stray keypress cannot abandon work already in flight.

### Picking pieces

Choosing members for a collection happens in a near-full-screen dialog, at `94vw` by `92vh`.

This began as a second mode on the gallery: the page went into a picking state and a bordered `accent` bar replaced ordinary browsing. It was wrong in use rather than in look -- choosing meant scrolling the length of the gallery, and naming or cancelling meant scrolling back to the top. **Replaced 2026-09-01.** `PieceCard`, `MasonryGrid` and `AllWorkSection` no longer know what a selection is.

* **Split 80/20** -- a dense uniform grid on the left, and a control column on the right holding the name, the filters, the count and the actions. The grid scrolls inside itself, so the controls never leave the screen however far the picking goes.
* **Filters live in the control column** -- title search and a year, applied as typed with no apply step. Years are derived from the pieces present, so the control never offers one with nothing behind it. Filtering runs in the browser over the already-fetched list; at this size a round trip per keystroke would be slower than scanning what is there.
* **A grid, not the masonry.** `repeat(auto-fill, minmax(140px, 1fr))`: uniform columns read across rows in a fixed grid, where the gallery's masonry sets each piece under whichever column is shortest. That is the part a picker actually needs -- a target in a predictable place, and a sequence that reads in the order the numbers are handed out. **Tile heights follow each piece's own ratio**, as everywhere else in the gallery: the columns are uniform, the tiles are not. This bullet used to claim `PieceTile` cropped to a 4:3 box. It never has -- the box is a flex item, so `min-height: auto` floors it at the image's intrinsic height and outranks the `aspect-[4/3]`, which computes correctly and loses. **Settled 2026-09-07**, once it had been measured and the one-class fix demonstrated: the gallery holds no landscape work at all, so a 4:3 box cropped every piece in it -- 68% of each kept on average, 45% for the worst -- to buy a uniformity the picker was not suffering for the want of. The `aspect-[4/3]` is inert and harmless; the ratio stays the piece's own.
* **Selection is numbered, not ticked.** A picked tile takes an `accent` border and a small solid `accent` square in its top-left carrying its position. Pick order becomes the collection's display order, and a plain checkmark would hide that -- the number is the only thing telling you the order is being recorded.
* **Actions sit at the bottom of the column** at `mt-auto`, so they hold their place whether or not the year control is showing. "Unpick all" sits with the count rather than with the filters: clearing a filter changes what you can see, unpicking changes what you have chosen.
* **The same picker serves "Add work"** in arrange mode, which had the same unfiltered scroll.

### Destructive confirmation

Deleting a piece removes the row, the original, and both renditions, with no undo. The design carries that weight in three places rather than one.

* **The affordance is quiet and out of the way.** "Delete permanently" is the last item in the wall label rail, below a hairline, and reachable only on work already waived. It never sits with prev/next, where a cursor is already moving between pieces. It is an icon button like its neighbours, and `danger` appears on hover alone; at rest it is as quiet as the metadata around it.

  **That separation got shorter on 2026-09-07 and still holds.** Prev/next used to be in a row above the artwork, a whole column away; it is now at the top of this same rail, with delete at the bottom of it. What keeps the rule is that delete is *last* rather than merely elsewhere -- the title, the meta, every optional block and two hairlines lie between the two, so a cursor stepping through the gallery never passes over it. Were the rail ever to put actions near its top, this bullet would be the thing that broke.
* **Owner only.** The prop is omitted for visitors, so the block does not render at all rather than rendering disabled.
* **The dialog does the persuading.** Native `<dialog>`, 480px, no close ×. Omitting the × means the first focusable element is Cancel, so the dialog opens with focus on the safe choice and a stray Enter does nothing. Escape and backdrop clicks cancel, and both are refused mid-request.
* **It names the piece and states the consequence** in two short paragraphs: what is removed from where, then that it cannot be undone and what the owner is left with. Generic "Are you sure?" copy is not enough when the thing being destroyed is the only copy.
* **The confirming button is outlined, not filled.** A filled button is an invitation and this is not one. It fills on hover, which is the moment the choice is actually being made.

### Footer

A `rule-5` pencil stroke, mirrored, straddling its top edge; 28px vertical padding; content split left and right and allowed to wrap. Both strings are 12px `faint`. Beside the wordmark, in the same 12px `faint`, a sentence says anonymous visits are counted and carries the opt-out as an underlined `SUBTLE_ACTION` -- the notice and objection `METRICS.md` section 7 requires. It wraps under the wordmark before the row itself wraps.

## Implementation Notes

* **Tailwind CSS v4.** Tokens live in `@theme inline` in `frontend/src/index.css`, mapping to plain custom properties defined under `:root` and `:root[data-theme="light"]`. `inline` is what makes utilities resolve the variable at the use site, which is what allows a live theme swap.
* **Theme is stamped on `<html>` as `data-theme`** by an inline script in `index.html` that runs before first paint, so there is no flash of the wrong palette. It resolves stored choice, then `prefers-color-scheme`, then dark.
* **Storage keys**: `sketchyart-theme` (`"dark"` | `"light"`) and `sketchyart-grid-density` (`"airy"` | `"comfortable"` | `"dense"`). A theme is written only on an explicit toggle -- writing on mount would freeze the OS-derived default for a visitor who never chose.
* **A no-JS fallback** honours `prefers-color-scheme` through a media query guarded as `:root:not([data-theme="dark"])`.

### Inline style exceptions

`coding-preferences.md` forbids inline styles, and the rule holds everywhere a value is known ahead of time. Four values in this UI are resolved at runtime and cannot be expressed as static utility classes, because Tailwind only emits classes it can see in the source:

1. `aspect-ratio` on a piece thumbnail -- a continuous value from stored image dimensions.
2. `columns` on the masonry -- selected from the density map at runtime.
3. The collection swatch gradient -- selected by card index.
4. `object-position` on a spotlight slide and in the focal picker -- two percentages stored per piece, and the mark's own `left` / `top` while it is being dragged. `object-fit`, `transform-origin` and the zoom's `scale()` ride along with it: all four are one per-piece framing, and a Tailwind class cannot hold a continuous value.

Cases 2 and 3 draw from a fixed, enumerable set and *could* be rewritten as static class lookups. Cases 1 and 4 cannot: both are continuous per-piece numbers, and case 4 changes on every pointer move. These are the only sanctioned exceptions; anything else uses a token.

The Tailwind rule behind all four is worth restating, because it is the trap: a class only exists if the literal string appears in the source. `` `scale-[${n}]` `` or `` `object-[${x}%_${y}%]` `` compiles, ships, and silently does nothing.

## Accessibility

* The `faint` token does not meet WCAG AA for normal text in either theme -- roughly 2.6:1 dark and 2.7:1 light, against a 4.5:1 bar. It carries meta, counts, the eyebrow and the footer, all at 12px. This is a deliberate aesthetic choice and is documented here so it is a decision rather than an accident. Raising it to `#898781` (dark) and `#6e6a60` (light) would clear 4.5:1 and is a two-line change.
* Accent gold on the light background is roughly 1.9:1, which matters where it is used as light-theme nav hover text. On the dark ground it is 7.2:1.
* Controls that toggle carry `aria-pressed`; the density group carries `role="group"` and a label; the menu button carries `aria-expanded` and `aria-controls`.
* All motion is skipped under `prefers-reduced-motion: reduce`, including the dialog transition -- skipped, not shortened.

## Deviations From The Prototype

Recorded so they are not mistaken for drift:

1. **Header and footer inner content is capped to the content measure.** The prototype left them full-bleed, which put the wordmark outside the headline's left edge.
2. **Density values are widths, not counts.** The prototype used `3 380px` / `4 320px` / `5 300px`. The leading count capped the grid: above the content cap a wider window only enlarged each card, so every screen rendered the same three columns. Dropping the count lets the column count follow the window.
3. **The density control is new.** The prototype exposed density as a developer knob with no UI.
4. **Tags filter through the gallery filter, not a chip row.** The prototype's chips above the grid became a Tags dropdown beside Year and Collections, for the reason those are dropdowns -- see *Gallery filter*.
5. **A per-image failure fallback was added**, which the prototype did not design.
6. **The spotlight band breaks the content cap**, deliberately. Layout says content regions are capped at 2400px with gutters and only the header and footer span the viewport. The band spans it too, because a hero that stops 64px short of the edge reads as a wide card rather than as a wall. Its inner grid still caps at 2400px, so it lines up with everything below it, and the rule holds everywhere else.
