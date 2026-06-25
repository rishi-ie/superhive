# Superhive — Electron + React Desktop App

---

## Refactoring Progress

### Phase 1 ✅ Complete
Split 8 multi-component files into 20 individual files across 6 new subdirectories:
- `CenterWorkspace.tsx` → `CenterWorkspace.tsx` (orchestrator) + `TabBody.tsx` (dispatcher)
- `right-auxiliary/GlobalStatsTab.tsx` → `global-stats/` (7 files + dispatcher + index.ts barrel)
- `right-auxiliary/SessionsView.tsx` → `sessions/` (SessionsView + ThreadRow + index.ts barrel)
- `right-auxiliary/ProjectDetailsTab.tsx` → renamed to `project/ProjectOverviewTab.tsx`
- `right-auxiliary/TelemetryDeck.tsx` → `telemetry/` (TelemetryDeck + StatusPill + index.ts barrel)
- `left-nav/AccordionItem.tsx` → `accordion/` (AccordionItem + AccordionHeader + index.ts barrel)
- `center-workspace/UniversalTicketCard.tsx` → `tickets/` (UniversalTicketCard + PriorityTag + TypeTag + index.ts barrel)
- `archived/NewChatAccordion.tsx` deleted (not imported anywhere, had colliding `ChatEmptyState`)
- All import paths updated in `RightAuxiliary.tsx`, `AccordionCore.tsx`, `KanbanColumn.tsx`
- Build verified clean after Phase 1

### Phase 2 ✅ Complete
Extracted duplicated helpers to canonical homes:
- `src/lib/relative-time.ts` — canonical `formatRelativeTime()` (was in 5 files: CommunicationsView, UniversalChannelsView, UniversalProjectsView, ThreadRow, ChatThreadList)
- `src/components/ui/StatCard.tsx` — shared (was in GlobalStatsTab + ProjectOverviewTab + ProjectDetailView)
- `src/components/ui/SectionLabel.tsx` — shared (was in GlobalStatsTab)
- `src/components/channels/ChannelStatusPill.tsx` — shared (was in 5 files: Communications, CommunicationsView, UniversalChannelsView, ChannelDetailView, ChannelOverviewTab)
- `src/components/chat/format.ts` — shared `formatTime` + `formatDuration` (was in ChatMessage only)
- Updated all consuming files to use shared imports
- Build verified clean after Phase 2

### Phase 3 ✅ Complete
Moved loose config files into proper subdirectories:
- `wizard-configs.ts` → `src/data/config/wizard-configs.ts`
- `models.ts` → `src/data/config/models.ts`
- `right-panel-tabs.ts` → `src/data/config/right-panel-tabs.ts`
- `left-nav.ts` → `src/data/config/left-nav.ts`
- `feature-flags.ts` → `src/data/mock/feature-flags.ts` (from `src/lib/`)
- `mock-types.ts` → `src/data/mock/types.ts`
All 22 import paths updated across components, screens, and data stores.

### Phase 4 ✅ Complete
Resolved naming/duplicate issues:
- Deleted orphaned `src/components/ui/PanelEmptyState.tsx` (unused, simpler duplicate)
- `global-stats/StatCard.tsx` + `global-stats/SectionLabel.tsx` deleted — updated 4 subcomponents to import from canonical `src/components/ui/`
- Barrel `global-stats/index.ts` updated to remove re-exports of deleted local components

### Phase 5 ✅ Complete
Added top-of-file JSDoc blocks and component-level JSDoc on all ~86 TSX exports across:
- `center-workspace/` (33 files)
- `left-nav/` + `right-auxiliary/` (30 files)
- `ui/` + `channels/` + `archived/` (17 files)
- `screens/` + root `App.tsx` + `main.tsx` (6 files)

### Phase 6 ✅ Complete
- Deleted stale docs: `README.md`, `CLAUDE.md`, `DESIGN.md`, `design-spec.md`
- `CLEANUP_MOCK_DATA_FOR_PRODUCTION.md` completely rewritten to match current architecture (per-domain `isMockEnabled()` mock flag system, not the old single-directory approach)

### Phase 7 ✅ Complete
Centralized magic numbers into `src/lib/constants.ts`:
- Panel sizing: `DEFAULT_LEFT_WIDTH=280`, `DEFAULT_RIGHT_WIDTH=340`, `MIN/MAX_LEFT_WIDTH=180/400`, `MIN/MAX_RIGHT_WIDTH=200/500`
- Token cost math: `COST_PER_TOKEN=0.00001` (ChatView), `COST_PER_TASK=0.00003` (ControlMatrix)
- `App.tsx`, `Dashboard.tsx`, `ChatView.tsx`, `ControlMatrix.tsx` all now import from canonical constants

### Phase 8 ✅ Complete (Tier 1 — Quick Wins)
- Deleted 4 orphaned UI components (`DropdownTrigger`, `NavItem`, `RadioOption`, `ModelToolbar`)
- Deleted empty `src/hooks/` directory
- Deleted 6 orphaned `api.ts` placeholder files (agents, workspaces, projects, tickets, chat, favorites)
- Moved root-level containers to proper subdirectories:
  - `CenterWorkspace.tsx` → `center-workspace/CenterWorkspace.tsx`
  - `LeftNav.tsx` → `left-nav/LeftNav.tsx`
  - `RightAuxiliary.tsx` → `right-auxiliary/RightAuxiliary.tsx`
  - `TicketCard.tsx` → `center-workspace/tickets/TicketCard.tsx`
