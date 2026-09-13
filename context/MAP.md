# The Map

Where everything is. Read this before you search, and you will usually not
have to search. It answers one question -- *which files hold feature X* --
and nothing else; the reasoning behind each feature lives in the spec listed
in its row.

For relationships -- what calls X, what depends on it, how A reaches B -- use
the knowledge graph instead: `graphify affected "X"`, `graphify path "A" "B"`.
The map answers *where*; the graph answers *what connects to what*.

## 1. The words this project uses

Grepping fails when the code calls a thing something else. It calls them these.

| You might say | The code says | Meaning |
|---|---|---|
| featured, hero, carousel | **spotlight** | The picks the owner pins to the top of the landing page |
| archived, hidden, soft-deleted | **waived** | A piece taken out of the gallery but not destroyed. Two stages: waive, then delete |
| admin login, sign-in page | **keyhole** | There is no login screen. The owner opens a hidden trigger. See `AUTH.md` |
| artwork, drawing, image | **piece** | The unit of content. `Piece` in TypeScript, `Piece` in `models.py` |
| album, gallery, folder | **collection** | A named, ordered set of pieces, addressed by `slug` |
| thumbnail, crop centre | **focal** | The point a crop keeps in frame |
| zoom view, lightbox | **detailed view** | The full-window viewer, backed by pre-cut **tiles** |
| grid size, columns | **density** | How many columns the masonry grid uses |
| admin, logged in | **owner** | The only privileged role. Everyone else is a **visitor** |

## 2. Features, and the files that are them

Read the row, open the files. The spec column is the *why*; open it only when
you need to change behaviour, not to find code.

| Feature | Screen | Frontend | Backend | Spec |
|---|---|---|---|---|
| Landing page | `pages/LandingPage.tsx` | `IntroSection`, `Spotlight`, `CollectionsSection`, `AllWorkSection` | `GET /api/pieces`, `GET /api/collections` | `feature/landing-phase-*.md` |
| Spotlight | landing | `Spotlight`, `SpotlightDialog`, `SpotlightOrder`, `FocalPicker`, `lib/spotlight.ts`, `hooks/useSpotlight.ts` | `api/spotlight.py` | STATUS.md section 9 |
| Piece grid | landing, collection, waived | `AllWorkSection`, `MasonryGrid`, `PieceCard`, `PieceFilters`, `DensityControl`, `hooks/useGridDensity.ts`, `hooks/useFlipReflow.ts`, `hooks/usePieceFilter.ts` | `GET /api/pieces` | `DESIGN.md` |
| Gallery filter | landing, collection | `GalleryFilter`, `MultiSelect`, `hooks/useGalleryFilter.ts` | -- filters in the browser | `DESIGN.md`, `current-feature.md` |
| Gallery sort | landing, collection | `GallerySort`, `hooks/useGallerySort.ts`, `lib/sortPieces.ts` | `createdAt` on the piece payload | `DESIGN.md` |
| List memory | landing, collection | `hooks/useReturnMemory.ts`, `lib/returnMemory.ts` | -- | `DESIGN.md` |
| Piece page | `pages/PiecePage.tsx` | `PieceWallLabel`, `PieceNav`, `PieceOwnerActions`, `PieceDetailsDialog`, `TagInput`, `FocalPicker`, `lib/origin.ts` | `api/pieces.py` | `project-overview.md` |
| Detailed view | piece page | `DetailedView`, `DetailedViewButton`, `PieceTile` | `services/tiles.py`, `scripts/backfill_tiles.py` | `DETAILED-VIEW.md` |
| Collections | `pages/CollectionsIndexPage.tsx`, `pages/CollectionPage.tsx` | `CollectionGrid`, `CollectionCard`, `CollectionArrange`, `CollectionOwnerActions`, `CollectionDetailsDialog`, `NewCollectionDialog`, `CollectionPicker`, `AddWorkDialog`, `PiecePickerGrid`, `lib/order.ts` | `api/collections.py`, `services/slugs.py` | `COLLECTIONS.md` |
| Upload | any, owner only | `UploadModal`, `TagInput`, `CollectionPicker`, `YearField`, `lib/year.ts` | `POST /api/pieces`, `services/images.py`, `storage.py` | `STORAGE.md` |
| Waived pieces | `pages/WaivedPage.tsx` | `AllWorkSection` | `POST /api/pieces/<id>/waive`, `.../restore` | `WAIVED-PIECES.md` |
| Owner session | hidden | `Keyhole`, `lib/keyhole.ts`, `services/keyhole.ts`, `hooks/useSecretTrigger.ts`, `contexts/SessionProvider.tsx` | `api/session.py`, `auth.py`, `ratelimit.py` | `AUTH.md` |
| Socials | header | `SocialsMenu`, `SocialsDialog`, `platform-icons`, `contexts/SocialsProvider.tsx` | `api/socials.py` | STATUS.md section 9 |
| Theme | everywhere | `ThemeToggle`, `contexts/ThemeProvider.tsx`, `index.css` | -- | `DESIGN.md` |
| Page chrome | everywhere | `PageShell`, `Header`, `SiteFooter`, `ScrollToTop`, `SectionHeader`, `SectionState`, `PageMessage`, `ConfirmDialog` | -- | `DESIGN.md` |

