# Superhive Renderer + Electron Main Process — AGENTS.md

> The Electron desktop app. Renderer (React + shadcn) + main process + IPC. See the parent `superhive-5/AGENTS.md` for cross-module rules (settings file format, telemetry stream, IPC channel, launch command).

## 1. Scope of this folder

`superhive/` owns:

| Path | Layer | Owns |
|---|---|---|
| `electron/` | Main process | IPC handlers, runtime, fs watchers, storage, agent lifecycle |
| `src/` | Renderer | React UI, flows, storage types, components |
| `src/api/` | Renderer↔IPC bridge | Thin wrappers around `window.api.*` |
| `src/storage/` | Persistence | lowdb-backed repositories |
| `src/flows/` | Business logic | Domain-organized by entity (`agents/`, `projects/`, `settings/`, `tasks/`, `navigation/`, `ui/`) |
| `src/pages/` | Routes | One folder per page (`agent-chat/`, `project-chat/`, `settings/`, `landing/`, `meta-hive/`, `plugins/`, `remote/`) |
| `src/components/` | UI | `common/` (shared widgets), `layout/` (shell + sidebars), `ui/` (shadcn primitives) |

Every module in this folder is independently editable. No sync tickets, no upstream/downstream hand-offs. Edit the file whose concern a change serves and move on.

## 2. The rubric

`modularity-check.md` is the source of truth for shape, layout, naming, and style modularity. **15 steps, 6 Pass-or-Fail gates.** Run it after a long feature day.

Cited by step:

- **Step 1** — type homes
- **Step 2** — flow folder shape
- **Step 3** — file size cap (500 / 700 / 758 for the runtime)
- **Step 4** — `src/api/` thinness
- **Step 5** — UI→data path
- **Step 7** — style tokens (no hardcoded colors, hex, or `space-x-N`)
- **Step 8** — `agent-chat/` ↔ `project-chat/` mirror
- **Step 10** — three-panel coupling (left-sidebar, center, right-sidebar)
- **Step 11** — verb-first naming in `src/flows/`
- **Step 12** — magic numbers
- **Step 14** — preset is the only token home

When the structure of `superhive/` changes — a new entity under `src/flows/`, a new IPC handler, a new storage repo, a new preset — update the corresponding Step in `modularity-check.md`. The rubric is only useful if it tracks the real shape of the repo.

## 3. The GAPS workflow

`GAPS.md` lists what we plan to build. Each gap gets:

1. A pre-marker commit on the relevant module (e.g. `pre gap 4`)
2. N feature commits (each leaves the test suite green)
3. A `changelog/YYYY-MM-DD-gap-N-<name>.md` file in the **module the change serves**
4. A `docs(<module>): Gap N changelog + GAPS update` commit

The changelog format (mirror `changelog/2026-07-21-gap-3-task-queue.md`):

- Summary (Before / After table)
- Files added
- Files modified
- "Where to change what" map (a list of common future edits → file)
- Out of scope (deferred to later gaps)
- Known limitations
- Risk + rollback

Don't write the changelog until all feature commits land. The changelog records what shipped, not what was planned.

## 4. Type homes (Step 1)

Every shape lives in exactly one of three homes:

| Home | What goes here |
|---|---|
| `src/storage/types.ts` | Storage layer shapes (entities, repo inputs/outputs) |
| `src/models/` | Renderer and UI domain shapes |
| `src/types/electron.d.ts` | IPC contract shapes — `window.api.*` and runtime type re-exports |

A shape imported across homes is a **Fail**. Move it to the correct home and update importers. Storage shapes never reach the renderer directly except through the IPC contract in `src/types/electron.d.ts`.

## 5. Flow folder shape (Step 2)

Every entity under `src/flows/` must have these three subfolders, even if empty:

- `crud/` — list, load, create, update, delete, select flows
- `runtime/` — use-X-runtime and start-X-runtime hooks
- `ui/` — open-X, close-X, toggle-X flows

Each subfolder must have an `index.ts` barrel. Each entity folder must have a top-level `index.ts` barrel. Cross-entity folders (`navigation/`, `ui/`) do not need the 3-tier — they are not entities.

A missing subfolder, a missing barrel, or a stray file at the entity root (other than `index.ts`) is a **Fail**. Stores no longer live under `src/flows/<entity>/`; they live under `src/stores/` (future) and are exempt from the "stray file" rule.

**Engine files exception** (Step 11): `src/flows/<entity>/runtime/<engine>.ts` files whose purpose is a *pipeline* (`queue.ts`, `event-translator.ts`, `slice.ts`) are exempt from the verb-first rule. They are engines, not flows. Their consumers (the runtime hooks) are the flows. This is the only naming exception in `src/flows/`.

## 6. UI→data path (Step 5)

UI components and page views must never talk to `window.api.*` directly. They must go through flows:

