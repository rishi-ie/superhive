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
├── index.css                 # Tailwind v4 + CSS variables (dark warm theme, terracotta accent)
├── hooks/                    # Shared React hooks
│   └── use-mobile.ts         # Mobile breakpoint detection (shadcn utility)
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
│   ├── ui/                  # Shared primitives — use these, don't reinvent (shadcn/ui + custom)
│   │   ├── Accordion.tsx
│   │   ├── AccordionContent.tsx
│   │   ├── AccordionItem.tsx
│   │   ├── AccordionTrigger.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx         # CVA variants: default/destructive/outline/secondary/ghost/link
│   │   ├── Card.tsx           # Card/CardHeader/CardTitle/CardDescription/CardContent/CardFooter
│   │   ├── Checkbox.tsx
│   │   ├── Collapsible.tsx
│   │   ├── Command.tsx
│   │   ├── Dialog.tsx         # Dialog/DialogContent/DialogHeader/DialogTitle/DialogDescription etc.
│   │   ├── DropdownMenu.tsx   # DropdownMenu/DropdownMenuContent/DropdownMenuItem etc.
│   │   ├── HoverCard.tsx
│   │   ├── IconButton.tsx
│   │   ├── Label.tsx
│   │   ├── NewButton.tsx
│   │   ├── Pill.tsx
│   │   ├── Popover.tsx
│   │   ├── Progress.tsx
│   │   ├── RadioGroup.tsx
│   │   ├── ScrollArea.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SectionLabel.tsx  # Section heading for stat panels
│   │   ├── Select.tsx         # Radix Select — SelectTrigger/SelectContent/SelectItem
│   │   ├── SelectableCard.tsx
│   │   ├── Separator.tsx
│   │   ├── SegmentedControl.tsx
│   │   ├── Sheet.tsx          # Sheet/SheetContent/SheetHeader/SheetTitle etc.
│   │   ├── Skeleton.tsx
│   │   ├── Slider.tsx
│   │   ├── StatCard.tsx      # Stat card for global stats views
│   │   ├── StatusDot.tsx     # Agent status indicator — EXECUTING/COMPILING/IDLE/ERROR_LOOP/AWAITING_HUMAN
│   │   ├── StatusFilter.tsx
│   │   ├── Switch.tsx         # Radix Switch — for form on/off toggles
│   │   ├── Tabs.tsx
│   │   ├── TabsContent.tsx
│   │   ├── TabsList.tsx
│   │   ├── TabsTrigger.tsx
│   │   ├── TextInput.tsx
│   │   ├── Textarea.tsx
│   │   ├── Toggle.tsx         # Radix Switch — for settings boolean toggles
│   │   ├── Tooltip.tsx
│   │   ├── TooltipProvider.tsx
│   │   ├── UniversalListCard.tsx
│   │   ├── CodeBlock.tsx      # Syntax-highlighted code (uses appearance.codeSyntaxTheme)
│   │   ├── MaximizeOnDoubleClick.tsx
│   │   └── index.ts
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
    ├── utils.ts             # cn() — shadcn utility (clsx + tailwind-merge)
    └── use-double-click.ts
