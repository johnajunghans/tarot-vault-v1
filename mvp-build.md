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

**03/16/2026 -- 1.4.5 -- Claude Opus 4.6**
Summary of actions taken:
- Phase 1 — Quick wins:
	- Removed unused `CardTransform` type from `types/spreads.ts`
	- Consolidated duplicate `snapToGrid` in `card-settings-panel.tsx` to import from `spread-layout.ts`
	- Eliminated `utils.ts` entirely — moved `generateCardAt` to `spread-layout.ts`, removed dead `generateCard`, updated 3 import sites
	- Fixed redundant `normalizeZoom(clampZoom(nextZoom))` → `normalizeZoom(nextZoom)` in canvas `index.tsx`
- Phase 2 — Panel wrapper consolidation:
	- Created `_hooks/use-spread-form.ts` with `useSpreadForm` hook (form + field array + canvas model + addCard/addCardAt), `mapPositionsForApi` utility, and `useValidationErrorHandler` hook
	- Refactored both `panel-wrapper.tsx` and `edit-panel-wrapper.tsx` to use shared hook, eliminating duplicated form setup, card CRUD, and validation logic
- Phase 3 — Zoom performance:
	- Added `willChange: 'transform'` CSS hint to SVG element for GPU compositing during pinch zoom

Future considerations/recommendations/warnings
- The JSX layout (mobile/desktop panels) is still duplicated between wrappers — could be consolidated into a shared layout component if the view mode conditionals become less divergent
- Read-only vs editable panel content components (`SpreadDetailsContent` / `SpreadSettingsContent`, etc.) are still separate — merging them was deemed higher risk than reward
- SVG viewBox-based zoom (replacing CSS scale transform) could further improve zoom performance but requires reworking the drag/snap/pan coordinate system — too risky for this step
- Manual testing recommended: create new spread, edit spread, view spread, draft save/load, discard dialog, mobile layout

## 0.3_Archived_Entries
*Full entries available in `./mvp-build-archive.md`*

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

## 1.4_View/Edit Spreads
- **1.4.1** — Spreads page (saved spreads grid + localStorage draft display). ~~Complete~~
- **1.4.2** — Favoriting spreads (toggle favorite, `listFavorited` query, star UI). ~~Complete~~
- **1.4.3** — Edit spreads (dynamic `[id]` route, edit panel, save/cancel/discard). ~~Complete~~
- **1.4.4** — View spreads (view mode, read-only canvas + panels, view/edit toggle). ~~Complete~~

### ~~1.4.5_Spreads Audit and Refactor~~ ~~Complete~~
Audited all spreads route files. Created shared `useSpreadForm` hook to DRY up duplicated form/canvas/card logic between new and edit wrappers. Eliminated `utils.ts`, consolidated `snapToGrid`, removed dead types, fixed redundant zoom normalization, added GPU compositing hint for mobile pinch zoom.

### 1.4.6_ViewBox-Based Zoom
Replace the current CSS `scale()` zoom with SVG `viewBox`-based zoom to eliminate full SVG repaints during zoom and improve mobile pinch zoom performance. Start in plan mode.

**Context from 1.4.5 investigation:** The current system uses `transform: scale(${zoom})` on the SVG element inside a scroll container sized to `svgWidth * zoom` x `svgHeight * zoom`. This causes the browser to repaint the entire SVG on every zoom change. A `viewBox` approach lets the browser handle zoom natively without repainting.

**Key files:**
- `_components/canvas/index.tsx` — main canvas (1442 lines), owns zoom state, scroll panning, touch/pinch/wheel handlers
- `_components/canvas/components/card.tsx` — GSAP Draggable integration (493 lines)
- `_components/canvas/helpers/viewport.ts` — viewport ↔ canvas coordinate transforms
- `_components/canvas/helpers/zoom.ts` — zoom constants and normalization
- `_components/canvas/tests/viewport.test.ts` — existing viewport tests

**What needs to change (ordered by risk):**

1. **GSAP Draggable coordinate handling** (HIGH risk) — Currently reads coordinates from CSS-scaled SVG automatically. With viewBox, Draggable receives unscaled screen coordinates. Must intercept drag values and divide by zoom, or wrap Draggable's coordinate space. This is the critical blocker — solve this first.
    - `card.tsx`: `Draggable.create()` — `onDragStart`, `onDrag`, `onDragEnd` all use `this.x` / `this.y` which currently return canvas-space values due to CSS scale
    - `card.tsx`: `gsap.set(group, { x: card.x, y: card.y })` — position sync also relies on scaled space
    - `index.tsx`: `transientPositionsRef` — stores drag positions in canvas coordinates

2. **`clientToSVG` function** (MEDIUM risk) — Uses `svg.getScreenCTM().inverse()` which currently includes CSS scale in the matrix. With viewBox only, the CTM changes. Must verify/adjust the matrix math.
    - Used for: marquee selection start/move/end, background double-click to place cards

3. **Container and SVG element** (LOW risk) — Replace the sized wrapper div + CSS scale with viewBox attribute on SVG.
    - Remove: `<div style={{ width: svgWidth * zoom, height: svgHeight * zoom }}>`
    - Remove: `style={{ transform: scale(${zoom}), transformOrigin: '0 0', willChange: 'transform' }}`
    - Add: `viewBox` attribute computed from zoom + scroll position
    - Scroll panning may need to change to viewBox manipulation instead of native scroll

4. **Viewport math** (LOW risk) — Functions in `viewport.ts` are pure ratio math and should work unchanged, but verify.

5. **No changes needed:** alignment guides, off-screen pointers, geometry helpers, zoom event handlers (wheel/pinch/safari gesture) — all pass viewport coordinates to functions that handle transformation math independently.

**Testing checklist:**
- Existing `viewport.test.ts` tests pass
- Single card drag + grid snap works at zoom levels 0.5x, 1.0x, 2.0x
- Group drag (marquee select + multi-drag) works at non-1x zoom
- Pinch zoom on mobile anchors correctly (zoom toward pinch midpoint)
- Wheel zoom anchors correctly (zoom toward cursor)
- Spacebar pan works at all zoom levels
- Double-click to place card lands at correct canvas position at non-1x zoom
- Off-screen card pointers point in correct direction
- Alignment guides appear at correct positions during drag