- Fixed `AgentsView.tsx` redundant inline `StatusDot` — now imports canonical from `ui/StatusDot`
- Added missing JSDoc on 4 files (`SettingsSidebar`, `ChannelStatusPill`, `StatCard`, `SectionLabel`)
- Added `typecheck` npm script; enabled `noUnusedLocals` and `noUnusedParameters` in tsconfig
- Fixed 61 unused imports/variables across 30 files (surfaced by strict tsconfig)
- Fixed double-quote import inconsistency in 3 files (`Settings.tsx`, `RightPanelTabs.tsx`, `Pill.tsx`)
- Created `.editorconfig` for cross-editor consistency

---

## What is this?

**Superhive** is a digital agent workspace — a command center for orchestrating autonomous AI agents. It features a three-panel layout:

- **Left Nav (Fleet Command)**: Workspace selector, active agents, favorites, accordion core (Projects, agents, Tickets, Automations, Communications, Remote), utilities (Settings, Help)
- **Center (Operations Deck)**: Tabbed workspace — Chat or Projects tab. Chat: AI thread + composer. Projects: operational swarm dashboard.
- **Right Auxiliary (Avionics)**: Agent telemetry, configuration controls, audit queue, and live activity feed

## Dev Commands

```sh
bun run dev           # Start Vite dev server + Electron (hot reload)
bun run electron:dev  # Alias for dev
bun run typecheck     # TypeScript type check (no emit)
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
- `tsconfig.json`: ESNext, bun types, bundler resolution; `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- `tailwind.config.js`: v4 (uses `@tailwindcss/postcss` plugin)
- `postcss.config.js`: `@tailwindcss/postcss` + autoprefixer
- `electron-builder.yml`: builds for mac/win/linux
- `.editorconfig`: cross-editor consistency (indent, charset, newline)

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

## Center Workspace — Multi-Tab Layout

The center panel uses a full multi-tab model. Every view (project, agent, ticket, channel) opens in its own tab. The tab strip is always visible when tabs exist.

### Tab Model (`src/data/tabs/`)

```
CenterTabType = 'projects' | 'project' | 'tickets' | 'ticket'
              | 'channels' | 'channel' | 'agents' | 'agent'
              | 'universal-agents' | 'universal-projects'
```

| Tab type | Description |
|---|---|
| `projects` | Workspace kanban dashboard (To Do / Executing / Done) |
| `project` | Single project detail (with selectedProjectId) |
| `tickets` | Workspace-wide ticket kanban (Backlog / Executing / Review / Merged) |
| `ticket` | Single ticket detail (with selectedTicketId) |
| `channels` | Workspace channel list |
| `channel` | Single channel detail (with selectedChannelId) |
| `agents` | Workspace agents list |
| `agent` | Single agent chat + telemetry (with selectedAgentId) |
| `universal-agents` | All agents across workspaces |
| `universal-projects` | All projects across workspaces |

**`src/data/tabs/store.ts`** — immutable state operations:
- `openOrFocusTab(state, tab)` — opens a new tab or reuses an existing one (dedup by type + workspaceId + entityId)
- `closeTab(state, tabId)` — closes a tab (pinned tabs cannot be closed)
- `selectTab(state, tabId)` — switches active tab
- `setSelection(state, tabId, selection)` — updates selectedAgentId/ProjectId/TicketId/ChannelId on a tab
- `getActiveTab(state)` — returns the active tab
- `makeInitialTabState(workspaceId)` — seeds one pinned `projects` tab

**Breadcrumb** — always 2–3 segments: `Workspace · Section · [Item]`. First two segments are clickable (jump to that section/workspace).

**Tab strip** — horizontal scrollable strip. `+` button opens a new tab picker for the active workspace. Keyboard: `Cmd+W` closes active tab, `Cmd+1..9` switches to tab N. Pinned tabs show a lock icon and cannot be closed.

**When no tabs exist** — `CenterEmptyState` shows a quick-start prompt with options to open Projects, Agents, Tickets, Comms, or browse lists.

### Components (`src/components/center-workspace/`)

- `CenterWorkspace` — root container; `switch (activeTab.type)` renders the correct view
- `CenterTabStrip` — tab strip with `+` new-tab picker
- `CenterTab` — individual tab pill (icon + label + close X, or lock if pinned)
- `CenterBreadcrumb` — 2–3 segment breadcrumb with workspace avatar
- `ProjectsView` — workspace kanban dashboard (3-column: To Do / Executing / Done) + SwarmRoster + Communications grid
- `TicketsView` — 4-column kanban (Backlog / Executing / Review / Merged) with search + sort + workspace filter
- `CommunicationsView` — channel list with status filter + unread indicators
- `AgentsView` — workspace agent list with status dots
- `UniversalAgentsView` — all agents across workspaces with search + sort + status filter
- `UniversalProjectsView` — all projects across workspaces with search + sort + workspace filter
- `ChatView` — chat thread with ChatInput at bottom
- `OnboardingWizard` — used for empty states (not as a persistent tab)

**Mock data** (`src/data/mock.json`):
- `tickets` — 8 per workspace (TODO/EXECUTING/DONE), assigned to agents
- `projectAgents` — 5 per workspace with WORKING/COMPILING/IDLE status
- `swarmActivity` — 6 inter-agent event log entries per workspace
- `channels` — 5 active communication channels per workspace
- `universalTickets` — 24 cross-workspace tickets with BACKLOG/EXECUTING/REVIEW/MERGED status

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