```

---

## Module Conventions

These rules are enforced by TypeScript (`noUnusedLocals: true`, `noUnusedParameters: true`) and review. Every contributor — human or agent — follows them.

### One component per file
File name matches the exported name. Every `.tsx` file exports exactly one component (named export). No multi-component files except:
- `index.ts` barrels that re-export sibling components
- Co-located type-only exports (e.g. `type FooProps` in `Foo.tsx` beside `Foo`)

The codebase uses named exports throughout (`export function Foo()`) — `export default` is not used.

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
|---|---|---|
| Magic numbers (panel sizes, token costs, animation durations, debounce ms) | `src/lib/constants.ts` |
| Formatting helpers with no React deps (time, cost, text utils) | `src/lib/` or `src/components/chat/format.ts` |
| Reusable UI primitives | `src/components/ui/` |
| Channel-specific shared | `src/components/channels/` |
| Chat-specific shared helpers | `src/components/chat/` |
| Static config (wizards, nav, tabs) | `src/data/config/` |
| Domain data | `src/data/{domain}/store.ts` |
| User settings defaults | `src/data/settings/settings.json` |

### Settings architecture

Settings live in `src/data/settings/settings.json` (seeded defaults) + `localStorage` (user overrides). The `SettingsProvider` in `src/lib/settings-context.tsx` merges them: if `localStorage` has a value for a key, it wins over the JSON default.

The `Settings` type in `src/data/settings/interface.ts` defines the shape. All settings pages live under `src/components/settings/` and update via `useSettings().update(domain, patch)`.

**Appearance settings** are applied directly to the DOM via `applySettingsToDOM()`:
- `appearance.theme` → CSS vars + `data-theme` on `<html>`
- `appearance.accentColor` → `--highlight`, `--accent`, `--chart-1`, `--sidebar-primary`
- `appearance.fontScale` → `font-size` on `<html>` (rem-based text scales; pixel-arbitrary `text-[Npx]` classes do not)
- `appearance.reduceMotion` → `data-reduce-motion` attr; CSS kills all transitions when `"true"`
- `appearance.codeSyntaxTheme` → `CodeBlock` component uses this for `<pre>` background/foreground

**Adaptive wiring rule**: every setting must drive visible UI. If a setting is stored but never consumed outside its settings page, it is a bug — fix it in the same PR that adds the setting.

**Adding a new setting**: update `settings.json`, add the type in `interface.ts`, add the UI in the appropriate `*Settings.tsx` page, and consume it in the component that needs it. All four in the same PR.

**`account.accentColor`** was removed — it was a duplicate of `appearance.accentColor`. Always use `appearance.accentColor`.

### No new files at `src/components/` root
Every new component goes in the correct subdirectory (see Component Placement below).

### Barrel files
Create `index.ts` in any new subdirectory with 2+ sibling files. Keep barrels focused — don't re-export from parent directories.

### Tailwind / CSS
- No inline magic hex colors — use CSS variables (`--chart-1`, `--accent`, etc.) defined in `src/index.css`
- No invented arbitrary values — use existing design tokens
- Animation utilities (`animate-in`, `fade-in-0`, `zoom-in-95`, etc.) are provided by `tw-animate-css` — import via `src/index.css`
- shadcn components use `@theme inline` CSS variables (see `src/index.css`) for theming — use them instead of hardcoded values

### shadcn/ui conventions
This project uses shadcn/ui as the component foundation. Key conventions:
- **Add new shadcn components**: run `bunx shadcn@latest add <component-name>` (CLI adds to `src/components/ui/`)
- **Filename convention**: PascalCase (`Button.tsx`, not `button.tsx`) — preserves existing import paths
- **Variant naming**: `Button` uses `variant="default"` (not `"solid"`) and `variant="outline"` — existing `variant="solid"` call sites were migrated to `variant="default"` in the initial shadcn overhaul
- **cn() utility**: shadcn components use `cn()` from `@/lib/utils` (clsx + tailwind-merge) for composing class names
- **CVA for variants**: use `class-variance-authority` (CVA) for components with multiple variant/size axes (Button, Badge, Pill)
- **Radix primitives**: shadcn is built on Radix UI primitives (`@radix-ui/react-*`); import them from the radix package directly, not from shadcn
- **`verbatimModuleSyntax: true`**: TypeScript requires explicit named imports for all used identifiers — always write `import { forwardRef } from 'react'` not just `import React from 'react'` when using React types
- **Theme tokens**: shadcn components read CSS variables from `src/index.css` — our custom `--chart-1..5`, `--highlight`, `--tertiary` etc. are available and used by custom components
- **Domain components**: IconButton, StatusDot, StatusFilter, SegmentedControl, CodeBlock, SectionLabel, StatCard, SelectableCard, UniversalListCard, MaximizeOnDoubleClick, AccordionCore, FavoritesSection — these are custom domain primitives, not in shadcn; keep them as-is

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
   - Prefer shadcn primitives if available (see shadcn/ui conventions)
   - For new UI primitives, use CVA for variants + cn() for class composition
4. Wire it — add to TabBody.tsx dispatcher, RightAuxiliary.tsx, or AccordionCore.tsx
5. TypeScript — bun run typecheck (must pass, no unused locals/params)
6. Build — bun run build (must pass)
7. Update this guide if you add a new convention or shared utility location
```
