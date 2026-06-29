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
├── types/                    # Type declarations
│   └── electron.d.ts         # Electron IPC types
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
│   │   ├── HomeView.tsx       # Workspace home: stats, projects, agents, channels, ticket board
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
│   │   ├── CreateProjectDialog.tsx  # Modal for capturing a new project's initial state
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
│   │   ├── ArchivedProjectsSection.tsx  # Bottom-of-sidebar section listing archived projects
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
│   │   ├── ControlMatrix.tsx
│   │   ├── AuditQueue.tsx
│   │   ├── TicketOverviewTab.tsx
│   │   ├── TicketManageTab.tsx
│   │   ├── ChannelOverviewTab.tsx
│   │   ├── ChannelManageTab.tsx
│   │   ├── ProjectManageTab.tsx
│   │   ├── dashboard/       # Inbox + overview for dashboard context
│   │   │   ├── DashboardOverview.tsx
│   │   │   ├── DashboardInbox.tsx
│   │   │   └── index.ts
│   │   ├── global-stats/     # Stats views for universal/channels-lists views
│   │   │   ├── GlobalStatsTab.tsx
│   │   │   ├── ChannelStats.tsx
│   │   │   ├── AgentStats.tsx
│   │   │   ├── UniversalAgentStats.tsx
│   │   │   ├── UniversalProjectStats.tsx
│   │   │   └── index.ts
│   │   ├── inbox/           # Per-entity inbox panels
│   │   │   ├── AgentInbox.tsx
│   │   │   ├── ChannelInbox.tsx
│   │   │   ├── ProjectInbox.tsx
│   │   │   ├── TicketInbox.tsx
│   │   │   └── index.ts
│   │   ├── sessions/        # Chat sessions
│   │   │   ├── SessionsView.tsx
│   │   │   ├── ThreadRow.tsx
│   │   │   └── index.ts
│   │   ├── shared/          # ConfirmationModal, BulkActionBar, EmptyState, FilterChips
│   │   │   ├── ConfirmationModal.tsx
│   │   │   ├── BulkActionBar.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── FilterChips.tsx
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
│   │   ├── SaveBar.tsx        # Save/Cancel bar — variant: 'sticky' | 'inline'
│   │   ├── ScrollArea.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SectionLabel.tsx   # Section heading for stat panels
│   │   ├── Select.tsx         # Radix Select — SelectTrigger/SelectContent/SelectItem
│   │   ├── Separator.tsx
│   │   ├── SegmentedControl.tsx
│   │   ├── Sheet.tsx          # Sheet/SheetContent/SheetHeader/SheetTitle etc.
│   │   ├── Skeleton.tsx
│   │   ├── Slider.tsx
│   │   ├── StatCard.tsx       # Stat card for global stats views
│   │   ├── StatusDot.tsx      # Agent status indicator — EXECUTING/COMPILING/IDLE/ERROR_LOOP/AWAITING_HUMAN
│   │   ├── StatusFilter.tsx
│   │   ├── Switch.tsx         # Canonical shadcn Switch — terracotta accent on-state
│   │   ├── Tabs.tsx
│   │   ├── TabsContent.tsx
│   │   ├── TabsList.tsx
│   │   ├── TabsTrigger.tsx
│   │   ├── TextInput.tsx
│   │   ├── Textarea.tsx
│   │   ├── Toast.tsx            # Sonner toast — exported from ui/index.ts
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
│       ├── shared/          # Shared settings primitives
│       │   ├── ComingSoonBadge.tsx
│       │   ├── ColorPicker.tsx
│       │   ├── ResetSection.tsx
│       │   ├── SelectableCard.tsx
│       │   ├── SettingRow.tsx
│       │   ├── SettingSection.tsx
│       │   ├── SettingSearch.tsx
│       │   ├── SettingsPageHeader.tsx
│       │   └── index.ts
│       ├── SettingsSidebar.tsx
│       ├── AccountSettings.tsx
│       ├── AppearanceSettings.tsx
│       ├── NotificationsSettings.tsx
│       ├── PrivacySettings.tsx
│       ├── AccessibilitySettings.tsx
│       ├── DefaultsSettings.tsx
│       ├── KeyboardSettings.tsx
│       ├── ModelsSettings.tsx
│       ├── WorkflowsSettings.tsx
│       ├── CostUsageSettings.tsx
│       ├── AgentsSettings.tsx
│       ├── WorkspacesSettings.tsx
│       ├── IntegrationsSettings.tsx
│       └── BillingSettings.tsx
│
├── data/                    # Domain data layer — one subdirectory per domain
│   ├── agents/             # listAgents(), getAgent(), getTelemetry(), getPermissions(), etc.
│   ├── chat/               # listThreads(), addMessageToActiveThread(), etc.
│   ├── cost-usage/         # listCostUsage() — cost and usage history
│   ├── favorites/          # listFavorites(), etc.
│   ├── left-nav/           # AccordionAgent type (interface only; data reshaped in AccordionCore)
│   ├── projects/           # listProjects(opts), getProject(), createProject(), archiveProject(), unarchiveProject(), listChannels(), etc.
│   ├── settings/           # Settings type + seeded defaults (settings.json) — canonical source
│   ├── tickets/            # listUniversalTickets(), etc.
│   ├── tabs/               # Tab state: openTab(), closeTab(), selectTab(), setSelection()
│   ├── universal-projects/
│   ├── workspaces/
│   │
│   ├── config/             # Static config — wizard definitions, nav items, right panel tabs, themes
│   │   ├── wizard-configs.ts
│   │   ├── left-nav.ts
│   │   ├── right-panel-tabs.ts
│   │   ├── models.ts
│   │   ├── themes.ts        # Built-in theme definitions + ALL_THEME_VARS
│   │   └── settings-registry.ts  # Settings nav registry — single source of truth for all settings pages
│   │
│   └── mock/               # Mock data — single source of truth
│       ├── mock.json       # All seed data (workspaces, projects, agents, tickets, themes, etc.)
│       ├── index.ts        # Central toggle + mockableData (the single place the env var is read)
│       └── types.ts        # Shared mock seed types (FavoriteSeed, ChatThreadSeed, etc.)
│
└── lib/                     # Pure utilities — no React (except contexts below)
    ├── constants.ts          # Panel sizing, token costs, STROKE_WIDTH
    ├── debounce.ts           # Debounce utility
    ├── initials.ts           # Initials extraction utility
    ├── markdown.ts           # parseMarkdown()
    ├── pluralize.ts          # Pluralization helper
    ├── relative-time.ts      # formatRelativeTime()
    ├── settings-context.tsx  # SettingsProvider + useSettings() — applies appearance to DOM
    ├── toast-context.tsx    # ToastProvider — sonner toast context
    ├── utils.ts              # cn() — shadcn utility (clsx + tailwind-merge)
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
|---|---|
| Magic numbers (panel sizes, token costs, animation durations, debounce ms) | `src/lib/constants.ts` |
| Formatting helpers with no React deps (time, cost, text utils) | `src/lib/` or `src/components/chat/format.ts` |
| Reusable UI primitives | `src/components/ui/` |
| Settings-only primitives (page header, save bar, color picker) | `src/components/settings/shared/` |
| Channel-specific shared | `src/components/channels/` |
| Chat-specific shared helpers | `src/components/chat/` |
| Static config (wizards, nav, tabs, themes) | `src/data/config/` |
| Domain data | `src/data/{domain}/store.ts` |
| User settings defaults | `src/data/settings/settings.json` |

