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

## UI Development Workflow

### For Every UI Task:

1. **Read AGENTS.md** (this file)
2. **Read the official shadcn Skill** (`.ai/skills/shadcn.md`)
3. **Get project context** — Run `npx shadcn@latest info` or use the MCP `shadcn:get_project_registries` tool
4. **Search the registry** — Use `npx shadcn@latest search` or MCP `shadcn:search_items_in_registries`
5. **Find the closest Block or Component** — Check `@shadcn` registry first
6. **Install required components** — `npx shadcn@latest add <component>`
7. **Compose the interface** — Build using shadcn components
8. **Customize only where necessary** — Follow the styling rules
9. **Verify** — Run typecheck and lint

### Example Workflow for "Build a settings page":

```
Read AGENTS.md
  ↓
Read .ai/skills/shadcn.md
  ↓
npx shadcn@latest info
  ↓
npx shadcn@latest search settings -t block
  ↓
Find @shadcn/settings-block
  ↓
npx shadcn@latest add @shadcn/settings-block
  ↓
Compose using Card, Tabs, FieldGroup, Field, Switch, ToggleGroup
  ↓
Customize to match the Superhive design system
  ↓
Verify with typecheck
```

---

## Core Rules

### Must Follow:

- **Always consult the shadcn Skill before implementing UI**
- **Always search the official shadcn Registry first**
- **Install missing components automatically via CLI**
- **Prefer official Blocks whenever possible**
- **Never recreate components that already exist in shadcn**
- **Use Radix UI primitives only through shadcn**
- **Use Lucide icons** (already configured)
- **Use `cn()` for class composition**
- **Keep accessibility intact** — shadcn handles this
- **Tailwind for layout, spacing, composition only**
- **Avoid custom CSS unless absolutely necessary**
- **Match the existing Superhive design system**
- **Reuse existing components whenever possible**

### Must Never Do:

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

Or use the shadcn MCP tools for registry operations (no package manager needed).

---

## MCP Tools

The shadcn MCP server provides these tools:

| Tool | Purpose |
|------|---------|
| `shadcn:search_items_in_registries` | Fuzzy search across registries |
| `shadcn:list_items_in_registries` | List all items from registries |
| `shadcn:view_items_in_registries` | View item details and contents |
| `shadcn:get_item_examples_from_registries` | Find usage examples |
| `shadcn:get_add_command_for_items` | Get CLI install command |
| `shadcn:get_project_registries` | Get configured registries |
| `shadcn:get_audit_checklist` | Verify components |

See `.ai/skills/shadcn.md` for MCP configuration.

---

## Project Structure

```
superhive/
├── electron/              # Electron main/preload (DO NOT MODIFY)
├── src/                   # Renderer process (React app)
│   ├── components/        # React components (shadcn goes here)
│   │   └── ui/            # shadcn components
│   ├── lib/               # Utilities (utils.ts lives here)
│   ├── screens/           # Screen/page components
│   └── index.css          # Global styles + Tailwind theme
├── .ai/                   # Agent configuration
│   └── skills/            # Skills (shadcn.md + local-ui.md)
├── components.json       # shadcn configuration
└── package.json
```

---

## Tailwind Version

This project uses **Tailwind CSS v4** with CSS-first configuration. Theme is defined in `src/index.css` using CSS custom properties and `@theme inline` directive.

---

## Icon Library

**Lucide React** is configured. Use `lucide-react` for all icons.

---

## Local UI Skill

For Superhive-specific conventions (layout patterns, window management, etc.), see:

```
.ai/skills/local-ui.md
```

---

## Validating Your Work

Before completing a UI task:

1. Run `bun run typecheck` to verify TypeScript
2. Check that all imports use `@/` alias
3. Verify `cn()` is used for conditional classes
4. Ensure no raw color values in className
5. Confirm accessibility (titles on dialogs, fallback on avatars, etc.)

---

## Getting Help

- **shadcn Skill**: `.ai/skills/shadcn.md`
- **Local UI Skill**: `.ai/skills/local-ui.md`
- **shadcn docs**: `npx shadcn@latest docs <component>`
- **shadcn search**: `npx shadcn@latest search`
