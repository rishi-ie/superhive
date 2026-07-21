# Modularity Check — superhive

After a long day of adding features, point an agent at this file. The agent reads it, walks the steps in order, and writes a `modularity-report.md` saying what passed and what needs fixing.

## Scope

Only inside `superhive/`. The external repos `superhive-pi-truth`, `superhive-pi-telemetry`, and `general-kai` are black-box dependencies. They are not graded here. Their install pattern is documented in Step 13.

## How to use this file

1. Pick the scope in Step 0.
2. Walk Steps 1 through 15 in order.
3. Write `modularity-report.md` at the end. Format is in the Output section.

## Severity

- **Pass** — clean.
- **Warn** — should fix; not blocking the next feature day.
- **Fail** — must fix before the next feature day.

---

## Step 0 — Pick the scope

Default: full repo.

You may narrow to today's work with `git diff --name-only main..HEAD`. If you narrow, every Step still runs, but only on the changed files. Do not narrow if Step 9 (storage ghosts) or Step 15 (AGENTS.md accuracy) needs full-repo reads.

---

## Step 1 — Type and shape inventory

Shapes (TypeScript types and interfaces) live in exactly one of three homes:

| Home | What goes here |
|---|---|
| `src/storage/types.ts` | Storage layer shapes (entities, repo inputs/outputs) |
| `src/models/` | Renderer and UI domain shapes |
| `src/types/electron.d.ts` | IPC contract shapes — `window.api.*` and runtime type re-exports |

Walk the tree. For every type or interface, confirm it sits in the right home.

A shape imported across homes is a **Fail**. Move it to the correct home and update importers.

---

## Step 2 — Flow folder shape

Every entity under `src/flows/` must have these three subfolders, even if empty:

- `crud/` — list, load, create, update, delete, select flows
- `runtime/` — use-X-runtime and start-X-runtime hooks
- `ui/` — open-X, close-X, toggle-X flows

Each subfolder must have an `index.ts` barrel.

Each entity folder must have a top-level `index.ts` barrel.

Cross-entity folders (`navigation/`, `ui/`) do not need the 3-tier — they are not entities.

A missing subfolder, a missing barrel, or a stray file at the entity root (other than `index.ts`) is a **Fail**. Stores no longer live under `src/flows/<entity>/`; they live under `src/stores/` and are exempt from the "stray file" rule.

---

## Step 3 — File size audit

Cap: 500 lines per file.

- 500 to 700 lines → **Warn**.
- Over 700 lines → **Fail**.

Special target: `electron/general-kai-runtime.ts` is currently 758 lines. It must be split into:

- `general-kai-runtime/lifecycle.ts` — agent subprocess start/stop/health
- `general-kai-runtime/telemetry-tailer.ts` — per-agent JSONL tail → IPC broadcast (this file already lives at `electron/pi-protocol/telemetry-tailer.ts`; the split should reuse or move it cleanly)
- `general-kai-runtime/ipc.ts` — IPC dispatch

A file over 700 lines that has not been split is a **Fail**, even if the rest of the repo is clean.

---

## Step 4 — API wrapper thinness

Files in `src/api/` are thin wrappers around `window.api.*`. Allowed:

```ts
export const agents = {
  list: () => window.api.agents.list(),
  create: (input: CreateAgentInput) => window.api.agents.create(input),
};
```

Disallowed inside `src/api/`:

- branching, conditionals, default values
- data transformation (map, filter, merge)
- try/catch
- toasts, logging, side effects
- imports from `@/flows/*`, `@/storage/*`, `@/models/*`, `sonner`, `react-router-dom`

Any of the above in `src/api/*` is a **Fail**. Move the logic to `src/flows/<entity>/crud/`.

---

## Step 5 — UI to data path (flow isolation)

UI components and page views must never talk to `window.api.*` directly. They must go through flows.

Run from `superhive/` root:

```bash
rg "@/api" src/components src/pages
```

Zero results is **Pass**. Any hit is **Fail**.

The flow imports in components and pages must follow this pattern:

```ts
import { createAgent } from '@/flows/agents/crud/create-agent';
import { listAgents } from '@/flows/agents/crud/list-agents';
```

Imports from `@/api/*` are **Fail**. Imports from `@/flows/<entity>/<kind>/<file>` are correct.

---

## Step 6 — Vendor boundary

Skip `src/components/ui/`. It holds 28 shadcn vendor files. They are not graded.

But: if a vendor file contains custom styling (added after the shadcn install), flag it as input for Step 7. Custom edits to vendor files are a smell — the fix is to add a token to the preset and let the vendor file use it.

A custom edit in `src/components/ui/` is a **Warn** for the preset rule, not a Fail on its own.

