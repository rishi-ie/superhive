# Superhive — Agent Instructions

## Overview

This is an **Electron + React + Vite + Tailwind v4** project using **Bun** as the package manager. The UI framework is **shadcn/ui**.

> **Branch model:** Only 2 branches exist — `main` triggers releases, `dev` is for daily work. No feature branches, no PRs — commit directly to `dev`, merge `dev` → `main` to ship. See [`RELEASE.md`](./RELEASE.md) for the full release pipeline.

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

Files live under `src/components/layout/{shell, left-sidebar, right-sidebar, common, command-palette}/`. Cross-region coupling is not allowed. Page-view components live in `src/pages/<feature>/`, not here.

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
import { createProject } from '@/flows/agents/crud/create-project';
import { listAgents } from '@/flows/agents/crud/list-agents';
```

❌ Forbidden:
```ts
// src/components/foo.tsx
import { projects } from '@/api/projects';   // NEVER — flows only
import { agents } from '@/api/agents';
```

✅ Flows themselves freely import from `@/api/*`, `sonner`, `react-router-dom`.

### Flow Sub-folder Structure

`src/flows/` is **nested by entity, then by kind**. Pattern:

```
src/flows/<entity>/<kind>/<file>.ts
```

| `<kind>` | Purpose | File naming |
|---|---|---|
| `crud/` | Create, list, load, update, delete, select | `<verb>-<entity>.ts` |
| `runtime/` | Runtime hooks, start/stop helpers | `<use|start>-<entity>-runtime.ts` |
| `ui/` | Global UI state (dialog open/close, panel toggle) | `<open|close|toggle>-<thing>.ts` |

Cross-entity flows (navigation, global UI) use top-level folders:

```
src/flows/navigation/<go|select>-*.ts
src/flows/ui/<use>-*.ts
```

Every sub-folder MUST have an `index.ts` barrel.

**Current structure:**
```
src/flows/
├── agents/
│   ├── crud/     (list-agents, load-agent, create-agent, delete-agent, select-agent)
│   ├── runtime/   (use-agent-runtime, start-agent-runtime)
│   └── ui/       (open-create-agent)
├── navigation/    (go-back-home, go-to-settings, go-to-settings-section)
└── ui/          (use-command-palette, use-center-breadcrumb)
```

### Flow Signature Pattern

```ts
// src/flows/agents/crud/create-agent.ts
import { agents } from '@/api/agents';
import { toast } from 'sonner';
import type { Agent } from '@/storage/types';

export interface CreateAgentInput { name: string; folderName: string; parentDir: string; manifestPiSource: string }
export interface CreateAgentResult { ok: boolean; agent?: Agent; error?: string }

export async function createAgent(input: CreateAgentInput): Promise<CreateAgentResult> {
  const trimmed = input.name.trim();
  if (!trimmed) {
    toast.error('Agent name is required');
    return { ok: false, error: 'Agent name is required' };
  }
  try {
    const agent = await agents.create({ name: trimmed, ...input });
    toast.success(`Agent "${agent.name}" created`);
    return { ok: true, agent };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create agent';
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

## Flow Organization

`src/flows/` is the **only** path from UI to data. Populate as features are added.

When wiring a new entity:
1. Create flow files under `src/flows/<entity>/crud/`: `list-`, `load-`, `create-`, `update-`, `delete-`, `select-`
2. Create runtime flows under `src/flows/<entity>/runtime/`: `<use|start>-<entity>-runtime.ts`
3. Create UI flows under `src/flows/<entity>/ui/`: `<open|close|toggle>-<entity>.ts`
4. Add an `index.ts` barrel in each sub-folder
5. Add a section file under `src/components/layout/left-sidebar/sections/`
6. The section consumes flows via `useEffect(() => flow().then(setState), [])`

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
├── flows/                            # Side-effect handlers — ONLY path from UI to data
│   ├── agents/
│   │   ├── crud/                    # list, load, create, delete, select
│   │   ├── runtime/                 # use-agent-runtime, start-agent-runtime
│   │   └── ui/                     # open-create-agent
│   ├── projects/
│   ├── navigation/                  # go-back-home, go-to-settings, go-to-settings-section
│   ├── ui/                         # use-command-palette, use-center-breadcrumb
│   └── index.ts                    # top-level barrel
│
├── pages/                            # Route targets — one folder per feature
│   ├── routes.tsx                   # createBrowserRouter config
│   ├── landing/                     # Landing page + inner components
│   ├── agent-chat/                 # AgentChatView + components + dialogs
│   │   ├── components/              # ConversationArea, UserMessage, AssistantMessage, …
│   │   └── dialogs/                 # CreateAgentDialog
│   ├── project-chat/
│   ├── meta-hive/
│   ├── remote/
│   ├── settings/                    # SettingsLayout + SettingsSidebar + SettingsSectionView
│   └── *_Legacy.tsx               # Orphan re-exports (no longer used — keep, don't delete)
│
├── components/                      # All UI
│   ├── ui/                         # shadcn primitives (24 components, 7 unused)
│   ├── common/                     # EmptyState, Spinner, PanelHeader, FormField (unused)
│   └── layout/                     # Shell layer (see 3-Panel Architecture)
│       ├── shell/                  # AppLayout, Workspace
│       ├── command-palette/        # CommandPalette
│       ├── left-sidebar/            # AppSidebar, SidebarAccordion, SidebarRepositories,
│       │                            # SidebarUser, sections/, primitives/
│       ├── right-sidebar/
│       └── common/                # CenterBreadcrumb, TopHandle (unused), TopRightControls
│
├── models/                          # Domain shapes for renderer/UI (not storage or IPC)
│   ├── runtime.ts                  # RuntimeMessage, RuntimeStatusPayload, RuntimeExitPayload
│   ├── boot-step.ts               # InitStep, AdapterEvent, INIT_STEPS
│   ├── template.ts                # EnsureTemplateResult
│   └── index.ts
│
├── styles/
│   └── globals.css                 # Tailwind v4 + @theme inline + dark mode
│
├── storage/                         # LowDB repositories
│   ├── database.ts
│   ├── seed.ts
│   ├── types.ts
│   └── repositories/               # Agent, Project, Task, Session, Channel, Workspace, Tag, Settings
│
├── api/                             # window.api IPC wrappers
│   ├── agents.ts
│   ├── manifest-pi.ts
│   └── projects.ts
│
├── hooks/                           # Generic React hooks (no business logic)
├── lib/                             # cn() utilities
├── types/                           # IPC contract declarations
│   ├── electron.d.ts               # window.api.* + runtime type re-exports
│   └── init-steps.ts              # INIT_STEPS (legacy)
│
├── App.tsx                         # TooltipProvider + Routes
├── main.tsx                        # renderer entry
└── vite-env.d.ts
```

---

## Routing

| Path | Component | Folder |
|---|---|---|
| `/` | `Landing` | `@/pages/landing` |
| `/agents` | `AgentChatView` | `@/pages/agent-chat` |
| `/agents/:agentId` | `AgentChatView` | `@/pages/agent-chat` |
| `/projects` | `ProjectChatView` | `@/pages/project-chat` |
| `/projects/:projectId` | `ProjectChatView` | `@/pages/project-chat` |
| `/hive` | `MetaHiveView` | `@/pages/meta-hive` |
| `/remote` | `RemoteView` | `@/pages/remote` |
| `/settings` | `SettingsLayout` → `SettingsSectionView` | `@/pages/settings` |

Routes config lives at `src/pages/routes.tsx`. Page components are imported directly from `@/pages/<feature>`.

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

This project uses **Tailwind CSS v4** with CSS-first configuration. Theme is in `src/styles/globals.css` via `@theme inline`.

---

## Icon Library

**Hugeicons (free tier)**. Use `@hugeicons/react` + `@hugeicons/core-free-icons` via the wrapper at `@/components/ui/icon`. Import icons from `@hugeicons/core-free-icons`, then wrap with `<HugeiconsIcon icon={IconName} className="..." />`. Default size is 16px, color `currentColor`, strokeWidth 1.5.

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
