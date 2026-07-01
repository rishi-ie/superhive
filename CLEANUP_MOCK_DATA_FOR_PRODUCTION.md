# Deleting Mock Data for Production

This guide explains how to cleanly remove mock.json seed data from the Superhive app when preparing for a production build. Follow each step in order.

---

## Overview

Mock data is controlled by `VITE_DATA_SOURCE` (defaults to `mock`). The single switch is in `src/data/datasource/index.ts`. Every domain store reads through the `DataSource` interface — there are no direct mock.json imports outside `src/data/datasource/mock-source.ts`.

UI components (LeftNav, CenterWorkspace, RightAuxiliary, etc.) remain in place after cleanup — they just receive empty data instead of mock data.

**Note:** `src/data/settings/settings.json` is the user settings seed and is NOT mock data. It is always kept regardless of the data source.

---

## Architecture

**Seam**: `src/data/datasource/` — the `DataSource` interface (`types.ts`) is the contract every backend satisfies.

**Factory**: `src/data/datasource/index.ts` — the single place that picks which implementation:
- `mock` (default) → `MockDataSource` — reads `src/data/mock.json` via `normalizeSeedData()`
- `db` → `DbDataSource` — reads from a real database (not yet wired)

**Seed data**: `src/data/mock.json` — all seed content for every domain

**Mock types**: `src/data/mock/types.ts` — shared TypeScript types for seed structures (`FavoriteSeed`, `ChatThreadSeed`, etc.)

**Data stores** (10 domains, all go through `DataSource` via `getDataSource()`):
- `src/data/workspaces/store.ts`
- `src/data/agents/store.ts`
- `src/data/favorites/store.tsx`
- `src/data/projects/store.ts`
- `src/data/tickets/store.ts`
- `src/data/chat/store.ts`
- `src/data/cost-usage/store.ts`
- `src/data/themes/store.ts`
- `src/data/activity/store.ts`
- `src/data/universal-projects/store.ts`

---

## Step 1 — Set the data source to db

Open `.env.local` and change:

```sh
VITE_DATA_SOURCE=mock
```

to:

```sh
VITE_DATA_SOURCE=db
```

If deploying to a hosting platform, set `VITE_DATA_SOURCE=db` as an environment variable there.

---

## Step 2 — Wire DbDataSource

Add `DbDataSource` in `src/data/datasource/index.ts`. The factory branch already exists — it is commented out pending this wiring:

```ts
const source = import.meta.env.VITE_DATA_SOURCE ?? 'mock';
return _instance ?? (_instance =
  source === 'db' ? new DbDataSource() : new MockDataSource());
```

Implement `DbDataSource` in `src/data/datasource/db-source.ts` — it must satisfy the `DataSource` interface. See `src/data/datasource/types.ts` for the contract and `src/data/datasource/snapshot.ts` for the expected row shapes.

---

## Step 3 — Verify the build

```sh
bun run typecheck
bun run build
```

There should be NO TypeScript errors. If you see errors about missing `mock-source.ts` imports, return to Step 2 — a collection getter is likely missing its implementation.

---

## What the app looks like after switching

| Area | Before (mock) | After (db) |
|------|-------------|------------|
| Left nav workspace dropdown | Shows workspaces | Empty |
| Left nav favorites | Shows favorites | Empty section hidden |
| Left nav active agents | Shows agents with status | Empty section hidden |
| Center workspace | Shows Projects/Agents/Tickets/Channels | Empty tab with empty state |
| Right panel Overview | Shows telemetry/stats | Empty panel |
| Right panel Manage | Shows controls | Empty panel |
| Right panel Inbox | Shows audit queue | Empty panel |

All UI components, button clicks, panel resizing, and tab navigation remain fully functional — they just have no data to display until the database is seeded or the user creates records.

---

## Re-enabling mock data for development

To switch back to mock data:

```sh
VITE_DATA_SOURCE=mock
```

in `.env.local`. The `MockDataSource` and `mock.json` are not deleted — they remain available for dev and tests.