---

## Step 7 — Style modularity

Run from `superhive/` root. All three must return zero.

```bash
rg "bg-(emerald|red|blue|green|yellow|orange|purple|pink|cyan|slate|gray|zinc|neutral|amber|lime|teal|sky|indigo|violet|fuchsia|rose)-" src -g '!src/styles/**'

rg "#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\(|hsl\(|hsla\(" src -g '!src/styles/**'

rg "\bspace-[xy]-\d" src -g '!src/styles/**'
```

Any hit is a **Fail**.

---

## Step 8 — Page mirror audit

`src/pages/agent-chat/` and `src/pages/project-chat/` mirror each other.

Read both folder trees. Find any file (or block of files) whose logic is duplicated. Examples to look for:

- The composer block (the context ring, the input box, the model picker)
- The message renderer (user message, assistant message, tool call)
- The sidebar of agents or projects inside the chat

Duplication with no shared module is a **Warn**. The fix is to extract a shared module. Suggest where the shared module should live — usually `src/components/layout/composer/` for the composer and a shared `MessageList` component for messages.

A duplicated single file under 100 lines is acceptable. Larger mirrors are a **Warn**.

---

## Step 9 — Storage cleanup

`src/storage/repositories/` currently holds three repos: `AgentRepository`, `ProjectRepository`, `SettingsRepository`.

Search the repo for ghost mentions of entities that do not exist as repos:

```bash
rg -i "TaskRepository|SessionRepository|TagRepository|WorkspaceRepository|ChannelRepository" src
```

Zero results is **Pass**. Any hit in code or comments is a **Fail**.

Also check `AGENTS.md` for the same ghost mentions. AGENTS.md says "3 of 8 wired — Task/Session/Tag/Workspace/Channel deleted." That sentence is the ghost. **Fail** until it is cleaned up. Either drop the sentence or replace it with the actual current state.

---

## Step 10 — Three-panel coupling

The renderer is a three-panel layout: LeftSidebar, Center Panel, RightPanel.

Run from `superhive/` root:

```bash
rg "from.*left-sidebar" src/components/layout/right-sidebar
rg "from.*right-sidebar" src/components/layout/left-sidebar
rg "from.*layout/.*from.*layout/" src/components/layout
```

The first two must be zero (no cross-region coupling). Any hit is a **Fail**.

Page-view components must live in `src/pages/<feature>/`, never in `src/components/layout/`. Confirm by listing the layout folder:

```bash
ls src/components/layout/{shell,left-sidebar,right-sidebar,common,command-palette,composer}
```

A page-view file (one whose name ends in `View.tsx` or matches a route) found in `src/components/layout/` is a **Fail**. Move it to `src/pages/<feature>/`.

---

## Step 11 — Naming

Files in `src/flows/` follow a verb-first pattern.

| Kind | Pattern | Example |
|---|---|---|
| CRUD flow | `<verb>-<entity>.ts` | `create-agent.ts`, `list-agents.ts` |
| Runtime hook | `use-<entity>-runtime.ts` or `start-<entity>-runtime.ts` | `use-agent-runtime.ts` |
| UI flow | `open-<thing>.ts`, `close-<thing>.ts`, `toggle-<thing>.ts` | `open-create-agent.ts` |
| Store (renderer mirror) | `src/stores/<entity>.ts` | `src/stores/agent.ts` |
| Barrel | `index.ts` | `index.ts` |

Wrong casing, wrong order, wrong form is a **Warn**. The fix is to rename. The barrel must be `index.ts`.

**Engine files exception.** Files in `src/flows/<entity>/runtime/` whose purpose is a *pipeline* — the per-agent stream queue (`queue.ts`), the event-to-op mapping (`event-translator.ts`), the slice state container (`slice.ts`) — are exempt from the verb-first rule. They are engines, not flows. Their consumers (the runtime hooks like `useAgentRuntime`) are the flows. The name describes the artifact, not the action. This is the only naming exception in `src/flows/`. Same rule documented in `superhive/AGENTS.md` Section 5.

---

## Step 12 — Magic numbers and config

Search for magic numbers used in business logic:

```bash
rg "200_?000|contextWindow.*=.*[0-9]|setInterval\(.*[0-9]+\)" src electron
```

Examples of magic numbers today:

- `CONTEXT_WINDOW_FALLBACK = 200_000` (lives in two composers)
- `fs.watch` debounce values
- IPC timeout values

These constants should live in one place — a single config module. The likely homes are:

- `src/lib/constants.ts` for renderer constants
- `electron/config.ts` for main-process constants

A magic number that appears in more than one file is a **Warn**. A magic number in `src/components/` or `src/pages/` (where it should never live) is a **Fail**.

