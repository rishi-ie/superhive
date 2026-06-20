# Superhive Design Spec

## App Overview

**Superhive** is a multi-model AI chat/workspace desktop interface built with Electron + React. It provides a three-panel layout for navigating projects, managing AI conversations, and accessing contextual tools.

## Design Language

### Aesthetic Direction
Dark, warm productivity tool — like a premium code editor meets AI assistant. Think VS Code meets Linear meets Claude.ai.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#151110` | App background |
| `--foreground` | `#eae8e6` | Primary text |
| `--card` | `#201e1c` | Cards, elevated surfaces |
| `--sidebar` | `#1a1716` | Navigation panels |
| `--sidebar-border` | `#2a2827` | Panel borders |
| `--sidebar-accent` | `#252220` | Hover states |
| `--highlight` / `--chart-1` | `#e07850` | Primary accent (terracotta) |
| `--chart-2` | `#50a878` | Secondary accent (green) |
| `--chart-3` | `#d4a84b` | Tertiary accent (gold) |
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

- **Border radius**: 0.625rem (10px) base, with `--radius-sm` (6px), `--radius-md` (8px), `--radius-xl` (14px)
- **Panel widths**: Left nav 280px default (180-400px range), Right panel 280px default (200-500px range)
- **Border width**: 1px standard

## Layout Structure

### Three-Panel Layout

```
┌─────────────┬──────────────────────────────┬──────────────┐
│   Left Nav  │     Center Workspace          │   Right      │
│   (280px)   │     (flex-1)                 │  Auxiliary   │
│   resizable │                              │   (280px)    │
│             │  ┌─────────────────────────┐  │   resizable  │
│  [Header]   │  │ Breadcrumb             │  │              │
│  [Workspace]│  ├─────────────────────────┤  │  [Tabs]      │
│  [Favorites]│  │ Tab Strip              │  │  [Filters]   │
│  [Active]   │  ├─────────────────────────┤  │  [Content]   │
│  [Nav Items]│  │                        │  │              │
│  [Footer]   │  │ Chat Empty State       │  │              │
│             │  │ (with suggestions)     │  │              │
│             │  │                        │  │              │
│             │  ├─────────────────────────┤  │              │
│             │  │ Chat Input              │  │              │
│             │  └─────────────────────────┘  │              │
└─────────────┴──────────────────────────────┴──────────────┘
```

### Center Panel (V1)

Simple, minimal structure:
1. **Breadcrumb**: Path bar showing current location (`Mumbrane > Manager`)
2. **Tab Strip**: Workspace tabs (Chat, Memory, etc.)
3. **Chat Area**: Empty state with suggested actions
4. **Composer**: Text input with attachments, voice, send

### Panel Resizing
- Both left and right panels are drag-resizable via edge handles
- Resize handle: 1px, shows terracotta on hover
- Min/max constraints enforced

## Components

### Chat Empty State
Shown when no messages in chat:
- Large centered empty state
- Header: "What would you like your workforce to do?"
- 2x3 grid of suggested action cards (Zap icon + text)
- Suggestions: Build landing page, Research competitors, Create product spec, Generate marketing plan, Analyze codebase

### Tab Strip
Underline-style tabs with add button
- Active tab: terracotta bottom border
- Add button: plus icon, right-aligned

### Chat Input
Textarea with action buttons
- Placeholder: "Describe an objective..."
- Attach (Paperclip), Voice (Mic), Send buttons
- Send button: terracotta background
- Submit: Cmd/Ctrl+Enter

### Breadcrumb
Clickable path segments with branch selector dropdown
- Branch selector shows current branch with GitBranch icon
- Split view toggle button

### Left Navigation
- **Header**: Drag area with toggle/back/forward controls
- **Team Selector**: Workspace avatar + name dropdown
- **Favorites Section**: Pinned items
- **Active Section**: Online employees and active tasks
- **Main Nav**: Projects, Employees, Tickets, Automations
- **Footer**: Notifications bell with count

### Right Auxiliary Panel
- **Tabs**: Overview, Manage, Inbox (button-style with icons)
- **Filter Toolbar**: Branch dropdown + changes filter + view toggles
- **Empty State**: Icon + message

## Archived Components

Located in `src/components/archived/`:
- **ModelToolbar**: Pill-based model selector with Set Run button
- **NewChatAccordion**: Expandable section header with split/close actions

These components are kept for potential future use (e.g., for different workspace types).

## Interaction Patterns

### Drag Regions
- Top of panels: `-webkit-app-region: drag` for window movement
- Non-drag elements: `no-drag` class to enable buttons/inputs

### Hover States
- Buttons: `hover:bg-tertiary` (darken slightly)
- Nav items: background highlight
- Links: text color change

### Focus States
- Input focus: `border-ring` with subtle ring shadow
- Keyboard accessible on all interactive elements

