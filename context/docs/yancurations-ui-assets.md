# Yancurations — hand-drawn asset kit: integration brief

**Audience:** the agent doing UI work on Yancurations.
**Status of these assets:** final, production-ready. Do not regenerate, redraw, or "clean up" any of them.

---

## 1. What these assets are and why it matters

Every asset in this kit comes from a physical drawing by the project owner: a chibi character drawn in marker, and eleven pencil strokes drawn freehand (no ruler) on the same paper, photographed and then extracted, de-skewed and tapered programmatically.

The whole point is that they are *irregular*. The logo's linework wobbles, the rules vary in weight along their length, the grain of the graphite is preserved in the alpha channel, and no two strokes are identical. That irregularity is the brand. Design decisions in the UI should protect it:

- **Do not** substitute a CSS `border`, `<hr>` default, or straight SVG line where a stroke asset is specified. A 1px solid border next to a hand-drawn rule makes the hand-drawn rule look like a rendering bug.
- **Do not** apply filters, drop shadows, gradients, or border-radius to these assets.
- **Do not** re-trace, re-crop, or re-export them. If a variant is needed that isn't in the kit, request it rather than deriving it.
- **Do** let the rest of the interface be quiet. These are the one loud element; type, spacing and color around them should be disciplined so the strokes carry the personality.

---

## 2. Recommended file layout

```
public/
  brand/
    logo.png                      logo-inverted.png
    logo-1024.png                 logo-inverted-1024.png
    logo-lines-only.png           logo-lines-only-white.png
    favicon.ico                   favicon-inverted.ico
    favicon-32.png                favicon-inverted-32.png
    favicon-192.png               favicon-inverted-192.png
    favicon-512.png               favicon-inverted-512.png
    anim/
      logo-draw.gif                   logo-draw-small.gif
      logo-draw-white.gif
      logo-draw-dark.gif
      logo-draw-invert-reveal.gif     logo-draw-invert-reveal-small.gif
      logo-draw-dark-reveal.gif       logo-draw-dark-reveal-small.gif
      logo-draw-inverted.gif          logo-draw-inverted-small.gif
    lines/
      rule-1.png … rule-7.png
      divider-1.png … divider-4.png
      lines.svg
      (legacy, ruler-drawn: rule.png, rule-white.png, rule.svg,
       rule-stretch.svg, divider.png, divider-white.png, divider.svg)
```

---

## 3. Asset inventory

### 3.1 Logo — static

All are PNG with a real alpha channel and a fully transparent area outside the character. "Body" means the character's interior (skin, shirt, trousers).

| File | Size | Body | Lines | Use it for |
|---|---|---|---|---|
| `logo.png` | 4648 × 4872 | white | black | Master. Print, large hero, any future re-export. Too heavy to ship as-is. |
| `logo-1024.png` | 977 × 1024 | white | black | **Default logo.** Header, avatar, share images, anywhere on a light *or* dark surface. |
| `logo-inverted.png` | 4648 × 4872 | black | white | Master of the inverted mark. |
| `logo-inverted-1024.png` | 977 × 1024 | black | white | Inverted mark for use **on light surfaces only**, when you want a heavy, solid silhouette (e.g. a stamp in a footer, a sticker, an OG image). |
| `logo-lines-only.png` | 4648 × 4872 | transparent | black | Watermark / outline treatment on a light background: the page color shows through the character. |
| `logo-lines-only-white.png` | 4648 × 4872 | transparent | white | Same, on a dark background. |

**Choosing between them:** `logo-1024.png` is the safe default in both themes because the white body plus black lines reads correctly against almost anything. Only reach for the inverted or lines-only variants when there is a specific reason (a solid stamp, a watermark), and check contrast against the actual surface color.

The character's silhouette is wide (roughly 1 : 1.05, arms outstretched). Reserve horizontal space accordingly; don't crop the hands.

### 3.2 Favicons

| File | Size | Notes |
|---|---|---|
| `favicon.ico` | 16/32/48 | Standard mark (white body, black lines). |
| `favicon-32.png`, `favicon-192.png`, `favicon-512.png` | as named | PWA / Apple touch / manifest. |
| `favicon-inverted.ico`, `favicon-inverted-32/192/512.png` | as named | Inverted mark, for a dark browser chrome if you decide to serve a variant. |