### Settings architecture

Settings live in `src/data/settings/settings.json` (seeded defaults) + `localStorage` (user overrides). The `SettingsProvider` in `src/lib/settings-context.tsx` merges them: if `localStorage` has a value for a key, it wins over the JSON default.

The `Settings` type in `src/data/settings/interface.ts` defines the shape. All settings pages live under `src/components/settings/` and update via `useSettings().update(domain, patch)`.

**Settings navigation** is data-driven via `src/data/config/settings-registry.ts` — the single source of truth for all 14 settings page entries (id, label, icon, category, component). `Settings.tsx` and `SettingsSidebar.tsx` both derive from this registry rather than duplicating nav data.

**Built-in themes** are defined in `src/data/config/themes.ts` as `DEFAULT_THEMES` (light, dark, system). Theme CSS variables are applied to `<html>` via `applySettingsToDOM()` in `src/lib/settings-context.tsx`.

**Appearance settings** are applied directly to the DOM via `applySettingsToDOM()`:
- `appearance.theme` → CSS vars + `data-theme` on `<html>`. **Theme is authoritative for brand color** (`--chart-1`, `--sidebar-primary`, `--accent`, `--accent-foreground`, `--highlight-foreground`). Changing theme → buttons, badges, tabs, borders, sidebar accents all update.
- `appearance.highlightColor` → user-controllable highlight subset only: `--highlight`, `--highlight-match`, `--highlight-active`, `--highlight-foreground`. Drives selection/match backgrounds, active link underlines, Switch on-state, Pill active state. **Does not** affect `--chart-1` / `--sidebar-primary` — those are theme-owned.
- `appearance.fontScale` → `font-size` on `<html>` (rem-based text scales; pixel-arbitrary `text-[Npx]` classes do not)
- `appearance.reduceMotion` → `data-reduce-motion` attr; CSS kills all transitions when `"true"`
- `appearance.codeSyntaxTheme` → `CodeBlock` component uses this for `<pre>` background/foreground

