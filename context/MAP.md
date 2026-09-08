# The Map

Where everything is. Read this before you search, and you will usually not
have to search. It answers one question -- *which files hold feature X* --
and nothing else; the reasoning behind each feature lives in the spec listed
in its row.

The bottom half is generated from the source by `python scripts/build_map.py`.
Run it after moving, adding or deleting a file.

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
| Piece page | `pages/PiecePage.tsx` | `PieceWallLabel`, `PieceNav`, `PieceOwnerActions`, `PieceDetailsDialog`, `TagInput`, `FocalPicker` | `api/pieces.py` | `project-overview.md` |
| Detailed view | piece page | `DetailedView`, `DetailedViewButton`, `PieceTile` | `services/tiles.py`, `scripts/backfill_tiles.py` | `DETAILED-VIEW.md` |
| Collections | `pages/CollectionsIndexPage.tsx`, `pages/CollectionPage.tsx` | `CollectionGrid`, `CollectionCard`, `CollectionArrange`, `CollectionOwnerActions`, `CollectionDetailsDialog`, `NewCollectionDialog`, `CollectionPicker`, `AddWorkDialog`, `PiecePickerGrid`, `lib/order.ts` | `api/collections.py`, `services/slugs.py` | `COLLECTIONS.md` |
| Upload | any, owner only | `UploadModal`, `TagInput`, `CollectionPicker` | `POST /api/pieces`, `services/images.py`, `storage.py` | `STORAGE.md` |
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

<!-- generated:start -->

_Generated by `scripts/build_map.py`. Do not edit by hand._

### Every API route