```html
<link rel="icon" href="/brand/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32.png">
<link rel="apple-touch-icon" sizes="192x192" href="/brand/favicon-192.png">
<link rel="manifest" href="/site.webmanifest"> <!-- 192 + 512 entries -->
```

**Known limitation:** the full-body character loses detail at 16–32 px and reads as a grey smudge on some backgrounds. If the favicon looks muddy in the browser tab, request a head-only crop — do not crop it yourself from the full-body PNG, the framing needs to be redrawn around the head.

### 3.3 Logo — drawing animations (GIF)

All GIFs are transparent-background unless noted, loop forever, and are built additively (each frame only adds pixels), which is why they're small. They show the lineart being drawn stroke by stroke in a natural order (hair outline → head → face → torso → legs → arms), then resolve to the finished mark.

| File | Size | Frames | Ends on | Use on |
|---|---|---|---|---|
| `logo-draw.gif` | 720 × 755 | 77 | white body, black lines | **Light surfaces.** Draws in black, white body wipes in at the end. |
| `logo-draw-small.gif` | 360 × 378 | 77 | same | Same, header-sized. |
| `logo-draw-white.gif` | 720 × 755 | 69 | black lines on solid white | Light surfaces where transparency is a problem (email, embeds). Non-transparent. |
| `logo-draw-dark.gif` | 720 × 755 | 69 | white lineart, no fill | Dark surfaces, when you want the outline look rather than the filled mark. |
| `logo-draw-dark-reveal.gif` | 720 × 755 | 79 | white body, black lines | **Dark surfaces, default choice.** Draws in white (visible against dark), then the white body wipes in and the lines flip to black. |
| `logo-draw-dark-reveal-small.gif` | 360 × 378 | 79 | same | Same, header-sized. **Smallest file in the set, 31 KB.** |
| `logo-draw-invert-reveal.gif` | 720 × 755 | 79 | black body, white lines | **Light surfaces**, when you want it to land on the inverted mark. Draws in black, then inverts. |
| `logo-draw-invert-reveal-small.gif` | 360 × 378 | 79 | same | Same, header-sized. |
| `logo-draw-inverted.gif` | 720 × 755 | 77 | black body, white lines | Mid-tone or dark surfaces only. Draws in **white**, so on a white page the first 3 seconds are invisible. |
| `logo-draw-inverted-small.gif` | 360 × 378 | 77 | same | Same, header-sized. |

**Timing:** roughly 3.1 s of drawing at ~45 ms per frame, a ~0.5 s fill/flip, then a 1.8 s hold on the finished mark. Full cycle ≈ 5.3 s.

**The contrast trap — read this before picking a file.** A GIF whose *drawing* strokes match the background color plays invisibly for its first three seconds and then appears to pop in. Match the drawing color to the surface:

- Light surface → the animation must draw in **black**: `logo-draw*`, `logo-draw-white`, `logo-draw-invert-reveal*`.
- Dark surface → the animation must draw in **white**: `logo-draw-dark*`, `logo-draw-inverted*`.

**Where to use animation at all.** One orchestrated moment beats scattered effects. Use it in exactly one of: the first paint of the landing hero, or a hover/tap on the header logo. Do not put a looping GIF in a persistent header — a mark that redraws itself every 5.3 s next to body copy is a distraction, and GIF itself cannot stop after one pass.

Recommended pattern — static by default, animate on hover, honor reduced motion:

```html
<a class="brand" href="/">
  <picture>
    <source srcset="/brand/anim/logo-draw-dark-reveal-small.gif"
            media="(prefers-color-scheme: dark)">
    <img class="brand__anim" src="/brand/anim/logo-draw-small.gif" alt="" width="48" height="50">
  </picture>
  <img class="brand__static" src="/brand/logo-1024.png" alt="Yancurations" width="48" height="50">
</a>
```

```css
.brand { position: relative; display: inline-block; }
.brand__anim { position: absolute; inset: 0; opacity: 0; }
.brand:hover .brand__anim,
.brand:focus-visible .brand__anim { opacity: 1; }
.brand:hover .brand__static,
.brand:focus-visible .brand__static { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .brand__anim { display: none; }          /* static mark only */
}
```

