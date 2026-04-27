---
name: Gallery Minimalist Dark
colors:
  surface: '#141311'
  surface-dim: '#141311'
  surface-bright: '#3a3937'
  surface-container-lowest: '#0f0e0c'
  surface-container-low: '#1c1c19'
  surface-container: '#20201d'
  surface-container-high: '#2b2a28'
  surface-container-highest: '#363532'
  on-surface: '#e6e2de'
  on-surface-variant: '#cac6bb'
  inverse-surface: '#e6e2de'
  inverse-on-surface: '#31302e'
  outline: '#939186'
  outline-variant: '#48473e'
  surface-tint: '#cac7af'
  primary: '#ffffff'
  on-primary: '#323120'
  primary-container: '#e7e3ca'
  on-primary-container: '#676551'
  inverse-primary: '#615f4b'
  secondary: '#cac6bb'
  on-secondary: '#323129'
  secondary-container: '#48473e'
  on-secondary-container: '#b8b5aa'
  tertiary: '#ffffff'
  on-tertiary: '#253335'
  tertiary-container: '#d6e5e8'
  on-tertiary-container: '#59676a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e7e3ca'
  primary-fixed-dim: '#cac7af'
  on-primary-fixed: '#1d1c0d'
  on-primary-fixed-variant: '#494835'
  secondary-fixed: '#e6e2d6'
  secondary-fixed-dim: '#cac6bb'
  on-secondary-fixed: '#1c1c15'
  on-secondary-fixed-variant: '#48473e'
  tertiary-fixed: '#d6e5e8'
  tertiary-fixed-dim: '#bac9cc'
  on-tertiary-fixed: '#101e20'
  on-tertiary-fixed-variant: '#3b494c'
  background: '#141311'
  on-background: '#e6e2de'
  surface-variant: '#363532'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 20px
  margin: 32px
---

## Brand & Style
The design system is rooted in the concept of a "Silent Curator." It prioritizes the artwork above all else, using a minimalist framework to provide a sophisticated, professional backdrop that doesn't compete with the creator's vision. By shifting to a dark mode aesthetic, the system evokes the atmosphere of a dimly lit, high-end private gallery or a digital darkroom, where light is reserved strictly for the art itself.

The UI utilizes deep, charcoal-toned surfaces and generous whitespace to evoke a sense of prestige and focus. The personality is curated and high-end, utilizing organic, muted tones to feel more human and less clinical than traditional high-contrast dark portfolios.

## Colors
The palette has transitioned to a sophisticated dark mode. The foundation is built on "Deep Ink" and "Charcoal" surfaces, providing a low-light foundation that makes artwork colors pop. This dark base is complemented by "Muted Olive" and "Earthy Taupe" which are used for primary actions and structural elements, creating a naturalistic, low-energy visual rhythm.

Light grays and off-whites are used for text to ensure legibility without being jarring. A very pale "Arctic Wash" serves as the tertiary accent, used for subtle highlights or background fills where a breath of coolness is needed to balance the earthy tones of the primary palette.

## Typography
This design system utilizes **Manrope** for all type treatments. Its geometric yet slightly condensed nature offers a technical precision that aligns with digital craftsmanship while remaining highly legible against dark backgrounds. 

Headlines use tighter letter-spacing and heavier weights to create a strong visual anchor on the page. Body text is set with generous line height to ensure readability in descriptions and artist statements. Labels are frequently used in all-caps or medium weights to differentiate metadata from primary content.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for gallery views to ensure artwork aspect ratios remain consistent across large displays. A 12-column grid is standard, with generous margins to prevent the content from feeling "crowded."

The spacing rhythm is based on a 4px baseline, but defaults to larger increments (16px and 24px) to maintain the minimalist breathability. Internal component padding is kept tight to maintain a crisp, professional look, while external margins between sections are intentionally large to signify distinct shifts in content.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Glows**. In this dark theme, surfaces are layered using subtle increases in lightness rather than heavy drop shadows. Higher elevation levels are represented by slightly lighter shades of charcoal or taupe.

When shadows are used—primarily for cards and modals—they are extra-diffused and low-opacity, often tinted with a hint of the neutral taupe to keep them feeling integrated with the background. This "low-altitude" elevation strategy ensures that the UI feels tactile but never bulky, maintaining the clean lines characteristic of modern art platforms.

## Shapes
The design system employs a **Soft** shape language. A 0.25rem (4px) base radius is applied to standard components like buttons and input fields, while larger containers like cards and image thumbnails utilize a 0.5rem (8px) radius.

This subtle rounding removes the clinical sharpness of a purely architectural grid without veering into "playful" territory. It reflects the professional precision of a curated platform with the slightly more approachable feel found in contemporary boutique digital spaces.

## Components
- **Buttons:** Primary buttons use the Muted Olive for the background with dark text. Secondary buttons are outlined with a 1px border in taupe. 
- **Cards:** Artwork cards are the core component. They feature a minimal footer for the artist's name and view counts. On hover, a subtle ambient glow or surface lightening is applied to indicate interactivity.
- **Input Fields:** Minimalist design with a deep charcoal fill and a bottom-border focus state in Muted Olive.
- **Chips/Tags:** Used for art categories (e.g., "3D", "Character Design"). These use a muted taupe or olive-grey background to remain unobtrusive.
- **Lists:** Clean, horizontal dividers using a low-opacity version of the secondary taupe. 
- **Additional Components:** An "Artwork Detail Modal" which uses a backdrop blur to keep the user focused on the high-resolution image, and "Artist Stat Badges" which use the pale Arctic Wash for subtle background highlights or verified status icons.