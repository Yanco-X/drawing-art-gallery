---
name: SketchyArt Gallery
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

## Themes & Color

Every colour is a semantic token, defined once per theme. Components never reference a hex directly -- the only literal in component code is the accent, which is shared by both themes.

### Text hierarchy

Four steps, from loudest to quietest. Picking the right step is most of the work of styling text in this system.

| Token | Role | Dark | Light |
|---|---|---|---|
| `text` | Primary -- headline, piece titles, wordmark, active nav | `#e8e6e1` | `#1c1b18` |
| `dim` | Section headings ("Collections", "All work") | `#b7b4ac` | `#4a4842` |
| `muted` | Nav links, control labels | `#97958d` | `#6f6c63` |
| `faint` | Meta, counts, eyebrow, footer, "View all" | `#62605a` | `#9a968b` |

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

**Outlined or hairline** -- `accent` on a border, a rule, or text -- is the interface pointing at something: hover borders, the active nav underline, active control states, form focus with its required marks and errors, the picked-tile number in a picker, the minimap's viewport rectangle, and the italic "Art" in the wordmark. These may repeat, and often do.

`ICON_BUTTON_ACCENT` is the outlined box and `PAGE_ACTION` is the filled one; both live in `components/form-styles.ts`. Reach for an existing one before writing a third.

### Danger

The one sanctioned exception to "no second colour", and it is a semantic token rather than an accent: it names a consequence, appears only where an action cannot be undone, and is never decorative. At the time of writing that is exactly two places -- the "Delete piece" hover state and the confirming button in a destructive dialog.

Unlike the accent, it is defined per theme: `#d77868` on the dark ground, `#a33f2f` on the light one. A single red cannot carry on both. Both clear WCAG AA against their own background (5.3:1 and 5.8:1).

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
| `0.08em` | Buttons, footer, menu rows | Uppercase |
| `0.24em` | Eyebrow | Uppercase |

Line-height is `1.05` on the display headline and default everywhere else.

## Layout & Spacing

Fluid, with no media queries in the content regions. Horizontal padding and headline size scale with `clamp()`; the collections grid and masonry reflow by column count on their own.

* Content regions are capped at **2400px** and centred, with `clamp(20px, 5vw, 64px)` horizontal gutters.
* The header and footer span the full viewport -- their background and border are edge to edge -- but their **inner content is capped to the same 2400px** so it lines up with the page below.
* The cap is deliberately above a 1920px laptop, so a large monitor gains columns rather than margin. Long text is not at risk from it: every headline and paragraph carries its own em-based measure (`max-w-[14em]`, `max-w-[16em]`, `max-w-[42em]`), so prose stays readable at any container width.
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
| 300ms `cubic-bezier(0.2, 0, 0, 1)` | The filter band opening and closing -- its height, nothing else |
| 200ms `cubic-bezier(0.2, 0, 0, 1)` | A dialog opening and closing -- opacity, and an 8px rise |
| 200ms `cubic-bezier(0.2, 0, 0, 1)` | A menu panel opening and closing -- opacity, and an 8px drop |
| 200ms | One spotlight slide crossfading into the next -- opacity, nothing else |

No stagger and no scale. Motion acknowledges an action and gets out of the way.

**A carousel does not license a slide.** The spotlight crossfades because there is no horizontal translate anywhere in this table, and adding one for the sake of a familiar pattern is exactly the drift this section exists to prevent. Opacity was already the sanctioned way for one surface to replace another.

**Opening in the page is a reflow, not an entrance.** The filter band takes the masonry's 300ms rather than the dialog's 200ms and 8px, because nothing is arriving over anything -- the page makes room and the content below moves down. That is the same act as a density change, and it should cost the same. The 8px rise is reserved for a surface that covers what was under it; spend it on something that pushes instead and the two stop meaning different things.

Height cannot be transitioned from `auto`, so the band is a grid going `grid-template-rows: 0fr` to `1fr`. That is machinery rather than design, and it is recorded because the obvious `height` transition does not work and the next person will reach for it.

**A surface arriving over the page is the sanctioned entrance**, added 2026-09-01 for dialogs and extended to menu panels on 2026-09-02. Something that covers what was under it and appears in a single frame reads as a jump cut rather than as a thing opening. It is 8px and an opacity, on the same budget as a hover -- deliberately below the threshold where it would feel like an effect.

The 8px goes the way the surface came from: a dialog rises, a menu hanging below its button drops. Nothing else animates in. This is a rule about surfaces, not a licence to animate the page.

The exit is the part that needs modern CSS: `close()` removes the element in the same frame, so `display` and `overlay` transition with `allow-discrete` to hold it in the top layer long enough to fade, and `@starting-style` supplies the pre-open values. Browsers without either show and hide the dialog outright, which is what happened before.

