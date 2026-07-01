# Superhive — Contributor Guide

## Project

Local-first desktop cockpit for orchestrating autonomous AI agents. Electron + Vite + React + TypeScript + Tailwind v4. Three-panel UI: Left Nav (Fleet Command) · Center (Operations Deck) · Right Auxiliary (Avionics).

---

## Commands

```sh
bun install                # install deps
bun run dev                # Vite dev server + Electron (hot reload)
bun run typecheck          # tsc --noEmit — MANDATORY before commit
bun run build              # typecheck + vite build
bun run electron:build     # build + electron-builder → release/ (dmg/zip/nsis)
bun run electron:preview   # vite build + electron .
```

`bun run electron:dev` is identical to `bun run dev` — there is no separate dev variant.

**No test framework, no linter, no formatter are configured.** `bun run typecheck` is the single verification gate. It runs with `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, and `verbatimModuleSyntax: true`. Fix every error before committing.

**Use `bun` for everything** — package management and script running. Do not use `npm`, `pnpm`, or `yarn`. Also enforced by `CLAUDE.md` and `.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc`.

---

## Key env vars

- `LIBSQL_URL` — path to the SQLite database file (e.g. `file:./data.db`). Defaults for dev are set in `.env.example`.
- `LIBSQL_AUTH_TOKEN` — auth token for remote SQLite (e.g. Turso). Defaults for dev are set in `.env.example`.

---

## Architecture at a glance

```
src/
├── App.tsx · main.tsx · index.css         # React entry, Tailwind v4 theme vars
├── screens/                               # Dashboard.tsx (3-panel) · Settings.tsx
├── components/
│   ├── center-workspace/                  # Tabbed workspace views (HomeView, Projects, Tickets, Channels, Agents, Chat, …)
│   ├── left-nav/                          # Sidebar: TeamSelector, accordion, HelpPopover
│   ├── right-auxiliary/                   # Telemetry, audit queue, per-entity inboxes
│   │   ├── inbox/  dashboard/  global-stats/  sessions/  shared/  telemetry/  project/
│   ├── settings/                          # SettingsSidebar + 10 settings pages + shared/
│   ├── ui/                                # shadcn + custom primitives — reuse, don't reinvent
│   ├── shortcuts/                         # KbdGroup, ShortcutHint, CommandPalette
│   ├── channels/  chat/                   # tiny shared helpers
├── data/
│   ├── seed/                              # static SQL seed — 18 tables, bundled via Vite ?raw
│   ├── settings/                          # Settings type + settings.json (seed defaults)
│   ├── config/                            # static config: settings-registry, themes, nav, right-panel-tabs, wizard configs
│   └── {domain}/                          # one folder per data domain; interface.ts + store.ts
├── lib/
│   ├── shortcuts/                         # single source of shortcut truth
│   ├── settings-context.tsx               # applies appearance → DOM
│   ├── toast-context.tsx · constants.ts · utils.ts (cn) · markdown · debounce · …
├── hooks/ · types/                        # small helpers
electron/main.ts · preload.ts              # Electron main + contextBridge (use electron-log, not console.log)
```

### Sources of truth — find these first

| Concern | File |
|---|---|
| Data layer (seam + factory) | `src/data/datasource/index.ts` + `src/data/datasource/types.ts` + `src/data/datasource/db-source.ts` |
| Settings nav (10 pages, 3 categories) | `src/data/config/settings-registry.ts` |
| Theme palette + tokens | `src/data/config/themes.ts` |
| Keyboard shortcuts (declarative data) | `src/lib/shortcuts/registry.ts` (`DEFAULT_SHORTCUTS`) |
| Keyboard shortcut handlers | `src/lib/shortcuts/actions.ts` (`ACTIONS` map) |
| Keyboard shortcut dispatcher | `src/lib/shortcuts/useGlobalShortcuts.ts` (mounted in `Dashboard.tsx`) |
| Settings storage (defaults → localStorage) | `src/data/settings/settings.json` + `src/lib/settings-context.tsx` |
| Magic numbers (panel sizes, token costs, debounce ms) | `src/lib/constants.ts` |

---

## Module conventions

- **Named exports only** — `export default` is never used.
- **One component per file** — filename matches the exported name, PascalCase. Co-located type-only exports beside the component are fine.
- **JSDoc required** — every `.tsx` has a top-of-file `/** ... */` block describing the file, plus a `/** @param ... */` block on the main export.
- **Imports** — `@/` alias for anything crossing directory boundaries. Siblings are `./Sibling`. Never import `./ParentDir/Child` from within `ParentDir`.
- **Style** — single quotes, 2-space indent, UTF-8, LF, trim trailing whitespace (enforced by `.editorconfig`).

### Where to put new things

| New thing | Put in |
|---|---|
| Reusable across any panel | `src/components/ui/` |
| Only used in settings pages | `src/components/settings/shared/` |
| Only used in right-auxiliary | `src/components/right-auxiliary/` (or sub-dir) |
| Center panel content | `src/components/center-workspace/` |
| Left / right sidebar / shortcuts UI | `src/components/{left-nav \| right-auxiliary \| shortcuts}/` |
| Pure utility (no React) | `src/lib/` |
| Static config (wizards, nav, tabs, themes) | `src/data/config/` |
| A data domain | `src/data/{domain}/` with `interface.ts` + `store.ts` |
| Keyboard shortcut runtime | `src/lib/shortcuts/` |
| Keyboard shortcut UI | `src/components/shortcuts/` |

Always create an `index.ts` barrel when 2+ sibling files exist. **Never** create files at `src/components/` root.

---

## shadcn / UI primitives

Add new primitives via `bunx shadcn@latest add <component-name>` — they land in `src/components/ui/`. Button uses `variant="default"` (not `"solid"`). Use `cn()` from `@/lib/utils` (clsx + tailwind-merge) for class composition. Use CVA (`class-variance-authority`) for components with multiple variant/size axes.

Domain primitives (custom, not in shadcn) — keep them as-is: `IconButton`, `StatusDot`, `StatusFilter`, `SegmentedControl`, `CodeBlock`, `SectionLabel`, `StatCard`, `UniversalListCard`, `MaximizeOnDoubleClick`, `AccordionCore`, `FavoritesSection`, `SaveBar` (replaces the old `SettingsSaveBar` and `SaveCancelBar`).

---

## Tailwind / CSS

- No hex literals in source — use the CSS vars defined in `src/index.css` (`--chart-1`, `--accent`, `--highlight`, `--tertiary`, …). They are exposed as Tailwind utilities via `@theme inline`, so `bg-chart-1`, `text-accent`, etc. work directly.
- Animation utilities (`animate-in`, `fade-in-0`, `zoom-in-95`, …) come from `tw-animate-css` and are imported in `src/index.css`.

---

## Data layer

**Single seam:** `src/data/datasource/`. The `DataSource` interface (`types.ts`) is the contract every backend satisfies. Every other file in the codebase reads through this interface — only `src/data/datasource/db-source.ts` imports `src/data/seed/seed.sql` directly.

**Single switch point:** `src/data/datasource/index.ts`. The factory re-exports from `db-source.ts`. Zero callers import from a specific implementation.

**Today, the only implementation is `DbDataSource`** (`src/data/datasource/db-source.ts`). On first boot it loads `src/data/seed/seed.sql` (bundled via Vite `?raw`) and executes all statements against libSQL. Schema versioning is tracked in `schema_meta`; mismatches trigger a drop-and-recreate.

**Adding a new domain:** create `src/data/{domain}/interface.ts` + `src/data/{domain}/store.ts`. Add seed INSERTs to `src/data/seed/seed.sql`. No factory changes.

**Verify the seam holds:**
```sh
rg "from '@/data/seed/seed.sql'|from '\\./seed\\.sql'" src electron scripts
```
Expected single hit: `src/data/datasource/db-source.ts`. Anything else is a leak.

**`src/data/settings/settings.json` is NOT mock data** and is always kept regardless of the data source.

---

## Settings architecture

`SettingsProvider` (`src/lib/settings-context.tsx`) merges `settings.json` (seed) + `localStorage` (user override); `localStorage` wins when both have a value. Settings pages call `useSettings().update(domain, patch)`. Settings nav is fully data-driven — `src/data/config/settings-registry.ts` is the single source of the 10 page entries (`account`, `appearance`, `privacy`, `defaults`, `keyboard`, `models`, `workflows`, `cost-usage`, `workspaces`, `billing`) and 3 categories (`personal`, `workflow`, `organization`). Both `Settings.tsx` and `SettingsSidebar.tsx` read from this registry — never duplicate nav data.

**Adding a new settings page** → create the page in `src/components/settings/`, add a registry entry (`id`, `label`, `icon`, `component`, `category`). **Adding a new setting** → update `settings.json`, add the type in `interface.ts`, add the UI, consume it in the component that needs it. **All 4 in the same PR — adaptive wiring rule:** if a setting is stored but never consumed outside its settings page, that's a bug.

### Theme vs. highlight split (non-obvious — do not break)

- `appearance.theme` → owns `--chart-1`, `--sidebar-primary`, `--accent`, `--accent-foreground`, `--highlight-foreground`. Editing a theme cascades to buttons, badges, tabs, borders, sidebar accents.
- `appearance.highlightColor` → owns only `--highlight`, `--highlight-match`, `--highlight-active`, `--highlight-foreground`. Drives Switch on-state, Pill active, selection backgrounds, active link underlines.
- `appearance.fontScale` → `<html>` font-size (only rem-based text scales; arbitrary `text-[Npx]` does not).
- `appearance.reduceMotion` → `data-reduce-motion` attr; CSS kills transitions when `"true"`.
- `appearance.codeSyntaxTheme` → `CodeBlock` background/foreground.

**To change the brand color, edit the theme, not `highlightColor`** — `highlightColor` was deliberately scoped narrower to avoid overriding theme authority.

---

## Keyboard shortcuts

**Developer-controlled, not user-rebindable.** To add a shortcut:

1. Add one entry to `DEFAULT_SHORTCUTS` in `src/lib/shortcuts/registry.ts` (`id`, `label`, `description`, `category`, `chord`, `scope`).
2. Add one handler in `src/lib/shortcuts/actions.ts` and register it in the `ACTIONS` map (keyed by the shortcut `id` — or `handles` field if different).
3. Done — `useGlobalShortcuts`, mounted once in `Dashboard.tsx`, dispatches it; the keyboard settings page lists it; any `<ShortcutHint shortcutId="…" />` renders it platform-aware.

Conventions: `Mod` = Cmd on Mac, Ctrl elsewhere. Unnamed keys unescaped (`Escape`, `Enter`, `ArrowUp`, `Space`). `Mod+1`–`Mod+9` are tab-cycle bindings.

Scopes:
- `'global'` (default) — only when not in an input or open dialog
- `'always'` — fires even inside inputs/dialogs (e.g. `Mod+Enter` send)
- `'in-canvas'` — only when a center tab is active (skip on the settings page)

`runRegistryValidation()` runs on Dashboard mount in dev and logs id/chord collisions. The keyboard settings page is documentation only — there is no `localStorage` sync and no rebinding UI.

---

## Data layer contract

Each domain: `src/data/{domain}/interface.ts` (types + function signatures) + `store.ts` (the only public API). Components import from `@/data/{domain}/store` — never from sibling mock files.

Stores delegate to a `Repository` that wraps a `DataSource` collection. The `DataSource` is obtained via `getDataSource()` from `src/data/datasource/index.ts` — the single factory. Reads are synchronous.

---

## Gotchas

- **Wrong dev command** — `bun run index.ts` does not work. This is Electron + Vite, not a Bun server. Use `bun run dev`.
- **Main-process logging** — use `electron-log`. `console.log` in `electron/main.ts` won't appear in devtools.
- **Bun-native libs** — `better-sqlite3`, `ioredis`, `express`, `ws` need native rebuilds for Electron. Do not add them to the main process.
- **No `src/components/archived/`.** It doesn't exist; don't create it.
- **No `api.ts` placeholder files.** If a domain needs a real backend, wire it directly into `store.ts`.
- **Settings seed is not mock.** `src/data/settings/settings.json` is never deleted by the mock cleanup.
- **`src/components/` root** is forbidden for new components — always go in the correct subdirectory.

---

## Adding a feature (short)

1. **Domain data** — types in `interface.ts`, impl in `store.ts`; if new domain, also add seed INSERTs to `src/data/seed/seed.sql`.
2. **Component** — create in the correct subdirectory (see table above). Top-of-file JSDoc + `@param` JSDoc on the component. Prefer existing shadcn primitives; add new ones via `bunx shadcn add`. Use CVA + `cn()` for variants.
3. **Wire it** — `TabBody.tsx` (center tabs), `RightAuxiliary.tsx`, or `AccordionCore.tsx` depending on which panel needs it.
4. **Verify** — `bun run typecheck` must pass. `bun run build` must pass. Update this guide if you added a new convention or shared utility location.
