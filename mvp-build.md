# Archiving Protocol
*Instructions for future LLMs on how to archive content in these files.*

**What "archiving" means:**
Completed build steps and change log entries accumulate detail that clutters active planning. Archiving moves the full content to `mvp-build-archive.md` and replaces it in this file with a compact one-liner, keeping this file short and scannable.

**How to archive a Change Log entry:**
1. Copy the full entry (bold header + Summary + Future considerations block) to the top of the `## 0.5.2_Entries (archived)` section in `mvp-build-archive.md`, converting the header format to `**MM/DD/YYYY -- {title} -- {model}**`
2. In this file, remove the full entry and add a single bullet to `## Archived Entries` in the format: `- {step or date} — {short title}`

**How to archive a Build Plan section or subsection:**
1. Copy the full spec content (the `### ~~X.X.X_Title~~` heading and all its numbered steps) to the matching `## X.X_Section (archived)` section at the bottom of `mvp-build-archive.md`. If that archived section doesn't exist yet, create it following the existing `---` separator pattern.
2. In this file, remove the full `### ~~X.X.X~~` block and replace it with a single bullet under the parent `## ~~X.X_Section~~` stub in the format: `- **X.X.X** — {one-line description}. ~~Complete~~`
3. If the entire parent section is now just bullets (no remaining full specs), ensure the section header has the `*Full steps archived in mvp-build-archive.md.*` note.

---

# Change Log
*Most recent at the top*

## Archived Entries
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
## ~~1.1_Database & Auth Setup~~
*Full steps archived in mvp-build-archive.md.*
- **1.1.1** — Create database tables in /convex/schema.ts; create indexes; update 0.2.2.1.1 with index specs. ~~Complete~~
- **1.1.2** — Create webhook to sync Clerk with users table: /convex/users.ts, /convex/http.ts; follow [Convex guide](https://docs.convex.dev/auth/database-auth#set-up-webhooks); scan project for auth improvements.
- **1.1.3** — Create readings.ts, interpretations.ts, spreads.ts with list/create/update/remove + table-specific queries. ~~Complete~~
- **1.1.4** — Code review of 1.1.1–1.1.3. ~~Complete~~
- **1.1.5** — Convex tests per table ([Convex Tests](https://docs.convex.dev/testing/convex-test)). ~~Complete~~

## ~~1.2_Frontend Setup~~
*Full steps archived in mvp-build-archive.md.*
- **1.2.1** — Setup: update layout title; landing page (auth, redirect to /app, /app → /app/personal); install shadcn components from 0.2.1.1.2. ~~Complete~~
- **1.2.2** — App-sidebar: header links to /app; content (Personal, Readings, Spreads, Interpretations, tooltips/collapsed fix); footer (UserButton, Settings). ~~Complete~~
- **1.2.3** — App-topbar: sidebar toggle, breadcrumbs (no "app", ChevronRight), placeholder center title, New dropdown (Reading, Spread, Interpretation). ~~Complete~~
- **1.2.4** — Field component abstractions (TextField, TextareaField, SwitchField, NumberField for react-hook-form). ~~Complete~~
- **1.2.5** — Responsive panel component (mobile Sheet / desktop ResizablePanel abstraction). ~~Complete~~

## ~~1.3_New Spread~~
*Full steps archived in mvp-build-archive.md.*
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
*Full steps archived in mvp-build-archive.md.*
- **1.4.1** — Spreads page (saved spreads grid + localStorage draft display). ~~Complete~~
- **1.4.2** — Favoriting spreads (toggle favorite, `listFavorited` query, star UI). ~~Complete~~
- **1.4.3** — Edit spreads (dynamic `[id]` route, edit panel, save/cancel/discard). ~~Complete~~
- **1.4.4** — View spreads (view mode, read-only canvas + panels, view/edit toggle). ~~Complete~~
