# Deleting Mock Data for Production

This guide explains how to cleanly remove all mock data from the Superhive app when preparing for a production build. Follow each step in order.

---

## Overview

Mock data is controlled by the `VITE_USE_MOCK_DATA` env var and isolated to `src/data/mock/`. The app uses a per-domain mock flag system (`isMockEnabled(domain)`) so each data domain can be independently toggled.

UI components (LeftNav, CenterWorkspace, RightAuxiliary, etc.) remain in place after cleanup — they just receive empty data instead of mock data.

---

## Architecture

**Mock config**: `src/data/mock/feature-flags.ts`
- `USE_MOCK_DATA` — global master toggle (true/unset = mock on, false = mock off)
- `isMockEnabled(domain)` — per-domain override check

**Mock types**: `src/data/mock/types.ts` — shared TypeScript types for mock data structures

**Data stores** (7 domains, each checks `isMockEnabled`):
- `src/data/workspaces/store.ts`
- `src/data/agents/store.ts`
- `src/data/favorites/store.tsx`
- `src/data/projects/store.ts`
- `src/data/tickets/store.ts`
- `src/data/chat/store.ts`

**Static UI config vs. mock data** — important distinction:

| Category | Where | Examples | Production? |
|---|---|---|---|
| **Mock data** | `src/data/mock.json` + `src/data/{domain}/store.ts` | workspaces, agents, tickets, chat threads, cost-usage history, quick-start suggestions | Deleted in Step 2 |
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

This will break imports in the 6 data stores unless you also update them (Step 3).

---

## Step 3 — Update the data stores

Each store imports from `src/data/mock/feature-flags`. After deleting that file, update each store to remove or stub the mock check.

### 3a. Remove the feature-flags import from each store

Delete this line from each of the 6 stores listed above:

```ts
import { isMockEnabled } from '@/data/mock/feature-flags';
```

### 3b. Remove mock checks from each store

In each store, find and remove blocks like:

```ts
if (!isMockEnabled('workspaces')) return [];
```

Replace with direct data access or empty arrays:

```ts
// Before:
export function listWorkspaces(): Workspace[] {
  if (!isMockEnabled('workspaces')) return [];
  return mockData.workspaces;
}

// After:
export function listWorkspaces(): Workspace[] {
  // TODO: replace with real API call
  return [];
}
```

### Stores to update

| Store | Domain flag | File |
|-------|-------------|------|
| `listWorkspaces` | `isMockEnabled('workspaces')` | `src/data/workspaces/store.ts` |
| `listAgents` / `getAgent` | `isMockEnabled('agents')` | `src/data/agents/store.ts` |
| `listFavorites` | `isMockEnabled('favorites')` | `src/data/favorites/store.tsx` |
| `listProjects` / `getProject` | `isMockEnabled('projects')` | `src/data/projects/store.ts` |
| `listUniversalTickets` | `isMockEnabled('tickets')` | `src/data/tickets/store.ts` |
| `listThreads` / `listMessages` | `isMockEnabled('chat')` | `src/data/chat/store.ts` |
| `listCostUsage` | `isMockEnabled('costUsage')` | `src/data/cost-usage/store.ts` |

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
