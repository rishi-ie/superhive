# Superhive — Electron + React Desktop App

## What is this?

**Superhive** is a digital employee workspace — a command center for orchestrating autonomous AI agents. It features a three-panel layout:

- **Left Nav (Fleet Command)**: Workspace selector, active agents, favorites, accordion core (Projects, Employees, Tickets, Automations, Communications), utilities (Settings, Help)
- **Center (Operations Deck)**: AI chat workspace with breadcrumb, tab strip, chat area (empty state or thread), and composer
- **Right Auxiliary (Avionics)**: Agent telemetry, configuration controls, and audit queue — only renders when an agent is active

## Dev Commands

```sh
bun run dev           # Start Vite dev server + Electron (hot reload)
bun run electron:dev  # Alias for dev
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
- `tsconfig.json`: ESNext, bun types, bundler resolution
- `tailwind.config.js`: v4 (uses `@tailwindcss/postcss` plugin)
- `postcss.config.js`: `@tailwindcss/postcss` + autoprefixer
- `electron-builder.yml`: builds for mac/win/linux
- `DESIGN.md`: Full design system documentation

## Left Nav Layout Structure

```
┌──────────────────────┐
│  Header (drag)       │
│  TeamSelector         │
├──────────────────────┤
│  Active              │  ← collapsible, status dots, Zap icon
│  Favorites           │  ← collapsible, Star icon
├──────────────────────┤
│  ▸ Projects [◈]      │  ← accordion core (scrollable)
│  ▾ Employees  [◈]    │    defaultOpen, agent status dots
│  ▸ Tickets    [◈]    │
│  ▸ Automations [◈]  │
│  ▸ Communications[◈]│
├──────────────────────┤
│  Settings      ?     │  ← utilities (sticky bottom)
└──────────────────────┘
```

**Accordion Core** (`src/components/left-nav/AccordionCore.tsx`):
- `AccordionItem` — reusable accordion with CSS grid height animation (chevron rotates 90°, smooth expand/collapse)
- `AccordionHeader` — same styling as AccordionItem but non-expandable (no chevron)
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

**Deleted**: `LeftNavFooter`, `FavoritesSection` (old standalone), `ActiveSection` (old standalone), `PrimaryNavList`, `data/left-nav.ts` (recreated), `data/mock/tasks.ts`

## Design System

- **Theme**: Dark warm palette with terracotta accent (`#e07850`)
- **Colors**: CSS variables in `src/index.css`
- **Components**: Hand-rolled, no external UI library; Lucide icons with `STROKE_WIDTH` from `src/lib/constants.ts`
- **Panel sizing**: Left nav 280px default (180-400px range), Right panel 340px default (200-500px range)

## Data Architecture

Employee/agent data is fully abstracted behind a store pattern in `src/data/employees/`:

```
src/data/employees/
├── interface.ts   — Types + function signatures (the contract)
├── mock.ts        — All mock employee data + implementations
└── store.ts       — Public API; USE_MOCK_DATA flag lives here
```

**Public API** (import from `@/data/employees/store`):
```ts
listEmployees()        → Employee[]
getEmployee(id)         → Employee | undefined
getActiveEmployee()     → Employee | null
getTelemetry(id)       → Telemetry
getPermissions(id)      → Permissions
getAuditItems(id?)     → AuditItem[]
getActionLog(id)       → ActionLogEntry[]
getNextStep(id)        → string
```

**To swap in a real DB**: create `src/data/employees/api.ts` with the same signatures, then edit `store.ts` to import from `./api` instead of `./mock`.

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
