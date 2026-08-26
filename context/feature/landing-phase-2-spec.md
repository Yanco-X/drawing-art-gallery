# Landing UI Phase 2 Spec

## Overview

This is phase 2 of 3 for the home or landing UI layout. Use the screenshot referenced below for how it should look. Use the data from the mock data file referenced below. Just import it directly for now until we implement a database.

## Requirements for phase 2

- pieces with links to /piece/ (eg.piece/id)
- Favorite collections
- Most recent collections
- Local repo for the pieces are in @backend/uploads
- We need to read each file in @backend/uploads and map it to the mock data structure
- Update the mock-data.ts file to include the pieces from @backend/uploads
- for the title, just use the filename without the extension
- for the description, use the filename without the extension
- for the tags, use the first tag in the mock data structure
- for the created date, use the current date (YYYY-MM-DD format)


## References

- @context/screenshots/landing-ui-main.png
- @context/project-overview.md
- @src/lib/mock-data.ts
- @context/features/landing-phase-1-spec.md
- @context/features/landing-phase-3-spec.md