A menu panel needs the same treatment for the same reason, minus `overlay` -- it is not in the top layer. It stays mounted and toggles `display` through `data-open`, so `display: none` keeps its links out of the tab order while it is shut, and `allow-discrete` holds the element long enough to fade on the way out. Both live in `index.css` rather than in the components: the exit cannot be written as utility classes without becoming unreadable, and the two entrances belong next to each other.

All motion must be skipped under `prefers-reduced-motion: reduce`.

## Components

### Header

Sticky at `top: 0`, `z-index: 10`, 12px backdrop blur, `bg-translucent` background, bottom border in `line`. Padding `20px` vertical.

* **Wordmark** -- "Sketchy" in `text` plus "Art" in accent italic, Instrument Serif 24px.
* **Nav** -- Gallery / Collections / Socials, 14px uppercase, plus Waived for the owner. Active item is `text` with a 1px accent bottom border and 2px of padding beneath; inactive items are `muted` and go accent on hover. The nav sits left of centre; this is a natural result of a three-cluster `space-between` row and is correct.
* **Socials** is a button, not a link, and carries a chevron -- the only thing marking it apart from its neighbours, and what says a click opens rather than goes.
* **Theme toggle** -- 1px `line` border, transparent fill, glyph plus label. **The label names the theme currently active, not the one it switches to.** The accessible name states the action.
* **Owner state** -- a solid accent "+ Upload" button, then a 36px square sign-out button set 40px apart from it. The gap is deliberate: the two are next to each other but are not the same kind of act, and a mis-click ends the session someone was about to upload into.
* **Visitor state** -- nothing. No sign-in link, no hint that an owner exists; `AUTH.md` §5 has the reasoning.
* **Below 640px** -- the nav collapses behind a menu button drawn as three 1px bars, the toggle drops to its glyph, and the socials and sign-out move into the menu panel, where they can carry labels.

### Icon buttons

The theme toggle's treatment, generalised: 1px `line` border, transparent fill, icon plus label, 12px uppercase at `0.08em`, going accent on hover. Destructive actions go `danger` on hover instead and are never filled. Used where an action changes something and must not read as a link -- the owner's actions on a piece are the first place.

**Icons are drawn in `components/icons.tsx`, not imported.** A 24-unit `viewBox` rendered at 16px puts a 1.5-unit stroke at exactly one device pixel, so an icon is the same hairline as every border in the system. `fill: none`, `stroke: currentColor`, square caps, so an icon inherits every hover and disabled state already on the button and never needs styling twice.

Deliberately not an icon font or a package -- several hundred kilobytes for five glyphs, and `AGENTS.md` §2 rules out new dependencies without asking. Deliberately not Unicode dingbats either: ✎ and its neighbours render as colour emoji on Windows, and there are no emoji in this project.

**Three weights, in `components/form-styles.ts`.** `ICON_BUTTON` is the default, `line` border going accent on hover. `ICON_BUTTON_ACCENT` is bordered in accent and fills on hover -- a useful action inside a section, like "+ New collection". `PAGE_ACTION` is filled from the start and full width: the one action a page exists for, at most one per screen. See Accent for which is which. `ICON_BUTTON_DANGER` and `ICON_BUTTON_INERT` cover the destructive and the unavailable.

### Spotlight

The band above the intro on the landing page: the newest five pieces, one at a time, shown nearly whole beside its label. Added 2026-09-03, modelled on the hero band at artsy.net.

* **Full bleed, inner content capped.** The section spans the viewport; the grid inside it is capped at 2400px and centred. This is the header and footer rule, not the content-region rule, and it is the one place a *content* region takes it -- recorded under Deviations.
* **Split 50/50**, collapsing to one column below 1024px. No new breakpoint. It went 55/45, then 66/34 to give the artwork more room, and back to 50/50 on 2026-09-07 -- because a wider panel is a *wider frame*, and a wide frame beside a tall portrait is more empty ground, not less. At 50/50 the band's frame lands within a whisker of the picker's 3:2 preview at a typical window (1.485 against 1.502), so the hatch the owner sees while choosing is the hatch the page shows. What the half gives up in artwork width it gets back in a label panel with room for the collections block.
* **Cover, aimed by a per-piece focal point.** `object-fit: cover` at `clamp(440px, 72vh, 780px)` beside the label and `clamp(320px, 52vh, 500px)` above it, with `object-position` from the piece's stored focal point. The artwork fills its half outright; nothing is letterboxed.

  This replaced contain plus a zoom on 2026-09-06, and the reasoning is worth keeping, because contain looked like the safer choice. Every piece here is portrait or square while the panel is wider than it is tall, so a contained fit was limited by height and left hatch bars down both sides. Scaling past the fit did not close them: it ate the axis that was already full. Measured, a 1.14 scale cost 12.3% of the height -- heads and feet -- and took nothing off the bars. **No zoom value fills a bar**, because the slack and the crop are on different axes.

  Cover fills the panel by definition. What made it unsafe before was only that the crop was centred, and centre-cropping a portrait beheads it. A focal point is what makes cover safe, so the two arrived together and neither works without the other.