`alt=""` on the animated copy is deliberate: it's decorative, and the static `<img>` carries the accessible name.

### 3.4 Pencil rules and dividers

Eleven freehand strokes, extracted with the graphite grain intact in the alpha channel, tilt removed but wobble preserved, and both ends tapered to a point. Ink is near-black (#111) in the PNGs, but **the color should come from CSS via masking** (§4), not from the file.

**Long rules** — for full-width or near-full-width lines (header bottom, footer top, section breaks):

| File | Size | Weight | Character |
|---|---|---|---|
| `rule-1.png` | 1945 × 44 | heaviest | Strong, dark, noticeable weight shifts. Best where the line is doing real structural work. |
| `rule-3.png` | 1911 × 41 | heavy | Dark and fairly even; a good workhorse. |
| `rule-5.png` | 1945 × 46 | medium-heavy | Most visible wobble — the most obviously hand-drawn of the set. |
| `rule-6.png` | 1911 × 43 | medium | Softer, drier stroke. |
| `rule-4.png` | 1998 × 33 | medium-light | The most uniform. Use where a quieter line is wanted. |
| `rule-7.png` | 1911 × 45 | light | Dry and broken in places; feels sketched. |
| `rule-2.png` | 1998 × 23 | lightest | The most delicate. Good for dense areas (lists, tables) where a heavy rule would shout. |

**Short dividers** — for lines that sit inside a component or between list items, where the natural tapered ends should be visible rather than stretched across the viewport:

| File | Size | Weight |
|---|---|---|
| `divider-1.png` | 760 × 35 | heaviest |
| `divider-2.png` | 760 × 27 | medium |
| `divider-3.png` | 760 × 22 | light |
| `divider-4.png` | 760 × 24 | lightest |

**`lines.svg`** — a sprite containing all eleven strokes as `<symbol>` elements (`rule-1` … `rule-7`, `divider-1` … `divider-4`), each with a 24-unit-tall viewBox and `fill="currentColor"`. Vector, so it stays crisp at any size and inherits text color — but it's a solid traced silhouette, so **the graphite grain is lost**. Use the PNGs by default; use the sprite only where you need a stroke at very large scale or in an inline SVG context.

**Legacy, ruler-drawn:** `rule.png` / `rule-white.png` (2139 × 44), `divider.png` / `divider-white.png` (760 × 41), and matching SVGs. These came from a stroke drawn *with* a ruler, so they're straighter and stiffer than the rest of the set. Keep them out of the main UI unless you specifically want a mechanical line; the freehand set in `lines/` supersedes them.

---

## 4. The core technique: mask, don't paint

Do not use these PNGs as `<img>` or as `background-image` in normal UI. Use them as a **mask** over `currentColor`. Three reasons: one file serves light and dark themes, the stroke picks up whatever text color the context defines, and you can theme it (muted rules in a sidebar, full-contrast in the header) without new assets.

```css
:root {
  --rule-1: url("/brand/lines/rule-1.png");
  --rule-2: url("/brand/lines/rule-2.png");
  --rule-4: url("/brand/lines/rule-4.png");
  --rule-5: url("/brand/lines/rule-5.png");
  --div-1:  url("/brand/lines/divider-1.png");
  --div-2:  url("/brand/lines/divider-2.png");
  --div-3:  url("/brand/lines/divider-3.png");
}

/* Base: a stroke painted in the current text color. */
.stroke {
  display: block;
  border: 0;
  background: currentColor;
  -webkit-mask: var(--stroke-src) center / 100% 100% no-repeat;
          mask: var(--stroke-src) center / 100% 100% no-repeat;
}
```

`background-size: 100% 100%` stretches the stroke to the element's box in both axes. That's intended: the vertical squash is what turns a 44 px-tall source into a 7 px rule while compressing the grain into something that reads as pencil.

**Height guidance.** Render heights between **4 px and 12 px**. Below 4 px the grain blurs into flat grey and the asset stops being worth its weight; above ~14 px it reads as a smear rather than a line. Good defaults: 8 px for a header rule, 6 px for section breaks, 5 px for in-card dividers.

**Width guidance.** The sources are ~1900–2000 px long. Stretching to a 1440 px container is a mild *compression* and looks fine. Stretching one stroke across a 2560 px ultrawide flattens the wobble slightly; if that matters, cap it with `background-size: 1600px 100%` and let the ends sit inside the container.

**Opacity.** `currentColor` at full strength can be heavier than a conventional border. Dropping to `opacity: .8` on light themes and `.7` on dark themes usually sits better. Tune per surface; don't bake it into the base class.

### 4.1 Fallback for browsers without CSS masks

Masks are supported in all current browsers (Safari still needs the `-webkit-` prefix, included above). For a very old engine, fall back to the pre-colored files:

```css
@supports not ((-webkit-mask-image: url("")) or (mask-image: url(""))) {
  .stroke { background: url("/brand/lines/rule-1.png") center / 100% 100% no-repeat; }
  @media (prefers-color-scheme: dark) {
    .stroke { background-image: url("/brand/lines/rule-white.png"); }
  }
}
```

---

## 5. Component recipes

### 5.1 Header bottom border

```css
.site-header { position: relative; }
.site-header::after {
  content: "";
  position: absolute; left: 0; right: 0; bottom: -4px;
  height: 8px;
  background: currentColor;
  opacity: .8;
  -webkit-mask: var(--rule-1) center / 100% 100% no-repeat;
          mask: var(--rule-1) center / 100% 100% no-repeat;
  pointer-events: none;
}
```

Note `bottom: -4px` — the stroke should straddle the edge, not sit above it, so it reads as drawn *on* the boundary. Add `pointer-events: none` to every decorative pseudo-element so it never eats clicks on nav items underneath.

### 5.2 Footer top border

Use a **different** stroke than the header, and flip it. Two identical wobbles on one page is the single most likely way for this system to look mechanical.

```css
.site-footer { position: relative; }
.site-footer::before {
  content: "";
  position: absolute; left: 0; right: 0; top: -4px;
  height: 8px;
  background: currentColor;
  opacity: .8;
  transform: scaleX(-1);
  -webkit-mask: var(--rule-5) center / 100% 100% no-repeat;
          mask: var(--rule-5) center / 100% 100% no-repeat;
  pointer-events: none;
}
```

### 5.3 Section separators (`<hr>`)

```css
hr {
  border: 0;
  height: 6px;
  margin: 3rem 0;
  background: currentColor;
  opacity: .7;
  -webkit-mask: var(--rule-4) center / 100% 100% no-repeat;
          mask: var(--rule-4) center / 100% 100% no-repeat;
}

/* Rotate strokes by position so no two adjacent rules match. */
hr:nth-of-type(3n+1) { -webkit-mask-image: var(--rule-4); mask-image: var(--rule-4); }
hr:nth-of-type(3n+2) { -webkit-mask-image: var(--rule-2); mask-image: var(--rule-2); transform: scaleX(-1); }
hr:nth-of-type(3n)   { -webkit-mask-image: var(--rule-7); mask-image: var(--rule-7); }
```

### 5.4 Dividers inside cards and lists

Short strokes, fixed width, centered, so the tapered ends stay visible:

```css
.card__divider {
  height: 5px;
  width: min(420px, 80%);
  margin: 1.25rem auto;
  background: currentColor;
  opacity: .65;
  -webkit-mask: var(--div-2) center / 100% 100% no-repeat;
          mask: var(--div-2) center / 100% 100% no-repeat;
}

.list > li + li { position: relative; padding-top: 1rem; }
.list > li + li::before {
  content: "";
  position: absolute; left: 0; right: 0; top: 0;
  height: 4px;
  background: currentColor;
  opacity: .5;
  -webkit-mask: var(--rule-2) center / 100% 100% no-repeat;   /* lightest stroke */
          mask: var(--rule-2) center / 100% 100% no-repeat;
}
```

For repeating list separators, use the **lightest** strokes (`rule-2`, `divider-4`). A heavy stroke repeated fifteen times down a list turns the page into a ledger.

### 5.5 Underlining a heading

```css
.section-title { position: relative; display: inline-block; padding-bottom: .5rem; }
.section-title::after {
  content: "";
  position: absolute; left: 0; bottom: 0; width: 100%; height: 6px;
  background: currentColor;
  opacity: .75;
  -webkit-mask: var(--div-3) center / 100% 100% no-repeat;
          mask: var(--div-3) center / 100% 100% no-repeat;
}
```

A short divider works better than a long rule here, because the taper lands near the end of the word instead of being stretched to nothing.

### 5.6 Vertical rules

Rotate a long rule with `transform: rotate(90deg)` on an absolutely positioned element sized as a horizontal rule (width = the intended height, height = the intended thickness), with `transform-origin` set so it lands where you want. Do **not** swap `background-size` axes to fake a vertical stroke — the mask would stretch the grain the wrong way and it looks like scan noise.

---

## 6. Variation policy

The kit exists so that no stroke repeats visibly. Enforce it:

1. Header and footer must use different strokes, and one should be `scaleX(-1)`.
2. Repeating separators must cycle through at least three strokes (`:nth-of-type`) or be flipped alternately.
3. Reserve the heaviest stroke (`rule-1`) for one structural line per page — usually the header.
4. Never use the same stroke twice within one viewport height.
5. If you need more variation than eleven strokes allow, ask for more source strokes. Do not procedurally warp, scale-jitter, or rotate a stroke to fake a new one; the result reads as a filtered copy.

---

## 7. Performance and delivery

- Total line set is ~360 KB across 11 PNGs; each individual rule is 35–55 KB. Load only the strokes a page actually uses — that's why they're separate files and CSS variables, not a sprite sheet.
- Every asset has an alpha channel, so PNG is correct; do not convert to JPEG. WebP/AVIF conversions are fine and will cut size substantially, but keep the PNGs as the source of truth and verify the grain survives at your target quality.
- Ship `logo-1024.png`, not `logo.png` — the master is 2.8 MB.
- The GIFs are 28–118 KB. Prefer the `-small` (360 px) variants unless you're displaying above ~180 px.
- GIF is the stated format here, but if you need one-shot playback, smaller files, and smooth edges, animated **WebP** or **APNG** would beat it on all three; GIF's one-bit transparency is why the animated logo's edges are hard rather than anti-aliased. Raise this if it becomes a visible problem — a re-export is possible, but it's my job, not a conversion to do downstream.

---

## 8. Accessibility

- Decorative strokes belong in pseudo-elements or `<img alt="">`; never give them meaningful alt text. An `<hr>` that's masked is still a semantic separator, which is correct.
- Keep real focus styles independent of these assets. Do not use a pencil stroke as a focus indicator — the irregular edge fails contrast expectations and the taper makes the indicator thinner at the ends.
- Respect `prefers-reduced-motion` for every animated logo instance (§3.3).
- Check contrast of the *stroke color*, not the asset. Because the mask has soft grain, an 8 px rule at 50% opacity can compute as far lighter than the token you chose. If a rule needs to carry meaning (a required boundary), verify it visually at the real size on the real surface.

---

## 9. Hard don'ts

- No `filter`, `box-shadow`, `border-radius`, or gradient on any stroke or on the logo.
- No re-tracing, no auto-vectorizing, no "smoothing" of the wobble.
- No stretching a stroke to a height above ~14 px or below ~4 px.
- No mixing these strokes with conventional `1px solid` borders in the same visual group — pick one system per surface.
- No looping animated logo in a persistent chrome element.
- No cropping the logo's arms or hands to fit a square; use the square favicon exports instead.
- No color on the strokes beyond the theme's text color (masking handles this). If the brand later takes an accent color, the strokes can inherit it, but that's a decision to request, not to make inline.

---

## 10. Open items — request these rather than improvising

- A head-only crop of the character, for legible favicons at 16–32 px.
- A vertical stroke drawn as such, if the layout needs column rules.
- More source strokes if the eleven start repeating visibly.
- Corner/frame strokes, if cards are meant to have a fully hand-drawn border rather than a top/bottom rule.
- A one-shot (non-looping) animated logo in WebP or APNG.
