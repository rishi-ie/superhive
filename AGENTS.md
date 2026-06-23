# Superhive — Electron + React Desktop App

## What is this?

**Superhive** is a digital agent workspace — a command center for orchestrating autonomous AI agents. It features a three-panel layout:

- **Left Nav (Fleet Command)**: Workspace selector, active agents, favorites, accordion core (Projects, agents, Tickets, Automations, Communications, Remote), utilities (Settings, Help)
- **Center (Operations Deck)**: Tabbed workspace — Chat or Projects tab. Chat: AI thread + composer. Projects: operational swarm dashboard.
- **Right Auxiliary (Avionics)**: Agent telemetry, configuration controls, audit queue, and live activity feed

## Dev Commands

```sh
bun run dev           # Start Vite dev server + Electron (hot reload)
bun run electron:dev  # Alias for dev
bun run build        # TypeScript compile + Vite production build
bun run electron:build  # build + electron-builder (produces dmg/zip in release/)
bun run electron:preview # vite build + launch electron with production build
```

## Architecture

- **Electron main process**: `electron/main.ts` → compiled to `dist-electron/main.js`
- **Preload**: `electron/preload.ts` → compiled to `dist-electron/preload.js`
- **Renderer**: React app in `src/`, entry `src/main.tsx`, served from `dist/`
- `vite-plugin-electron` handles compiling + watching electron main/preload separately from the renderer
- `VITE_DEV_SERVER_URL` env var tells electron where to load the dev server

## Key Configs

- `vite.config.ts`: Vite + React + electron plugins; `@` alias maps to `src/`
- `tsconfig.json`: ESNext, bun types, bundler resolution
- `tailwind.config.js`: v4 (uses `@tailwindcss/postcss` plugin)
- `postcss.config.js`: `@tailwindcss/postcss` + autoprefixer
- `electron-builder.yml`: builds for mac/win/linux
- `DESIGN.md`: Full design system documentation

## Left Nav Layout Structure

```
┌──────────────────────┐
│  Header (drag)       │
│  TeamSelector         │
├──────────────────────┤
│  Active              │  ← collapsible, status dots, Zap icon
│  Favorites           │  ← collapsible, Star icon
├──────────────────────┤
│  ▸ Projects [◈]     │  ← accordion core (scrollable)
│  ▾ agents  [◈]    │    defaultOpen, agent status dots
│  ▸ Tickets    [◈]   │
│  ▸ Automations [◈]  │
│  ▸ Communications[◈]│
│  ▸ Remote     [?]   │  ← Coming Soon badge
├──────────────────────┤
│  Settings      ?     │  ← utilities (sticky bottom)
└──────────────────────┘
```

**Accordion Core** (`src/components/left-nav/AccordionCore.tsx`):
- `AccordionItem` — reusable accordion with CSS grid height animation (chevron rotates 90°, smooth expand/collapse). Supports optional `badge` for inline labels (e.g. "Coming soon").
- `AccordionHeader` — same styling as AccordionItem but non-expandable (no chevron placeholder)
- `AgentListItem` — nested row with `StatusDot` for agent status visualization
- `StatusDot` (`src/components/ui/StatusDot.tsx`) — colored dot + spinner for agent statuses:
  - 🟢 EXECUTING → green + pulse animation
  - 🟡 COMPILING → gold + spinning Loader2
  - 🔴 ERROR_LOOP → red + pulse animation
  - 🟠 AWAITING_HUMAN → terracotta (solid)
  - ⚪ IDLE → muted gray

**Smart Views / Utilities** (`src/components/left-nav/Utilities.tsx`):
- `HelpPopover` — anchored dark popover (Documentation / Changelog / Shortcuts)
- Bell/Notifications removed in v1

## Center Workspace — Tabbed Layout

Tabs: **Chat** · **Projects** (like browser tabs, independent views). ChatInput hidden on Projects tab.

### Chat Tab
- `ChatThread` — user/assistant message bubbles
- `ChatInput` — textarea + model selectors + send
- `ChatEmptyState` — suggestion grid when no thread

### Projects Tab
Full operational swarm dashboard. Compact, information-dense layout:

```
┌──────────────────────────────────────────────────────────────┐
│  Superhive App (h1)                                        │
├─────────────────────┬─────────────────────┬──────────────────┤
│  To Do         3    │  Executing    2     │  Done       3   │
│  [card]            │  [card] ▌           │  [card]           │
│  [card]            │  [card] ▌           │  [card]           │
│  [+1 more]         │                     │  [+2 more]        │
├─────────────────────┴─────────────────────┴──────────────────┤
│  Active Agents              │  Communications                │
│  [agent] Marcus W. COMPILING│  [ch: Schema validation]      │
│  [agent] Priya S.  WORKING  │  [ch: DB snapshot handoff]    │
│  [agent] Sonia P.  COMPILING│  [ch: Design tokens]          │
└─────────────────────────────┴────────────────────────────────┘
```

