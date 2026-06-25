# Superhive — Contributor Guide

## Project

Digital agent workspace — a command center for orchestrating autonomous AI agents.
Three-panel layout: Left Nav (Fleet Command) · Center (Operations Deck) · Right Auxiliary (Avionics).
Electron + React + Vite + TypeScript + Tailwind v4.

---

## Quick Commands

```sh
bun install              # Install dependencies
bun run dev             # Dev server + Electron (hot reload)
bun run typecheck       # TypeScript check (strict: noUnusedLocals, noUnusedParameters)
bun run build           # typecheck + production build
bun run electron:build  # build + electron-builder (dmg/zip/nsis in release/)
bun run electron:preview # Preview packaged build
```

**Mock data** — controlled by `VITE_USE_MOCK_DATA` in `.env.local` (defaults to `true`).
See `CLEANUP_MOCK_DATA_FOR_PRODUCTION.md` for production cleanup steps.

---

## Directory Map

```
src/
├── App.tsx                    # Root shell — Dashboard or Settings
├── main.tsx                  # React entry point
├── index.css                 # Tailwind + CSS variables (dark warm theme, terracotta accent)
│
├── screens/
│   ├── Dashboard.tsx          # Main 3-panel layout (LeftNav + CenterWorkspace + RightAuxiliary)
│   └── Settings.tsx           # Settings screen
│
├── components/
│   ├── center-workspace/      # Center panel — all tab content lives here
│   │   ├── CenterWorkspace.tsx
│   │   ├── CenterTabStrip.tsx
│   │   ├── CenterTab.tsx
│   │   ├── CenterBreadcrumb.tsx
│   │   ├── TabBody.tsx       # Tab dispatcher — switch(activeTab.type) renders correct view
│   │   ├── ProjectsView.tsx   # Kanban: To Do / Executing / Done
│   │   ├── ProjectDetailView.tsx
│   │   ├── TicketsView.tsx     # Kanban: Backlog / Executing / Review / Merged
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── SwarmRoster.tsx
│   │   ├── ExecutionStream.tsx
│   │   ├── Communications.tsx
│   │   ├── CommunicationsView.tsx
│   │   ├── ChannelDetailView.tsx
│   │   ├── UniversalChannelsView.tsx
│   │   ├── UniversalProjectsView.tsx
│   │   ├── AgentsView.tsx
│   │   ├── UniversalAgentsView.tsx
│   │   ├── ChatView.tsx
│   │   ├── ChatThread.tsx
│   │   ├── ChatThreadList.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatHeader.tsx
│   │   ├── ChatEmptyState.tsx
│   │   ├── OnboardingWizard.tsx
│   │   ├── TicketCard.tsx     # Single workspace ticket card (used in ExecutionStream)
│   │   └── tickets/           # Ticket-related shared components
│   │       ├── UniversalTicketCard.tsx
│   │       ├── TicketCard.tsx
│   │       ├── PriorityTag.tsx
│   │       ├── TypeTag.tsx
│   │       └── index.ts
│   │
│   ├── left-nav/             # Left sidebar — workspace selector, active, favorites, accordion
│   │   ├── LeftNav.tsx
│   │   ├── LeftNavHeader.tsx
│   │   ├── TeamSelector.tsx
│   │   ├── ActiveSection.tsx
│   │   ├── FavoritesSection.tsx
│   │   ├── AccordionCore.tsx
│   │   ├── ProjectListItem.tsx
│   │   ├── AgentListItem.tsx
│   │   ├── HelpPopover.tsx
│   │   ├── Utilities.tsx
│   │   └── accordion/        # Accordion primitives
│   │       ├── AccordionItem.tsx
│   │       ├── AccordionHeader.tsx
│   │       └── index.ts
│   │
│   ├── right-auxiliary/      # Right sidebar — telemetry, controls, audit
│   │   ├── RightAuxiliary.tsx
│   │   ├── RightPanelTabs.tsx
│   │   ├── RightPanelActivityFeed.tsx
│   │   ├── PanelEmptyState.tsx
│   │   ├── ControlMatrix.tsx
│   │   ├── AuditQueue.tsx
│   │   ├── TicketOverviewTab.tsx
│   │   ├── TicketManageTab.tsx
│   │   ├── ChannelOverviewTab.tsx
│   │   ├── ChannelManageTab.tsx
│   │   ├── ChannelThreadTab.tsx
│   │   ├── ProjectInboxTab.tsx
│   │   ├── ProjectManageTab.tsx
│   │   ├── global-stats/     # Stats views for universal/channels-lists views
│   │   │   ├── GlobalStatsTab.tsx
│   │   │   ├── ChannelStats.tsx
│   │   │   ├── AgentStats.tsx
│   │   │   ├── UniversalAgentStats.tsx
│   │   │   ├── UniversalProjectStats.tsx
│   │   │   └── index.ts
│   │   ├── sessions/         # Chat sessions
│   │   │   ├── SessionsView.tsx
│   │   │   ├── ThreadRow.tsx
│   │   │   └── index.ts
│   │   ├── telemetry/       # Agent telemetry
│   │   │   ├── TelemetryDeck.tsx
│   │   │   ├── StatusPill.tsx
│   │   │   └── index.ts
│   │   └── project/         # Project context panel
│   │       ├── ProjectOverviewTab.tsx
│   │       └── index.ts
│   │
│   ├── ui/                  # Shared primitives — use these, don't reinvent
│   │   ├── Avatar.tsx
│   │   ├── Button.tsx
│   │   ├── IconButton.tsx
│   │   ├── NewButton.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Select.tsx
│   │   ├── TextInput.tsx
│   │   ├── Toggle.tsx
│   │   ├── Pill.tsx
│   │   ├── StatusDot.tsx     # Agent status indicator — EXECUTING/COMPILING/IDLE/ERROR_LOOP/AWAITING_HUMAN
│   │   ├── StatusFilter.tsx
│   │   ├── UniversalListCard.tsx
│   │   ├── SectionLabel.tsx  # Section heading for stat panels
│   │   ├── StatCard.tsx      # Stat card for global stats views
│   │   ├── MaximizeOnDoubleClick.tsx
│   │   └── index.ts          # (intentionally incomplete — direct imports preferred for tree-shaking)
│   │
│   ├── channels/            # Channel-specific shared components
│   │   ├── ChannelStatusPill.tsx
│   │   └── index.ts
│   │
│   ├── chat/               # Chat-specific helpers (no React dependencies)
│   │   └── format.ts        # formatTime(), formatDuration()
│   │
│   └── settings/           # Settings screen subcomponents
│       ├── SettingsSidebar.tsx
│       └── AccountSettings.tsx
│
├── data/                    # Domain data layer — one subdirectory per domain
│   ├── agents/             # listAgents(), getAgent(), getTelemetry(), getPermissions(), etc.
│   ├── chat/               # listThreads(), addMessageToActiveThread(), etc.
│   ├── favorites/          # listFavorites(), etc.
│   ├── projects/           # listProjects(), getProject(), listChannels(), etc.
│   ├── tickets/            # listUniversalTickets(), etc.
│   ├── universal-projects/
│   ├── workspaces/
│   ├── tabs/              # Tab state: openTab(), closeTab(), selectTab(), setSelection()
│   │
│   ├── config/             # Static config — wizard definitions, nav items, right panel tabs
│   │   ├── wizard-configs.ts
│   │   ├── left-nav.ts
│   │   ├── right-panel-tabs.ts
│   │   └── models.ts
│   │
│   └── mock/               # Mock data config and types
│       ├── feature-flags.ts  # isMockEnabled(domain) — per-domain mock toggle
│       └── types.ts          # Shared mock seed types (FavoriteSeed, ChatThreadSeed, etc.)
│
└── lib/                     # Pure utilities — no React
    ├── constants.ts          # Panel sizing, token costs, STROKE_WIDTH
    ├── relative-time.ts     # formatRelativeTime()
    ├── markdown.ts          # parseMarkdown()
    └── use-double-click.ts
```