```ts
import { createAgent } from '@/flows/agents/crud/create-agent'
import { listAgents } from '@/flows/agents/crud/list-agents'
```

Imports from `@/api/*` are **Fail**. Imports from `window.api.*` in `src/components/` or `src/pages/` are **Fail**. The flow imports in components and pages follow `<verb>-<entity>.ts` from `@/flows/<entity>/<kind>/`.

`src/api/*` is allowed to call `window.api.*` only. No branching, no transforms, no try-catch, no toasts, no imports from `@/flows/*` / `@/storage/*` / `@/models/*` / `sonner` / `react-router-dom`. See Step 4.

## 7. Cross-module contracts (do not break)

The cross-module contracts live in the parent `superhive-5/AGENTS.md` and apply unchanged:

- **Truth files**: 4-file split under `<agentDir>/` — `settings.json` (runtime essentials) + `manage.json` (user-tweakable surface — identity/permissions/behavior/skills/extensions/prompts/planMode/project) + `overview.json` (right-sidebar Overview snapshot) + `inbox.json` (append-only feed). Each has its own `managedBy: "superhive-pi-truth@1#N"` counter + atomic `tmp + rename`. Legacy `Superhive-pi-<basename>.json` is migrated on first launch and deleted by the truth extension.
- **Telemetry stream**: `<agentDir>/telemetry.jsonl` — append-only, one JSON per line
- **IPC channels**: `agent:<id>:event` (22 `AdapterEvent` variants in `electron/pi-protocol/types.ts`) + 8 truth-file channels (`READ/WRITE` for `settings`/`manage`/`overview` + `READ/APPEND/MARK_READ/CLEAR` for `inbox`)
- **Launch**: `bash agent.sh --manifest <manifest.json>` — copied per agent

Cross-layer communication flows only through these contracts. No new IPC channels, no new file formats, no new telemetry events without updating the canonical schema in the module that owns it.

## 8. External Pi extensions — actual install pattern

The four Pi extensions the app depends on have three different install patterns. This is the current state; the rubric's Step 13 describes the target state.

| Extension | Install pattern | Where it appears in `superhive/` |
|---|---|---|
| `superhive-pi-truth` | npm dep, GitHub-tagged | `package.json` `dependencies` — `from 'superhive-pi-truth/...'` |
| `superhive-pi-telemetry` | monorepo path-import (dev), symlink per agent (runtime) | `electron/mailbox-store.ts:38` — `from '../../superhive-pi-telemetry/types'`; `electron/extension-source.ts` clones the runtime from GitHub into `~/.superhive/extensions/superhive-pi-telemetry/` |
| `superhive-pi-context` | local bundle (walk-up resolution) | `electron/install-context.ts` — `walkUp(cwd, 'superhive-pi-context')` or `<resourcesPath>/extensions/superhive-pi-context` |
| `superhive-pi-orchestration` | local bundle (walk-up resolution) | `electron/install-orchestration.ts` — `walkUp(cwd, 'superhive-pi-orchestration')` or `<resourcesPath>/extensions/superhive-pi-orchestration` |
| `general-kai` template | auto-cloned from GitHub on first agent creation | `electron/install-general-kai.ts` — `git clone https://github.com/rishi-ie/general-kai.git ~/.superhive/general-kai-template/` |

**The monorepo path-import pattern for `superhive-pi-telemetry` is intentional.** The dev-time types travel with the monorepo, so there's no version drift between the typechecked code and the symlinked runtime. Adding it to `peerDependencies` would force a separate npm install of the package, which would diverge from the monorepo copy. The dev path IS the peer dep — just expressed as a sibling-dir import.

**Seam-3 mirror check** (parent AGENTS.md rule 4): the bundled copies of `superhive-pi-truth`, `superhive-pi-context`, and `superhive-pi-orchestration` live at `general-kai/extensions/<name>/`. If you change the dev source, regenerate the bundled copy via `cp -R` (or a `bun run` script if one exists). Drift between dev and bundled is a **Fail**.

## 9. Style tokens (Step 7, Step 14)

- The single source of truth for tokens is `src/styles/presets/<name>.css` (today: `radix-mira.css`).
- `src/styles/globals.css` must `@import` the preset and must not redefine tokens.
- Components/pages never hardcode tailwind color names, hex colors, or `space-x-N`. Use semantic classes backed by preset tokens.
- Vendor files in `src/components/ui/` (shadcn) may contain raw color names — those are exempt per Step 6. Custom edits to vendor files are a smell; add a token to the preset and let the vendor file use it.

## 10. When in doubt

I ask. I do not invent a new module, contract, or workflow. The rubric is the rubric; the cross-module contracts are law; the test suite must be green before the next feature day.

If a change obviously belongs to one file, edit there. If it plausibly spans files and there is no clear primary owner, ask before editing.
