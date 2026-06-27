# Deleting Mock Data for Production

This guide explains how to cleanly remove all mock data from the Superhive app when preparing for a production build. Follow each step in order.

---

## Overview

Mock data is controlled by the `VITE_USE_MOCK_DATA` env var and isolated to `src/data/mock/`. The toggle is checked in exactly one place — `src/data/mock/index.ts` — which exports `mockableData`. Every domain store imports `mockableData` from there.

UI components (LeftNav, CenterWorkspace, RightAuxiliary, etc.) remain in place after cleanup — they just receive empty data instead of mock data.

**Note:** `src/data/settings/settings.json` is the user settings seed and is NOT mock data. It lives in the same `src/data/` directory but is never deleted by this cleanup process — it is always kept regardless of `VITE_USE_MOCK_DATA`.

---

## Architecture

**Mock central module**: `src/data/mock/index.ts`
- `MOCKS_ENABLED` — global master toggle (true/unset = mock on, false = mock off)
- `mockableData` — either the seed from `mock.json` (when on) or an empty `MockData` (when off)

**Mock data**: `src/data/mock.json` — all seed content for every domain

**Mock types**: `src/data/mock/types.ts` — shared TypeScript types for mock data structures (`MockData`)

**Data stores** (8 domains, all import `mockableData` from `@/data/mock/index`):
- `src/data/workspaces/store.ts`
- `src/data/agents/store.ts`
- `src/data/favorites/store.tsx`
- `src/data/projects/store.ts`
- `src/data/tickets/store.ts`
- `src/data/chat/store.ts`
- `src/data/cost-usage/store.ts`
- `src/data/themes/store.ts`

**Static UI config vs. mock data** — important distinction:

| Category | Where | Examples | Production? |
|---|---|---|---|
| **Mock data** | `src/data/mock.json` + `src/data/{domain}/store.ts` | workspaces, agents, tickets, chat threads, cost-usage history, quick-start suggestions, custom themes | Deleted in Step 2 |
| **Static UI config** | Inline arrays in component/TS files | `STATUS_OPTIONS`, `TIMEZONES`, `PLAN_TIERS`, `MODEL_LABELS`, icon name maps | Always kept — defines valid UI choices, not per-instance records |

Static UI config arrays define the set of valid choices for a control (e.g., "which status values can a ticket have?"). They are NOT seeded records and do not belong in `mock.json`. They are intentionally kept inline regardless of the `VITE_USE_MOCK_DATA` setting.

---

## Step 1 — Set the global flag to false

Open `.env.local` (or your production env file) and change:

```sh
VITE_USE_MOCK_DATA=true
```

to:

```sh
VITE_USE_MOCK_DATA=false
```

If deploying to a hosting platform (Vercel, Netlify, etc.), set this as an environment variable there instead: `VITE_USE_MOCK_DATA=false`

---

## Step 2 — Delete the mock data directory

Delete `src/data/mock/`. It contains only the mock configuration:

```bash
rm -rf src/data/mock/
```

This will break imports in the 8 data stores unless you also update them (Step 3).

---

## Step 3 — Update the data stores

Each store imports from `@/data/mock/index`. After deleting that module, update each store to point at a real backend or return sensible empty defaults.

### 3a. Replace the mockableData import in each store

Replace `import { mockableData } from '@/data/mock/index';` with the appropriate real-API call (or empty defaults).

### 3b. Replace seed reads with real fetches

```ts
// Before:
const workspaces: Workspace[] = mockableData.workspaces;

// After:
const workspaces: Workspace[] = []; // TODO: replace with real API call
```

### Stores to update

| Store | File |
|-------|------|
| `listWorkspaces` | `src/data/workspaces/store.ts` |
| `listAgents` / `getAgent` | `src/data/agents/store.ts` |
| `listFavorites` | `src/data/favorites/store.tsx` |
| `listProjects` / `getProject` / `createProject` / `archiveProject` | `src/data/projects/store.ts` |
| `listUniversalTickets` | `src/data/tickets/store.ts` |
| `listThreads` / `listMessages` / `createThreadForAgent` | `src/data/chat/store.ts` |
| `listCostUsage` | `src/data/cost-usage/store.ts` |
| `themes` | `src/data/themes/store.ts` |

---

## Step 4 — Verify the build

```sh
bun run build
```

There should be NO TypeScript errors. If you see errors about missing `@/data/mock/` modules, return to Step 3 — a mock import was likely missed.

---

## Step 5 — Clean up .env.local (optional)

If `.env.local` only contains `VITE_USE_MOCK_DATA=true` and nothing else, you can delete the file. Otherwise, just remove the `VITE_USE_MOCK_DATA` line.

---

## What the app looks like after cleanup

| Area | Before | After |
|------|--------|-------|
| Left nav workspace dropdown | Shows workspaces | Empty |
| Left nav favorites | Shows favorites | Empty section hidden |
| Left nav active agents | Shows agents with status | Empty section hidden |
| Center workspace | Shows Projects/Agents/Tickets/Channels | Empty tab with empty state |
| Right panel Overview | Shows telemetry/stats | Empty panel |
| Right panel Manage | Shows controls | Empty panel |
| Right panel Inbox | Shows audit queue | Empty panel |

All UI components, button clicks, panel resizing, and tab navigation remain fully functional — they just have no data to display until a real backend is connected.

---

## Re-enabling mock data for development

To turn mock data back on:

1. Restore the `src/data/mock/` directory from git:
   ```bash
   git checkout HEAD -- src/data/mock/
   ```
2. Set `VITE_USE_MOCK_DATA=true` in `.env.local`

Or set `VITE_USE_MOCK_DATA=true` without restoring files — each store will use its in-memory mock data defaults.