---

## Module Conventions

These rules are enforced by TypeScript (`noUnusedLocals: true`, `noUnusedParameters: true`) and review. Every contributor — human or agent — follows them.

### One component per file
File name matches the default export name. No multi-export files except:
- `index.ts` barrels that re-export sibling components
- Co-located type-only exports (e.g. `type FooProps` in `Foo.tsx` beside `Foo`)

### JSDoc required
Every `.tsx` file needs:
1. A top-of-file `/** ... */` block describing what the file provides
2. A `/** ... */` on the main exported component/function with `@param` for each prop

### Imports
- Always use `@/` alias — never `../../` or other relative paths crossing directory boundaries
- Sibling imports within the same directory: `./SiblingName`
- Never import sibling files via parent: no `./ParentDir/Child` from within `ParentDir/`

### Centralization rules
| What | Where |
|---|---|
| Magic numbers (panel sizes, token costs, animation durations, debounce ms) | `src/lib/constants.ts` |
| Formatting helpers with no React deps (time, cost, text utils) | `src/lib/` or `src/components/chat/format.ts` |
| Reusable UI primitives | `src/components/ui/` |
| Channel-specific shared | `src/components/channels/` |
| Chat-specific shared helpers | `src/components/chat/` |
| Static config (wizards, nav, tabs) | `src/data/config/` |
| Domain data | `src/data/{domain}/store.ts` |

