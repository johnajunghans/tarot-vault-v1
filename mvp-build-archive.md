# MVP Build Archive

## 0.5.2_Entries (archived)

*Ordered with most recent at the top*

**02/19/2026 -- Project Structure Refactor -- Claude Sonnet 4.6**
Summary of actions taken:
- Created `app/app/personal/spreads/_components/` directory; moved 9 non-route files there: `canvas.tsx`, `card.tsx`, `card-overview.tsx`, `card-settings-panel.tsx`, `spread-settings-panel.tsx`, `spread-card.tsx`, `spread-thumbnail.tsx`, `spread-schema.ts`, `spread-functions.ts`
- Updated imports in `spreads/page.tsx`, `new-spread/panel-wrapper.tsx`, `[id]/edit-panel-wrapper.tsx`, and `types/spreads.ts` to reference `_components/` paths
- Stripped stale specification content from `mvp-build.md` (sections 0.1–0.5.1); kept change log and build plan only
- Updated `CLAUDE.md` project structure tree to reflect `_components/` subdirectory; updated MVP Build Protocol description of `mvp-build.md`
- Rewrote `.cursor/rules/project-structure.mdc` to reflect current actual project structure
- All 72 tests pass; no new lint errors

Future considerations:
- The `_components/` convention (underscore prefix) is a Next.js pattern that prevents directory from being treated as a route segment; use this for any co-located feature components in future route directories

**02/18/2026 -- 1.4.4 View Spreads -- Claude Opus 4.6**
Summary of actions taken:
- Updated `app/app/personal/spreads/[id]/page.tsx`: added `searchParams` prop to read `mode` query param; derives `"view" | "edit"` (defaults to `"edit"` for backward compat); passes `mode` to `EditPanelWrapper`
- Updated `app/app/personal/spreads/[id]/edit-panel-wrapper.tsx`: added `mode` prop and `isViewMode` derived flag; added `VIEW_BREADCRUMBS`; view mode shows "Close" + "Edit Spread" buttons in topbar; edit mode Cancel/Discard now routes to `?mode=view` instead of spreads list; passes `isViewMode` to canvas and both panels; mobile floating toolbar hides "add card" button in view mode; dialogs only render in edit mode
- Updated `app/app/personal/spreads/_components/canvas.tsx`: added `isViewMode` prop; hides grid `<defs>` and uses transparent background fill in view mode; disables marquee (`onMouseDown` undefined); passes `isViewMode` to `SpreadCard` children; guides `useMemo` early-returns `[]` in view mode
- Updated `app/app/personal/spreads/_components/card.tsx`: added `isViewMode` prop; skips `Draggable.create()` in view mode (only `gsap.set` for initial position); adds native `onClick` on outer `<g>` for card selection in view mode; position sync effect still works; updated `arePropsEqual` comparator
- Updated `app/app/personal/spreads/_components/spread-settings-panel.tsx`: added `SpreadDetailsContent` component (read-only name/description text + `CardOverviewReadOnly`); `SpreadSettingsPanel` conditionally renders details vs settings content; collapsed floating card hides "New Card" button in view mode; `addCard`/`remove`/`move` now optional
- Updated `app/app/personal/spreads/_components/card-settings-panel.tsx`: added `CardDetailsContent` component (read-only name, description, allowReverse, x, y, rotation, z-index); `CardSettingsPanel` conditionally renders details vs settings content; `remove`/`cardCount` now optional
- Updated `app/app/personal/spreads/_components/card-overview.tsx`: added `CardOverviewReadOnly` export (simple tile list with click-to-select, no GSAP drag, no delete buttons, label reads "Click to view")
- Updated `app/app/personal/spreads/_components/spread-card.tsx`: changed click navigation from `?mode=edit` to `?mode=view`
- All 72 tests pass; no new lint errors

Future considerations:
- `EditPanelWrapper` handles both view and edit modes via a `mode` prop rather than a separate component, since both modes share identical data fetching, layout, loading/not-found states, and center title logic
- `FormProvider` remains active in view mode as a convenient reactive data source (via `useWatch`) — it's just never written to
- If view mode grows significantly different from edit mode (e.g., different layout), consider splitting into separate wrapper components

**02/18/2026 -- 1.4.3 Edit Spreads -- Claude Opus 4.6**
Summary of actions taken:
- Updated `components/app/app-topbar.tsx`: added optional `breadcrumbs` prop to `AppTopbarProps`; when provided, overrides auto-generated breadcrumbs; existing callers unaffected
- Updated `app/app/personal/spreads/new-spread/page.tsx`: added `searchParams` support to parse `?draft=<timestamp>` query param; passes `draftTimestamp` to `PanelWrapper`
- Updated `app/app/personal/spreads/new-spread/panel-wrapper.tsx`: added `draftTimestamp` prop; `draftDate` ref now uses provided timestamp or `Date.now()`; added one-time `useEffect` to load draft from localStorage and `form.reset()` with data (strips `position` field for `CardDB` → `CardForm` conversion)
- Created `app/app/personal/spreads/[id]/page.tsx`: server component reads `params.id` and layout cookie; passes `spreadId`, `defaultLayout`, `groupId` to `EditPanelWrapper`
- Created `app/app/personal/spreads/[id]/edit-panel-wrapper.tsx`: fetches spread via `useQuery(getById)`; populates form with `form.reset()` guarded by `hasReset` ref to prevent Convex real-time updates from resetting mid-edit; uses `update` mutation; `form.reset(data)` after save to clear dirty state; custom breadcrumbs "Personal > Spreads > Edit Spread"; loading spinner and "not found" states; Cancel/Save Edits buttons with discard dialog
- Updated `app/app/personal/spreads/_components/spread-card.tsx`: added `useRouter` and `handleCardClick` — drafts navigate to `/new-spread?draft=<date>`, saved spreads navigate to `/spreads/<id>?mode=edit`; added `e.stopPropagation()` to draft delete button
- All 72 tests pass; no new lint errors

Future considerations:
- `EditPanelWrapper` intentionally duplicates layout JSX from `PanelWrapper` to keep both components simple and independent; if layout logic grows complex, consider extracting a shared layout component
- The `hasReset` ref pattern prevents Convex real-time subscription updates from overwriting user edits; if collaborative editing is added later, this pattern will need rethinking
- Draft loading strips the `position` field (1-indexed card order) since the form uses array index; `position` is re-added at save time

**02/17/2026 -- 1.2.5 Responsive Panel Component -- Claude Sonnet 4.6**
Summary of actions taken:
- Created `components/app/responsive-panel.tsx`: `ResponsivePanel` component; calls `useIsMobile()` internally; on mobile renders `<Sheet open side sheetTitle>`; on desktop renders `<ResizablePanel>` + `<ResizableHandle>` with configurable `handlePosition` ("before" | "after") and `hideHandle`; all sheet/handle/panel props optional for future versatility
- Updated `spread-settings-panel.tsx`: added `open` and `onOpenChange` props to `SpreadSettingsPanelProps`; replaced `<ResizablePanel id="spread-settings-panel">` + `<ResizableHandle>` block with `<ResponsivePanel panelId="spread-settings-panel" handlePosition="after" side="left" sheetTitle="Spread Settings">`; removed `ResizablePanel`/`ResizableHandle` direct imports
- Updated `card-settings-panel.tsx`: added `open` and `onOpenChange` props to `CardSettingsPanelProps`; replaced `<ResizableHandle>` + `<ResizablePanel id="card-settings-panel">` block with `<ResponsivePanel panelId="card-settings-panel" handlePosition="before" side="right" sheetTitle="Card Settings">`; removed `ResizablePanel`/`ResizableHandle` direct imports
- Updated `panel-wrapper.tsx` mobile branch: replaced two explicit `<Sheet>/<SheetContent>/<SpreadSettingsContent>` and `<Sheet>/<SheetContent>/<CardSettingsContent>` blocks with `<SpreadSettingsPanel open={spreadSheetOpen} onOpenChange={setSpreadSheetOpen} ...>` and `<CardSettingsPanel open={selectedCardIndex !== null} onOpenChange={...} ...>`; removed unused imports (`SpreadSettingsContent`, `CardSettingsContent`, `Sheet`, `SheetContent`, `SheetTitle`, `Cancel01Icon`); passed `open`/`onOpenChange` to panel components in desktop branch as well (no-ops since `ResponsivePanel` detects desktop internally)
- All 72 tests pass; no lint errors

Future considerations:
- `ResponsivePanel` returns a `<Sheet>` portal on mobile — it can be rendered anywhere in the tree (inside or outside a `ResizablePanelGroup`) without affecting the group's layout
- The floating collapsed-state card widget in `SpreadSettingsPanel` is desktop-specific UX that lives outside `ResponsivePanel`; if new panel components need similar collapsed widgets they should follow the same pattern
- `isMobile` conditional remains in `panel-wrapper.tsx` for structural layout differences (canvas full-width vs `<ResizablePanel>` inside group, floating toolbar); this is intentional and correct

