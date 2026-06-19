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
- **Tabs**: Changes, Searches, Everyone (underline style)
- **Filter Toolbar**: File count + search
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

## Technical Notes

- **Tailwind v4** with CSS variables for theming
- Lucide icons with consistent `STROKE_WIDTH` (from constants)
- Component library is hand-rolled (no external UI lib)
- All panels use flexbox column layout
- Scroll containers use custom webkit scrollbar styling
