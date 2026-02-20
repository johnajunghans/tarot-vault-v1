# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev              # Run both frontend and backend in parallel
npm run dev:frontend     # Next.js dev server only (port 3000)
npm run dev:backend      # Convex dev server only
npm run predev          # Initialize Convex and open dashboard
```

### Build and Production
```bash
npm run build           # Build Next.js and Convex for production
npm run start           # Start production server
npm run lint            # Run ESLint
```

### Testing
```bash
npm run test            # Run tests in watch mode
npm run test:once       # Single test run
npm run test:debug      # Debug tests with inspector
npm run test:coverage   # Generate coverage report
```

### Running Single Tests
```bash
npx vitest run convex/tests/users.test.ts        # Run specific test file
npx vitest run -t "test name pattern"            # Run tests matching pattern
```

## High-Level Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Convex (real-time database + server functions)
- **Authentication**: Clerk with webhook-based user sync
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Testing**: Vitest with convex-test utilities

### Project Structure

```
app/                    # Next.js App Router
├── layout.tsx          # Root layout with Clerk/Convex/Theme providers
├── page.tsx            # Landing page (public, redirects authenticated users)
└── (app)/              # Route Group (protected: all routes within require authentication)
    ├── layout.tsx      # App group layout with sidebar and topbar
    ├── page.tsx        # Dashboard (redirects to /personal)
    ├── personal/       # Personal workspace
    │   └── spreads/    # Spreads feature
    │       ├── page.tsx              # List route
    │       ├── _components/          # Shared feature components (canvas, card, panels, schema, etc.)
    │       ├── new/                  # Create route + panel-wrapper
    │       ├── [id]/                 # View/edit route + edit-panel-wrapper
    │       ├── utils.ts              # Spread creation/editing helpers and utilities
    │       └── schema.ts             # Zod schema and runtime validation for spreads
    └── collective/     # Collective workspace (future)

components/
├── layout/             # App-specific components (sidebar, topbar, responsive-panel)
├── form/               # Reusable react-hook-form field components
├── ui/                 # Base UI components (shadcn/ui)
├── providers/          # Context providers
│   ├── ConvexClientProvider.tsx  # Clerk + Convex integration
│   └── ThemeProvider.tsx         # Theme provider (next-themes)

types/                  # Shared TypeScript types
└── spreads.ts          # Spread/card types derived from schema and zod

convex/                 # Convex backend
├── schema.ts           # Database schema definitions
├── auth.config.ts      # Clerk authentication configuration
├── http.ts             # HTTP routes (webhooks)
├── users.ts                # User queries/mutations
├── readings.ts             # Reading queries/mutations
├── spreads.ts              # Spread queries/mutations
├── interpretations.ts      # Interpretation queries/mutations
└── tests/              # Backend tests
    ├── test.setup.ts   # Test utilities
    └── *.test.ts       # Test files