---

## Step 13 — External dependency surface

Three external surfaces. The rubric only checks that the install pattern matches the spec; the external repos themselves are out of scope.

| Surface | Install pattern | Where it appears in `superhive/` |
|---|---|---|
| `superhive-pi-truth` | npm dep, GitHub-tagged | `package.json` `dependencies` |
| `superhive-pi-telemetry` (types only) | peer dep | `package.json` `peerDependencies` |
| `superhive-pi-telemetry` (runtime) | symlink per agent into `~/.superhive/extensions/superhive-pi-telemetry/` | `electron/extension-source.ts` (or equivalent) |
| `general-kai` template | vendored in `general-kai/` and shipped with each agent | `electron/install-general-kai.ts` |

Checks:

- `superhive-pi-truth` must be referenced exactly once in `package.json`, under `dependencies`. If it appears under `devDependencies` or is duplicated, **Fail**.
- `superhive-pi-telemetry` must be a `peerDependencies` entry. If it is a `dependencies` entry, **Fail** (runtime comes from the symlink, not from the renderer bundle).
- The two `superhive-pi-truth` copies on disk (the dev one at `superhive-5/superhive-pi-truth/` and the bundled one at `superhive-5/general-kai/extensions/superhive-pi-truth/`) are the **same module, two paths**. The bundled copy must be regenerated by a documented sync step (today it is `cp -R`). If the bundled copy is more than one commit ahead of or behind the dev copy, **Fail**.

---

## Step 14 — Preset and theme

The single source of truth for tokens is `src/styles/presets/<name>.css`. Today that is `radix-mira.css`.

`src/styles/globals.css` must `@import` the preset and must not redefine tokens. Run:

```bash
rg "^[^/]*--[a-z-]+:" src/styles/globals.css
```

A token declared in `globals.css` is a **Fail**. Move it to the preset.

A second preset file in `src/styles/presets/` is a **Fail** unless `globals.css` imports both and the tokens do not overlap.

---

## Step 15 — AGENTS.md accuracy

`AGENTS.md` is the source of truth for any folder mentioned in it. If it lies, fix it.

Checks:

- Every folder listed under `src/` in AGENTS.md must exist on disk. `ls` each one.
- Every file mentioned by name in AGENTS.md must exist. `find` for it.
- The folder counts AGENTS.md cites must match the disk:
  - "26 components, 4 unused" in `src/components/ui/` → `ls src/components/ui | wc -l` should be 30 (today: 28, after dropping `icon.tsx` / `huge-icon.tsx` to `src/components/common/` would land at 26; documented target is the 28 currently on disk until the icon-library move lands).
  - "3 of 8 wired" in `src/storage/repositories/` → must be rewritten (Step 9).
  - `src/components/common/` lists `(EmptyState, Spinner, PanelHeader, FormField deleted)` → confirm those four are absent from disk.
  - "3 of 8 wired" in `src/storage/repositories/` → must be rewritten (Step 9).
  - "54 unit tests" outside this repo — out of scope, do not check.

A folder that AGENTS.md lists but does not exist is a **Fail**. A folder that exists but AGENTS.md does not list is a **Warn**.

---

## Output

The agent writes `superhive/modularity-report.md`. Format:

```markdown
# Modularity Report

- **Date:** YYYY-MM-DD
- **Scope:** full repo | git diff main..HEAD
- **Auditor:** <agent name or human>

## Steps

| # | Step | Result | Notes |
|---|------|--------|-------|
| 1 | Type and shape inventory | Pass / Warn / Fail | |
| 2 | Flow folder shape | | |
| 3 | File size audit | | |
| 4 | API wrapper thinness | | |
| 5 | UI to data path | | |
| 6 | Vendor boundary | | |
| 7 | Style modularity | | |
| 8 | Page mirror audit | | |
| 9 | Storage cleanup | | |
| 10 | Three-panel coupling | | |
| 11 | Naming | | |
| 12 | Magic numbers | | |
| 13 | External dependency surface | | |
| 14 | Preset and theme | | |
| 15 | AGENTS.md accuracy | | |

## Findings

### Fail
- `path/to/file.ts:42` — short description. Suggested fix.

### Warn
- `path/to/file.ts:120` — short description. Suggested fix.

### Pass
- One-line summary per passing step.
```

Every Fail must have a `file:line` reference and a suggested fix. Warnings should too. Pass can be a one-liner.

---

## Maintenance

When the structure of `superhive/` changes — a new entity under `src/flows/`, a new IPC handler, a new storage repo, a new preset — update the corresponding Step in this file. The rubric is only useful if it tracks the real shape of the repo.