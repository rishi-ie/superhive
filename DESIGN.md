# Superhive Design Spec

## App Overview

**Superhive** is a digital employee workspace — a command center for orchestrating autonomous AI agents. Built with Electron + React + Tailwind v4.

## Design Language

### Aesthetic Direction
Dark, warm productivity tool — premium code editor meets AI assistant. Think VS Code meets Linear meets NASA Mission Control. Dense, context-aware telemetry panels.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#151110` | App background |
| `--foreground` | `#eae8e6` | Primary text |
| `--card` | `#201e1c` | Cards, elevated surfaces |
| `--sidebar` | `#1a1716` | Navigation panels |
| `--sidebar-border` | `#2a2827` | Panel borders |
| `--sidebar-accent` | `#252220` | Hover states |
| `--chart-1` / `--highlight` | `#e07850` | Primary accent (terracotta) |
| `--chart-2` | `#50a878` | Secondary accent (green) |
| `--chart-3` | `#d4a84b` | Tertiary accent (gold) |
| `--chart-5` | `#dc6b6b` | Danger/error accent (red) |
| `--border` | `#2a2827` | Default borders |
| `--input` | `#2a2827` | Input backgrounds |
| `--ring` | `#3a3837` | Focus rings |
| `--muted-foreground` | `#a8a5a3` | Secondary text |

