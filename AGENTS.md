# Superhive — Contributor Guide

## Project

Bare-bones desktop shell. Electron + Vite + React + TypeScript + Tailwind v4. Two screens: Dashboard (landing) and Settings (7 pages). No agent orchestration, no data layer, no workspace management.

---

## Commands

```sh
bun install                # install deps
bun run dev                # Vite dev server + Electron (hot reload)
bun run typecheck          # tsc --noEmit — MANDATORY before commit
bun run build              # typecheck + vite build
bun run electron:build     # build + electron-builder → release/
bun run electron:preview   # vite build + electron .
```

**No test framework, no linter, no formatter are configured.** `bun run typecheck` is the single verification gate. It runs with `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, and `verbatimModuleSyntax: true`. Fix every error before committing.

**Use `bun` for everything** — package management and script running. Do not use `npm`, `pnpm`, or `yarn`.

---

## Architecture at a glance

```
src/
├── App.tsx · main.tsx · index.css     # React entry, Tailwind v4 theme vars
├── screens/
│   ├── Dashboard.tsx                    # Landing screen ("Dashboard" + "Welcome to Superhive")
│   └── Settings.tsx                    # Settings screen (sidebar nav + 7 pages)
├── components/
│   ├── settings/                       # 7 settings pages + shared/ sub-components
│   │   ├── AccountSettings.tsx         # Connected accounts, profile, sign out
│   │   ├── AppearanceSettings.tsx       # Theme picker (dark/light/system)
│   │   ├── DefaultsSettings.tsx         # Placeholder — coming soon
│   │   ├── KeyboardSettings.tsx         # Shortcut registry reference page
│   │   ├── ModelsSettings.tsx           # Placeholder — coming soon
│   │   ├── WorkflowsSettings.tsx        # Placeholder — coming soon
│   │   ├── BillingSettings.tsx          # Placeholder — coming soon
│   │   └── shared/                     # SettingSection, SettingRow, SettingsPageHeader,
│   │                                    # SettingSearch, ColorPicker, ComingSoonBadge,
│   │                                    # SelectableCard, ResetSection
│   └── shortcuts/                       # ShortcutHint, ShortcutRow, CategoryGroup
│       ├── Hint.tsx                    # Renders chord chips (⌘K style) + ShortcutHint
│       ├── ShortcutRow.tsx             # Single row in keyboard settings
│       └── CategoryGroup.tsx           # Grouped section in keyboard settings
├── data/
│   ├── settings/                       # Settings domain
│   │   ├── interface.ts                # Settings type, AppearanceSettings, BillingSettings,
│   │   │                                # ModelsSettings, WorkflowsSettings, AccountSettings
│   │   ├── settings.json                # Seed defaults
│   │   └── storage.ts                  # localStorage + IPC persistence
│   └── config/                         # Static config
│       ├── themes.ts                   # DEFAULT_THEMES (dark/light/system)
│       ├── palette.ts                  # DARK_PALETTE for theme previews
│       ├── css-vars.ts                 # ALL_CSS_VARS for theme application
│       └── settings-registry.ts        # 7 page entries (id, label, icon, component, category)
└── lib/
    ├── shortcuts/
    │   ├── registry.ts                 # DEFAULT_SHORTCUTS (40 entries), getShortcutById
    │   ├── format.ts                   # formatChord, formatChordText
    │   ├── chord.ts                    # normalizeChord, chordForPlatform
    │   └── platform.ts                 # detectPlatform, usePlatform
    ├── settings-context.tsx            # SettingsProvider + useSettings (DOM theme application)
    ├── toast-context.tsx               # ToastProvider + useToast (sonner-backed)
    ├── utils.ts                        # cn() (clsx + tailwind-merge)
    ├── constants.ts                    # STROKE_WIDTH
    ├── initials.ts                     # getInitials (Avatar fallback)
    └── relative-time.ts                # formatRelativeTime (WorkflowsSettings)

electron/
├── main.ts                              # Window creation + settings IPC + libSQL boot (stub only)
└── preload.ts                          # IPC bridge: readSettings, writeSettings, dbQuery,
                                       # dbExecute, dbBatch