* **The focal point is a fact about the piece, not about the band.** `focalX` and `focalY`, two nullable percentages on the piece row, null meaning centre. Stored as numbers rather than baked into a cropped rendition: a second derivative per piece would cost a pipeline stage, another copy of every image and a backfill, where two integers cost about thirty bytes in a payload the page already fetches and are spent at paint time, on an image the browser is drawing anyway. Any other cropping surface can read the same pair.
* **The title takes the piece-title step**, `clamp(22px, 2.4vw, 32px)`, not the display step. The intro headline sits directly beneath and is the page's own voice; two headlines at the same size argue with each other.
* **The action is outlined.** `ICON_BUTTON_ACCENT`, because the header already spends the filled accent on "+ Upload" for the owner and the rule is one per screen.
* **No caption over the artwork.** The title is already in the label; an overlay would say it twice.
* **Slides stack in one grid cell**, not absolutely. The band takes the height of the tallest, so it never resizes as it advances, and the stacked layout needs no fixed height of its own. The label is centred beside the artwork and top-aligned below it, so the slack a short label leaves falls as padding rather than as a hole between a piece and its title.
* **Indicators are position, not progress.** One hairline per slide, `line` going `accent` for the current one, each a button with 12px of padding above and below so a 1px rule is still a target. A rule that filled over eight seconds would make the timer legible and would also put continuous motion on screen for as long as the page is open.
* **Autoplay at eight seconds**, paused by hover and by focus landing inside the band, and ended for good by any deliberate advance -- a band that moves on eight seconds after someone chose a slide is taking the choice back. It does not start at all under `prefers-reduced-motion`.
* **The pause control is the word `PAUSE`, not a glyph.** WCAG 2.2.2 wants an explicit way to stop anything moving for more than five seconds. A pause mark at 16px is two 1.5-unit bars almost touching, which is the mud the density icons had to be filled to escape; that exception was granted for columns and is not extended here. Hidden under reduced motion, where there is nothing to pause.
* **Inactive slides are `inert`**, which keeps their "View piece" link out of the tab order and out of hit testing. Verified with `elementFromPoint` and a dispatched mouse event, not with `.click()`.
* **Zero pieces renders nothing. One piece renders the piece**, with no indicators, no chevrons and no timer.

**Curation, added 2026-09-06.** The band shows the newest five until the owner says otherwise; hand-picked pieces take the first slots, in whatever order the owner dragged them into, and whatever is left is filled from the newest work not already picked. Nothing picked is the default and is stored nowhere.

* **A gear at the far right of the control row, owner only**, set apart by 40px. This is the header's rule about "+ Upload" and sign-out: the two sit together but are not the same kind of act. Everything to the left of the gap changes what you are looking at; the gear changes what the gallery shows everyone.
* **The control row survives a single piece for the owner.** With one piece there are no indicators and no chevrons, but the gear is the only way into curation and a gallery of one still has a spotlight to arrange.
* **The dialog is the picking vocabulary, not a new one** — 94vw by 92vh, the 80/20 split, `PiecePickerGrid` with its numbered badges, and the title and year filters in the control column. The name field is what collection creation has that this does not.
* **It shows all five slots, not just the picks.** Picked slots carry the accent badge; filled ones carry an outlined number and the word "Latest". Filling is the whole point of the feature, and a rule you can only verify by closing the dialog and looking at the page is a rule that will be mistaken for a bug.
* **The picks are dragged into order, with the collection arranger's gesture.** Native drag and drop, the `text/plain` payload Firefox needs before it will start a drag at all, the lifted row at 40% and an accent outline on the row it will land in -- and the same arrow-key fallback, down the list here rather than across a grid, so the keys are up and down. A second vocabulary for a job the owner has already learned elsewhere is one to unlearn. The `move` helper both arrangers were about to own a copy of now lives in `lib/order.ts`.
* **Only picks move.** A filler's place is `created_at DESC` and nothing in this list can change it, so fillers are listed, numbered and inert: a drop onto one is refused by the browser rather than by a rule the owner has to read. Below two picks there is nothing to order at all, and the grips, the drag and the instruction line go with it rather than sitting there dead.
* **The sixth pick is refused, not swapped in.** Silently evicting something the owner chose is worse than not adding one more, so the tile simply does not take and the column says every slot is taken.
* **The dialog is a sibling of the band, never a child.** However the top layer paints a `<dialog>`, it is still a DOM descendant of wherever it sits, so its events bubble: as a child, an arrow key typed in the search field advanced the carousel behind it.
* **Autoplay stops while the dialog is open**, through a suspend flag rather than the hover hold. Opening the dialog takes the pointer off the band, which fires the mouse-leave that would release a hold and set the band running behind the cover.

### Focal picker

Where a piece's crop is aimed, in the Edit details dialog. Added 2026-09-06 with the spotlight's move to cover.