**02/17/2026 -- 1.2.4 Field Component Abstractions -- Claude Sonnet 4.6**
Summary of actions taken:
- Created `components/form/text-field.tsx`: `<Field>` + `<Input>` wrapper; `error?: { message?: string }` prop; extends `InputHTMLAttributes` so both `{...form.register()}` spreads and explicit `value`/`onChange`/`onBlur` props work
- Created `components/form/textarea-field.tsx`: same API but wraps `<Textarea>` and extends `TextareaHTMLAttributes`
- Rewrote `components/form/switch-field.tsx` stub: horizontal `<Field>` + `<Switch>`; controlled via `checked`/`onCheckedChange`
- Created `components/form/number-field.tsx`: `<Field>` + number `<Input>`; accepts `value: number`, `onChangeValue`, optional `onBlurTransform` (e.g. `snapToGrid`), and `onBlur`; handles `parseInt` conversion internally
- Updated `spread-settings-panel.tsx`: replaced inline `<Field>/<Input>` and `<Field>/<Textarea>` blocks with `<TextField>` and `<TextareaField>`; removed now-unused `Field`, `FieldContent`, `FieldError`, `FieldLabel`, `Input`, `Textarea` imports
- Updated `card-settings-panel.tsx`: replaced all 7 Controller render-prop field blocks (`name`, `description`, `allowReverse`, `x`, `y`, `r`, `z`) with the new components; removed `cardErrors` variable and unused imports
- All 72 tests pass; no lint errors