### Typography
- **Font**: System UI stack (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
- **Body**: 14px default
- **Small/Labels**: 12px
- **Extra small/Kbd**: 10px monospace

### Spacing & Radius
- **Border radius**: 0.625rem (10px) base, `--radius-sm` (6px), `--radius-md` (8px), `--radius-xl` (14px)
- **Panel widths**: Left nav 280px (180-400px range), Right panel 340px (200-500px range)
- **Border width**: 1px standard

## Layout Structure

### Three-Panel Layout

```
┌─────────────┬──────────────────────────────┬──────────────┐
│  Left Nav   │      Center Workspace           │   Right      │
│  (280px)    │      (flex-1)                 │  Auxiliary   │
│  resizable  │                              │  (340px)     │
│             │  [Breadcrumb]                 │  resizable   │
│  [Header]   │  [Tab Strip]                 │              │
│  [Workspace]│  [Chat / Thread]             │  [Tabs]      │
│  [Favorites]│  [Composer]                  │  [Content]   │
│  [Active]   │                              │              │
│  [Nav Items]│                              │              │
│  [Footer]   │                              │              │
└─────────────┴──────────────────────────────┴──────────────┘
```

### Center Panel (V1)
1. **Breadcrumb**: Path bar showing current location (`Superhive > Workspace`)
2. **Tab Strip**: Workspace tabs (Chat, Memory, etc.)
3. **Chat Area**: Chat thread with message bubbles OR ChatEmptyState with suggested actions
4. **Composer**: Textarea with model selectors, attachments, send

### Panel Resizing
- Both left and right panels are drag-resizable via edge handles
- Resize handle: 1px, shows terracotta on hover
- Min/max constraints enforced

## Components

### Left Navigation
- **LeftNavHeader**: Drag area with window controls
- **TeamSelector**: Workspace avatar + name dropdown
- **FavoritesSection**: Pinned items (projects + employees)
- **ActiveSection**: Active employees with status dots and current tasks
- **MainNavList**: Projects, Employees, Tickets, Automations, Communications
- **LeftNavFooter**: Settings icon + Notifications bell with count badge

### Center Workspace
- **Breadcrumb**: Clickable path segments with branch selector dropdown
- **TabStrip**: Underline-style tabs with active terracotta bottom border
- **ChatEmptyState**: "What would you like your workforce to do?" + 2x3 suggestion grid
- **ChatThread**: User/assistant message bubbles with avatars and timestamps
- **ChatInput**: Textarea with model selectors, attach, voice, send (terracotta)

### Right Auxiliary Panel — Avionics (Mission Control)

**Three tabs**: Overview · Manage · Inbox

#### Tab: Overview (Telemetry Deck)
Shown when an agent is active. Displays live agent telemetry.

- **Identity Strip**: Status dot + agent name + role + uptime
- **Heartbeat Bar**: Single `BRAIN USAGE [████████░░] 67% — Healthy` bar. Green ≤70%, amber 71-90%, terracotta >90%
- **Cost Card**: Big current burn `$0.0234` + session total + budget remaining + sub-metrics (tok/s, evolutions, kernel integrity)
- **Last Actions**: Timestamped human-readable action log (e.g., `12:34 — Generated 247 lines of auth middleware`)
- **Next Step**: Italic forward-looking footer

#### Tab: Manage (Control Matrix)
Shown when an agent is active. Form-based configuration.

- **Live Config Summary**: Single row showing current engine · write state · commit authority · token count — updates live
- **Model Engine Cards**: 2x2 grid of engine options (Opus 4.8, Sonnet 4, Claude 3.5, Codex) with cost + tag; click to select
- **Permissions List**: Three rows (WRITE FILES, SEND MESSAGES, INSTALL DEPENDENCIES) each with label, description, ON/OFF badge, and toggle
- **Commit Authority**: 3-segment horizontal control (Review · Auto-Merge · Direct Push); Direct Push has danger tint
- **Thinking Budget**: Range slider with live `$/task` cost estimate
- **Danger Zone**: Warning banner + full-width "Terminate Employee" red outline button

#### Tab: Inbox (Audit Queue)
Shows actionable audit cards regardless of whether an agent is selected.

- **AUTH_INTERCEPT cards**: Terracotta left border, title + description, two ghost buttons (Grant One-Time Access · Deny)
- **DIFF_REVIEW cards**: Standard border, title + description, ghost "View Diff" + solid terracotta "Approve & Merge"

#### Right Panel — No Agent Selected
When no agent is active, all tabs show an empty/placeholder state.

### Status Indicators
| Status | Visual |
|--------|--------|
| `EXECUTING` | Green pulsing dot (`pulse-executing` animation) |
| `COMPILING` | Yellow `Loader2` icon with `animate-spin` |
| `AWAITING_HUMAN` | Solid terracotta dot |
| `IDLE` | Dim gray dot |
| `ERROR_LOOP` | Red pulsing dot (`pulse-error` animation) |

### Chat Empty State
- Large centered empty state
- Header: "What would you like your workforce to do?"
- 2x3 grid of suggested action cards (Zap icon + text)
- Suggestions: Build landing page, Research competitors, Create product spec, Generate marketing plan, Analyze codebase

## Employee Data Model

Types defined in `src/types/agent.ts`:

```ts
type AgentStatus = 'EXECUTING' | 'COMPILING' | 'AWAITING_HUMAN' | 'IDLE' | 'ERROR_LOOP';
type CommitAuthority = 'REVIEW_ONLY' | 'AUTO_MERGE' | 'DIRECT_MAIN';

type Telemetry = {
  contextSaturation: number;   // 0-100
  tokensPerSecond: number;
  currentCost: number;
  evolutionLoop: string;       // "47/100"
  logicKernelIntegrity: number; // 0-100
  sessionCost: number;
  budget: number;
};

type Permissions = {
  modelEngine: string;
  writeAccess: boolean;
  commitAuthority: CommitAuthority;
  maxTokens: number;
  writeMessages: boolean;
  installDeps: boolean;
};

type Employee = {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  activeTask: string;
  uptime: string;
};

type AuditItem = {
  id: string;
  type: 'AUTH_INTERCEPT' | 'DIFF_REVIEW';
  title: string;
  description: string;
  timestamp: string;
};

type ActionLogEntry = {
  time: string;
  action: string;
};
```

## Page Navigation

### Mechanism
State-based page switching in `App.tsx` — no router. A `page` state (`'main' | 'settings'`) controls which root screen renders.

### Entry Points
| Trigger | Location | Effect |
|---------|----------|--------|
| Click Settings icon | LeftNavFooter | `onSettingsClick → setPage('settings')` |
| Click Settings item | TeamSelector dropdown | Same handler |

### Exit Points
| Trigger | Location | Effect |
|---------|----------|--------|
| Click "← Back" | SettingsSidebar top | `onBack → setPage('main')` |

## Settings Page

**Route**: No URL — state-based page switch from Main Layout.

**Layout**: Two-column grid (`grid-cols-[300px_1fr]`), full viewport height.

### Column 1: Settings Sidebar (300px fixed)
- "← Back" text link → navigates to Main Layout
- "Settings" h1
- Search input
- 3 category groups (PERSONAL, EDITOR & WORKFLOW, ORGANIZATION) with nav items
- Documentation link footer

### Column 2: Account Settings (default)
- Avatar with hover overlay (80px circular)
- Name + Email text inputs (320px wide)
- Sign out outline button

All other settings sections show "Coming soon." placeholder.

## UI Components

### TextInput
- Sizes: `sm` (text-xs, px-2.5 py-1.5) · `md` (text-sm, px-3 py-2)
- Tokens: `bg-input border-border rounded-md`, focus `ring-1 ring-ring`
- States: default · hover · focus · filled · disabled · error

### Button
- Variants: `solid` (terracotta bg) · `outline` (border bg-secondary) · `ghost` (transparent)
- Sizes: `sm` (h-7) · `md` (h-9) · `lg` (h-11)
- States: default · hover · focus · active · disabled · loading (animated spinner)

### Avatar
- Sizes: `xs`(24px) · `sm`(32px) · `md`(40px) · `lg`(56px) · `xl`(80px)
- Shows `src` image if provided, otherwise renders initials from `fallback` string

### IconButton
- Variants: `ghost` · `solid` · `outline`
- Sizes: `xs` · `sm` · `md` · `lg`

### Toggle
- Pill-shaped track with sliding circle knob
- Sizes: `sm` · `md`
- States: unchecked (gray track) / checked (terracotta track)

### Select
- Styled `<select>` with ChevronDown icon
- `bg-input border-border rounded-md`, focus ring on interaction

### RadioOption
- Custom radio with terracotta fill when selected
- `danger` variant: red border always visible (for DIRECT_MAIN commit authority)

## Technical Notes

- **Tailwind v4** with CSS variables for theming (`@tailwindcss/postcss`)
- **Lucide icons** with consistent `STROKE_WIDTH` (from `src/lib/constants.ts`, value: 1.5)
- **Component library**: Hand-rolled, no external UI library
- **State management**: `useState` in App.tsx + props drilling; no Context/Zustand needed yet
- **Routing**: State-based in App.tsx — no router library
- **Custom animations** (defined in `src/index.css`):
  - `pulse-executing`: green agent active pulse (1.5s ease-in-out infinite)
  - `pulse-error`: red agent error pulse (0.8s ease-in-out infinite)

## Archived Components

Located in `src/components/archived/`:
- **ModelToolbar**: Pill-based model selector with Set Run button
- **NewChatAccordion**: Expandable section header with split/close actions

## Files & Directories

```
src/
├── App.tsx                     — Root component, page state, panel widths
├── main.tsx                    — React entry point
├── index.css                   — CSS variables, theme, custom animations
├── screens/
│   ├── Dashboard.tsx           — Main three-panel layout
│   └── Settings.tsx            — Settings page
├── components/
│   ├── LeftNav.tsx             — Left navigation shell + resize handle
│   ├── CenterWorkspace.tsx      — Center panel shell
│   ├── RightAuxiliary.tsx       — Right panel shell
│   ├── left-nav/               — Left nav sub-components
│   │   ├── LeftNavHeader.tsx
│   │   ├── TeamSelector.tsx
│   │   ├── FavoritesSection.tsx
│   │   ├── ActiveSection.tsx    — (used for active employees list)
│   │   ├── MainNavList.tsx
│   │   └── LeftNavFooter.tsx
│   ├── center-workspace/
│   │   ├── Breadcrumb.tsx
│   │   ├── TabStrip.tsx
│   │   ├── ChatEmptyState.tsx
│   │   ├── ChatThread.tsx
│   │   └── ChatInput.tsx
│   ├── right-auxiliary/
│   │   ├── RightPanelTabs.tsx
│   │   ├── FilterToolbar.tsx
│   │   ├── PanelEmptyState.tsx
│   │   ├── TelemetryDeck.tsx    — Overview tab (Mission Control)
│   │   ├── ControlMatrix.tsx    — Manage tab (Mission Control)
│   │   └── AuditQueue.tsx       — Inbox tab (Mission Control)
│   ├── settings/
│   │   ├── SettingsSidebar.tsx
│   │   └── AccountSettings.tsx
│   ├── ui/                     — Reusable primitives
│   │   ├── Button.tsx
│   │   ├── IconButton.tsx
│   │   ├── TextInput.tsx
│   │   ├── Avatar.tsx
│   │   ├── NavItem.tsx
│   │   ├── Pill.tsx
│   │   ├── DropdownTrigger.tsx
│   │   ├── MaximizeOnDoubleClick.tsx
│   │   ├── Toggle.tsx           — (Mission Control)
│   │   ├── Select.tsx            — (Mission Control)
│   │   └── RadioOption.tsx       — (Mission Control)
│   └── archived/                — Archived unused components
├── data/
│   ├── employees/               — Employee data abstraction layer
│   │   ├── interface.ts         — Types + function signatures
│   │   ├── mock.ts             — Mock employee data
│   │   └── store.ts            — Public API + USE_MOCK_DATA routing
│   ├── mock/                   — Legacy mock data (LeftNav, chat, etc.)
│   │   ├── workspaces.ts
│   │   ├── favorites.tsx
│   │   ├── employees.ts
│   │   ├── tasks.ts
│   │   ├── notifications.ts
│   │   ├── chat.ts
│   │   └── ...
│   ├── left-nav.ts
│   ├── models.ts
│   ├── right-panel-tabs.ts
│   └── workspace-tabs.ts
├── lib/
│   ├── constants.ts             — STROKE_WIDTH = 1.5
│   └── use-double-click.ts
├── types/
│   └── agent.ts                 — AgentStatus, CommitAuthority types
└── hooks/
    └── use-double-click.ts
```