* **Two views of one pair of numbers**: the whole artwork with a mark on it, and beneath it the band's own shape cropping live. Choosing on the full image and judging the crop are different jobs, and a control that only did the first would have the owner saving and reloading to find out what they picked.
* **The preview uses the band's real ratio**, roughly 3:2, not a round number. A preview at the wrong shape lies about what will be cut.
* **The mark is a hairline cross, not a filled dot.** A dot covers the exact detail being aimed at, and this set has no filled marks outside the density icons.
* **It replaced a static preview**, which showed the artwork beside a line explaining that the artwork does not change -- true, and nothing to do. The crop is the one thing about the image this dialog can set, and setting it still does not touch the file.
* **Pointer capture, not window listeners.** The element keeps receiving moves once the pointer leaves it, the browser cleans up a cancelled gesture, and touch and mouse are one code path. `touch-none` is required with it: without it a drag scrolls the dialog instead of moving the point.
* **Arrow keys move it**, 2% a press and 10% with Shift, on a focusable frame carrying its coordinates in its accessible name. 1% a press would be forty presses to cross a piece.
* **A zoom slider under the preview**, because the preview is the only thing it visibly changes. 100% is the whole piece in frame and 200% is twice as close; the line beneath says what share of the piece survives, which is true of the band as well as of the preview. An unsized piece parks the slider where filling this preview lands, so the first drag does not jump.
* **The zoom is spent over `contain`, not over `cover`.** `object-fit` crops at layout time and a transform only scales what came out, so a scale over `cover` draws the same crop smaller instead of revealing more -- measured with a test image of numbered bands, which showed the same bands at every scale. Over `contain` the whole piece starts in frame and the scale has something to give back.
* **A multiple of fit, not of fill, so no surface needs to know its own shape.** Fill belongs to the frame; the band's frame is `clamp()`-sized and the picker's preview is 3:2, so a percentage of fill framed the same piece differently in each -- 41.3% of its height in the band against 53.9% in the preview, on one window. Over `contain` the scale is simply the stored number, and every surface and every visitor sees the same amount of the drawing. What varies is the hatch beside it, which is what a wider frame honestly means.
* **The preview promises the artwork, not the hatch.** It is 3:2 while the band is whatever the window makes it, so the share of the piece in frame matches exactly and the surrounding hatch does not. Only the first of those is worth promising.
* **A native range input**, styled to a hairline track and a square thumb in `index.css`. It brings keyboard stepping and its value in the accessibility tree; none of that is worth rebuilding for one field.
* **"Fill" clears it back to null** rather than writing a number, the same reasoning as "Centre". Null is the one framing that needs no frame to know: it fills whatever shape it is given.
* **"Centre" clears it back to null** rather than writing 50, so a piece that was never placed stays distinguishable from one deliberately centred.

* **The label is two columns from `2xl`**: the wall label, and a column naming the collections the piece is in. The half is wider than a title and three lines of description need, and a collection is the one thing a visitor looking at a piece plausibly wants next that the page cannot otherwise tell them.
* **Drawn by `CollectionGrid`**, the same component the landing row and the collections index use, so a collection looks like itself wherever it appears and there is one place to change how. A column narrow enough makes its `auto-fill` resolve to a single track, which is what turns the row into a column without a second component.
* **The column is a bounded share of the half** -- 40%, never under 220px, never over 340px. Fixed, it took the same width out of a 576px label at the bottom of `2xl` as out of a 1072px one at the top, and the wall label paid for it.
* **The wall label is capped at a 26rem measure when something sits beside it**, and the row packs from the start rather than centring. Uncapped, the label ate the half and pushed the collections against the far gutter with a field of nothing between them. Centred, the title stepped sideways as the band advanced from a piece in three collections to a piece in none -- so the cap is conditional and the start is fixed.
* **The axis flips once, at `2xl`, and the label takes the artwork's height with it.** Below that the half cannot hold both -- a 260px column at 1024px left the wall label 110px and broke the title over two lines -- so the collections sit under the label at natural height instead. The height arrives with the row because it is what caps the scroller; a fixed height under a stacked layout would cap nothing and spill the overflow over the intro.
* **A long list scrolls rather than growing the band**, and each width caps it differently. Under `lg` the band is stacked and the page scrolls, so the list runs as long as it likes. From `lg` the artwork has a fixed height and the label does not, so an unbounded list dragged the band to 1007px beside a 648px piece -- hence a `32vh` cap. From `2xl` the label has the artwork's height and the flex box caps it, so the viewport cap is dropped. `min-h-0` is not optional there: without it a flex child refuses to shrink, and a long list measured 2492px spilling out of a 637px band.
* **It costs no request.** `GET /api/collections` carries `pieceIds` and the landing page already asks for it, so membership is a filter over rows the page is holding. A draft never reaches a visitor because that route drops private collections before the band sees them.
* **Nothing is shown for a piece in no collection** -- no heading, no rule, no empty state. It is not a gap to be filled; most pieces are in nothing.

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
* **The restore re-asserts for up to half a second**, because the page is not its final height when the grid first paints -- on the landing page the collections row arrives on its own request and adds a band above the grid. It gives up the instant the reader scrolls, wheels or types: someone who has started reading has said where they want to be, and outranks a remembered position.