### No new files at `src/components/` root
Every new component goes in the correct subdirectory (see Component Placement below).

### Barrel files
Create `index.ts` in any new subdirectory with 2+ sibling files. Keep barrels focused — don't re-export from parent directories.

### Tailwind / CSS
- No inline magic hex colors — use CSS variables (`--chart-1`, `--accent`, etc.) defined in `src/index.css`
- No invented arbitrary values — use existing design tokens

### TypeScript
- `noUnusedLocals: true` and `noUnusedParameters: true` are enforced — fix all errors before committing
- Run `bun run typecheck` before every commit

### Style
- Single quotes for imports and strings
- `.editorconfig` at root enforces: 2-space indent, UTF-8, LF, trim-trailing-whitespace

---

## Component Placement

Use this table to decide where a new file belongs.

| New thing | Put it in |
|---|---|
| Reusable across any panel (Button, Avatar, Badge, etc.) | `src/components/ui/` |
| Channel status display | `src/components/channels/` |
| Chat formatting helpers (no React) | `src/components/chat/` |
| Center panel content | `src/components/center-workspace/` or a subdirectory inside it |
| Left sidebar content | `src/components/left-nav/` |
| Right sidebar content | `src/components/right-auxiliary/` |
| A distinct group of related components inside a panel | `src/components/{panel}/{feature}/` with `index.ts` barrel |
| Pure utility (no React) | `src/lib/` |
| Static app config (wizard, nav, tabs) | `src/data/config/` |
| A data domain | `src/data/{domain}/` with `interface.ts` + `store.ts` |

---

## Data Layer Contract

Every domain follows this pattern:

```
src/data/{domain}/
├── interface.ts   # Type definitions + function signatures
└── store.ts       # Public API implementation (imports from interface)
```

The store is the **only** public API for a domain. Components never import from sibling mock files — they always go through the store.

Mock data is gated behind `isMockEnabled(domain)` in `src/data/mock/feature-flags.ts`. When disabled, stores return empty arrays — UI must handle empty states gracefully.

To add a new domain: create the `interface.ts` + `store.ts` pair, add mock data to `src/data/mock.json` if needed, wire into the appropriate dispatcher.

---

## Common Gotchas

- **Wrong dev command**: `bun run index.ts` does not work — this is an Electron app. Use `bun run dev`.
- **Main process logging**: use `electron-log` — `console.log` in `electron/main.ts` won't appear in devtools.
- **Bun-native libs**: `better-sqlite3`, `ioredis`, `express`, `ws` don't work in the Electron main process without native rebuilds.
- **vite-plugin-electron ≠ Bun.serve** — don't apply Bun HTTP server patterns here.
- **`src/components/archived/`** does not exist — no files go there.
- **No `api.ts` placeholder files** — if a domain needs a real backend, wire it directly into the store; don't create dormant `api.ts` files.

---

## Adding a New Feature

```
1. Domain data — add types to src/data/{domain}/interface.ts, implement in store.ts
2. Mock data — extend src/data/mock.json (domain seed) + src/data/mock/types.ts if needed
3. Component — create file in correct subdirectory (see Component Placement)
   - Top-of-file JSDoc block
   - Component JSDoc with @param for each prop
4. Wire it — add to TabBody.tsx dispatcher, RightAuxiliary.tsx, or AccordionCore.tsx
5. TypeScript — bun run typecheck (must pass, no unused locals/params)
6. Build — bun run build (must pass)
7. Update this guide if you add a new convention or shared utility location
```