**Theme modularity rule**: changing a value in `:root` or any theme's `vars` MUST propagate to the whole app via the CSS variable cascade (`@theme inline` exposes them as Tailwind utilities like `bg-chart-1`). Do not write theme-defined vars from settings — settings only override the narrow user-tunable subset (`--highlight*` family).

**Adaptive wiring rule**: every setting must drive visible UI. If a setting is stored but never consumed outside its settings page, it is a bug — fix it in the same PR that adds the setting.

**Adding a new setting**: update `settings.json`, add the type in `interface.ts`, add the UI in the appropriate `*Settings.tsx` page, and consume it in the component that needs it. All four in the same PR.

**Adding a new settings page**: create the page in `src/components/settings/`, add it to `settings-registry.ts` (nav entry with id/label/icon/category/component), and add it to `settingsCategories` in the same file.

**`appearance.accentColor`** was renamed to `appearance.highlightColor` with narrower scope — it no longer affects `--chart-1` / `--sidebar-primary` (theme-owned). To change the brand color, edit the theme.

---

### Keyboard shortcuts architecture

Keyboard shortcuts are **developer-controlled**, not user-rebindable. The system lives in `src/lib/shortcuts/`. One file is the single source of truth: **`src/lib/shortcuts/registry.ts`**.

**Adding a new shortcut** (3 steps):
1. Add one entry to `DEFAULT_SHORTCUTS` in `registry.ts` (id, label, description, category, chord, scope)
2. Add one handler in `src/lib/shortcuts/actions.ts` and register it in the `ACTIONS` map (keyed by shortcut id)
3. Done — Dashboard automatically dispatches it, the settings page lists it, and any `<ShortcutHint shortcutId="…" />` you add renders the platform-appropriate chord.

**Files**:
| File | Purpose |
|---|---|
| `src/lib/shortcuts/registry.ts` | `DEFAULT_SHORTCUTS` — the single source of truth |
| `src/lib/shortcuts/actions.ts` | One handler per shortcut, exported in `ACTIONS` map |
| `src/lib/shortcuts/useGlobalShortcuts.ts` | Window keydown listener + dispatcher (mounted once in `Dashboard.tsx`) |
| `src/lib/shortcuts/chord.ts` | Chord normalization, event matching, input/dialog detection |
| `src/lib/shortcuts/format.ts` | Platform-aware chord formatter (`⌘K` on Mac, `Ctrl K` on Win/Linux) |
| `src/lib/shortcuts/platform.ts` | `usePlatform()` hook + `detectPlatform()` |
| `src/components/ui/Kbd.tsx` | Single key cap primitive |
| `src/components/shortcuts/` | `KbdGroup`, `ShortcutHint`, `ShortcutRow`, `CategoryGroup`, `CommandPalette` |

**Chord conventions**:
- `{ mac: 'Mod+k', default: 'Mod+k' }` — single string for both platforms (Mod = Cmd on Mac, Ctrl elsewhere)
- `{ mac: 'Mod+Option+Right', default: 'Ctrl+Alt+Right' }` — explicit divergence when needed
- `Escape`, `Enter`, `ArrowUp`, `Space` — unnamed keys are unescaped
- `Mod+1`–`Mod+9` are the tab cycle bindings

