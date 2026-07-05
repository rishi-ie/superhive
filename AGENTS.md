# Superhive — Agent Instructions

## Overview

This is an **Electron + React + Vite + Tailwind v4** project using **Bun** as the package manager. The UI framework is **shadcn/ui**.

---

## Primary Directive: shadcn-First Development

**All UI development MUST use the official shadcn ecosystem.** Before implementing any UI feature, you MUST consult the official shadcn Skill.

### The shadcn Skill

The official shadcn Skill is located at:
```
.ai/skills/shadcn.md
```

This file is the **source of truth** for all UI development. It contains:
- Core principles and rules
- Styling guidelines
- Form composition patterns
- Component selection guide
- CLI reference
- MCP tools documentation

---

## 3-Panel Architecture

The application is a **single-page 3-region layout**:

```
┌─────────────┬───────────────────────────┬─────────────┐
│ LeftSidebar │  Center Panel (Workspace) │  RightPanel │
│  w = 280    │       flex-1             │   w = 280   │
└─────────────┴───────────────────────────┴─────────────┘
```

- **LeftSidebar** (`w-64` to `w-80`): Navigation (repositories, accordion sections: Pinned / Agents / Projects / Channels), user button at footer.
- **Center Panel** (`flex-1`): The active page (Dashboard by default). `<Outlet />` for nested routes. Houses `TopRightControls` (absolute over center) and `TopHandle` (drag handle).
- **RightPanel** (`w-64` to `w-80`): Context inspector for the active selection in center. Collapsible.

Files live under `src/components/layout/{left-sidebar, center, right-sidebar}/`. Cross-region coupling is not allowed.

---

## Flow Isolation — Strict Rule

> **All side effects (CRUD, navigation, dialog open/close, toasts) MUST live in `src/flows/`. UI components must NEVER import from `@/api/*`.**

### Architecture Layers

```
UI Component (React)  ──▶  Flow (TS function)  ──▶  API wrapper (window.api)
       │                       │                       │
       ▼                       ▼                       ▼
   layout &              validation,             preload bridge
   presentation          API call,
   only                  toast,
                         navigation
                                                  │
                                                  ▼
                                              IPC handler  ──▶  Repo  ──▶  LowDB
```

### Rules

✅ Allowed:
```ts
// src/components/foo.tsx
import { createProject } from '@/flows/create-project';
import { listAgents } from '@/flows/list-agents';
```

❌ Forbidden:
```ts
// src/components/foo.tsx
import { projects } from '@/api/projects';   // NEVER — flows only
import { agents } from '@/api/agents';
```

✅ Flows themselves freely import from `@/api/*`, `sonner`, `react-router-dom`.

### Naming Convention for Flows

`src/flows/` is **flat** (no subfolders). Naming pattern: `<verb>-<entity>.ts`.

| Verb family | Pattern | Example |
|---|---|---|
| CRUD — create | `create-<entity>.ts` | `create-project.ts` |
| CRUD — read one | `load-<entity>.ts` | `load-project.ts` |
| CRUD — read list | `list-<entities>.ts` | `list-agents.ts` |
| CRUD — update | `update-<entity>.ts` | `update-agent.ts` |
| CRUD — delete | `delete-<entity>.ts` | `delete-project.ts` |
| Navigation | `select-<entity>.ts`, `go-to-<destination>.ts` | `select-project.ts` |
| UI control | `open-<thing>.ts`, `toggle-<thing>.ts`, `close-<thing>.ts` | `toggle-right-panel.ts` |

### Flow Signature Pattern

```ts
// src/flows/create-project.ts
import { projects } from '@/api/projects';
import { toast } from 'sonner';
import type { Project } from '@/storage/types';

export interface CreateProjectInput { name: string; description?: string }
export interface CreateProjectResult { ok: boolean; project?: Project; error?: string }

export async function createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
  const trimmed = input.name.trim();
  if (!trimmed) {
    toast.error('Project name is required');
    return { ok: false, error: 'Project name is required' };
  }
  try {
    const project = await projects.create({ name: trimmed, description: input.description?.trim() || undefined });
    toast.success(`Project "${project.name}" created`);
    return { ok: true, project };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create project';
    toast.error(message);
    return { ok: false, error: message };
  }
}
```

### Verification

```bash
rg "@/api" src/components src/pages   # must return ZERO results
rg "@/api" src/flows                  # OK to return results
```

This grep is part of the per-phase verification in any restructure or feature work.

---

## Flows Folder

`src/flows/` is the **only** path from UI to data. Currently empty (restructure pass). Populate as features are added.

When wiring a new entity:
1. Create the flow files (7 per entity): `create-`, `list-`, `load-`, `update-`, `delete-`, `select-`, `open-create-`
2. Add a thin section file under `src/components/layout/left-sidebar/sections/`
3. The section consumes flows via `useEffect(() => flow().then(setState), [])`

---

## Core Rules (Shadcn)

### Must Follow

- **Always consult the shadcn Skill before implementing UI**
- **Always search the official shadcn Registry first**
- **Install missing components automatically via CLI**
- **Prefer official Blocks whenever possible**
- **Never recreate components that already exist in shadcn**
- **Use Radix UI primitives only through shadcn**
- **Use Lucide icons**
- **Use `cn()` for class composition**
- **Keep accessibility intact**
- **Tailwind for layout, spacing, composition only**
- **Match the existing Superhive design system**
- **Reuse existing components whenever possible**