```

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
| Settings page | `src/components/settings/` |
| Shortcut display component | `src/components/shortcuts/` |
| Pure utility (no React) | `src/lib/` |
| Static config | `src/data/config/` |
| Settings domain | `src/data/settings/` |

Always create an `index.ts` barrel when 2+ sibling files exist. **Never** create files at `src/components/` root.

---

## Settings

Settings is a sidebar nav (7 pages) backed by `settings.json` + localStorage. `SettingsProvider` in `src/lib/settings-context.tsx` applies theme/appearance changes to the DOM on every update.

### Settings pages

| ID | Page | Status |
|---|---|---|
| `account` | AccountSettings | Full — connected accounts, profile, sign out |
| `appearance` | AppearanceSettings | Full — theme picker (dark/light/system) |
| `defaults` | DefaultsSettings | Placeholder — coming soon |
| `keyboard` | KeyboardSettings | Full — shortcut reference (40 entries from registry) |
| `models` | ModelsSettings | Placeholder — coming soon |
| `workflows` | WorkflowsSettings | Placeholder — coming soon |
| `billing` | BillingSettings | Placeholder — coming soon |

### Adding a new settings page

1. Create the page in `src/components/settings/`
2. Add a registry entry in `src/data/config/settings-registry.ts` (`id`, `label`, `icon`, `component`, `category`)
3. Add the settings type in `src/data/settings/interface.ts`
4. Add seed defaults in `src/data/settings/settings.json`
5. Verify: `bun run typecheck` must pass

---

## Keyboard shortcuts

**Developer-controlled, not user-rebindable.** The keyboard settings page (`KeyboardSettings`) is purely a reference list — it reads from `DEFAULT_SHORTCUTS` in `src/lib/shortcuts/registry.ts` and renders every entry. No handler dispatches them.

To add a shortcut:
1. Add one entry to `DEFAULT_SHORTCUTS` in `src/lib/shortcuts/registry.ts` (`id`, `label`, `description`, `category`, `chord`, `scope`).
2. Done — `KeyboardSettings` picks it up automatically; `<ShortcutHint shortcutId="..." />` renders it platform-aware.

Conventions: `Mod` = Cmd on Mac, Ctrl elsewhere. `Mod+1`–`Mod+9` are tab-cycle bindings.

Scopes: `'global'` (default), `'always'` (fires in inputs/dialogs), `'in-canvas'` (only when center tab active).

---

## Electron / IPC

`electron/main.ts` exposes 5 IPC handlers via `preload.ts`:
- `settings:read` / `settings:write` — settings persistence to `userData/.superhive/settings.json`
- `db:query` / `db:execute` / `db:batch` — libSQL data DB (schema boot ready, currently no collections)

`preload.ts` does not expose `platform`, `version`, `toggleMaximize`, `onMaximizedChanged`, or `getDataDir` — those were stripped as dead.

Use `electron-log` for main-process logging. `console.log` in `electron/main.ts` won't appear in devtools.

---

## Tailwind / CSS

- No hex literals in source — use CSS vars from `src/index.css`.
- `--chart-1`, `--accent`, `--highlight`, `--tertiary`, etc. are exposed as Tailwind utilities via `@theme inline`.
- Animation utilities (`animate-in`, `fade-in-0`, `zoom-in-95`, …) come from `tw-animate-css` and are imported in `src/index.css`.

---

## Gotchas

- **Wrong dev command** — `bun run index.ts` does not work. This is Electron + Vite, not a Bun server. Use `bun run dev`.
- **Main-process logging** — use `electron-log`. `console.log` in `electron/main.ts` won't appear in devtools.
- **`src/components/` root** is forbidden for new components — always go in the correct subdirectory.
- **Settings seed is not mock.** `src/data/settings/settings.json` is never deleted.

---

## Adding a feature

1. **Component** — create in the correct subdirectory (see table above). Top-of-file JSDoc + `@param` JSDoc on the component. Prefer existing shadcn primitives; add new ones via `bunx shadcn add`. Use CVA + `cn()` for variants.
2. **Wire it** — if it's a new screen, add a route/page toggle in `App.tsx`.
3. **Verify** — `bun run typecheck` must pass. `bun run build` must pass.