### Masonry grid

CSS multi-column. Children use `break-inside: avoid` and a 20px bottom margin.

Reading order runs top-to-bottom down each column rather than left-to-right across rows. This is an accepted trade-off of the CSS-columns approach; a JS or grid masonry would be required to change it.

Density is a persisted user preference:

| Density | `columns` | 1792px content | 2272px content |
|---|---|---|---|
| Airy | `380px` | 4 columns | 5 columns |
| Comfortable | `290px` | 5 columns | 7 columns |
| Dense | `230px` | 7 columns | 9 columns |

The value is a bare length, so it sets `column-width` and leaves `column-count` auto: the browser fits as many columns as the container allows. Density therefore means *how wide a piece should be*, not how many sit across -- which is what lets one setting hold on a laptop and a 32-inch monitor at once. Rendered width is still `(container - gaps) / count`, so it exceeds the threshold rather than matching it.

All three stay visually distinct down to roughly a 1200px viewport; below that the available width genuinely cannot support three separate column counts and they begin to coincide.

Changing density animates via FLIP: positions are captured, the reflow is applied, and each card is played from its old offset back to zero on `transform` only. `columns` is not an animatable property, so nothing else would work.

### Density control

A single group with one 1px `line` border and hairline dividers between options -- deliberately *not* three separate chips, so it reads as one control. Options are 12px with `0.06em` tracking and chip padding, sentence case. The active option is filled accent with `on-accent` text.

Each option carries an icon drawn as the columns it produces -- two wide, three, then four narrow -- so the control shows its own effect. These are the one *filled* icon in the set: a 3-unit column drawn as an outline is two hairlines almost touching, which at 16px is mud. Below 640px the labels drop and the icons carry it alone, so the buttons take an explicit `aria-label` -- `display: none` takes a label away from a screen reader as well as from the screen.

### Gallery filter

Narrowing the wall, added 2026-09-08. A `Filter` button in the "All work" header beside the density control, and a band of criteria that opens beneath the whole header and above the grid.

* **It opens in the page, not over it.** Built first as a panel floating under its button, and changed the same day. The panel worked and covered the drawings, and on a gallery the work is the one thing the interface may not sit on top of. In flow it pushes the grid down, which costs a scroll and nothing else. The button still hides the whole thing when it is not wanted, which was the point of a panel in the first place.
* **A band, not a permanent row.** The criteria are three controls and will be more. Left on screen they would push the gallery down the page for everyone, forever, to serve something used occasionally.
* **The button takes outlined accent while something is filtered**, and carries the count of what is showing. The interface pointing at itself, which may repeat; filled would claim to be the action the page exists for. The count rather than a dot, because how much is being hidden is worth knowing without reopening the band to find out.
* **Year and Collections are multi-select dropdowns.** Flat checkbox lists made the band taller every year the gallery gains; three compact controls hold it to one line whatever the data does. A native `<select multiple>` is the obvious reach and the wrong one -- it renders as a permanently open scrolling box rather than a dropdown, wants ctrl-click for a second value, and cannot be styled to this set. So the trigger is a button dressed as a field and the menu is real checkboxes, which is also what a screen reader reads without every state being maintained by hand.
* **A closed trigger names its single pick.** "2021" rather than "1 selected": shorter, and it says *which*, which is what a closed control is there to answer. Beyond one it counts -- "2 years".
* **`.menu-panel` is now a control's menu as well as the nav's.** Those dropdowns use the socials surface unchanged. A menu floating over the grid is fine where the band was not: it is small, transient, and opened deliberately, where the band was large and covered work for as long as it stood.
* **Which cost the band's clip a condition.** `overflow: hidden` is what makes the collapse look like a collapse, and it clips a menu opening out of the band -- the menu is simply not there. The clip lifts 300ms after the row opens, on a discrete transition, and returns in the same frame on close. Where `allow-discrete` is unsupported the clip lifts at once and content spills for 300ms while the row grows: a cosmetic fault on the way in, chosen over a dropdown nobody can see.
* **Clear is an icon button, not a text action.** It began as `SUBTLE_ACTION`, the 12px `faint` text button, and sat immediately beside the 12px `faint` count -- two quiet strings, one of them secretly clickable and neither looking like a control. Given the same bordered box every other control in the band wears, with the close glyph, it reads as the thing it is. `SUBTLE_ACTION` is still right where it sits under the label of what it undoes, which is why the constant was left alone and only this use changed.
* **Shut, the band is `inert`.** Collapsed content is still focusable and still hit-tested. This is the trap the spotlight's inactive slides had to close, and the same answer.
* **It stays mounted while shut**, so a typed query survives being hidden. Unmounting would clear the filter every time the band was closed, which is not what closing a band means.
* **Narrowed to nothing is not an empty gallery**, and says so: "No work matches these filters", with a `Clear filters` action beside it. The way out is named rather than left to be worked out. This is the one `SectionState` that carries an action.
* **The element carrying `.filter-row` takes no display utility**, for the reason `.menu-panel` does not: utilities cascade after components and a `flex` there beats the `grid` the class needs. Layout goes on a child.