| Route | Handler | Source |
|---|---|---|
| `GET /api/collections` | `list_collections` | [`backend/app/api/collections.py:88`](../backend/app/api/collections.py#L88) |
| `GET /api/collections/<slug>` | `get_collection` | [`backend/app/api/collections.py:107`](../backend/app/api/collections.py#L107) |
| `POST /api/collections` | `create_collection` | [`backend/app/api/collections.py:120`](../backend/app/api/collections.py#L120) |
| `PATCH /api/collections/<uuid:collection_id>` | `update_collection` | [`backend/app/api/collections.py:146`](../backend/app/api/collections.py#L146) |
| `PUT /api/collections/<uuid:collection_id>/pieces` | `set_collection_pieces` | [`backend/app/api/collections.py:177`](../backend/app/api/collections.py#L177) |
| `DELETE /api/collections/<uuid:collection_id>` | `delete_collection` | [`backend/app/api/collections.py:195`](../backend/app/api/collections.py#L195) |
| `GET /api/pieces` | `list_pieces` | [`backend/app/api/pieces.py:20`](../backend/app/api/pieces.py#L20) |
| `GET /api/pieces/<uuid:piece_id>` | `get_piece` | [`backend/app/api/pieces.py:48`](../backend/app/api/pieces.py#L48) |
| `POST /api/pieces` | `create_piece` | [`backend/app/api/pieces.py:179`](../backend/app/api/pieces.py#L179) |
| `PATCH /api/pieces/<uuid:piece_id>` | `update_piece` | [`backend/app/api/pieces.py:285`](../backend/app/api/pieces.py#L285) |
| `DELETE /api/pieces/<uuid:piece_id>` | `delete_piece` | [`backend/app/api/pieces.py:352`](../backend/app/api/pieces.py#L352) |
| `POST /api/pieces/<uuid:piece_id>/waive` | `waive_piece` | [`backend/app/api/pieces.py:387`](../backend/app/api/pieces.py#L387) |
| `POST /api/pieces/<uuid:piece_id>/restore` | `restore_piece` | [`backend/app/api/pieces.py:479`](../backend/app/api/pieces.py#L479) |
| `PUT /api/pieces/<uuid:piece_id>/collections` | `set_piece_collections` | [`backend/app/api/pieces.py:505`](../backend/app/api/pieces.py#L505) |
| `POST /api/session` | `sign_in` | [`backend/app/api/session.py:29`](../backend/app/api/session.py#L29) |
| `DELETE /api/session` | `sign_out` | [`backend/app/api/session.py:59`](../backend/app/api/session.py#L59) |
| `GET /api/session/me` | `whoami` | [`backend/app/api/session.py:66`](../backend/app/api/session.py#L66) |
| `GET /api/socials` | `list_socials` | [`backend/app/api/socials.py:74`](../backend/app/api/socials.py#L74) |
| `PUT /api/socials` | `replace_socials` | [`backend/app/api/socials.py:84`](../backend/app/api/socials.py#L84) |
| `PUT /api/spotlight` | `replace_spotlight` | [`backend/app/api/spotlight.py:69`](../backend/app/api/spotlight.py#L69) |

### Who imports what

A component with no importers is either an entry point or dead code.

| Module | Imported by |
|---|---|
| `components/AddWorkDialog.tsx` | `components/CollectionArrange.tsx` |
| `components/AllWorkSection.tsx` | `pages/CollectionPage.tsx`, `pages/LandingPage.tsx`, `pages/WaivedPage.tsx` |
| `components/CollectionArrange.tsx` | `pages/CollectionPage.tsx` |
| `components/CollectionCard.tsx` | `components/CollectionGrid.tsx` |
| `components/CollectionDetailsDialog.tsx` | `components/CollectionOwnerActions.tsx` |
| `components/CollectionGrid.tsx` | `components/CollectionsSection.tsx`, `components/Spotlight.tsx`, `pages/CollectionsIndexPage.tsx` |
| `components/CollectionOwnerActions.tsx` | `pages/CollectionPage.tsx` |
| `components/CollectionPicker.tsx` | `components/PieceOwnerActions.tsx`, `components/UploadModal.tsx` |
| `components/CollectionsSection.tsx` | `pages/LandingPage.tsx` |
| `components/ConfirmDialog.tsx` | `components/CollectionOwnerActions.tsx`, `components/PieceOwnerActions.tsx` |
| `components/DensityControl.tsx` | `components/AllWorkSection.tsx` |
| `components/DetailedView.tsx` | `pages/PiecePage.tsx` |
| `components/DetailedViewButton.tsx` | `pages/PiecePage.tsx` |
| `components/FocalPicker.tsx` | `components/PieceDetailsDialog.tsx` |
| `components/Header.tsx` | `components/PageShell.tsx` |
| `components/IntroSection.tsx` | `pages/LandingPage.tsx` |
| `components/Keyhole.tsx` | `components/PageShell.tsx` |
| `components/MasonryGrid.tsx` | `components/AllWorkSection.tsx` |
| `components/NewCollectionDialog.tsx` | `pages/CollectionsIndexPage.tsx`, `pages/LandingPage.tsx` |
| `components/PageMessage.tsx` | `pages/CollectionPage.tsx` |
| `components/PageShell.tsx` | `pages/CollectionPage.tsx`, `pages/CollectionsIndexPage.tsx`, `pages/LandingPage.tsx`, `pages/PiecePage.tsx`, `pages/WaivedPage.tsx` |
| `components/PieceCard.tsx` | `components/MasonryGrid.tsx` |
| `components/PieceDetailsDialog.tsx` | `components/PieceOwnerActions.tsx` |
| `components/PieceFilters.tsx` | `components/AddWorkDialog.tsx`, `components/NewCollectionDialog.tsx`, `components/SpotlightDialog.tsx` |
| `components/PieceNav.tsx` | `pages/PiecePage.tsx` |
| `components/PieceOwnerActions.tsx` | `pages/PiecePage.tsx` |
| `components/PiecePickerGrid.tsx` | `components/AddWorkDialog.tsx`, `components/NewCollectionDialog.tsx`, `components/SpotlightDialog.tsx` |
| `components/PieceTile.tsx` | `components/CollectionArrange.tsx`, `components/PiecePickerGrid.tsx` |
| `components/PieceWallLabel.tsx` | `pages/PiecePage.tsx` |
| `components/ScrollToTop.tsx` | `App.tsx` |
| `components/SectionHeader.tsx` | `components/AllWorkSection.tsx`, `components/CollectionsSection.tsx` |
| `components/SectionState.tsx` | `components/AddWorkDialog.tsx`, `components/AllWorkSection.tsx`, `components/CollectionsSection.tsx`, `components/NewCollectionDialog.tsx`, `components/PiecePickerGrid.tsx`, `components/SpotlightDialog.tsx`, `pages/CollectionsIndexPage.tsx` |
| `components/SiteFooter.tsx` | `components/PageShell.tsx` |
| `components/SocialsDialog.tsx` | `components/SocialsMenu.tsx` |
| `components/SocialsMenu.tsx` | `components/Header.tsx` |
| `components/Spotlight.tsx` | `pages/LandingPage.tsx` |
| `components/SpotlightDialog.tsx` | `components/Spotlight.tsx` |
| `components/SpotlightOrder.tsx` | `components/SpotlightDialog.tsx` |
| `components/TagInput.tsx` | `components/PieceDetailsDialog.tsx`, `components/UploadModal.tsx` |
| `components/ThemeToggle.tsx` | `components/Header.tsx` |
| `components/UploadModal.tsx` | `components/PageShell.tsx` |
| `components/form-styles.ts` | `components/AddWorkDialog.tsx`, `components/CollectionArrange.tsx`, `components/CollectionDetailsDialog.tsx`, `components/CollectionOwnerActions.tsx`, `components/DetailedViewButton.tsx`, `components/FocalPicker.tsx`, `components/Keyhole.tsx`, `components/NewCollectionDialog.tsx`, `components/PieceDetailsDialog.tsx`, `components/PieceFilters.tsx`, `components/PieceNav.tsx`, `components/PieceOwnerActions.tsx`, `components/SocialsDialog.tsx`, `components/Spotlight.tsx`, `components/SpotlightDialog.tsx`, `components/TagInput.tsx`, `pages/CollectionPage.tsx`, `pages/CollectionsIndexPage.tsx`, `pages/LandingPage.tsx`, `pages/PiecePage.tsx` |
| `components/icons.tsx` | `components/CollectionOwnerActions.tsx`, `components/DensityControl.tsx`, `components/DetailedView.tsx`, `components/DetailedViewButton.tsx`, `components/Header.tsx`, `components/Keyhole.tsx`, `components/PieceOwnerActions.tsx`, `components/SocialsDialog.tsx`, `components/SocialsMenu.tsx`, `components/Spotlight.tsx`, `components/SpotlightOrder.tsx`, `components/platform-icons.tsx` |
| `components/platform-icons.tsx` | `components/SocialsDialog.tsx`, `components/SocialsMenu.tsx` |
| `hooks/useAsync.ts` | -- |
| `hooks/useFlipReflow.ts` | `components/MasonryGrid.tsx` |
| `hooks/useGridDensity.ts` | `components/AllWorkSection.tsx`, `components/DensityControl.tsx`, `components/MasonryGrid.tsx` |
| `hooks/usePersistentState.ts` | `hooks/useGridDensity.ts` |
| `hooks/usePieceFilter.ts` | -- |
| `hooks/useSecretTrigger.ts` | -- |
| `hooks/useSession.ts` | -- |
| `hooks/useSocials.ts` | -- |
| `hooks/useSpotlight.ts` | -- |
| `hooks/useTheme.ts` | `components/ThemeToggle.tsx` |
| `lib/keyhole.ts` | `components/Keyhole.tsx`, `contexts/SessionProvider.tsx` |
| `lib/order.ts` | `components/CollectionArrange.tsx`, `components/SpotlightDialog.tsx` |
| `lib/session.ts` | `contexts/SessionProvider.tsx`, `services/keyhole.ts`, `services/pieces.ts` |
| `lib/spotlight.ts` | `components/FocalPicker.tsx`, `components/Spotlight.tsx`, `components/SpotlightDialog.tsx`, `services/pieces.ts` |

<!-- generated:end -->