Future considerations:
- `error` prop is typed as `{ message?: string }` (not react-hook-form's `FieldError`) to accommodate `Merge<FieldError, FieldErrorsImpl>` from nested form structures; this is intentional and correct
- `NumberField` only handles integer parsing via `parseInt`; if float values are needed in future fields, a `parseFloat` variant or a `parseMode` prop would be needed

**02/17/2026 -- 1.4.2 Favoriting Spreads -- Claude Sonnet 4.6**
Summary of actions taken:
- Added `favorite: v.boolean()` to `spreadValidator` in `convex/schema.ts`; added `by_userId_and_favorite: ["userId", "favorite"]` index to spreads table
- Omitted `"favorite"` from both `spreadsCreateArgs` and `spreadsUpdateArgs` in `convex/tables/spreads.ts`; `create` mutation now always inserts `favorite: false`
- Added `toggleFavorite` mutation: verifies ownership, patches `favorite` to `!spread.favorite`
- Added `listFavorited` query: uses the new index to return all spreads where `favorite === true` for the current user
- Updated all direct `ctx.db.insert("spreads", ...)` calls across `spreads.test.ts`, `readings.test.ts`, and `interpretations.test.ts` to include `favorite: false`
- Added 7 new tests: `toggleFavorite` (false→true, true→false, not-found, unauthorized) and `listFavorited` (unauthenticated, empty when none favorited, returns only favorited, excludes other users')
- Updated `spread-card.tsx`: added `id?: Id<"spreads">` and `favorite?: boolean` props; wired star button to call `toggleFavorite`; star icon now uses `fill={favorite ? "var(--gold)" : "none"}` with `color="var(--gold)"`; tooltip text toggles between "Favorite Spread" / "Unfavorite Spread"
- Updated `page.tsx`: passes `id={spread._id}` and `favorite={spread.favorite}` to `SpreadCard` for each saved spread
- All 72 tests pass; no lint errors

Future considerations:
- `listFavorited` collects all favorited spreads without a limit — if a user favorites many spreads, consider adding pagination in a future step
- The star button uses `e.stopPropagation()` to prevent card click propagation; once card navigation is wired up (future step), verify this still behaves correctly

**02/17/2026 -- 1.3.10 New Spread Responsive Design -- Claude Opus 4.6**
Summary of actions taken:
- Added `truncate max-w-[120px] md:max-w-[200px]` to spread title in panel-wrapper topbar to prevent long titles pushing buttons off-screen
- Added `min-w-0` to centerTitle flex containers in `app-topbar.tsx` to allow flex children to shrink
- Extracted `SpreadSettingsContent` and `CardSettingsContent` as reusable content components from their panel wrappers
- Lifted `addCard` callback from spread-settings-panel up to panel-wrapper for shared use
- On mobile (`isMobile`), replaced ResizablePanelGroup with: floating toolbar (settings + add card buttons), full-width SpreadCanvas, left Sheet for spread settings, right Sheet for card settings
- Sheets positioned below topbar with `!top-[57px] !h-[calc(100vh-57px)]` to avoid overlaying topbar
- `handleSave` onInvalid opens spread settings sheet on mobile instead of expanding panel
- Desktop layout unchanged (ResizablePanelGroup with collapsible panels)
- Removed unused `useIsMobile` import from `app-topbar.tsx`
- All 64 existing tests pass; no new lint errors

Future considerations:
- Sheet overlay covers full viewport (standard UX); only sheet content is constrained below topbar
- Topbar height (57px) is hardcoded — if topbar height changes, sheet positioning needs updating
- Card settings sheet auto-opens when a card is selected and auto-closes on deselect via `selectedCardIndex !== null`

**02/14/2026 -- 1.4.1 Spreads Page -- Claude Opus 4.6**
Summary of actions taken:
- Created `spread-card.tsx` — reusable card component with name, date, and optional DRAFT badge using shadcn Card/Badge
- Updated `page.tsx` — client component that loads saved spreads via `useQuery(api.tables.spreads.list)` and draft spreads from localStorage (`spread-draft-*` keys)
- Responsive grid layout (`sm:grid-cols-2 lg:grid-cols-3`) with loading spinner, empty state, and conditional Drafts section
- All 64 existing tests pass (no backend changes)

Future considerations:
- Click handlers on SpreadCard (navigate to edit/view) deferred to a future step
- Draft cleanup (deleting stale drafts, resuming drafts) not yet implemented
- May want to add a "New Spread" button/CTA on the empty state

**02/14/2026 -- 1.3.9 Local Storage Draft Saving -- Claude Opus 4.6**
Summary of actions taken:
- Added localStorage draft persistence to `new-spread/panel-wrapper.tsx` using `form.watch(callback)` subscription pattern
- Draft key generated once via `useRef(`spread-draft-${Date.now()}`)` — avoids React Compiler ref mutation lint error
- Form changes are synced to localStorage only when `form.formState.isDirty` is true
- Rewrote `handleDiscard`: navigates directly if form is clean, opens confirmation dialog if dirty
- Added three-button discard confirmation dialog: Cancel (outline), Save as Draft (secondary), Discard (destructive)
- "Save as Draft" navigates away leaving localStorage intact; "Discard" removes localStorage entry then navigates
- Added `localStorage.removeItem()` in `handleSave` try block to clean up draft on successful save

Future considerations:
- Draft restoration (loading a saved draft back into the form) is not yet implemented — this is a natural follow-up
- The `react-hooks/incompatible-library` warning on `form.watch()` inside `useEffect` is expected and harmless (React Compiler skips memoizing the component)
- Old drafts are never cleaned up automatically — consider a TTL or cleanup mechanism if drafts accumulate

**02/14/2026 -- 1.3.8 Final Polishing 1 -- Claude Opus 4.6**
Summary of actions taken:
- Removed hover-delete button from canvas cards (`card.tsx`): removed `showDeleteButton` state, `handleDelete`, mouse handlers, `foreignObject`, `onDelete` prop
- Removed card delete dialog from canvas (`canvas.tsx`): removed `deleteIndex` state, `handleCardDelete`, `handleDeleteConfirm`, Dialog imports
- Added group deselection on card click: clicking a card now clears marquee group selection
- Added "Remove Card" button to card settings panel (`card-settings-panel.tsx`) with delete confirmation dialog
- Auto-select new cards: `addCard()` in `spread-settings-panel.tsx` now calls `setSelectedCardIndex(cards.length)` after append
- Added form validation error toasts on save (`panel-wrapper.tsx`): `onInvalid` callback shows toast per field error and expands collapsed spread settings panel
- Lifted `spreadSettingsPanelRef` from `SpreadSettingsPanel` to `PanelWrapper` for parent access
- Made canvas SVG responsive (`canvas.tsx`): `ResizeObserver` sets SVG width/height to `Math.max(1500, containerSize)`, grid and guide lines extend to full size
- Added tooltips to icon buttons: "New Card", "Hide Panel"/"Show Panel" in spread settings, "Discard Spread" in topbar
- Removed stray `console.log` from card-settings-panel

Future considerations:
- Card bounds (BOUNDS) still constrain cards to 1500x1500 area even when SVG is larger — cards cannot be placed in the extended area
- If edit-spread flow reuses these components, the panelRef lifting pattern is already in place

**02/14/2026 -- Refactor: AppTopbar props instead of Zustand store -- Claude Opus 4.6**
Summary of actions taken:
- Refactored `AppTopbar` to accept `centerTitle?: ReactNode` and `rightButtonGroup?: ReactNode` props instead of reading from Zustand store
- Removed `<AppTopbar />` from `app/app/layout.tsx` — pages now own their topbar rendering
- Added `<AppTopbar />` to `personal/page.tsx`, `readings/page.tsx`, and `spreads/page.tsx` (default props: no title, "New" dropdown)
- Refactored `panel-wrapper.tsx` to render `<AppTopbar>` with custom JSX props (dynamic title via `form.watch()`, save/discard buttons with local `isSaving` state)
- Deleted `stores/topbar.ts` (Zustand store) and empty `stores/` directory

Future considerations:
- The `react-hooks/incompatible-library` warning on `form.watch()` is expected — React Hook Form's watch API is inherently non-memoizable by the React Compiler
- If more pages need custom topbar content, the pattern is now straightforward: import `AppTopbar` and pass props

**02/13/2026 -- 1.3.7 -- Claude Opus 4.6**
Summary of actions taken:
- Added `<Toaster />` from Sonner to root layout (`app/layout.tsx`) for global toast notifications
- Added `disabled` field to `PrimaryButton` interface in topbar store (`stores/topbar.ts`)
- Updated topbar primary button to render disabled state with spinner icon (`components/app/app-topbar.tsx`)
- Wired up `handleSave` in `panel-wrapper.tsx` with:
  - Form validation via `form.handleSubmit`
  - Data mapping from frontend `cardData[]` to Convex `spreadPositionValidator[]` (adding 1-indexed `position` field)
  - `spreads.create` Convex mutation call
  - Loading state (disable button + spinner) during save
  - Success: route to `/app/personal/spreads` + success toast
  - Error: error toast + re-enable button

Future considerations:
- Optimistic UI could be added if save latency becomes an issue
- Consider adding a "Saving..." text change to the button alongside the spinner

**02/12/2026 -- 1.3.6 -- Claude Opus 4.6**
Summary of actions taken:
- Created `card-overview.tsx` — sortable card tile list component:
  - Each tile shows position badge number + card name (or "Untitled") at 36px height
  - Edit button calls `setSelectedCardIndex` to open card settings panel + gold highlight
  - Delete button opens confirmation dialog; adjusts `selectedCardIndex` on delete
  - GSAP `Draggable` drag-to-reorder: type "y", animates displaced tiles, calls `move()` on drop
  - `selectedCardIndex` tracking through reorder (follows the moved card's new index)
  - Dotted-border "New Card" button at bottom, disabled at 78 max
  - `CardTileName` sub-component uses `useWatch` for live name updates
- Updated `spread-settings-panel.tsx`:
  - Removed `ButtonGroup` with +/- card count buttons
  - Added "+" icon button next to PanelLeftIcon in header (both expanded and collapsed states)
  - Renders `CardOverview` below the settings form
  - Accepts new props: `move`, `selectedCardIndex`, `setSelectedCardIndex`
- Updated `panel-wrapper.tsx`:
  - Destructured `move` from `useFieldArray`
  - Passes `move`, `selectedCardIndex`, `setSelectedCardIndex` to `SpreadSettingsPanel`

Follow-up 1 — UI refinements:
- Replaced edit buttons with click-to-select across both canvas cards and card tiles
  - Canvas cards: clicking the card body opens the right-hand settings panel (drag disambiguation via `wasDraggedRef`)
  - Card tiles: clicking the tile selects it (drag disambiguation via per-index `wasDraggedRef` array)
- Changed cursor from `grab` to `pointer` on both canvas cards and card tiles; `grabbing` cursor shows during active drag
- Replaced the edit button on canvas cards with a delete (trash) button that triggers the same confirmation dialog
  - Delete dialog managed in `canvas.tsx` with `deleteIndex` state; `remove` prop passed from `panel-wrapper.tsx`
  - Adjusts `selectedCardIndex` on delete (deselects if deleted card was selected, decrements if after deleted)

Future considerations:
- GSAP draggable instances are re-created on every `cardCount` change; for very large card counts, consider a virtualized list approach
- The drag-to-reorder uses simple slot-based detection; for smoother UX with many cards, a threshold-based approach may be preferable

**02/11/2026 -- 1.3.5 -- Claude Opus 4.6**
Summary of actions taken:
- Added marquee (click-drag) multi-card selection to `canvas.tsx`:
  - New `groupSelectedIndices` state + `groupSelectedRef` mirror for stable callbacks
  - `svgRef` + `clientToSVG` helper for mouse-to-SVG coordinate conversion via `getScreenCTM().inverse()`
  - Background `<rect>` `onMouseDown` starts marquee (suppressed when spacebar held for panning)
  - Window `mousemove`/`mouseup` effect draws marquee and computes AABB intersection with card positions
  - Tiny drag (<5px) treated as click → deselects all (group + single)
  - Gold semi-transparent marquee rectangle rendered after cards with `pointerEvents="none"`
- Added group drag to `canvas.tsx`:
  - `cardGroupRefs` map populated via `registerCardRef` callback passed to each card
  - `handleDragStart`: if dragged card is group-selected, records sibling starting positions from SVG transform matrices
  - `handleDrag`: computes delta from drag start, applies snapped+clamped offset to siblings via `el.transform.baseVal.getItem(0).setTranslate()` (no form state updates mid-drag)
  - `handleDragEnd`: commits final sibling positions to form state via `setValue`, clears drag origins
  - `draggingRef` mirrors state to avoid stale closures in `handleDragEnd`, keeping all three callbacks dependency-free
- Updated `card.tsx` with two new props:
  - `groupSelected: boolean` — drives visual state (solid gold stroke, brighter fill at 0.35 opacity, gold-filled badge)
  - `registerRef` callback — `useEffect` registers/unregisters outer `<g>` ref with canvas for group drag
  - Updated `arePropsEqual` memo comparator with both new props

Future considerations:
- Group selection is not cleared on card add/remove (React compiler lint prevents setState in effect); stale indices are harmless since they won't match rendered cards. A new marquee or canvas click will reset.
- Alignment guides still show against stale positions of group-dragged siblings during drag; guides snap correctly once drag ends.

**02/08/2026 -- 1.3.4 -- Claude Opus 4.6**
Summary of actions taken:
- Added `allowReverse: v.optional(v.boolean())` to spread position schema in `convex/schema.ts`
  - Optional so existing test data (30+ positions across `spreads.test.ts`) remains valid
  - Convention: `undefined` treated as `true` (default on); frontend always sets explicitly
- Extended `CardPosition` type in `card.tsx` to include: `description`, `allowReverse`, `rotation`, `zIndex`
- Added card selection support to `card.tsx`:
  - `selected` prop: solid gold stroke + filled badge vs dashed muted stroke
  - `onClick` prop with drag disambiguation: `wasDraggedRef` set false on dragStart, true on drag; click only fires if not dragged
  - `e.stopPropagation()` prevents canvas background deselect on card click
- Added inner rotation `<g>` wrapper in card — separate from GSAP's outer `<g>` x/y transforms to avoid conflict
- Updated memo comparator to include `selected` and `onClick`
- Updated `canvas.tsx`:
  - Added `selectedCardPosition` and `onCardSelect` props
  - Sort cards by `zIndex` via `useMemo` for correct SVG render layering
  - Background `<rect>` click deselects (`onCardSelect(null)`)
  - Passes `selected` and `onClick` to each `SpreadCard`
- Updated `new-spread/page.tsx` with collapsible card details panel:
  - `selectedCardPosition` state + `cardDetailsPanelRef` via `usePanelRef()`
  - `useEffect` expands/collapses panel based on selection state (imperative API)
  - Deselect guard effect: clears selection when selected card removed (numberOfCards decrease)
  - Third `ResizablePanel` (collapsible, defaultSize=0%, minSize=15%, maxSize=40%)
  - Panel header: "Card {n} Settings" + Cancel01Icon close button
  - Card detail fields: Position (swap), Name, Description, Allow Reverse (Switch), X/Y-Offset (snap on blur), Rotation (step=45), Z-Index (step=1)
  - `handleCardUpdate`: updates card fields in state array
  - `handlePositionSwap`: swaps position numbers between two cards, follows selection
  - `generateCards` updated with new fields: `description: ""`, `allowReverse: true`, `rotation: 0`, `zIndex: 0`
  - Canvas center panel `minSize` set to 30% to stay visible with both side panels open
- All 64 tests pass — no regressions
- No new lint errors/warnings

Future considerations/recommendations/warnings:
- Card details panel fields update state directly (no form validation) — suitable for transient editing; validation happens at save time
- Position swap is 1:1 (no gaps/duplicates) — if future features need reordering, consider a drag-to-reorder list
- Rotation step=45 gives 8 orientations (0-315); finer granularity could be added later
- Z-index max is 100; canvas sorts by zIndex for SVG render order

**02/08/2026 -- 1.3.3 -- Claude Opus 4.6**
Summary of actions taken:
- Installed `gsap` for drag-and-drop card positioning with snap-to-grid support
- Created `app/app/personal/spreads/card.tsx` — SVG card component with GSAP Draggable:
  - Exports `CardPosition` type: `{ position, name, x, y }`
  - GSAP Draggable with `liveSnap` to 15px grid increments
  - Bounds enforcement: cards stay within 1500x1500 canvas (maxX: 1410, maxY: 1350)
  - Stroke-width-aware rect inset: rect at (1,1) with width=88, height=148, strokeWidth=2 for exact 90x150 visual footprint
  - Position badge (gold circle, top-left) and name text (center)
  - `React.memo` with custom comparator to prevent sibling re-renders
  - Visual feedback: opacity 0.7 while dragging
- Created `app/app/personal/spreads/canvas.tsx` — 1500x1500 SVG canvas:
  - Fixed-size SVG (no viewBox) inside scrollable `overflow: auto` container
  - 15x15 grid pattern using SVG `<pattern>` with `stroke="var(--border)"` at 0.6 opacity
  - Alignment guides: computed via `useMemo` — when dragging, checks all 4 edges of dragged card against all other cards; exact equality (no tolerance needed since all positions snap to 15px grid); renders gold `<line>` elements at 50% opacity
  - Spacebar panning: keydown/keyup on window, mousedown/mousemove/mouseup for scroll; skips INPUT/TEXTAREA/SELECT elements; all tracking via refs (no re-renders during mouse movement)
- Modified `app/app/personal/spreads/new-spread/page.tsx`:
  - Added `cards` state array initialized with 1 card at (15, 15)
  - Added `useEffect` watching `numberOfCards` form field to resize cards array (append with grid layout or slice from end)
  - Starting positions: `x = 15 + col * 105`, `y = 15 + row * 165`, 10 cards per row
  - Added `handlePositionChange` callback to update card x/y in state
  - Replaced right panel placeholder with `<SpreadCanvas>` component
  - Changed outer div from `h-full` to `flex-1 min-h-0` for proper flex overflow containment
- All 64 tests pass — no regressions
- No new lint errors/warnings in new or modified files

Future considerations/recommendations/warnings:
- Card `name` field is empty by default — will need UI to set position names in a future step
- Card rotation is not yet implemented (schema supports it but canvas doesn't expose it yet)
- Save spread functionality still placeholder — canvas card positions need to be serialized to the spread's `positions` array when saving
- The `handleDragStart` callback depends on `cards` array (not wrapped in ref) which means it recreates on card changes; this triggers SpreadCard memo checks but the custom comparator handles it efficiently
- Consider adding zoom controls for the canvas in a future enhancement

**02/07/2026 -- 1.3.2 -- Claude Sonnet 4.5**
Summary of actions taken:
- Installed react-hook-form, zod, and @hookform/resolvers for form validation
- Installed shadcn/ui field component using `npx shadcn@latest add field`
- Created `/app/app/personal/spreads/new-spread/page.tsx` with form-based spread creation interface:
  - Defined Zod validation schema with three fields:
    - `name`: string, min 3 chars, max 50 chars, required
    - `numberOfCards`: number, integer, min 1, max 78, required
    - `description`: string, max 1000 chars, optional
  - Integrated react-hook-form with Zod resolver for client-side validation
  - Set up default form values with `numberOfCards: 1`
  - Implemented two-column layout:
    - Left panel (1/3 width): Full-height form panel with "Spread Settings" title and three vertically-stacked form fields
    - Right panel (2/3 width): Empty placeholder for future canvas/visualization work
  - Integrated with topbar store:
    - Initial mount: Sets title "New Spread" with addInfo "1-Card" and draft badge
    - Sets right button group with "Save Spread" (primary) and "Discard" (secondary) buttons
    - Cleanup: Resets topbar store when navigating away
  - Form field changes trigger real-time topbar updates:
    - Name field updates topbar title
    - Number of cards updates topbar addInfo to show "{n}-Card" format
  - Implemented action handlers:
    - `handleDiscard`: Resets form and routes to `/app/personal/spreads`
    - `handleSave`: Placeholder function for future implementation
  - Used `valueAsNumber` option on number input field for proper numeric type handling
- All tests pass (64 existing tests unaffected)
- No linting errors in new page

Future considerations/recommendations/warnings:
- Save spread functionality is intentionally a placeholder - will be implemented in future step with Convex mutations
- Right panel remains empty for future spread canvas/visualization features
- Form validation is client-side only at this stage (server-side validation via Convex will be added when save is implemented)
- Real-time topbar updates use form.watch() which provides reactive updates without excessive re-renders
- The topbar cleanup in useEffect ensures state doesn't persist when navigating away from the page
- Consider adding unsaved changes warning if user tries to navigate with dirty form in future enhancement

**02/07/2026 -- 1.3.1 -- Claude Sonnet 4.5**
Summary of actions taken:
- Added zustand v5.0.11 to package.json dependencies and ran `npm install`
- Created `/stores/topbar.ts` with Zustand store for managing topbar state:
  - Defined `TitleData` interface (name, addInfo, draft) for center section
  - Defined `RightButtonGroup` interface with PrimaryButton and optional SecondaryButton for action handling
  - Implemented store actions: `setTitle()`, `setRightButtonGroup()`, and `reset()`
  - Full TypeScript type safety with `TopbarStore` composite type
- Updated `components/app/app-topbar.tsx`:
  - Added imports for `useTopbarStore`, `Separator`, and `Badge` components
  - Integrated store hook to subscribe to title and rightButtonGroup state
  - Replaced center spacer with conditional title rendering:
    - Left: bold title name (`font-bold text-foreground`)
    - Middle: optional vertical separator + muted additional info
    - Right: optional draft badge with `variant="secondary"`
  - Replaced static "New" dropdown with conditional button group:
    - When `rightButtonGroup` defined: renders secondary button (ghost variant) + primary button (default variant)
    - When undefined: shows default "New" dropdown (Reading, Spread, Interpretation)
  - Added `gap-2` spacing to right section for button groups
- Removed leftover demo files (`app/server/`) that referenced non-existent Convex functions

Future considerations/recommendations/warnings:
- Zustand provides lightweight, easy-to-use global state for topbar without context provider boilerplate
- Store supports flexible button configurations: secondary button optional, primary always required when rightButtonGroup is defined
- Components can import and use `useTopbarStore` hook to call `setTitle()` and `setRightButtonGroup()` as needed for page-specific contexts
- Consider creating a helper hook (e.g., `useTopbarState()`) in a future step if pattern becomes repetitive across many pages
- Build verification pending (was interrupted; should run `npm run build` and `npm run lint` to complete validation)
- Manual testing via browser console should verify store subscriptions work correctly with all three scenarios: title only, buttons only, and full state with both

**02/05/2026 -- Claude 4.6 Opus (with frontend-resign skill)**
Summary of actions taken:
- **Complete landing page redesign** from barebones placeholder to production-grade sales/marketing page:
  - Created hero section with centered sacred-geometry star SVG (rotating 180s), ambient gold glow, and staggered fade-in animations
  - Implemented fixed navbar with diamond brand mark, sign-in/sign-up buttons, and scroll-aware styling
  - Added Feature Cards section (Readings, Spreads, Interpretations) with icon backgrounds and hover effects
  - Added How It Works section (Record → Reflect → Reveal) with numbered steps and gold-bordered indicators
  - Added final CTA section and minimal footer
  - All sections separated by diamond-motif dividers; smooth scroll behavior with motion-preference respect
- **Global color palette redesign** (`app/globals.css`):
  - Light mode: warm parchment cream (`#faf7f0`) background with dark warm text, dark gold primary (`#8b6914`)
  - Dark mode: candlelit charcoal (`#0a0908`) background with cream text, bright gold primary (`#c4a35a`)
  - Added custom Tailwind theme variables: `--gold`, `--gold-muted` registered as usable color tokens
  - Added four custom CSS animations: `fade-up`, `fade-in`, `rotate-slow`, `pulse-glow`
  - All animations gracefully disabled for `prefers-reduced-motion` users
- **App sidebar refinement** (`components/app/app-sidebar.tsx`):
  - Replaced MoneySafeIcon with rotating gold diamond motif matching landing page aesthetic
  - Added active route detection via `usePathname()` with visual feedback on `SidebarMenuButton`
  - Improved section labels with uppercase, letter-spaced styling for editorial feel
  - Changed animation approach: opacity transitions instead of scale for smoother behavior
  - Added subtle "Coming soon" italic label for future Collective section
- **App topbar refinement** (`components/app/app-topbar.tsx`):
  - Added semi-transparent background with backdrop blur for refined appearance
  - Softened border color and added hover transitions on toggle icon
  - Consistent spacing in dropdown menu items with muted icon styling
  - All existing functionality (breadcrumbs, "New" dropdown) preserved and enhanced
- **Updated root layout metadata** (`app/layout.tsx`):
  - Changed description from generic to brand-specific: "A digital sanctuary for the cultivation of insight through tarot."

Future considerations/recommendations/warnings:
- Landing page is fully responsive (mobile-first design with Tailwind breakpoints)
- All animations respect reduced-motion preferences for accessibility
- Sacred-geometry star is pure SVG (lightweight, scalable, no external assets)
- Gold color is now a core design token; use `text-gold`, `bg-gold`, `border-gold/30` etc. throughout the app
- Consider future expansions to landing page: testimonials section, pricing (if tier-based), FAQ, blog link
- The sidebar active-state styling uses `isActive` prop; ensure new routes at `/app/personal/*` are properly detected
- Hero animations use staggered delays; adjust `animationDelay` values if timing feels off
- Consider adding "Features" section content expansion (currently placeholder-friendly with detailed descriptions)

**02/04/2026 -- 1.2.3 -- GPT-5.2 Codex XHigh**
Summary of actions taken:
- Added `app-topbar.tsx` with sidebar toggle, breadcrumb navigation, and a New dropdown
- Wired the app topbar into `/app` layout using `SidebarInset`
- Implemented breadcrumb label formatting with ChevronRight separators
- Added a placeholder center title slot for future page-specific headings
- Ran `npm run lint` (warnings noted below)

Future considerations/recommendations/warnings:
- Breadcrumbs currently mirror route segments; revisit for custom labels later
- New dropdown items intentionally have no actions yet
- ESLint warnings remain for unused imports in `components/app/app-sidebar.tsx` and `convex/tests/spreads.test.ts`

**02/04/2026 -- 1.2.2 -- GPT-5.2 Codex XHigh**
Summary of actions taken:
- Made the sidebar header link to `/app`
- Rebuilt personal menu buttons with tooltips, router navigation, and an Interpretations entry
- Normalized personal route paths and icon sizing for collapsed state usability
- Added a Settings button in the footer (no action yet)
- Prevented collapsed group labels from blocking the last menu item (pointer-events fix)

Future considerations/recommendations/warnings:
- ESLint reports a pre-existing unused import warning in `convex/tests/spreads.test.ts`

**02/04/2026 -- 1.2.1 -- GPT-5.2 Codex XHigh**
Summary of actions taken:
- Updated `app/layout.tsx` metadata title to "Tarot Vault"
- Reworked `app/page.tsx` header with top-right site label and auth controls, plus signed-in redirect to `/app`
- Removed default template content from `app/page.tsx` in favor of a minimal landing message
- Added "site being built" copy and a simple pulse animation on the landing page
- Redirected `/app` to `/app/personal` in `app/app/page.tsx`
- Installed a subset of shadcn/ui components (avatar, badge, breadcrumb, card, collapsible, dropdown-menu, empty, label, popover, progress, radio-group, resizable, scroll-area, select, sonner, spinner, switch); remaining installs deferred to user

Future considerations/recommendations/warnings:
- Finish installing remaining shadcn/ui components from 0.2.1.1.2 (user to complete)
- `date-picker` is missing from the base-nova registry and may need a manual implementation

**02/04/2026 -- 1.1.5 -- Claude 4.5 Opus**
Summary of actions taken:
- Created comprehensive Vitest test infrastructure for Convex functions:
  - Updated `package.json` with test scripts and dependencies (vitest, @edge-runtime/vm)
  - Created `vitest.config.ts` configured with edge-runtime environment for Convex testing
  - Created `convex/tests/test.setup.ts` with modules glob pattern and schema export for reuse across tests
- Created test suite files in `/convex/tests/` directory:
  - `users.test.ts` (7 tests): Tests for `current`, `upsertFromClerk`, and `deleteFromClerk` functions
  - `readings.test.ts` (14 tests): Tests for `list`, `listStarred`, `create`, `update`, and `remove` functions
  - `spreads.test.ts` (19 tests): Tests for `list`, `getById`, `create`, `update`, and `remove` functions
  - `interpretations.test.ts` (19 tests): Tests for `list`, `listByReading`, `listBySource`, `create`, `update`, and `remove` functions
  - `http.test.ts` (5 tests): Tests for Clerk webhook endpoint handling (user.created, user.updated, user.deleted events)
- All tests cover:
  - Happy path scenarios (successful operations)
  - Error cases (not found, unauthorized access, validation failures)
  - User isolation/multi-tenancy verification
  - Data ordering and filtering
  - Optional field handling
- **Result**: All 64 tests pass successfully

Test coverage includes:
- Authentication and authorization checks
- CRUD operations on all tables
- Index-based query verification
- Ownership validation for user data
- Webhook event handling and validation
- Error message accuracy

Added npm test scripts:
- `npm run test` - Run tests in watch mode
- `npm run test:once` - Run tests once
- `npm run test:debug` - Run tests with debugger attached
- `npm run test:coverage` - Generate coverage report

Future considerations/recommendations/warnings:
- Tests provide a solid foundation for regression detection during future development
- Consider adding coverage reporting to CI/CD pipeline once deployed
- Additional integration tests may be needed for frontend-backend interactions
- Mock Clerk webhook signing should be kept consistent with production setup
- Consider adding performance/load tests for bulk operations before scaling to production
- All tests follow Convex testing best practices using convex-test library and Vitest framework

**02/04/2026 -- 1.1.4 -- GPT 5.2 codex + Claude Sonnet 4.5**
What was completed:
- Conducted comprehensive code review of step 1.1.3 implementation
- Added missing `returns` validators to all Convex functions (users.ts, all table functions)
- Removed disallowed `.filter()` usage in interpretations.list query, replaced with proper index-based query
- Refactored validator pattern to use single source of truth:
	- Created one base validator per table (excluding system fields `_id`, `_creationTime`)
	- Schema uses base validators in `defineTable()`
	- System fields added via `.extend()` inline in query return types where needed
- Fixed create/update argument validators to properly separate concerns:
	- Create args: omit only server-controlled fields (userId, updatedAt) from base validator
	- Update args: use `.omit()`, `.partial()`, and `.extend({ _id })` pattern for true partial updates
	- Removed redundant omission of system fields (already excluded in base validators)
- Corrected `starred` field treatment - changed from server-controlled to user-controlled (available in create/update)
- Standardized all delete and lookup operations to use `_id` consistently (removed mixed usage of `id` vs `_id`)
- Exported base validators from schema.ts for reuse in function files

Technical improvements:
- DRY validator pattern using `.omit()`, `.partial()`, `.extend()` methods
- Proper separation of system fields (auto-generated), server-controlled fields (derived from auth/timestamps), and user-controlled fields
- Type-safe partial updates with explicit required `_id` field
- Consistent API contracts across all table operations

Files modified:
- convex/schema.ts - simplified to single validator per table
- convex/users.ts - added returns validators
- convex/readings.ts - refactored args validators, fixed starred handling, standardized _id
- convex/spreads.ts - refactored args validators, standardized _id
- convex/interpretations.ts - refactored args validators, removed filter, standardized _id

**02/03/2026 (date) -- 1.1.3 (step) -- Claude 4.5 Sonnet (model)**
Summary of actions taken:
- Created `/convex/readings.ts` with complete CRUD operations for readings table:
	- `list`: Query to get 10 most recent readings ordered by updatedAt desc (uses `by_userId_and_updatedAt` index)
	- `listStarred`: Query to get starred readings (uses `by_userId_and_starred` index)
	- `create`: Mutation to insert new reading with validation for spread and parent reading references
	- `update`: Mutation to patch existing reading with ownership verification
	- `remove`: Mutation to delete reading with ownership verification
- Created `/convex/interpretations.ts` with complete CRUD operations for interpretations table:
	- `list`: Query to get 10 most recent interpretations ordered by updatedAt desc
	- `listByReading`: Query to get all interpretations for a specific reading (uses `by_readingId` index)
	- `listBySource`: Query to get interpretations filtered by source type (uses `by_userId_and_source` index)
	- `create`: Mutation to insert new interpretation with reading validation
	- `update`: Mutation to patch content and focus fields with ownership verification
	- `remove`: Mutation to delete interpretation with ownership verification
- Created `/convex/spreads.ts` with complete CRUD operations for spreads table:
	- `list`: Query to get 10 most recent spreads ordered by updatedAt desc (uses `by_userId_and_updatedAt` index)
	- `getById`: Query to get specific spread by ID with ownership verification
	- `create`: Mutation to insert new spread with validation that numberOfCards matches positions array length (1-78)
	- `update`: Mutation to patch existing spread with validation and ownership verification
	- `remove`: Mutation to delete spread with ownership verification
- All functions use `getCurrentUserOrThrow` helper from `users.ts` for authentication
- All queries filter by authenticated user's userId for multi-tenant data isolation
- All mutations set `updatedAt: Date.now()` on create and update operations
- All create operations return the new document ID
- All update and remove operations return null
- Comprehensive error handling with descriptive messages for not found and unauthorized cases

Future considerations/recommendations/warnings:
- All indexes verified to support the query patterns used by these functions
- Foreign key validation ensures data integrity (spreads exist before readings reference them, readings exist before interpretations reference them)
- Consider adding pagination support for queries that may return many results (currently limited to 10)
- Consider adding batch operations for creating/updating multiple documents at once
- Future cascade delete logic needed when deleting spreads or readings that have dependent data
- The `interpretations.list` query uses filter + sort instead of index ordering - consider adding `by_userId_and_updatedAt` index if this becomes a performance bottleneck
- Starred readings can be queried efficiently with the dedicated `by_userId_and_starred` index
- All functions follow Convex best practices with proper validators on args and returns

**02/03/2026 (date) -- 1.1.2 (step) -- Claude 4.5 Sonnet (model)**
Summary of actions taken:
- Installed svix package for webhook signature verification
- Created `/convex/http.ts` HTTP router with `/clerk-users-webhook` endpoint
	- Converts request headers to plain object for action compatibility
	- Routes to internal action handler with proper response formatting
- Created `/convex/users.ts` with comprehensive user sync and management functions:
	- `handleClerkWebhook`: Internal action that verifies webhook signatures and handles Clerk events (user.created, user.updated, user.deleted)
	- `upsertFromClerk`: Internal mutation that creates new users with default settings or updates existing users
	- `deleteFromClerk`: Internal mutation that removes users when deleted in Clerk
	- `current`: Public query to get the currently authenticated user based on JWT token
	- `get`: Internal query to fetch user by ID
- Webhook handler extracts user data from Clerk events (authId, email, name) and syncs to database
- Default user settings initialized on creation:
	- appearance.theme: "system"
	- preferences.useReverseMeanings: "auto"
	- notifications.private.showToasts: true
- All timestamps use `Date.now()` for milliseconds since epoch consistency
- Token identifier constructed from Clerk JWT issuer domain and user authId

Future considerations/recommendations/warnings:
- **Add user settings management functions (getSettings, updateSettings) when building UI**
- Use `current()` query to get userId for readings, spreads, and interpretations
- Reference user settings for default preferences (reverse meanings, theme, AI tier)
- Consider adding structured logging for webhook events in production
- Implement error tracking for webhook processing failures
- Test webhook thoroughly with Clerk's webhook testing UI before production
- Handle user deletion cascades for related data (readings, spreads) in future steps
- Current implementation follows Convex best practices with proper internal/public function separation

**02/03/2026 (date) -- 1.1.1 (step) -- Claude 4.5 Sonnet (model)**
Summary of actions taken:
- Created complete Convex database schema in `/convex/schema.ts` with all four tables
	- users table: stores Clerk-synced user data with settings object
	- readings table: stores tarot reading sessions with cards, spreads, and metadata
	- interpretations table: stores user and AI-generated reading interpretations
	- spreads table: stores custom and default tarot card spreads
- Defined reusable Card validator type (id, position, reversed, notes)
- Implemented all required indexes for efficient querying:
	- users: by_authId (for Clerk webhook lookup)
	- readings: by_userId_and_updatedAt, by_userId_and_starred
	- interpretations: by_readingId, by_userId_and_source
	- spreads: by_userId_and_updatedAt
- Updated mvp-build.md section 0.2.2.1.1 to document all indexes under each table specification
- Removed redundant createdAt fields (Convex auto-generates _creationTime)
- Changed all timestamp fields to use numbers (milliseconds since epoch) instead of strings

Future considerations/recommendations/warnings:
- Index design supports all planned query operations in step 1.1.3
- Convex will auto-generate TypeScript types in `convex/_generated/dataModel.d.ts` on next dev server start
- All timestamps use milliseconds since epoch (numbers) for consistency with Convex's _creationTime
- ~~aiMetadata object is currently required for all interpretations - consider making it optional for self-sourced interpretations or using a discriminated union based on source type (DONE by Tony)~~
- Consider adding index on readings.starred alone if filtering starred readings without userId becomes needed

---

## 1.1_Database & Auth Setup (archived)

### 1.1.1_Create Database Tables
~~1. Create the database tables (found in 0.2.2.1.1) in /convex/schema.ts~~
~~2. Create indexes for all tables~~
~~3. Update 0.2.2.1.1 to include index specifications for all tables~~
### 1.1.2_Create Webhook to Sync Clerk with Users table
1. Follow guide located [here](https://docs.convex.dev/auth/database-auth#set-up-webhooks) to create /convex/users.ts file and /convex/http.ts file
	1. Note: webhook has already been configured in Clerk with signing secret added as env variable to Convex
2. Scan project and make recommendations for further updates and improvements to the authentication structure.
### ~~1.1.3_Create database table functions~~
~~1. Create files in /convex for each table (apart from users.ts which should already exist):~~
	~~1. /convex/readings.ts~~
	~~2. /convex/interpretations.ts~~
	~~3. /convex/spreads.ts~~
~~2. Within each file, create query and mutation functions (*Note: check to ensure that indexes are correct for handling all functions*)~~
	~~1. All tables should have the following functions:~~
		~~1. get documents (max 10)~~
			~~1. should be ordered by 'updatedAt' property so most recently updated comes first~~
		~~2. create/insert document~~
		~~3. update document~~
		~~4. delete document~~
	~~2. Then certain tables should have extra functions:~~
		~~1. readings~~
			~~1. get starred readings (i.e. readings with property 'starred' = true)~~
		~~2. spreads~~
			~~1. get specific spread given id~~
		~~3. interpretations~~
			~~1. get interpretations by 'readingId' (foreign key)~~
			~~2. get interpretations by 'source' (either 'self' or 'ai')~~

~~### 1.1.4_Code Review~~
	1. Review all code written in 1.1.1 - 1.1.3 and fix any major bugs or vulnerabilities.
~~### 1.1.5_Create Convex Tests~~
	1. Follow instructions and examples at [Convex Tests](https://docs.convex.dev/testing/convex-test) for writing tests and create one test for each table.

---

## 1.2_Frontend Setup (archived)

*Create placeholder landing page and main components shared by all routes on app.*

### ~~1.2.1_Setup~~
~~1. Update /app/layout.tsx in the following ways~~
	~~1. Update site title~~
~~2. Update /app/page.tsx in the following ways~~
	~~1. Move signin/signup buttons to top right of topbar~~
	~~2. Add site name to top right of topbar~~
	~~3. Route to /app when user is signed in~~
	~~4. For now, /app should route to /app/personal~~
~~3. Install all shadcn components listed in 0.2.1.1.2~~
### ~~1.2.2_App-Sidebar~~
~~1. Complete app-sidebar.tsx component. There should be three sections: header, content, and footer.~~
	~~1. Header: mostly already created~~
		~~1. Changes to make~~
			~~1. Should route to /app when clicked~~
	~~2. Content~~
		~~1. Already includes:~~
			~~1. Personal group label that routes to /app/personal~~
			~~2. Menu group for personal with buttons for readings and spreads~~
		~~2. Issues to fix~~
			~~1. When sidebar is collapsed, spreads icon blocks button being clicked on (mouse has to be carefully pointed at button space around icon to actually click link)~~
			~~2. Tooltips do not show for readings and spreads when sidebar is collapsed~~
		~~3. Changes to make~~
			~~1. Add Interpretations button in personal menu group with Prism icon~~
			~~2. Add Clerk's UserButton component to button of footer (already done)~~
			~~3. Add button for settings using Settings01Icon. This should not trigger anything yet.~~ 
### ~~1.2.3_App-Topbar~~
~~1. Create app-topbar.tsx component in components/app folder~~
	~~1. This component should be present for all /app routes and should have three sections (horizontal flex with justify-between to space out):~~
		~~1. Left section: 2 sections (flex with gap-2)~~
			~~1. Left section: Sidebar toggle~~
				~~1. Should use PanelLeftCloseIcon or PanelLeftOpenIcon depending on whether sidebar is open or closed.~~
			~~2. Right section: breadcrumbs showing current route and ability to easily go back.~~ 
				~~1. Should not show 'app'.~~ 
				~~2. Should use shadcn breadcrumbs component~~
				~~3. Should use ChevronRight icon for arrows~~
				~~4. Example (if at app/personal/readings/new-reading): Personal > Readings > New Reading~~
		~~2. Middle section: Page title~~
			~~1. Will only appear when viewing a page that displays a single doc with a name/id (e.g. viewing a single reading or creating a new reading, etc.)~~
			~~2. Do NOT try and implement any complex logic for this yet. User will manually create this logic later. For now just include placeholder div.~~
		~~3. Right section: New X Button~~
			~~1. Should be a shadcn button of primary variant~~
			~~2. Should trigger a dropdown menu when clicked showing three options (to the right of each text option should be an icon as show below in parentheses):~~ 
				~~1. New Reading (LibraryIcon)~~
				~~2. New Spread (Card01Icon)~~
				~~3. New Interpretation (Prism)~~
			~~3. Do not yet create any action for when an option is pressed.~~ 

### ~~1.2.4_Field Component Abstraction~~
1. Create abstracted components for the react-hook-form based inputs that are found in both spreads/spread-settings-panel.tsx and spreads/card-settings-panel.tsx.
	1. These should be placed in the components/form directory
		1. There already is a switch-field.tsx file which should be completed (or rewritten)
	2. These components should be able to be slotted directly into the spread-settings and card-settings components.
	3. They should all have the Shadcn <Field> component as the parent.
	4. They should be able to be controlled or registered depending on which props are passed to it.
2. Slot these new components into the spread settings and card settings components

### ~~1.2.5_Responsive Panel Component~~
1. Create a component called responsive-panel within the components/app directory
	1. This component should abstract the shared logic that conditionally renders panels or sheets, depending on the value of the useIsMobile boolean hook.
	2. This component should be able to be used in the new-spread/panel-wrapper component and/or the spread-settings and card-settings components to replace the duplicated logic that conditionally renders panels or sheets.
	3. This component should be versitile enough to accomodate future use (rather than just being able to replace the current code)
	4. This component should accept the content of the panel/sheet as its child.
2. Use this component to replace the existing duplicated logic.

---

## 1.3_New Spread (archived)

### ~~1.3.1_Update App Topbar~~
1. Install zustand for global state management
2. Create a zustand store for topbar state management at /stores/topbar.ts
	1. This store should contain the following pieces of data:
		1. title?: object
			1. name: string
			2. addInfo?: string
			3. draft?: boolean
		2. rightButtonGroup?: object
			1. primaryButton: object
				1. text: string
				2. action: (data: unknown) => void
			2. secondaryButton?: object
				1. text: string
				2. action: () => void
3. Within app-topbar.tsx, build title section (middle section—currently there is a placeholder called "spacer). This section should be composed of three parts, horizontally stacked
	1. Left part (required): title
		1. font-bold, text-foreground
	2. Middle part: addInfo (optional): composed of two parts, horizontally stacked
		1. left part: separator
			1. use shadcn component
			2. vertical
			3. color: border
		2. right part: text
			1. text-foreground-muted
	3. Right part: draft (optional)
		1. shadcn badge component
		2. should read "draft"
4. Integrate the topbar store into the app-topbar so that: 
	1. The title data maps onto the new title section
		1. If no title data, then no title (keep current placeholder there in this case)
	2. If rightButtonGroup data is defined, then:
		1. There should be a primary button with given text and action function
		2. If secondaryButton is defined, then there should be a ghost button with given text and action function
		3. If no rightButtonGroup, the default should be the current "new" dropdown menu
### ~~1.3.2_Create New Spread Page~~
1. Create new page at /app/app/personal/spreads/new-spread/page.tsx
2. There should be two horizontally stacked sections on this page.
	1. Left section should be 1/3 of the page width while the right section should be the remaining width. Only left section will be worked with for now.
	2. Left section will be a panel containing form fields. Before beginnging to construct the following form fields, install react-hook-form and zod to build client-side validated form fields (in conjunction with the shadcn Field component which is already installed).
	3. To start, please build the following three form fields which should be vertically stacked
		1. Name: input, type=text
			1. min=3, max=50
		2. Number of Cards: input, type=number
			1. min=1, max=78, integer only
		3. Description, textarea, optional
	4. This left panel should have the title: Spread Settings
3. The topbar store should be set on page load in the following way
	1. topbar rightButtonGroup should be set to:
		primaryButton: { text: "Save Spread", action: (data: {}) => {} (placeholder) }
		secondaryButton: { text: "Discard", action: handleDiscard }
		1. `handleDiscard` function should:
			1. Reset the form
			2. Route the page to /app/personal/spreads
	2. topbar title name should be set to "New Spread"
	3. Topbar title draft should be set to true
4. On name and numberOfCard field changes, the topbar title state should updated in the following way:
	1. The name field should be bound to the topbar title name.
	2. The number of cards should be bound to the topbar title addIndo as follows: `${numberOfCards}-Card`
### ~~1.3.3_Spread Canvas and Card~~
1. Create /app/personal/spreads/canvas.tsx. Here are the overall specifications of this component:
	1. This component will be integrated into the /new-spreads/page.tsx file, occupying the remainder of the page in addition to spread settings. 
	2. This canvas will be built using SVG and will be a place where users can add and arrange tarot card slots to create their spread. 
	3. The size of this canvas should be 1500x1500 px with scroll-auto so that it has its own scroll bars and does not cause the entire page to increase in either width or height. 
	4. Users should be able to use their mouse/trackpad to scoll but should also be able to hold down the spacebar and move their mouse to scoll around in the canvas.
		1. When spacebar is pressed, the mouse should change to the draghandle mode to indicate that dragging is being done.
	5. There should be a grid on the canvas with each square unit measuring 15x15 px. The color of these grid lines should be `border/60`
2. Create /app/personal/spreads/card.tsx. Here are the specifications of this component:
	1. This component will be imported and used in the canvas.tsx component.
	2. This component will be an svg rect element with a width of 90 and a height of 150 (the approximate aspect ratio of a standard tarot card).
	3. This card should have a badge in the top left of the card showing its position number (positive, non-zero integer; indicates the order in which the cards should be drawn in the spread).
	4. This card should have a text element in the center showing the name of the card. The default placeholder for this should be `Card-${position}`.
	5. This card should have a background color of `gold/25` and a stroke color of `gold-muted`. The stroke should be dashed.
3. The card.tsx and canvas.tsx components should work together in the following ways:
	1. Cards should be able to be dragged around the canvas component. GSAP should be used to animate card dragging.
		1. Dragging should not smooth but rather should snap onto grid lines. This means that the cards should always be perfectly lined up within a set of grid lines (since the grid lines are every 15px and the cards are 90 by 150 px). This also means that the x and y positions of the cards should only ever be multiples of 15 (inlcuding 0).
		2. The number of cards on the grid should be bound to the existing `numberOfCard` variable in the /new-spread/page.tsx file. 
			1. Because the default and minimum value of `numberOfCards` is 1, there should always be at least one card on the canvas. 
			2. This first and default card will have a position value of 1 and its starting position on the canvas should be (15, 15). 
			3. The second card added should have a position value of 2 and its starting position should be (120, 15). The starting position of each subsequent card should increase in x-offset by 105 (card width of 90 plus 15 for spacing) until card position #11 which should begin a new row. So, card #11 should be (15, 180). Each row should have up to 10 cards spaced by 15 px each. So, if a user wanted to make a spread with all of the cards, the starting configuration would be 7 rows of 10 cards, followed by an 8th row of 8 cards. These should fit confortably within the 1500 by 1500 canvas.
			4. When the number of cards is decreased (i.e. the value of `numberOfCards` goes down), then cards should be removed starting with highest position numbers. So, if there are 10 cards in a spread and then the user decreases it to 8, the #9 and #10 cards should be removed.
		3. While dragging a card, whenever its x or y offset aligns with another card (i.e when they line up), then a line should appear indicating to the user that the cards are lined up. So, if a user is trying to drag a card so that it is horizontally aligned with another card, lines should appear overtop of the grid lines, above and below the cards in question when the dragging card is properly aligned with the other card. The same should occur when vertically aligning cards, or when just one edge is lined up (e.g. the right edge of one card aligns with the left edge of another).
2. Resources
	1. Feel free to view /.resources/tarot-journal/canvas/spread-creation-canvas.tsx and /.resources/tarot-journal/canvas/draggable-card.tsx. These files contain a solution to this problem that seemed to mostly work. However, there were some issues with it. For example, the card positions were never whole numbers but rather were offset by 1.5 or so. This was, I think, because of the stroke, so ensure that you account for the width of the stroke to ensure that the cards' position are ALWAYS multiples of 15 (including 0) AND that the card fit perfectly in the grid lines (i.e. their final dimensions including stroke are 90 by 150).
	2. While you may view this solution, you solution should be cleaner and better overall. Keep things as simple as possible and as clear as possible so it can be easily understood and maintained by humans. 
### ~~1.3.4_Card Details Panel~~
1. Within the /new-spread/page.tsx file, create a third resizable panel which should allow users to edit specific card details. 
	1. This panel should appear when a user clicks on a card. 
	2. While the given card is selected, this new righthand panel should appear and the card should change to have a solid stroke. 
	3. This righthand panel should have a title which reads `Card ${Position} Settings`. This title should be on the right hand side of the panel and on the other side, opposite to the title, should be an 'x' icon (Cancel01 icon) which should close the panel and reducing its width to 0. Then when a card is clicked (and possibly moved) the panel reappears showing the card settings.
	4. The body of this third panel should be a form with the following fields
		1. Position: input type=number (min=1, max=numberOfCard, integer)
		2. Name: input type=text (min=3, max=50)
		3. Description: textarea (max=500)
		4. Allow Reverse Orientation: switch (default=on)
		5. X/Y offset: 2 fields, horizontally stacked
			1. X-Offset: input type=number (min=0, max=1410, increment=15)
			2. Y-Offset: input type=number (min=0, max=1350, increment=15)
		6. Rotation/Z-index: horizontally stacked
			1. Rotation: input type=number (min=0, max=315, increment=45)
			2. Z-Index: input type=number (min=0, max=100, integer)
2. Once this is complete, ensure that the type of a "spread" is linked to the spreadValidator in the /convex/schema.ts file (minus the server controlled fields). You can import this type by using Doc<"spreads"> and then omitting the server controlled fields.
### ~~1.3.5_Group Card Select~~
1. Add functionality that allows multiple cards to be selected for simultaneous group dragging
	1. Users should be able to click and drag across the canvas to select multiple cards at once
	2. While the user clicks and drags on the canvas, a rectangle should be shown that gives the user feedback as to which cards will be selected when the user releases their mouse
	3. This should behave just like any other click, drag, and select functionality.
	4. Use --gold/10 for the background and --gold/40 for the border of the dragging square.
	5. Upon release of the mouse after click and drag, all cards that were selected should show some indication that they are being selected. At this point, click/hold and dragging should now move all cards in the group.
	6. When cards are selected for this group click and drag, any single click on the canvas should deselect all cards.
	7. Again, ensure that this functionality behaves like all standard click/drag and select functionality that modern users have come to expect. 
### ~~1.3.6_Card Overview~~
1. Create a card overview/manager in the spread settings panel
	1. This should be below where +/- card button currently are. 
	2. This should consist of a set of rectangular tiles (36px in height) which show the position number and name of the card on the left (e.g. 1. Past)
	3. These cards should be able to be dragged and dropped between each other which should effectively change their order. 
		1. Ideally, use GSAP for this drag and drop. But if another library is absolutely necessary, then use Atlassian Pragmatic DnD.
	4. On the right hand side of the tile should be edit and delete buttons.
		1. The edit button should open up the right hand card panel for the card (and should also then style the card on the canvas to be selected for edit)
			1. This tile should show a similar gold style and glow as the card does when it is being edited.
		2. The delete button should open up a dialog confirming that the user wants to remove the card.
	5. At the bottom of the list of cards should be a button of the same height and width but with dotted border which says "New Card"
		1. Remove the +/- card button group and replace with just a + icon button to the left of the panel left icon button (this should be present in both expanded and collapsed state)
### ~~1.3.7_Save Functionality~~
1. Create functionality to save new-spreads
	1. Pressing the save button in the new-spreads page should save the new spread to the convex db using the `create` mutation in /convex/tables/spreads.ts
	2. While the function is running, the save button should be disabled and show a spinner to the left of the text
	3. If the save is succussful:
		1. The router should push to /app/personal/spreads
		2. After routing to spreads, a toast should pop up saying that the spread was successfully created.
	5. If the save fails
		1. A toast should appear saying that the there was an error (and what the error is)
	6. For the toast, use the shadcn Sonner component which is already installed.
### ~~1.3.8_Final Polishing 1~~
1. Remove the delete button from the card component (which appears on the card on mouse over) and instead add in a "remove card" button at the bottom of the card settings panel. Thus, cards will be able to be deleted from both the spread settings panel and card settings panel. 
2. Creating a new card should select that card to open up the card settings panel for that new card.
3. If a group of cards is selected for group drag, clicking on one should deselect the group.
	1. Clicking on one currently does select it but the group remains intact, ready for group drag, and the style of the card does not change to that of a selected card with panel open.
4. If the user attempts to save the spread and any form errors trigger (i.e. no name given, or name is too small), then a sonner should appear giving the user the error. 
	1. If there are multiple form errors, then there should be one sonner per error. 
	2. Each such error sonner should have the same title (Error saving form) but also should have a unique description outlining the issue (e.g. Spread name is required.)
	3. Along the same lines, if there are a react-hook-form validation error while saving, then the related panel should open if it is collapsed.
		1. For example, if the user attempts to save without a spread name and the spread settings panel is closed, then the spread settings panel should open so that the user can see the field error. (this happen alongside the sonner outlining the error.)
5. The canvas svg should have a min width/height of 1500px. However, it should fill its parent container (the top level div in the spreads/canvas.tsx file) if that parent container has either a width or height greater than 1500px.
	1. Use a resize observer to watch this parent div (which already has a ref to use) and then update the svg width and height if the width/height of the parent div is greater than 1500. 
6. Add tooltips to the icon buttons in the spread settings panel header. These are the add new card and show/hide panel icon buttons. They should read, "New Card" and "Hide/Show Panel", respectively.
7. Add tooltip to the delete spread icon button in the righthand button group which is passed as a prop to the app-topbar in the new-spread/panel-wrapper.tsx component.
### 1.3.9_Local Storage Draft Saving
1. Create localStorage draft saving
	1. Create a ref in new-spread/panel-wrapper.tsx called "spreadDraftId" which is of type number | null (default null). 
	2. Add in a useEffect hook to update this ref to change it to Date.now() whenever the form state appears
		1. This should only run if spreadDraftId = null rather than updating the Date.now() each time
	3. Add in a piece of code that only runs if spreadDraftId is truthy. This code should set a localStorage item with key=`spread-${spreadDraftId}` and value of the form state.
		1. This code should rerun to keep the localStorage object in sync with form state whenever the form state changes
	4. The 'discard' button should be updated to trigger a modal confirming deletion of the spread draft only if spreadDraftId is truthy (i.e. changes have been made that will be lost). Otherwise, is spreadDraftId is null, then the discard button should just route back to /app/personal/spreads.
		1. The modal that appears confirming deletion should have three buttons:
			1. On the right hand side will be two buttons:
				1. The right button on the right hand side will confirm deletion of the spread draft. This should delete the localStorage object and route back to spreads page.
				2. The left button on the right hand side should "save as draft" which will simply not delete the localStorage object but will still route back to spreads page.
			2. The single button on the left hand side will be "cancel" will will close the modal. 
	5. If you think that there is a better and more efficient way to implement this logic to save spreads as localStorage please do that instead.

### ~~1.3.10_New Spread Responsive Design~~
1. For all screen widths, new spread title in topbar should be truncated with ellipses so that it does encroach on surrounding elements. For example, in mobile view, as the user types in their spread title, the corresponding string in the topbar should truncate at a certain width such that the right hand button group is not pushed off to the side.
2. Both spread settings panel and card settings panel should turn into sheets (shadcn sheet components) at mobile viewports.
	1. Use the useIsMobile hook to dynamically determine mobile viewports.
	2. At mobile viewports, the spread settings panel should always be hidden with a button called "spread settings" and a small plus icon button for adding a new card. When the spread settings button is pressed, then the spread settings form should show as a sheet (i.e. it should overlay the canvas rather than displacing it like the panel does).
	3. Similarly, at mobile viewports, selecting a card (i.e. setSelectedIndex !== null) should open up a sheet rather than the panel.
	4. Importantly, these two sheets should NOT overlay the topbar (i.e. the whole height the screen). Instead, their height should be the same as the panel that they replace at mobile viewports. So, the only difference between the panel and the sheet is that the sheet will overlay the canvas while the panel displaces the canvas.
	5. See components/ui/sidebar.tsx for an example of how the useIsMobile hook is used to conditionally render a sheet at mobile viewports. However, again, the height of these spread settings and card settings sheets should NOT be the whole height of the screen but instead should just conver the canvas, NOT the app-topbar.

---

## 1.4_View/Edit Spreads (archived)

### ~~1.4.1_Spreads Page~~
1. Create a component in /app/personal/spreads to that renders a shadcn card component showing a given spread. Eventually, clicking on the spread will open up the page to view or edit the given spread.
	1. The component should accept a prop for whether the spread is a draft or not, in which case it should have a badge indicating that it is a draft.
	2. The component should display the name of the spread along with the date (just MM/DD/YYYY).
2. The spreads page (/app/personal/spreads/page.tsx) should use the `list` query in the spreads table functions to read the 10 most recently created spreads. These should be displayed using the above card component.
3. The spreads page should also read local storage and pull all items with a key matching the pattern `spread-draft-${Date.now()}`. The date.now() value in the key can be parsed to give the date of the spread draft.
	1. If the draft has no name, then "Untitled Spread" can be used.
	2. These spread drafts should be rendered in a separate section from the spreads taken from the db.

### ~~1.4.2_Favoriting Spreads~~
1. Add a boolean value to the spreads convex schema called "favorite" which is a boolean. This should be false by default.
2. This favorite boolean should not be present in the new spread form. Instead, users should be able to favorite the spreads they have saved by clicking the star icon which is currently present in the spread card component.
3. This star icon should toggle the favorite boolean in the db.
4. When a spread is favorited (i.e. favorite = true for that spread), then the fill of the star icon should be var(--gold).
5. Include a function in the spreads table function which grabs the user's favorited spreads. This will be used later.

### ~~1.4.3_Edit Spreads~~
1. Create a dynamic nextjs route within the spreads route so that users can edit existing spreads that they have already created.
	1. This route should be accessed by clicking on a certain spread within the spreads/page.tsx file.
		1. IMPORTANT: clicking on DRAFTS should route to the new spread page, loading the draft data into that page for continued editing until the user is ready to save to the db
	2. The url of the route should look like: /app/personal/spreads/[spread _id]?mode=edit
		1. The use of the mode=edit param will be used later
	3. The breadcrumbs in the app-topbar at this route should look like: Personal > Spreads > Edit Spread
	4. The title in the app topbar should look the same that within the new-spreads page (name of spread along with number of cards), however, there should be no draft badge.
	5. The righthand button group should have two buttons:
		1. Primary button on the right called "Save Edits" which saves any edits made (this should be disabled if no changes are made)
		2. Ghost button on the left which reads "Cancel"
			1. This button should route straight back to spreads page if no edits are made
			2. If edits have been made, this button should open a dialog confirming that the user would like to discard all edits that they've made.
	6. This route should REUSE the canvas, spread-settings-panel, and card-settings-panel components (all located with the spreads directory)
		1. Thus, the same components are used in this route to edit and create new spreads

### ~~1.4.4_View Spreads~~
1. Create functionality to just view (and not edit) spreads
	1. This should be the same dynamic route as the edit spreads but with mode=view
	2. The canvas, spread settings panel, and card settings panel components (all located with the spreads directory) should be modified to accomodate for spread viewing.
		1. The canvas view mode:
			1. should prevent dragging
			2. not show a grid
			3. not show the click and drag to select multiple cards
			4. cards should still be clickable to view their details
		2. The spread settings panel view mode:
			1. should be titled "Spread Details"
			2. should create a separate subcomponent called "SpreadDetailsContent" which should be able to be slotted into the responsive panel during view mode
				1. should show all the same info in same order and layout but not with inputs, just text
				2. The cards overview should remove the "drag to reorder" and they should not be draggable and there should be no delete buttons on them
					1. clicking on cards should still select them for viewing the card details
		3. The card settings panel view mode:
			1. should be titled "Card Details"
			2. should create a separate subcomponent called "CardDetailsContent" which should be able to be slotted into the responsive panel during view mode
				1. Should show all the same information in the same order and layout but with text rather than input fields
	3. The app-topbar should:
		1. have the same title as the edit mode
		2. have two buttons in the button group:
			1. Primary "Edit Spread" button on the right: switch to edit mode
			2. Ghost "Close" button on the left: route back to spreads page
		3. have final breadcrumb read "View Spread"
2. Change spreads page so that clicking on a card intially opens view mode
3. Change edit mode so that the Cancel button goes back to view mode
