# Superhive

A digital agent workspace — a command center for orchestrating autonomous AI agents. Three-panel layout with agent telemetry, tabbed workspace management, and real-time swarm activity.

## Features

**Fleet Command (Left Nav)** — workspace selector, team picker, favorites, and accordion navigation for projects, agents, and utilities.

**Operations Deck (Center)** — tabbed workspace views:
- **Projects** — Kanban board with To Do / Executing / Done columns
- **Tickets** — Kanban with Backlog / Executing / Review / Merged columns
- **Agents** — agent roster with status indicators and model configuration
- **Channels** — unified communications view across all workspaces
- **Chat** — threaded conversations with model picker and AI feedback

**Avionics (Right Auxiliary)** — telemetry dashboard, Control Matrix for agent configuration, Audit Queue for access approvals, and per-workspace inboxes.

**Settings** — 14 pages across three groups:
- Personal: Account, Appearance, Notifications, Privacy & Data, Accessibility
- Workflow: Defaults, Keyboard Shortcuts, Models, Workflows & Triggers, Cost & Usage, Agents
- Organization: Workspaces, Integrations, Billing & Plans

**UI Primitives** — 20 shared components in `src/components/ui/` (see §UI Primitives below).

**Mock-data driven** — per-domain toggle via `VITE_MOCK_*` env vars. All data domains fall back to empty states when disabled.

## UI Primitives

| Primitive | Purpose |
|---|---|
| `Avatar` | User avatar with image fallback to initials. Sizes: xs–xl + xs2/xs3 |
| `Badge` | Status label — active, current, recommended, coming soon, AI |
| `Button` | Push button. Variants: default, destructive, outline, secondary, ghost, link. Sizes: sm/md/lg/icon |
| `Checkbox` | Multi-select checkbox. Radix-wrapped for full keyboard/ARIA support |
| `IconButton` | Square icon-only button. Variants: ghost, solid, outline. Sizes: xs–lg |
| `NewButton` | Create action with plus icon |
| `Pill` | Compact toggleable filter/tag button. Sizes: sm/md/lg |
| `SearchBar` | Search input with integrated icon |
| `SectionLabel` | Small uppercase label for grouping items. Sizes: sm/md |
| `Select` | Native dropdown with chevron |
| `SegmentedControl` | Multi-option button group (2–4 options) |
| `StatCard` | Compact stat display with label, value, and optional subtitle |
| `StatusDot` | Agent status indicator — EXECUTING/COMPILING/IDLE/ERROR_LOOP/AWAITING_HUMAN. Sizes: xs/sm |
| `StatusFilter` | Horizontal filter button group with optional counts |
| `Tabs` | Tab strip. Radix-wrapped — Tabs / TabsList / TabsTrigger / TabsContent |
| `Textarea` | Multi-line text input |
| `TextInput` | Styled text input. Sizes: sm/md |
| `Switch` | Boolean toggle. Radix Switch — terracotta accent on-state |
| `Tooltip` | Floating tooltip. Radix-wrapped |
| `UniversalListCard` | List row with hover/selected states |

> Radix UI wraps `Checkbox`, `Tabs`, and `Tooltip` for headless keyboard and screen-reader accessibility.

## Prerequisites

- **Bun** v1+ — required for package management and running scripts
  ```sh
  # Install bun if you don't have it
  curl -fsSL https://bun.sh/install | bash
  ```

## Setup

```sh
# Install dependencies
bun install
```

## Development

```sh
# Start Vite dev server + Electron with hot reload
bun run dev
# or
bun run electron:dev
```

The app will open in an Electron window. The renderer hot-reloads on file changes; the main process restarts when `electron/main.ts` or `electron/preload.ts` changes.

## Production Build

```sh
# TypeScript check + Vite build + Electron app packaging (produces dmg/zip)
bun run electron:build

# Preview the production build locally
bun run electron:preview
```

Output artifacts are in `release/` (dmg for macOS, nsis for Windows, AppImage for Linux).

## Type Checking

```sh
bun run typecheck
```

Runs `tsc --noEmit` with strict mode enabled (`noUnusedLocals`, `noUnusedParameters`).

## Mock Data

Mock data is enabled by default. The single switch is `VITE_DATA_SOURCE` in `.env.local`. It is checked in exactly one place — `src/data/datasource/index.ts`. Set to `db` to use a real database backend (not yet wired).

```sh
VITE_DATA_SOURCE=mock   # default — in-memory seeded from mock.json
VITE_DATA_SOURCE=db     # not yet wired — coming soon
```

See `CLEANUP_MOCK_DATA_FOR_PRODUCTION.md` for full cleanup steps when going to production.

## Architecture

```
src/
├── App.tsx              # Root shell — Dashboard or Settings
├── main.tsx            # React entry point
├── index.css           # Tailwind v4 + CSS variables (dark warm theme, terracotta accent)
├── hooks/
│   └── use-mobile.ts   # Mobile breakpoint detection
├── types/
│   └── electron.d.ts   # Electron IPC types
├── screens/
│   ├── Dashboard.tsx    # Main 3-panel layout
│   └── Settings.tsx    # Settings screen
├── components/
│   ├── center-workspace/  # Projects, agents, tickets, channels, chat tabs
│   ├── left-nav/          # Fleet command sidebar
│   ├── right-auxiliary/   # Telemetry, controls, audit queue + dashboard/inbox/inbox panels
│   ├── ui/                # Shared primitives (Button, Avatar, StatusDot, Switch…)
│   ├── channels/          # ChannelStatusPill
│   ├── chat/              # formatTime / formatDuration helpers
│   └── settings/          # SettingsSidebar, 14 settings pages, shared primitives
├── data/
│   ├── agents/           # listAgents(), getAgent(), getTelemetry()…
│   ├── chat/
│   ├── cost-usage/       # listCostUsage()
│   ├── favorites/
│   ├── left-nav/         # AccordionAgent type (interface only)
│   ├── projects/
│   ├── settings/         # Settings type + seeded defaults (settings.json)
│   ├── tickets/
│   ├── tabs/             # Tab open/focus/close state
│   ├── universal-projects/
│   ├── workspaces/
│   ├── config/           # Wizard configs, nav items, right panel tabs, themes
│   └── mock/             # mock.json (all seed), index.ts (toggle + mockableData), types.ts
└── lib/
    ├── constants.ts      # Panel sizing, token costs, STROKE_WIDTH
    ├── debounce.ts
    ├── initials.ts
    ├── markdown.ts       # parseMarkdown()
    ├── pluralize.ts
    ├── relative-time.ts # formatRelativeTime()
    ├── settings-context.tsx  # SettingsProvider — applies appearance to DOM
    ├── toast-context.tsx     # ToastProvider — sonner toast context
    ├── utils.ts          # cn() — shadcn utility
    └── use-double-click.ts
```

Each data domain follows `interface.ts` + `store.ts` (+ optional `api.ts`) — swap the store implementation for a real backend by editing the store imports.

## Key Commands

| Command | Description |
|---|---|
| `bun run dev` | Dev server + Electron |
| `bun run typecheck` | TypeScript check |
| `bun run build` | TypeScript check + production build |
| `bun run electron:build` | Full packaged app (dmg/zip/nsis) |
| `bun run electron:preview` | Preview packaged build |