### Piece page

Not present in the original handoff -- designed against this system as a **gallery wall label**. The artwork keeps the room; the metadata sits beside it, small and quiet, separated by a hairline rather than boxed in a panel. No new visual vocabulary was introduced.

* **Layout** -- a two-column grid, `minmax(0, 1fr)` for the artwork and a fixed `320px` rail. Below 1024px the two stack and the dividing rule turns from a left border into a top border.
* **From `lg` the rail is two rows** -- the navigation, then the wall label -- at zero row gap, so their left borders meet and read as one unbroken rule beside the artwork. The rows are explicit, `auto 1fr`, because the artwork spans both of them: against `auto` rows grid hands a spanning item's height to every row it crosses, which inflated the first to some 300px of nothing, dropped the piece title from 215px down the page to 511px, and tore a hole in that rule.
* **Artwork** -- centred in its column, since the cap often leaves it narrower than the column and hugging one edge would strand the rule. 1px `line` border and the `hatch` behind it, exactly as in the grid.
* **The height cap covers the artwork and its button together**, not the image alone: `max(320px, 100vh - 226px)` from `lg`, and `100vh - 294px` below it, where the navigation sits back above the drawing and costs another 67px.

  It was `78vh`, set when nothing sat beneath the image. A percentage cannot hold that promise once something does -- the chrome around the artwork is a fixed height, header and page padding above, the Detailed view button and its dimensions line below, while `78vh` grows with the window. The two agreed at about a 900px viewport and disagreed everywhere else, which is how the button came to sit five pixels below the fold on a 1080p laptop, on square pieces as much as on tall ones: at the cap the image is the same height whatever shape the piece is.

  Subtracting the chrome instead gives the artwork whatever the page does not need -- larger on a big monitor than `78vh` ever allowed, smaller on a short one, and the button always in view. Measured at 20px of slack below the caption at every width from 390px to 1920px and every height from 660px to 986px. The 320px floor stops a landscape phone reducing the drawing to a stamp. **Changed 2026-09-07.**
* **Wall label** -- title at `clamp(22px, 2.4vw, 32px)` serif, then `{medium} · {year}` in 12px `faint`. Below that, optional blocks separated by `line` rules: description, tags, and the collections a piece belongs to. Each block is labelled in 12px uppercase `faint`.
* **Blocks are omitted entirely when empty.** A heading with nothing under it is louder than no heading. Descriptions are blank in the current data, so that block simply does not render.
* **Platform marks are the one place this set copies someone else's shape.** They live in `components/platform-icons.tsx`, apart from `icons.tsx`, because they break the house rules on purpose -- Instagram keeps its rounded corners, YouTube its pill. A brand is recognised or it is nothing. Everything else in `icons.tsx` is still square-cornered, unfilled and drawn to this design.

* **Tags render as static bordered chips, not links** -- there is nowhere for a chip to point. Tags are planned as a filter over the gallery rather than as pages of their own, so a chip becomes a control that narrows the grid, not a link that navigates. A chip that looks clickable but is not is worse than a plain one.
* **Back sits at the top left of the artwork, and prev/next at the top of the rail.** Not in a row above the artwork. **Moved 2026-09-07**, with the cap above and for the same reason: that row cost 68px off the top of every piece page and helped push the artwork's own action below the fold, while the rail beside it ran half empty. Here they cost the drawing nothing and are still the first thing above the fold. Reclaiming the row alone would not have been enough -- it buys 68px against a 69px overrun, which lands the caption exactly on the fold and only looks fixed on a taller window.
* **Back is in the artwork's left gutter from `lg`, which costs nothing.** It was in the rail with prev/next for a day, and that put it at the far right of the page -- against the one convention nobody thinks about, which is that back is top left and a cursor goes there by reflex. **Corrected 2026-09-08.** The height cap leaves the artwork much narrower than its column, so the gutter either side of it was already empty; the link sits in it and takes no height at all.
* **The artwork column is `1fr auto 1fr` from `lg`**, rather than padding wide enough for the link. There is no width to guess at, the outer tracks share the slack evenly so the artwork stays centred on the page instead of being pushed off by whatever the label measures, and a track cannot overlap its neighbour -- a wide piece squeezes the gutters rather than running under the link, which is what absolute positioning would have allowed the first landscape upload to do.
* **Below `lg` back and prev/next share a row above the artwork**, because the rail falls underneath it there and reaching Next by scrolling past the whole drawing is worse than the row ever was. Back is rendered in both places and hidden in one: the two sit in different columns at `lg` and in one row below it, which no single grid placement expresses. `hidden` rather than opacity, so the unused copy leaves the tab order with the screen.
* **Prev/next** -- neighbours in whichever list the reader is actually in, and the same treatment as the back link beside them: `ICON_BUTTON`, the bordered 12px uppercase box at `0.08em` in `muted`, going accent on hover. So the pair reads as one set of quiet actions, and as the same kind of thing as the owner's actions further down the rail.

  This bullet described them as bare 13px `faint` text until 2026-09-07. They have been bordered boxes for considerably longer, and the boxes are what is kept -- the text was the specification, the boxes were the build, and the build won on use. Recorded rather than quietly corrected, because the two had disagreed long enough that the document was the unreliable one.

  Piece titles move to the tooltip and the accessible name; at this size the labels alone carry the action, and keeping them short is what fits both controls inside the 288px the rail has once its padding is taken. Ends are open rather than wrapping, and the unavailable side takes `ICON_BUTTON_INERT` -- the same box at 40% opacity and without a pointer cursor -- rather than being omitted, so the pair does not reflow between pieces.