## 3. The fixed points

These do not move, and most questions end at one of them.

| Looking for | Open |
|---|---|
| Any call to the backend | `frontend/src/services/pieces.ts` -- every request in the app is one function here |
| Any shared type | `frontend/src/types/index.ts` |
| Any database column | `backend/app/models.py` |
| The JSON shape the frontend receives | `backend/app/schemas.py` (camelCase, matching `types/index.ts`) |
| A design token, colour or spacing value | `frontend/src/index.css` |
| Shared input and button classes | `frontend/src/components/form-styles.ts` |
| An SVG icon | `frontend/src/components/icons.tsx` |
| URL to page mapping | `frontend/src/App.tsx` |
| Owner-only enforcement | `backend/app/auth.py` |
| How a file gets to disk or MinIO | `backend/app/storage.py` |

## 4. Where new code goes

- A component used by more than one page -> `components/`. Used by one page and
  never reused -> still `components/`; pages stay thin.
- Anything that talks to the API -> a new function in `services/pieces.ts`,
  exported through `services/index.ts`. Components never call `fetch`.
- Stateful logic reused twice -> `hooks/`, exported through `hooks/index.ts`.
- Pure functions with no React -> `lib/`.
- A new resource -> a new blueprint in `backend/app/api/`, registered in
  `backend/app/api/__init__.py`, with a serializer in `schemas.py`.
- A context is always three files: `contexts/x-context.ts`, `contexts/XProvider.tsx`,
  `hooks/useX.ts`. Splitting them is what keeps fast refresh working.

## 5. Searching this repo

`node_modules`, `backend/.venv` and `dist` are ignored by git, so ripgrep skips
them. Anything that walks the tree without honouring gitignore will drown in
`.venv` -- there are more files under it than in the whole project.

The project is under 200 tracked files. Globbing is cheap; whole-file reads of
`STATUS.md` (856 lines) are not. Prefer:

- `rg -n "spotlight" frontend/src backend/app` -- feature words, scoped to source.
- `rg -n "^@bp\.(get|post|put|patch|delete)" backend/app/api` -- every route.
- `rg -n "^export (const|function|class)" frontend/src/services/pieces.ts` -- the API surface.
- `rg -n "^## " STATUS.md` -- section list, then `sed -n 'A,Bp'` for the one you want.

## 6. The documentation, ranked by cost

`AGENTS.md` is the working agreement and comes first. After that, open a
context doc only when the map above sends you to it. `STATUS.md` is a
reference, not a briefing: its section list is section 12, and it is the
right place to look for *state* -- what is built, what is broken -- never for
*where*. That is this file.

`DEPLOYMENT-NOTES.md` inverts the rule above: open it *before* you touch
config, cookies, the storage backend, `docker-compose.yml` or anything that
ships, rather than when a row sends you there. It carries the security sweep
of 2026-09-09 -- what blocks the first public request, what to harden after
it, and what was checked and found clean, so the clean half is not audited a
second time.
