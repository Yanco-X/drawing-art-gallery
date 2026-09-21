# Touch

What a finger may do on a phone, and the one browser rule that decides it.
Read this before putting `touch-action` on anything.

**Status:** Rule established 2026-09-20, after a bug that cost two sessions.
Applied to the spotlight band, the spotlight label and the piece page.

Companion to [`DESIGN.md`](./DESIGN.md), which covers motion and layout. This
document covers only touch.

---

## 1. The rule

**A swipe surface gets `touch-manipulation`. Never `pan-y`, never `none`.**

A `touch-action` that forbids an axis makes Chromium drop the click on the
first tap *anywhere on the page* for about a second afterwards. Not on that
element -- anywhere. The header, a dialog, a piece in the grid.

| `touch-action` | Tap in the second after a swipe |
|---|---|
| `auto` | fires |
| `manipulation` | fires |
| `pan-y pinch-zoom` | **swallowed** |
| `none` | **swallowed** |

`manipulation` is the one to reach for: it keeps panning and pinch-zoom, and
gives up only double-tap-to-zoom, which this gallery does not use -- the
[detailed view](./DETAILED-VIEW.md) is how a visitor magnifies a piece.

`pan-y` looks like the careful choice, because a band that turns sideways has
no use for sideways panning. It is the expensive one.

## 2. What it looked like

The spotlight needed a second tap. Swipe to turn a piece, tap it to open it,
nothing; tap again, it opens. It was never about the piece: after a swipe the
next touch was spent no matter where it landed, so the theme toggle, the
burger menu and "Show me some!" all needed two taps. Waiting a second or two
before tapping made it go away.

## 3. What the browser is doing

The page never sees a `click`, and no `mousedown` or `mouseup` either. The
touch events all arrive, at the right target, with `touches=1` and
`isPrimary=true`, nothing calls `preventDefault`, and `elementFromPoint` at
the tap coordinates returns the button that was tapped. The browser simply
declines to turn that touch into a tap.

Nothing in the page can stop it. A bare `<div>` with `touch-action: pan-y`,
no JavaScript of any kind, reproduces it; so does the band with every app
touch handler severed and `touch-action: none` applied.

## 4. Where this repo stands

Fixed, with `touch-manipulation`:

- `Spotlight.tsx` -- the artwork link, and the label column beside it.
- `PiecePage.tsx` -- the article that carries a swipe from piece to piece.

Still restrictive, on purpose:

- `FocalPicker.tsx` uses `touch-none`, because a drag that set the focal point
  would otherwise scroll the page. It is owner-only, and a tap straight after
  dragging the crop point is still eaten. Left as it is: the cure would cost
  the drag.

The swipe reader itself, `lib/swipe.ts`, was never involved. It works on touch
events and is indifferent to `touch-action`.

## 5. Diagnosing the next one

**Synthetic touch cannot reproduce a touch bug in this project.** In the exact
state where the owner's finger produced no click, CDP's
`Input.dispatchTouchEvent` and `Input.synthesizeTapGesture` both produced a
clean click, on the same phone, at the same coordinates. An hour went into
chasing a bug that injected events cannot show.

What does work:

1. Instrument, do not drive. Put capture-phase listeners on `window` for the
   touch, pointer, mouse and click events, and have the owner perform the
   gesture. Write the log to `sessionStorage` so it survives a navigation, and
   cap it generously -- a 400-entry cap lost the evidence once, to the taps
   that came after it.
2. Record the gap between gestures. The one-second threshold is what named
   this bug, and it is invisible unless the log carries timestamps.
3. Bisect against a bare HTML page before editing app code. Serve it over
   `adb reverse` and compare it with the real page. One page with four strips,
   one per `touch-action` value, settled in a single round what two sessions
   of reading swipe code had not.

The phone is debuggable from the PC over `adb`, which is what makes any of this
possible: `scripts/phone.ps1` sets up the forwarding, including the `::1` bridge
Vite sometimes needs, and exposes the phone's browser on `127.0.0.1:9223` for
CDP. Rerun it after every replug -- forwards are lost on unplug, and a missing
`tcp:9000` shows up as artwork that will not load, since media URLs are absolute
to MinIO in development.
