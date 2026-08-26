# Current Feature

Landing Page (Home UI) Layout and Refinement

## Status

In Progress

## Goals

### Phase 1: Base Layout & Grid
- Set up the Home route at `/home`.
- Establish the main home layout and global styles (dark mode by default).
- Create a top header bar with a search input and a "new item" button (display only).
- Build the main content area using a grid layout.
- Render each piece as a square image card with a link to `/piece/[id]`.
- *Note: No sidebar for now.*

### Phase 2: Collections Integration
- Ensure piece cards correctly link to their respective `/piece/[id]`.
- Implement a "Favorite Collections" section.
- Implement a "Most recent collections" section.
- Use data directly from `src/lib/mock-data.ts`.

### Phase 3: Recent Items & Refinement
- Finalize the "Recent collections" section.
- Display the 10 most recent items in their respective section.
- Ensure seamless data integration from the mock data file.

## Notes

- **References**: `@context/feature/landing-phase-1-spec.md`, `@context/feature/landing-phase-2-spec.md`, `@context/feature/landing-phase-3-spec.md`.
- **Mock Data**: Use the static data from `src/lib/mock-data.ts` until the backend and database are fully implemented.
- **Design**: Rely on the minimalist, dark aesthetic specified in the `DESIGN.md` and the reference screenshots.

## History

- **2026-05-05**: Feature goals initialized based on the 3-phase landing spec. Ready to begin Phase 1.