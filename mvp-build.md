# Archiving Protocol
*Instructions for future LLMs on how to archive content in these files.*

**What "archiving" means:**
Completed build steps and change log entries accumulate detail that clutters active planning. Archiving moves the full content to `mvp-build-archive.md` and replaces it in this file with a compact one-liner, keeping this file short and scannable.

**How to archive an Entry:**
1. Copy the full entry (bold header + Summary + Future considerations block) to the top of the `# 0_Archived_Entries` section in `./mvp-build-archive.md`, converting the header format to `**MM/DD/YYYY -- {title} -- {model}**`
2. In this file, remove the full entry and add a single bullet to `## Archived Entries` in the format: `- {step or date} — {short title}`

**How to archive a Build Plan section or subsection:**
1. Copy the full spec content (the `### ~~X.X.X_Title~~` heading and all its numbered steps) to the matching `## X.X_Section (archived)` section in `# 1_Archived_Build_Plan` of `./mvp-build-archive.md`. If that archived section doesn't exist yet, create it following the existing `---` separator pattern.
2. In this file, remove the full `### ~~X.X.X~~` block and replace it with a single bullet under the parent `## ~~X.X_Section~~` stub in the format: `- **X.X.X** — {one-line description}. ~~Complete~~`
3. If the entire parent section is now just bullets (no remaining full specs), ensure the section header has the ` note.

---

# 0_Entries
## 0.1_Example Entry
**02/02/2026 -- 0.5.1 -- Claude 4.5 Sonnet**
Summary of actions taken:
- Action 1 
- Action 2
	- Sub-action 1
	- Sub-action 2
- Action 3

Future considerations/recommendations/warnings
- Future consideration/recommendation/warning 1
- Future consideration/recommendation/warning 2
- Future consideration/recommendation/warning 3

## 0.2_Recent_Entries
*For context about what has recently been done. Most recent at the top.*

**03/26/2026 -- 1.4.11 Search/Sort for Spreads List -- Claude Opus 4.6**
Summary of actions taken:
- Extended `SpreadListItem` with `description` field and added `SpreadSortField`/`SpreadSortDir` types with URL param parsers in `filter-spreads.ts`
- Updated `buildSpreadList()` with client-side search filtering (name + description, case-insensitive) and dynamic sort comparator (date/name/cards, asc/desc)
- Added search `InputGroup` with `Search01Icon` addon and sort `DropdownMenu` with `RadioGroup` field selection + direction toggle to `SpreadsToolbar`
- Wired search as local `useState` in `page.tsx`; sort field/direction as URL search params via existing `updateParams` pattern
- Updated `_list/index.ts` barrel exports

Future considerations/recommendations/warnings
- Search is client-side only — sufficient for current scale but will need backend search if spread counts grow significantly
- `readingCount` sort option deliberately skipped — makes more sense for shared/collective spreads feature
- No "no results" empty state for search yet — grid is simply empty when search yields no matches; consider adding a distinct message in a follow-up

**03/26/2026 -- 1.4.12 Undo/Redo for Card Canvas Placement -- Claude Opus 4.6**
Summary of actions taken:
- Created `use-canvas-history.ts` — ref-based undo/redo stacks (max 50 entries) with `PlacementSnapshot` type, keyboard shortcuts (Ctrl+Z undo, Ctrl+Shift+Z/Ctrl+Y redo), input/textarea/select guard, `enabled` flag for view mode, auto-clear on card count change
- Moved `handleCanvasLayerChange` from `spread-editor-layout.tsx` into `use-canvas-model.ts` to centralize all three form write-back paths (drag, rotation, layer)
- Added `pushSnapshot()` call at the start of `handleCanvasPositionsCommit`, `handleCardRotationChange`, and `handleCanvasLayerChange` to capture state before each mutation
- Threaded `isViewMode` through `useSpreadForm({ isViewMode })` → `useSpreadCanvasModel({ enabled })` → `useCanvasHistory({ enabled })` so history is disabled in view mode
- Created `UndoRedoControls` component matching `ZoomControls` styling (same container classes, ghost icon buttons with `Undo03Icon`/`Redo03Icon`, disabled states, tooltips with shortcut hints)
- Wrapped `UndoRedoControls` + `ZoomControls` in a shared `absolute top-2 right-2 z-10 flex` container in both mobile and desktop layouts; made `ZoomControls` positioning class-driven via `className` prop (defaults to `absolute top-2 right-2 z-10` when no className provided, accepts `static` override)
- Exported `UndoRedoControls` from canvas barrel index
- Refactored both `UndoRedoControls` and `ZoomControls` to use shared `TooltipProvider` + `TooltipRoot` pattern instead of individual `Tooltip` wrappers
- Added keyboard shortcuts for zoom: ⇧⌘+ (zoom in), ⇧⌘- (zoom out), ⇧⌘0 (reset) — uses Shift modifier to avoid conflicting with browser zoom (⌘+/⌘-/⌘0)
- Updated all tooltip contents to show keyboard shortcuts as lighter text with Mac symbols (⌘, ⇧)

Future considerations/recommendations/warnings
- History stores full snapshots of all card positions — memory usage is bounded by MAX_HISTORY (50) but could be optimized to delta-based storage if spreads grow very large
- Undo/redo for rotation doesn't restore continuous rotation state (the visual angle cache in `cardRotationsRef`), only the stored 0-359 form value — this means undone rotations may take a different visual path but end at the correct angle
- If card add/remove undo is added later, the snapshot format would need to include card identity (field-array IDs) rather than just positional arrays

**03/26/2026 -- 1.4.8 Spread Versioning -- Claude Opus 4.6**
Summary of actions taken:
- Added `version` (int, starts at 1), `readingCount` (int, starts at 0), and `deleted` (boolean, default false) fields to `spreadValidator` in `convex/schema.ts`
- Created `spreadVersionValidator` and `spread_versions` table with `by_spreadId_and_version` index for archived spread snapshots
- Added `by_spreadId` index on readings table for efficient spread-to-readings lookups
- Added `SpreadVersionDB` type to `types/spreads.ts`
- Created backfill migration (`convex/migrations/backfillSpreadVersions.ts`) — internal mutation that patches existing spreads with new fields and counts existing readings per spread
- Updated `spreads.create` to set `version: 1, readingCount: 0, deleted: false`; updated `spreadsCreateArgs` and `spreadsUpdateArgs` to omit the server-managed fields
- Updated `spreads.update` to bump version when `readingCount > 0` (no archiving — snapshots are created lazily in `readings.create`); no-op on version when no readings exist
- Updated `spreads.remove` with three flows: hard-delete (readingCount === 0), soft-delete (readingCount > 0, cascade false), cascade delete (readingCount > 0, cascade true — deletes all readings + versions + spread)
- Updated `spreads.list` and `spreads.listFavorited` to filter out soft-deleted spreads
- Added `spreads.getByVersion` query: returns live spread for current version, archived snapshot for older versions; works on soft-deleted spreads (readings still need layout)
- Updated `readings.create` to increment spread's `readingCount`, server-enforce the spread's current version, and lazily archive the spread's current state to `spread_versions` if no snapshot exists for that version (only versions that readings actually reference get archived — edits between readings produce zero orphan rows)
- Updated `readings.remove` to decrement spread's `readingCount` and auto-cleanup soft-deleted spreads when count hits 0
- Updated `readings.update` to adjust `readingCount` on both old and new spreads when spread reference changes, and server-enforce the new spread's current version
- Updated delete dialog in `spread-detail.tsx`: when `readingCount > 0`, shows three options via ConfirmDialog's secondary button — "Keep it" (cancel), "Delete spread only" (soft-delete), "Delete spread and all X readings" (cascade delete)
- Added 18 new versioning tests across spreads.test.ts (versioning, soft-delete, cascade delete, getByVersion, list/listFavorited exclusion) and readings.test.ts (readingCount increment/decrement, version enforcement, lazy snapshot creation, snapshot deduplication, auto-cleanup, spread change count adjustment)
- Updated all existing test spread inserts across spreads.test.ts, readings.test.ts, and interpretations.test.ts to include new required fields

Future considerations/recommendations/warnings
- Run `convex/migrations/backfillSpreadVersions` from the Convex dashboard after deploying schema changes to patch existing spreads
- Cascade delete currently deletes all readings for the spread owner — when shared spreads are implemented, this should only delete the owner's readings
- `getByVersion` does not check ownership — it returns data for any spread by ID, which is fine for now since readings already validate ownership, but should be revisited for shared spreads
- The `by_spreadId` index on readings uses a nested field path (`spread.id`) — verify Convex supports this syntax in production (it works in convex-test)
- Soft-deleted spreads remain in the database indefinitely until all their readings are removed; consider a periodic cleanup job if orphaned soft-deletes become a concern

**03/16/2026 -- Custom Canvas Scrollbars -- Claude Opus 4.6**
Summary of actions taken:
- Created `CanvasScrollbars` component (`_components/canvas/components/scrollbars.tsx`) — macOS-style overlay scrollbar thumbs for horizontal and vertical axes
- Thumb size is proportional to the visible viewport fraction; thumb position tracks pan offset within canvas bounds
- Draggable thumbs: mousedown captures track length, mousemove converts pixel delta to pan delta, calls `onPan` which clamps and schedules pan update
- Auto-fade: thumbs appear on any pan/zoom activity (`isScrollbarActive` state in `index.tsx`) and fade out after 1.5s idle via timeout; hover/drag keeps them visible
- Thumbs expand from 6px to 8px on hover for easier grab targeting
- `pointer-events-none` on container, `pointer-events-auto` on thumb elements only — no interference with canvas interaction
- Uses `bg-[var(--scrollbar)]` (pre-existing CSS variable with theme-appropriate transparency)
- Integrated into `index.tsx`: `viewportDimensions` memo, `handleScrollbarPan` callback, `setScrollbarActiveForFrame` triggered from `flushViewportCommit` and `schedulePanUpdate`
- Fixed React Compiler lint error: replaced ref reads during render (`hTrackRef.current?.clientWidth`) with CSS `minWidth`/`minHeight` on thumb elements

Future considerations/recommendations/warnings
- Scrollbar thumbs are mouse-only (no touch drag on the scrollbar itself) — this is intentional since touch devices pan via direct gesture
- Track click-to-jump (clicking the track area to jump the thumb to that position) is not implemented — could be added if users expect it
- The `--scrollbar` CSS variable should be verified in both light and dark themes for adequate contrast/visibility

## 0.3_Archived_Entries
*Full entries available in `./mvp-build-archive.md`*

- 1.4.7 — Canvas card buttons
- 1.4.6 — ViewBox-based zoom
- 1.4.5 — Spreads audit and refactor
- 02/19 — Project Structure Refactor
- 1.4.4 — View Spreads
- 1.4.3 — Edit Spreads
- 1.2.5 — Responsive Panel Component
- 1.2.4 — Field Component Abstractions
- 1.4.2 — Favoriting Spreads
- 1.3.10 — New Spread Responsive Design
- 1.4.1 — Spreads Page
- 1.3.9 — Local Storage Draft Saving
- 1.3.8 — Final Polishing 1
- Refactor — AppTopbar props instead of Zustand store
- 1.3.7 — Save functionality (validation, Convex create, toasts)
- 1.3.6 — Card Overview (sortable tiles, drag-to-reorder, edit/delete)
- 1.3.5 — Group card select and group drag (marquee + multi-drag)
- 1.3.4 — Card details panel (third resizable panel, position/name/description/allowReverse/x/y/rotation/zIndex)
- 1.3.3 — Spread canvas and card (GSAP drag, grid, alignment guides, spacebar pan)
- 1.3.2 — New Spread page (form with name, numberOfCards, description; topbar integration)
- 1.3.1 — Topbar Zustand store and dynamic title/buttons
- 02/05 — Landing page redesign, global palette, sidebar/topbar refinement
- 1.2.3 — App topbar (sidebar toggle, breadcrumbs, New dropdown)
- 1.2.2 — App sidebar (header link, Interpretations, Settings, collapsed-state fixes)
- 1.2.1 — Setup (layout title, landing auth/redirect, shadcn components)
- 1.1.5 — Convex Vitest test infrastructure and 64 tests (users, readings, spreads, interpretations, http)
- 1.1.4 — Code review (returns validators, index-based queries, DRY validators, _id standardization)
- 1.1.3 — readings.ts, interpretations.ts, spreads.ts CRUD
- 1.1.2 — Clerk webhook, users.ts (current, upsertFromClerk, deleteFromClerk)
- 1.1.1 — Convex schema (users, readings, interpretations, spreads; indexes)

# Build Plan
*H2 Heading crossed out (e.g. ## ~~1.2_Example~~) means that the section is complete and has been archived. H3 Headings indicate active steps (e.g. ### 1.2.1_Example); when archived they are replaced with the following format: "**1.2.1** — Example". Full steps archived in mvp-build-archive.md.*

## ~~1.1_Database & Auth Setup~~
- **1.1.1** — Create database tables in /convex/schema.ts; create indexes; update 0.2.2.1.1 with index specs. ~~Complete~~
- **1.1.2** — Create webhook to sync Clerk with users table: /convex/users.ts, /convex/http.ts; follow [Convex guide](https://docs.convex.dev/auth/database-auth#set-up-webhooks); scan project for auth improvements.
- **1.1.3** — Create readings.ts, interpretations.ts, spreads.ts with list/create/update/remove + table-specific queries. ~~Complete~~
- **1.1.4** — Code review of 1.1.1–1.1.3. ~~Complete~~
- **1.1.5** — Convex tests per table ([Convex Tests](https://docs.convex.dev/testing/convex-test)). ~~Complete~~

## ~~1.2_Frontend Setup~~
- **1.2.1** — Setup: update layout title; landing page (auth, redirect to /app, /app → /app/personal); install shadcn components from 0.2.1.1.2. ~~Complete~~
- **1.2.2** — App-sidebar: header links to /app; content (Personal, Readings, Spreads, Interpretations, tooltips/collapsed fix); footer (UserButton, Settings). ~~Complete~~
- **1.2.3** — App-topbar: sidebar toggle, breadcrumbs (no "app", ChevronRight), placeholder center title, New dropdown (Reading, Spread, Interpretation). ~~Complete~~
- **1.2.4** — Field component abstractions (TextField, TextareaField, SwitchField, NumberField for react-hook-form). ~~Complete~~
- **1.2.5** — Responsive panel component (mobile Sheet / desktop ResizablePanel abstraction). ~~Complete~~

## ~~1.3_New Spread~~
- **1.3.1** — Topbar: Zustand store (/stores/topbar.ts) for title (name, addInfo, draft) and rightButtonGroup; app-topbar title section + conditional buttons. ~~Complete~~
- **1.3.2** — New Spread page: two-column layout; left panel form (name, numberOfCards, description) with react-hook-form + zod; topbar integration (Save/Discard, draft badge, live title). ~~Complete~~
- **1.3.3** — Spread canvas (1500×1500 SVG, grid, spacebar pan) and card (GSAP drag, snap-to-grid, alignment guides). ~~Complete~~
- **1.3.4** — Card details panel: third resizable panel; Position/Name/Description/Allow Reverse/X-Y/Rotation/Z-Index; link spread type to schema. ~~Complete~~
- **1.3.5** — Group card select: marquee selection + group drag. ~~Complete~~
- **1.3.6** — Card overview: sortable tiles in spread settings (GSAP drag-to-reorder), edit/delete, "New Card" button. ~~Complete~~
- **1.3.7** — Save: Convex create mutation, disabled+spinner, toasts (Sonner). ~~Complete~~
- **1.3.8** — Final polishing: remove card hover-delete (use panel "Remove Card"), auto-select new card, group-deselect on card click, validation toasts + expand panel, responsive canvas, tooltips. ~~Complete~~
- **1.3.9** — Local storage draft saving: persist form to localStorage; discard confirmation (Cancel / Save as draft / Discard). *In progress / see archive for full spec.*
- **1.3.10** — New spread responsive design (mobile sheets below topbar, floating toolbar, topbar title truncation). ~~Complete~~

## ~~1.4_View/Edit Spreads~~
- **1.4.1** — Spreads page (saved spreads grid + localStorage draft display). ~~Complete~~
- **1.4.2** — Favoriting spreads (toggle favorite, `listFavorited` query, star UI). ~~Complete~~
- **1.4.3** — Edit spreads (dynamic `[id]` route, edit panel, save/cancel/discard). ~~Complete~~
- **1.4.4** — View spreads (view mode, read-only canvas + panels, view/edit toggle). ~~Complete~~
- **1.4.5** — Spreads audit and refactor (`useSpreadForm`, DRY wrappers, zoom GPU hint). ~~Complete~~
- **1.4.6** — ViewBox-based zoom/pan (wheel, touch, spacebar; no native scroll). ~~Complete~~
- **1.4.7** — Canvas card buttons (rotation/layer), collapsed placement, rotation 0–359. ~~Complete~~

### ~~1.4.8_Spread Versioning~~
1. Add `version` (int, starts at 1), `readingCount` (int, starts at 0), and `deleted` (boolean, default false) fields to `spreadValidator`. Create `spreadVersionValidator` and `spread_versions` table with `by_spreadId_and_version` index. Add `by_spreadId` index to readings table.
2. Create backfill migration (`convex/migrations/backfillSpreadVersions.ts`) to patch existing spreads with `version: 1, readingCount: 0, deleted: false`.
3. Update spread mutations: `create` sets new fields; `update` bumps version when `readingCount > 0` (no archiving — snapshots are created lazily in `readings.create`); `remove` supports soft-delete (when readings exist) and cascade delete. Filter soft-deleted spreads from `list`/`listFavorited`.
4. New `getByVersion` query: returns live spread if version matches current, otherwise fetches from `spread_versions`.
5. Update reading mutations: `create` increments `readingCount`, server-enforces version, and lazily archives the spread's current state to `spread_versions` if no snapshot exists for that version (deduplicates across multiple readings for the same version); `remove` decrements `readingCount` and auto-cleans soft-deleted spreads when count hits 0; `update` adjusts counts when spread reference changes.
6. Update delete modal in spread detail page: when `readingCount > 0`, offer "Delete spread only" (soft-delete) and "Delete spread and all X readings" (cascade).
7. Tests for versioning, archiving, soft-delete, cascade delete, auto-cleanup, readingCount management.

### 1.4.9_Load Spread Template
1. Users should be able to load an existing spread as a template for a new spread. Should give the user the option to copy card positions only, or entire spread.

### 1.4.10_Pagination/"Load More"
1. This feature is fundamental. Allows users to either load more spreads (more than the default 10) via a "Load More button at the bottom" or via pagination.

### ~~1.4.11_Search/Sort~~
1. Extend `SpreadListItem` with `description?: string` field. Add `SpreadSortField` (`"date" | "name" | "cards"`) and `SpreadSortDir` (`"asc" | "desc"`) types with URL param parsers (`getSort`, `getSortDir`) in `filter-spreads.ts`.
2. Extend `buildSpreadList()` to accept `search`, `sortField`, `sortDir` params. Add client-side search filter matching against `name` and `description` (case-insensitive `includes`). Replace hardcoded timestamp sort with dynamic comparator (date=numeric, name=localeCompare, cards=length).
3. Expand `SpreadsToolbar` with search input (`InputGroup` + `Search01Icon` addon, local state) on the right side and sort `DropdownMenu` button (outline, `SortByDown01Icon`/`SortByUp01Icon`) with `RadioGroup` for field selection and direction toggle item.
4. Wire search as local `useState` in `page.tsx`; wire sort field/direction as URL search params (`sort`, `dir`) via existing `updateParams` pattern. Defaults omitted from URL (`date` + `desc`).
5. Update `_list/index.ts` barrel exports with new types and parsers.

### ~~1.4.12_Undo/Redo for card canvas placement~~
1. Create `use-canvas-history.ts` hook with ref-based undo/redo stacks (max 50), snapshot capture, keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y) with input/textarea/select guard, `enabled` flag for view mode, and auto-clear on card count change.
2. Move `handleCanvasLayerChange` from layout into `use-canvas-model.ts` alongside other form write-back handlers.
3. Integrate history: call `pushSnapshot()` at the start of `handleCanvasPositionsCommit` (drag), `handleCardRotationChange` (rotation), and `handleCanvasLayerChange` (z-order). Export `canUndo`, `canRedo`, `undo`, `redo` through the hook chain.
4. Pass `isViewMode` through `useSpreadForm` → `useSpreadCanvasModel` → `useCanvasHistory` via `enabled` flag.
5. Create `UndoRedoControls` component matching `ZoomControls` styling (same container, ghost icon buttons, tooltips with shortcut hints).
6. Wire controls into `spread-editor-layout.tsx`: wrap both `UndoRedoControls` and `ZoomControls` in a shared flex container; make ZoomControls positioning class-driven via `className` prop; only render undo/redo when not in view mode. Applied to both mobile and desktop layouts.
7. Export `UndoRedoControls` from canvas barrel.
8. Refactor both components to use `TooltipProvider` + `TooltipRoot` pattern for grouped tooltip behavior. Add zoom keyboard shortcuts (⇧⌘+, ⇧⌘-, ⇧⌘0) with input guard. Show shortcuts in tooltips as lighter text with Mac symbols.