### Must Never Do

- Create custom UI primitives when shadcn equivalents exist
- Use `space-x-*` or `space-y-*` — use `gap-*` instead
- Add manual `z-index` to overlay components
- Use raw color values like `bg-blue-500` — use semantic tokens
- Write manual template literal ternaries for className
- Override component colors via className — use variants
- Create custom styled divs for callouts, empty states, etc.

---

## Package Manager

This project uses **Bun**. All shadcn CLI commands should use:

```bash
bunx shadcn@latest <command>
```

---

## MCP Tools

The shadcn MCP server provides these tools:

| Tool | Purpose |
|---|---|
| `shadcn:search_items_in_registries` | Fuzzy search across registries |
| `shadcn:list_items_in_registries` | List all items from registries |
| `shadcn:view_items_in_registries` | View item details and contents |
| `shadcn:get_item_examples_from_registries` | Find usage examples |
| `shadcn:get_add_command_for_items` | Get CLI install command |
| `shadcn:get_project_registries` | Get configured registries |
| `shadcn:get_audit_checklist` | Verify components |

---

## Project Structure

```
src/
├── lib/                              # cn() etc.
├── types/                            # global types
├── storage/                          # LowDB — 8 repositories
│   ├── database.ts
│   ├── seed.ts
│   ├── types.ts
│   └── repositories/
├── api/                              # window.api IPC wrappers
├── hooks/                            # custom React hooks
│
├── flows/                            # Side-effect handlers (CRUD, navigation)
│                                    # see "Flow Isolation" above
│
├── components/
│   ├── ui/                           # shadcn primitives (NO business logic)
│   ├── common/                       # cross-region primitives
│   │   ├── icons/
│   │   ├── EmptyState.tsx
│   │   ├── Spinner.tsx
│   │   ├── PanelHeader.tsx
│   │   └── FormField.tsx
│   └── layout/                       # 3-panel hierarchy (see "3-Panel Architecture")
│       ├── AppLayout.tsx             # shell
│       ├── Workspace.tsx             # center panel root
│       ├── left-sidebar/              # LEFT region
│       │   ├── AppSidebar.tsx
│       │   ├── header/
│       │   ├── sections/
│       │   └── primitives/
│       ├── center/                   # CENTER region (pages compose from here)
│       │   ├── Dashboard/
│       │   ├── Chat/
│       │   ├── Projects/             # + dialogs/
│       │   ├── Hive/
│       │   ├── Remote/
│       │   ├── Settings/
│       │   └── Agents/
│       └── right-sidebar/            # RIGHT region
│
├── pages/                            # thin route targets (re-exports)
├── routes/                           # react-router config
├── App.tsx                           # TooltipProvider + Routes
├── main.tsx                          # renderer entry
└── index.css                         # Tailwind + tokens
```

---

## Routing

| Path | Component | Description |
|---|---|---|
| `/` | `Dashboard` (re-export) | Landing — composer + suggested actions |
| `/projects` | `Projects` (re-export) | Empty state + browse projects dialog |
| `/projects/:projectId` | `ProjectChat` (re-export) | Per-project chat |
| `/hive` | `MetaHive` (re-export) | Meta hive conversation |
| `/remote` | `Remote` (re-export) | Remote conversation |
| `/settings` | `Settings` (re-export) | Settings page |

Routes import from `@/pages` only, never directly from `@/components/layout/center/`.

---

## Data Layer (LowDB)

8 repositories, 82 methods total. Per-entity JSON files in Electron `userData` directory. All repo methods async. Cascade deletes handled by repository helpers (no UI-side cascades).

See `storage.md` for full repository reference.

---

## Sidebar Pattern

`src/components/layout/left-sidebar/sections/` contains per-entity section files (`PinnedSection.tsx`, `AgentsSection.tsx`, `ProjectsSection.tsx`, `ChannelsSection.tsx`). Each:
- Holds local state via `useState`
- Loads via `useEffect(() => flow().then(setState), [])` — flows only
- Renders either an `AccordionRow` per item OR an `EmptyCtaButton` when empty
- `OpenCreate` triggers call `open-create-<entity>.ts` flow

---

## Tailwind Version

This project uses **Tailwind CSS v4** with CSS-first configuration. Theme is in `src/index.css` via `@theme inline`.

---

## Icon Library

**Lucide React**. Use `lucide-react` for all icons.

---

## Validating Your Work

Before completing any task:

1. **Typecheck**: `bun run typecheck` must pass clean
2. **Build**: `bun run build` must pass clean
3. **Flow isolation grep**: `rg "@/api" src/components src/pages` returns **zero results**
4. **All imports use `@/` alias** (not relative)
5. **All conditional classes use `cn()`** (not ternary string concat)
6. **No raw color values** in `className`
7. **Accessibility confirmed** (titles on dialogs, fallback on avatars)

---

## Local UI Skill

Superhive-specific conventions (3-panel layout, sidebar section pattern, etc.):
```
.ai/skills/local-ui.md
```

---

## Getting Help

- **shadcn Skill**: `.ai/skills/shadcn.md`
- **Local UI Skill**: `.ai/skills/local-ui.md`
- **shadcn docs**: `npx shadcn@latest docs <component>`
- **shadcn search**: `npx shadcn@latest search`
- **Storage reference**: `storage.md`