* **A piece opened from a collection walks that collection**, in its curated order, and the back link is named for it -- "← Night Calls", not "← All work". **Added 2026-09-08.** Prev/next used to walk the whole gallery whatever list you had come from, so stepping through a set you had deliberately entered dropped you out of it at the first click, and Back then claimed to return you somewhere you had never been.
* **Where you came from rides in the URL, as `?from=`, and it is a trail rather than a step.** `from=home/night-calls` is "the gallery, then Night Calls": the nearest step is the list a page walks, and the rest is what its own back link inherits, so each page hands on exactly the trail behind it. A second parameter naming the origin's origin was the alternative, and that is one parameter per level of depth. Steps are collection slugs, plus `home` for the gallery, which is the one origin with no slug of its own. Router state was the alternative and is worse in the way that matters: it does not survive a reload and cannot be sent to anyone, so a shared link would quietly put the reader in gallery order while the sender was in a set. The same argument `?view=1` already makes. A slug rather than the ids themselves, because the collection route returns members in `display_order` already, and an id list in a query string would be both enormous and stale the moment the set was rearranged. Steps are not percent-encoded and are filtered to slug shape instead: encoding a `/` gives `%2F`, which the query parser decodes back to `/` on the way in, destroying the separator it was meant to protect. Filtering also keeps the trail away from `decodeURIComponent`, so a crafted `?from=100%` renders a page rather than throwing a `URIError`. The trail is capped at four steps, which is past anything this site can produce.
* **A stale origin degrades rather than breaks.** The set is fetched alongside the gallery list, not instead of it, so a `from` naming a deleted collection, one private to this reader, or one that no longer holds this piece falls back to gallery order and an "← All work" link. It costs one request on a piece opened from a collection, which is the price of a wrong link being worth less than a right one instead of being worth nothing.
* **A waived piece ignores it.** Waiving drops collection membership, so the reserve is the only list left to walk however the piece was reached.
* **Not found** -- an unknown id gets the eyebrow-plus-headline treatment from the intro, at a reduced size, with a link back.

### Collection page

* **Back offers the gallery as well as the index, when the gallery is where the reader came from.** A collection is reachable two ways -- the row on the landing page and the header's Collections item -- and "back" means a different place for each. Arriving from the landing page and being returned to the collections index is the small displacement that makes a site feel like it moved while you were reading. **Added 2026-09-08.**
* **And only then.** Someone who came through the header has no gallery to return to, and a second button would be inventing a history they do not have. The index is always offered, because a set always belongs to the list of sets.
* **The gallery sits first.** It is the truer "back" when it is there at all; the index is the step up rather than the step back.
* **The trail survives a trip through a piece.** Gallery, collection, piece, back returns the reader to the collection with the gallery still offered. It did not at first -- the origin held one step, so the piece never knew where the collection had come from and the gallery button vanished on the way back. Recorded because it was shipped that way for an afternoon and reported as a bug within the hour, which is the correct verdict: a back row that changes depending on how you got to the same page reads as broken, not as economical.

### Upload modal

The first form in the system, so it defines the form vocabulary the rest will inherit. Built on a native `<dialog>`: focus trapping, Escape, an inert background and top-layer stacking come from the platform rather than from a hand-rolled trap.