**Components** (`src/components/center-workspace/`):
- `ProjectsView` — root layout container
- `ExecutionStream` — 3-column kanban (To Do / Executing / Done). Max 2 visible cards per column; overflow shown as "+ N more" dashed button
- `TicketCard` — ticket card with ID badge, bold title, agent avatar. EXECUTING cards have terracotta left border
- `SwarmRoster` — active agent profile cards with status dots, role, assigned ticket pill
- `Communications` — channel monitor rows with stacked avatar pairs, topic, last message preview, ticket pill, status indicator, unread dot

**Mock data** (`src/data/mock/project.ts`):
- `tickets` — 8 tickets (TODO/EXECUTING/DONE), assigned to agents
- `projectAgents` — 5 agents with WORKING/COMPILING/IDLE status
- `swarmActivity` — 6 inter-agent event log entries
- `channels` — 5 active communication channels between agent pairs

## Right Auxiliary (Avionics / Mission Control)

Three tabs: **Overview** · **Manage** · **Inbox**

### Overview Tab
- `TelemetryDeck` — agent identity, brain usage bar, cost card, last actions, next step
- `RightPanelActivityFeed` — compact activity log below TelemetryDeck (top 6 events, gates behind `USE_MOCK_DATA`). Single-line format: `timestamp · initials → initials · context`

### Manage Tab
- `ControlMatrix` — model engine cards, permission toggles, commit authority, thinking budget, terminate

### Inbox Tab
- `AuditQueue` — AUTH_INTERCEPT and DIFF_REVIEW cards with action buttons

## Design System

- **Theme**: Dark warm palette with terracotta accent (`#e07850`)
- **Colors**: CSS variables in `src/index.css`
- **Components**: Hand-rolled, no external UI library; Lucide icons with `STROKE_WIDTH` from `src/lib/constants.ts`
- **Panel sizing**: Left nav 280px default (180-400px range), Right panel 340px default (200-500px range)

## Data Architecture

**Agent/agent store** (`src/data/agents/`):
```
src/data/agents/
├── interface.ts   — Types + function signatures (the contract)
├── store.ts       — Public API; USE_MOCK_DATA flag lives here
└── api.ts         — Real API placeholder (swap in for real backend)
```

**Project data** (`src/data/mock/project.ts`):
```
src/data/mock/project.ts
├── Ticket, TicketStatus
├── ProjectAgent, AgentCurrentStatus
├── SwarmActivity
├── CommunicationChannel, ChannelStatus
└── tickets, projectAgents, swarmActivity, channels (mock data)
```

**Public API** (import from `@/data/agents/store`):
```ts
listAgents()        → Agent[]
getAgent(id)        → Agent | undefined
getActiveAgent()    → Agent | null
getTelemetry(id)       → Telemetry
getPermissions(id)     → Permissions
getAuditItems(id?)     → AuditItem[]
getActionLog(id)       → ActionLogEntry[]
getNextStep(id)        → string
```

**To swap in a real DB**: create `src/data/agents/api.ts` with the same signatures, then edit `store.ts` to import from `./api` instead of the mock data source.

## Mock Data Toggle

`VITE_USE_MOCK_DATA` env var controls whether mock data is used:
- `true` / unset → full mock data throughout the app
- `false` → empty states, safe for production

Set in `.env.local` (gitignored). See `CLEANUP_MOCK_DATA_FOR_PRODUCTION.md` for full cleanup steps.

## Archived Components

Located in `src/components/archived/`:
- **ModelToolbar**: Pill-based model selector with Set Run button
- **NewChatAccordion**: Expandable section header with split/close actions

## Common Mistakes

- Do NOT use `bun run index.ts` — this is an Electron app, not a Bun HTTP server. Use `bun run dev`.
- The `vite-plugin-electron` dev server is NOT `Bun.serve`. Do not apply CLAUDE.md's `Bun.serve()` patterns here.
- Do NOT use `better-sqlite3`, `ioredis`, `express`, or `ws` — Bun-native libs don't work in standard Electron main process without native rebuilds.
- `electron-log` is used for logging in the main process, not `console.log`.

## Dependencies

- `electron-log` for main process logging (initialized in `electron/main.ts`)
- `vite-plugin-electron` + `vite-plugin-electron-renderer` for build
- `@tailwindcss/postcss` (Tailwind v4) for CSS
- `lucide-react` for icons
