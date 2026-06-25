# Superhive

A digital agent workspace — a command center for orchestrating autonomous AI agents. Three-panel layout with agent telemetry, tabbed workspace management, and real-time swarm activity.

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

Mock data is enabled by default. The app uses per-domain mock flags so each data area can be toggled independently.

**Enable/disable globally** — edit `.env.local`:

```sh
VITE_USE_MOCK_DATA=true   # default — full mock data
VITE_USE_MOCK_DATA=false   # empty states everywhere
```

**Toggle a specific domain** — set any of these in `.env.local` (each overrides the global flag):

```sh
VITE_MOCK_WORKSPACES=false
VITE_MOCK_AGENTS=false
VITE_MOCK_PROJECTS=false
VITE_MOCK_TICKETS=false
VITE_MOCK_CHAT=false
VITE_MOCK_FAVORITES=false
```

See `CLEANUP_MOCK_DATA_FOR_PRODUCTION.md` for full cleanup steps when going to production.

## Architecture

```
src/
├── App.tsx              # Root shell — Dashboard or Settings
├── main.tsx             # React entry point
├── index.css            # Tailwind + CSS variables (theme)
├── screens/
│   ├── Dashboard.tsx    # Main 3-panel layout
│   └── Settings.tsx      # Settings screen
├── components/
│   ├── center-workspace/ # Projects, agents, tickets, channels, chat tabs
│   ├── left-nav/         # Fleet command sidebar
│   ├── right-auxiliary/  # Telemetry, controls, audit queue
│   ├── ui/               # Shared primitives (Button, Avatar, StatusDot…)
│   ├── channels/         # ChannelStatusPill
│   ├── chat/             # formatTime / formatDuration helpers
│   └── settings/         # SettingsSidebar, AccountSettings
├── data/
│   ├── agents/           # listAgents(), getAgent(), getTelemetry()…
│   ├── chat/
│   ├── favorites/
│   ├── projects/
│   ├── tickets/
│   ├── universal-projects/
│   ├── workspaces/
│   ├── tabs/             # Tab open/focus/close state
│   ├── config/           # Wizard configs, nav items, right panel tabs
│   └── mock/             # feature-flags.ts, types.ts
└── lib/
    ├── constants.ts      # Panel sizing, token costs, STROKE_WIDTH
    ├── relative-time.ts  # formatRelativeTime()
    ├── markdown.ts       # parseMarkdown()
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