hooks/                  # Custom React hooks
lib/                    # Utility functions and important constants (e.g. routes)
proxy.ts                # Clerk middleware for route protection
```

### Authentication Flow

1. **Client-Side**: Clerk manages sign-in/sign-up UI and generates JWT tokens
2. **Route Protection**: `proxy.ts` middleware protects `/app/*` routes
3. **Backend Validation**: Convex validates Clerk JWT via `CLERK_JWT_ISSUER_DOMAIN`
4. **User Sync**: Clerk webhooks (`/clerk-users-webhook`) sync user data to Convex `users` table
5. **Authorization**: All queries/mutations call `getCurrentUserOrThrow()` to verify authentication

### Database Schema

**Four Main Tables:**

1. **users** - User profiles synced from Clerk
   - Indexed by `authId` for fast auth lookups
   - Contains nested `settings` object (appearance, preferences, notifications)

2. **readings** - Tarot reading sessions
   - Links to spreads via versioned reference
   - Supports parent-child relationships (follow-up readings)
   - Indexed by `userId_and_updatedAt` and `userId_and_starred`

3. **spreads** - Tarot spread definitions
   - Defines card positions with spatial transforms (x, y, rotation, z-index)
   - Can be user-created or system defaults

4. **interpretations** - Reading interpretations (user or AI-generated)
   - Links to readings (one-to-many)
   - Tracks AI metadata (model, tokens, cost) for analytics
   - Indexed by `userId`, `readingId`, and `userId_and_source`

### Convex Backend Patterns

**File Organization:**
- Each table has its own file in `convex/tables/`
- HTTP routes defined in `convex/http.ts`
- Schema definitions in `convex/schema.ts`
- Tests in `convex/tests/`

**Function Patterns:**
- **Queries** (read-only): `current`, `list`, `listStarred`, `getById`
- **Mutations** (write): `create`, `update`, `remove`
- All functions use **new function syntax** with `args` and `returns` validators
- All functions verify authentication via `getCurrentUserOrThrow()`
- All mutations verify ownership before modifications

**Example Function Structure:**
```typescript
export const create = mutation({
  args: { /* validators */ },
  returns: v.id("tableName"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    // Validate inputs
    // Insert/update data with userId
    // Return result
  },
});
```

### Testing Strategy

**Setup:**
- Tests use `convexTest()` helper from `convex-test` library
- Test environment: `edge-runtime` (matches Convex runtime)
- Test files: `convex/tests/*.test.ts`

**Common Patterns:**
```typescript
import { convexTest } from "convex-test";
import { test, expect } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "./test.setup";

test("example", async () => {
  const t = convexTest(schema, modules);

  // Test with authentication
  const asUser = t.withIdentity({ name: "Test User" });
  const result = await asUser.query(api.tables.users.current);

  expect(result).toMatchObject({ name: "Test User" });
});
```

**Test Coverage:**
- Authentication checks (unauthenticated queries throw errors)
- Authorization checks (users can't access other users' data)
- CRUD operations with validation
- Webhook handling (Clerk user sync)

### Frontend Data Fetching

**Real-Time Queries:**
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const user = useQuery(api.tables.users.current);
const readings = useQuery(api.tables.readings.list);
const createReading = useMutation(api.tables.readings.create);

// Usage
await createReading({ question: "...", spread: { id, version: 1 } });
```

**Key Points:**
- Convex provides real-time synchronization automatically
- No need for Redux, Zustand, or other state management
- Backend is the source of truth

### Important Conventions

**Route Protection:**
- Public routes: `/` (landing page)
- Protected routes: `/app/*` (requires authentication via `proxy.ts` middleware)

**Path Aliases:**
- `@/components` → `./components`
- `@/lib` → `./lib`
- `@/hooks` → `./hooks`
- `@/ui` → `./components/ui`

**Convex Function Registration:**
- **Public functions**: Use `query`, `mutation`, `action` (exposed to Internet)
- **Internal functions**: Use `internalQuery`, `internalMutation`, `internalAction` (private)
- Always include `args` and `returns` validators
- Use `v.null()` for functions that don't return anything

**Convex Function Calling:**
- Use `api` for public functions: `api.tables.users.current`
- Use `internal` for internal functions: `internal.tables.users.deleteFromClerk`
- File-based routing: `convex/tables/users.ts` → `api.tables.users.*`

**Database Operations:**
- Use `.withIndex()` instead of `.filter()` for performance
- Define indexes in schema for all common query patterns
- Use `.unique()` to get single document (throws if multiple found)
- Use `ctx.db.patch()` for partial updates, `ctx.db.replace()` for full replacement

**Validators:**
- Use `v.int64()` for 64-bit integers (not deprecated `v.bigint()`)
- Use `v.record()` for dynamic key-value objects
- Use `v.union()` for discriminated unions with `v.literal()`
- System fields `_id` and `_creationTime` added automatically

**Ownership Pattern:**
- Every document has `userId` field
- Queries filter by `userId` automatically
- Mutations verify ownership before modifications
- Prevents cross-user data access

**Environment Variables:**
- `CLERK_JWT_ISSUER_DOMAIN` - Set in Convex dashboard (see Clerk integration docs)
- `CLERK_WEBHOOK_SECRET` - Set in Convex dashboard for webhook validation

## Key Architecture Decisions

1. **Table-Based Organization**: Each database table has its own file with all related queries/mutations
2. **Webhook-Based User Sync**: Clerk is source of truth; Convex users table is derived cache
3. **Authorization at Backend**: All authorization checks happen in Convex functions, not frontend
4. **Real-Time First**: Convex provides automatic real-time synchronization across clients
5. **Validator-Driven Schema**: Runtime validation and type safety via Convex validators
6. **Metadata Tracking**: All records track `updatedAt` for conflict resolution

## Development Workflow

1. **Update schema** (`convex/schema.ts`) when adding tables/fields
2. **Create table file** (`convex/tables/newfeature.ts`) with queries/mutations
3. **Add tests** (`convex/tests/newfeature.test.ts`) for new functionality
4. **Create frontend pages** (`app/app/feature/page.tsx`) using `useQuery`/`useMutation`
5. **Use UI components** from `components/ui/` for consistent styling

## Important Notes

- Always use the **new function syntax** with `args` and `returns` validators
- Never use deprecated `ctx.storage.getMetadata` - query `_storage` system table instead
- Test files must use `edge-runtime` environment (configured in `vitest.config.ts`)
- All Convex functions must include authentication checks via `getCurrentUserOrThrow()`
- Route protection is handled by `proxy.ts` middleware for `/app/*` routes

## MVP Build Protocol

This protocol is used in conjunction with `mvp-build.md` to structure development work into discrete, testable steps.

### How to Use

When you have a step to complete (e.g., "Complete step 1.1.1"):

1. **Planning**: Enter plan mode to devise an implementation strategy
2. **Implementation**: Execute the plan upon user confirmation following this workflow:
   - Execute the task
   - Run tests with `npm run test:once`
   - If all tests pass, proceed to step 3; if not, debug and rerun until passing
   - Recommend any manual user actions (e.g., environment variable updates in Convex dashboard)
   - Create an entry in the `# Change Log` section of `mvp-build.md`
3. **Follow-up**: Await potential follow-up prompts
   - If the user provides additional feedback, repeat step 2 and update the completion log entry

### Key Principles

- **Test-First Validation**: All steps must pass their tests before being marked complete
- **Atomic Changes**: Each step should be a self-contained, testable unit of work
- **Manual Actions Logged**: Any actions requiring user intervention are documented
- **Progressive Completion**: Completion log tracks all finished steps with timestamps and notes

### Referencing mvp-build.md

The `mvp-build.md` file contains:
- **`# Change Log`**: Completion log entries, most recent first (updated as steps are finished)
- **`# Build Plan`**: Individual step definitions with requirements and acceptance criteria