### Transitions
- Most color changes: `transition-colors`

## Page Navigation

### Mechanism
State-based page switching in `App.tsx` — no router. A `page` state (`'main' | 'settings'`) controls which root screen renders.

```ts
const [page, setPage] = useState<Page>('main');
// App-level state so panel widths survive page swaps
const [leftWidth, setLeftWidth] = useState(280);
const [rightWidth, setRightWidth] = useState(340);
```

### Entry Points

| Trigger | Location | Effect |
|---------|----------|--------|
| Click Settings icon | LeftNavFooter | `onSettingsClick → setPage('settings')` |
| Click Settings item | TeamSelector dropdown | Same handler |

### Exit Points

| Trigger | Location | Effect |
|---------|----------|--------|
| Click "← Back" | SettingsSidebar top | `onBack → setPage('main')` |

### Flow: Open Settings
1. User on Main Layout clicks Settings icon (Left Nav footer)
2. `onSettingsClick` fires → `setPage('settings')` in App
3. App unmounts `<Dashboard />`, mounts `<Settings onBack={...} />`
4. Settings renders with Account section pre-selected

### Flow: Leave Settings
1. User clicks "← Back" in Settings sidebar
2. `onBack` fires → `setPage('main')`
3. App unmounts `<Settings />`, mounts `<Dashboard />`
4. Panel widths are preserved (live in App, not Dashboard)

## Pages

### Settings Page

**Route**: No URL — state-based page switch from Main Layout.

**Layout**: Two-column grid (`grid-cols-[280px_1fr]`), full viewport height.

#### Column 1: Settings Sidebar (280px fixed)

**Header Control Row** (40px, `-webkit-app-region: drag`):
- macOS traffic lights (auto-inset from OS)
- Back/Forward/History icon buttons (disabled — no history in v1)

**Sticky Top**:
- "← Back" text link: `text-xs text-muted-foreground`, navigates to Main Layout
- "Settings" h1: `text-2xl font-semibold`
- Search input: full-width, `bg-input border-border rounded-md`, magnifying glass icon left, placeholder "Search settings..."

**Scrollable Nav List** (3 categories):

| Category | Items |
|----------|-------|
| **PERSONAL** | Account (active default) · Appearance · Notifications |
| **EDITOR & WORKFLOW** | General · Keyboard · Git & Worktrees · Agents · Terminal · Links · Models |
| **ORGANIZATION** | Organization · Teams · Projects · Hosts · Integrations |

- Nav item: `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm`
- Active: `bg-sidebar-accent` + 2px terracotta left border
- Icon + label per item (Lucide icons)

**Sticky Footer**: "Documentation" link + ExternalLink icon

#### Column 2: Content Area

Max-width `768px` (max-w-3xl), centered horizontally, `px-12 pt-16 pb-24`.

**Account Section** (default active):

| Row | Left | Right |
|-----|------|-------|
| 1 | "Avatar" label + "Recommended size 256x256" subtitle | 80px circular avatar, hover shows "Change" overlay |
| 2 | "Name" label | Text input, value: "Rishi Sidharda", 320px wide |
| 3 | "Email" label | Text input, value: "nandipati.sidharda@gmail.com", 320px wide |
| 4 | "Sign out of this device" + subtitle | Outline button "Sign out" |

All other sections (Appearance, Notifications, etc.) show "Coming soon." placeholder.

## New UI Components

### TextInput
- Sizes: `sm` (text-xs, px-2.5 py-1.5) · `md` (text-sm, px-3 py-2)
- Tokens: `bg-input border-border rounded-md`, focus `ring-1 ring-ring`
- States: default · hover · focus · filled · disabled · error

### Button
- Variants: `solid` (terracotta bg) · `outline` (border bg-secondary) · `ghost` (transparent)
- Sizes: `sm` (h-7) · `md` (h-9) · `lg` (h-11)
- States: default · hover · focus · active · disabled · loading
- Loading state: animated spinner SVG

### Avatar
- Sizes: `xs`(24px) · `sm`(32px) · `md`(40px) · `lg`(56px) · `xl`(80px)
- Shows `src` image if provided, otherwise renders initials from `fallback` string
- States: default · hover (via parent overlay) · with-status-dot (future)

### IconButton (existing, extended)
- Variants: `ghost` · `solid` · `outline`
- Sizes: `xs` · `sm` · `md` · `lg`

### NavItem (existing)
- Used for settings sidebar nav items
- States: default · hover · active (terracotta left border)

## Technical Notes

- **Tailwind v4** with CSS variables for theming
- Lucide icons with consistent `STROKE_WIDTH` (from constants)
- Component library is hand-rolled (no external UI lib)
- All panels use flexbox column layout
- Scroll containers use custom webkit scrollbar styling
- State-based routing via `App.tsx` page state — no router library
