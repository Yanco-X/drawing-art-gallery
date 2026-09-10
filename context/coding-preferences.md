# Coding Preferences

## TypeScript

- Strict mode enabled
- No `any` types - use proper typing or `unknown`
- Define interfaces for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks


## Tailwind CSS
- Use css variables for colors, spacing, etc.
- Never use inline styles.

## Naming

- Components: PascalCase (`ItemCard.tsx`)
- Files: Match component name or kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Styling

- Tailwind CSS for all styling
- No inline styles
- Dark mode first, light mode as option


## Error Handling

- Use try/catch in Server Actions
- Return `{ success, data, error }` pattern from actions
- Display user-friendly error messages via toast

## Comments

The name is the explanation. A function, component or variable whose purpose
is not clear from its name is misnamed, and the fix is the name, not a line
above it.

Write no comment unless it stops the next person breaking something.

**Delete on sight:**

```ts
/** User preference controlling masonry column count. */
export type GridDensity = 'airy' | 'comfortable' | 'dense';
```

The name and the values already say it, twice. Also: headings over obvious
blocks, a summary of the function beneath it, a restated signature, and any
paragraph of design reasoning copied out of `context/` -- the document owns
that, and a copy rots in one of the two places with nothing to catch it.

**Keep:**

```ts
// %2F decodes back to `/` on the way in, so the separator cannot survive
// encoding. Segments are filtered to slug shape instead. See DESIGN.md.
```

Something the code cannot say, that a reader would otherwise get wrong, in
one or two lines, pointing at the document if there is more.

Measured on 2026-09-09: **21% of the frontend's lines are comments**, and
`lib/origin.ts` is 75%. Most of it is design rationale that `DESIGN.md`
already carries in full. That is the thing to stop writing.

- No commented-out code
- No `TODO` without the reason it is not done yet

## Logic and performance

- Write the plain version. A reader should follow it top to bottom without
  holding state in their head.
- **Do not optimise speculatively.** No cache, counter, index, memo or extra
  layer for performance without a measured reason. The project already made
  this call: `pieceCount` is derived rather than stored because a counter
  column is one bug away from drifting for no measurable gain at this scale,
  and the gallery filter runs in the browser because a round trip per
  keystroke would be slower than scanning what is already in hand.
- **Do not write accidentally expensive code.** The same rule's other half:
  work repeated in a loop that could be hoisted, a nested scan where a map
  would do it once, a request per item where one call returns the set.
- `useMemo` and `useCallback` are for a measured cost or a dependency that
  must stay stable, not a reflex on every value.
- Size the solution to a couple of hundred pieces, which is what this gallery
  holds -- not to an imagined million.

## Code Quality

- No unused imports or variables