* **Panel** -- `surface` on a 1px `line` border, `min(94vw, 940px)` wide, capped at `90vh` with the body scrolling inside. Header and footer are divided by hairlines, not by elevation. The backdrop is `black/70` under a 3px blur, echoing the sticky header.
* **Two columns above 640px** -- artwork left, fields right, stacking below. The image is given the larger half because it is the subject.
* **Drop zone** -- `hatch` when empty, which is already the system's mark for absent artwork, so nothing new was invented. `line` border turning `accent` on hover and while a file is dragged over it. On drop it becomes the preview, `object-contain` under a 420px cap, with filename and size in 12px `faint` below.
* **Field labels use `muted`, not `faint`.** Meta text is allowed to recede; an instruction is not. This is the one place the eyebrow letterform (12px, uppercase, `0.24em`) is paired with a louder colour, and the reason is legibility.
* **Inputs** -- `bg` inside a `surface` panel, so the recess reads as a change of background rather than an inset shadow. 1px `line` border, radius 0, 14px `text`, placeholders in `faint`. Focus takes an `accent` border *and* a 1px `accent` outline: a border change alone is too quiet at this line weight, and an outline is a focus ring, not elevation.
* **Tag chips** -- typed into the field and committed with Enter or comma; Backspace on an empty field removes the last. Same bordered chip as the wall label, but interactive here, so they take the `accent` hover the static ones do not. Duplicates collapse case-insensitively because the backend slugifies.
* **A derived value is stated, not boxed.** Where one field already answers another, the answer is shown as its label plus plain 14px `text` -- no border, no `bg` recess, nothing focusable. An input invites typing and there must be nothing to type, or the two can disagree. It keeps the field's vertical padding so a stated value and a box beside it sit on one line.

  **Year is the first of these, added 2026-09-07, and it changes kind.** A date made carries a year, so where one is picked the year is read off it; where none is, the year is an ordinary input. Two controls for one fact had been two ways to disagree and nothing reconciled them -- the gallery holds a piece dated 2024-08-05 whose wall label shows no year, because the box beside the date was left empty.

  Deriving it *always* was tried first and was wrong. `input[type=date]` demands a complete date, and a sketchbook is full of work whose year is known and whose day is not; two pieces are recorded exactly that way, and always deriving would have blanked them and forced an invented day onto every older drawing. So the form shows the two precisions the data model already has -- `year` coarse, `created_date` fine, the fine implying the coarse -- and the year stays typeable exactly while nothing else claims it. That is what makes disagreement impossible rather than merely discouraged. `lib/year.ts` holds the rule; `YearField` is shared by the upload form and the edit dialog, which collect the same things by design.
* **Required marks** -- an `accent` asterisk. Pointing at something the form needs, so hairline rather than filled.
* **Errors** in `accent`, bottom-left, `role="alert"`, and cleared by any edit -- a message that outlives the problem it describes reads as though the form is still refusing.
* **Actions** -- bordered ghost "Cancel", solid `accent` "Add to gallery". Both disable during upload, and Escape is refused mid-request so a stray keypress cannot abandon work already in flight.

### Picking pieces

Choosing members for a collection happens in a near-full-screen dialog, at `94vw` by `92vh`.

This began as a second mode on the gallery: the page went into a picking state and a bordered `accent` bar replaced ordinary browsing. It was wrong in use rather than in look -- choosing meant scrolling the length of the gallery, and naming or cancelling meant scrolling back to the top. **Replaced 2026-09-01.** `PieceCard`, `MasonryGrid` and `AllWorkSection` no longer know what a selection is.

* **Split 80/20** -- a dense uniform grid on the left, and a control column on the right holding the name, the filters, the count and the actions. The grid scrolls inside itself, so the controls never leave the screen however far the picking goes.
* **Filters live in the control column** -- title search and a year, applied as typed with no apply step. Years are derived from the pieces present, so the control never offers one with nothing behind it. Filtering runs in the browser over the already-fetched list; at this size a round trip per keystroke would be slower than scanning what is there.
* **A grid, not the masonry.** `repeat(auto-fill, minmax(140px, 1fr))`: uniform columns read across rows, where the gallery's CSS-columns masonry reads down each column. That is the part a picker actually needs -- a target in a predictable place, and a sequence that reads in the order the numbers are handed out. **Tile heights follow each piece's own ratio**, as everywhere else in the gallery: the columns are uniform, the tiles are not. This bullet used to claim `PieceTile` cropped to a 4:3 box. It never has -- the box is a flex item, so `min-height: auto` floors it at the image's intrinsic height and outranks the `aspect-[4/3]`, which computes correctly and loses. **Settled 2026-09-07**, once it had been measured and the one-class fix demonstrated: the gallery holds no landscape work at all, so a 4:3 box cropped every piece in it -- 68% of each kept on average, 45% for the worst -- to buy a uniformity the picker was not suffering for the want of. The `aspect-[4/3]` is inert and harmless; the ratio stays the piece's own.
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

Top border in `line`, 28px vertical padding, content split left and right and allowed to wrap. Both strings are 12px `faint`.

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
4. **Tag filter chips are not currently shown.** Pieces still carry tags; the chip row was removed pending real filtering work.
5. **A per-image failure fallback was added**, which the prototype did not design.
6. **The spotlight band breaks the content cap**, deliberately. Layout says content regions are capped at 2400px with gutters and only the header and footer span the viewport. The band spans it too, because a hero that stops 64px short of the edge reads as a wide card rather than as a wall. Its inner grid still caps at 2400px, so it lines up with everything below it, and the rule holds everywhere else.