**Scope values**:
- `'global'` (default) — fires when not in any input or dialog
- `'always'` — fires even inside inputs / open modals (use sparingly, e.g. `Mod+Enter` send)
- `'in-canvas'` — fires only when a center tab is active (skip on the settings page)

**Surfacing hints in UI**: `<ShortcutHint shortcutId="palette.open" />` for chip-style, or `<ShortcutHint shortcutId="palette.open" compact />` for inline text. Drop into `Button`s, dropdown items, table rows, or anywhere a hint should appear.

**Help→CommandPalette bridge**: `HelpPopover`'s "Shortcuts" item dispatches a `app:open-command-palette` event that Dashboard listens for. Pattern is reusable for other menu→action wirings.

**Validation**: `runRegistryValidation()` runs in dev on Dashboard mount and logs conflicts (duplicate ids, chord collisions per platform).

**No localStorage sync, no user rebinding UI** — the keyboard settings page is documentation only.

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
- **Domain components**: IconButton, StatusDot, StatusFilter, SegmentedControl, CodeBlock, SectionLabel, StatCard, UniversalListCard, MaximizeOnDoubleClick, AccordionCore, FavoritesSection — these are custom domain primitives, not in shadcn; keep them as-is
- **Settings-only components**: `SettingsPageHeader`, `SettingsSaveBar` (now `SaveBar` in ui), `ColorPicker`, `ComingSoonBadge`, `SelectableCard` — these live in `src/components/settings/shared/` because they're only used in settings pages
- **SaveBar**: `src/components/ui/SaveBar.tsx` consolidates the old `SettingsSaveBar` (settings) and `SaveCancelBar` (right-auxiliary) into one primitive with `variant: 'sticky' | 'inline'`

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
| Only used in settings pages (ColorPicker, ComingSoonBadge, SelectableCard, SettingsPageHeader) | `src/components/settings/shared/` |
| Only used in right-auxiliary (ControlMatrix helpers, ManageTab components) | `src/components/right-auxiliary/` or `src/components/right-auxiliary/shared/` |
| Channel status display | `src/components/channels/` |
| Chat formatting helpers (no React) | `src/components/chat/` |
| Center panel content | `src/components/center-workspace/` or a subdirectory inside it |
| Left sidebar content | `src/components/left-nav/` |
| Right sidebar content | `src/components/right-auxiliary/` |
| A distinct group of related components inside a panel | `src/components/{panel}/{feature}/` with `index.ts` barrel |
| Pure utility (no React) | `src/lib/` |
| Static app config (wizard, nav, tabs, themes) | `src/data/config/` |
| A data domain | `src/data/{domain}/` with `interface.ts` + `store.ts` |
| Keyboard shortcut UI primitives (hint chip, row, palette) | `src/components/shortcuts/` with `index.ts` barrel |
| Keyboard shortcut runtime (registry, matcher, dispatcher) | `src/lib/shortcuts/` with `index.ts` barrel |

---

## Data Layer Contract

Every domain follows this pattern:

```
src/data/{domain}/
├── interface.ts   # Type definitions + function signatures
└── store.ts       # Public API implementation (imports from interface)
```

The store is the **only** public API for a domain. Components never import from sibling mock files — they always go through the store.

**Mock toggle architecture**: there is exactly one place the `VITE_USE_MOCK_DATA` env var is checked — `src/data/mock/index.ts`. It exports `mockableData`, which is either the seed from `mock.json` or an empty `MockData` object. Every domain store imports `mockableData` from `@/data/mock/index` and reads/writes against the mutable arrays it returns.

When mocks are **on**: stores seed from `mock.json` and mutators (createProject, createThreadForAgent, etc.) work as expected.

When mocks are **off**: stores start with empty arrays but mutators still work — the user can create projects, threads, audit items from zero. This is the "real fresh user" experience: empty app, full functionality.

To add a new domain: create the `interface.ts` + `store.ts` pair, import `mockableData` from `@/data/mock/index`, add a corresponding key to `MockData` in `src/data/mock/types.ts` and seed data to `src/data/mock.json`. No per-store toggle logic — just import the central data source.

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
