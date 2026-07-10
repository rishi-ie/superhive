# Pre-Implementation Plan: API Keys / BYOK Feature

> This document breaks the BYOK (Bring-Your-Own-Keys) implementation into small mini-tasks.
> Each task is scoped to a single commit. After every task, run verification and push.
> If a task needs a different approach, pause and revise the plan before moving on.

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│  /settings/models  (new UI)                                      │
│   ├─ Providers section: list of { name, baseUrl?, apiKey? }      │
│   └─ Models section: list of { provider, name, enabled? }        │
└─────────────────────────────────────────────────────────────────┘
                                │  flows/settings/crud/*
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/api/settings.ts  (renderer wrapper)                         │
└─────────────────────────────────────────────────────────────────┘
                                │  IPC: settings:*
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  electron/ipc/settings.ts  (main process)                        │
│   • LowDB SettingsRepository with OwnerType='global'             │
│   • At agent start: reads global providers, merges into         │
│     per-agent providers block (per-agent wins)                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Composers  (AgentChatView, ProjectChatView, ComposerCard)      │
│   • DropdownMenu of enabled models                                │
│   • Selection writes to agent.settings.model.{provider,name}     │
└─────────────────────────────────────────────────────────────────┘
```

## Locked-in decisions

- **Storage:** LowDB `SettingsRepository` with `OwnerType='global'`, auto-seeded into per-agent `providers` block at agent startup.
- **Providers:** Fully custom from start. Predefined list dropped. Each provider is `{ name, baseUrl?, apiKey? }`. Name is the user-chosen key (unique).
- **Models:** Curated, hardcoded catalog (matches the existing landing list). Per model, user enables/disables via a toggle. Custom model additions allowed.
- **Composer:** All three surfaces (agent, project, landing) get a working dropdown. Selection persists per-agent via `settings.model`.
- **Send behavior:** Switch model on next send (existing settings watcher handles propagation).
- **Right sidebar:** Remove the existing `ModelSection` / `ModelManageSection` entirely. Composer dropdown is the only place to pick a model.
- **API key UX:** Password input with eye/reveal toggle + copy-to-clipboard.
- **Phasing:** Three PRs, one per logical layer.
- **Backwards compat:** `.env.local` `MINIMAX_API_KEY` auto-seeds `providers.minimax` on agent start if no global entry exists (non-breaking).

---

## Phase 1 — Settings Page + Global Store + IPC

### Task 1.1: Add IPC channel constants for settings
**File:** `electron/ipc/ipc-channels.ts` (create or edit existing channels object)
**What:** Add `SETTINGS.GET_PROVIDERS`, `SETTINGS.SET_PROVIDER`, `SETTINGS.DELETE_PROVIDER`, `SETTINGS.GET_MODELS`, `SETTINGS.SET_MODEL_ENABLED`, `SETTINGS.ADD_MODEL`, `SETTINGS.DELETE_MODEL`, `SETTINGS.GET_ENABLED_MODELS` constants.
**Why:** Establishes the IPC contract before any handler exists.
**Verify:** `bun run typecheck` clean.
**Commit:** `chore(electron): add settings IPC channel constants`

### Task 1.2: Add `SettingsAPI` to renderer type definitions
**File:** `src/types/electron.d.ts`
**What:** Add `SettingsAPI` interface with all 8 method signatures. Add `settings: SettingsAPI` to `ElectronAPI`.
**Verify:** `bun run typecheck` clean.
**Commit:** `feat(api): add SettingsAPI type definition`

### Task 1.3: Add settings IPC handler (electron main)
**File:** `electron/ipc/settings.ts` (new), `electron/main.ts` or `registerIpc()` caller (edit)
**What:** Implement handlers for all 8 settings methods. Backed by `SettingsRepository` with `ownerType='global'`. Use `setSetting` / `getSetting` / `removeSetting` / `getByOwner` from the existing repository.
**Verify:** `bun run typecheck` clean.
**Commit:** `feat(electron): add settings IPC handler with global store`

### Task 1.4: Expose settings on preload bridge
**File:** `electron/preload.ts`
**What:** Expose `settings: { getProviders, setProvider, deleteProvider, getModels, setModelEnabled, addModel, deleteModel, getEnabledModels }` on `window.api`.
**Verify:** `bun run typecheck` clean.
**Commit:** `feat(preload): expose settings API`

### Task 1.5: Add renderer API wrapper
**File:** `src/api/settings.ts` (new), `src/api/index.ts` (edit barrel)
**What:** Type-safe wrapper around `window.api.settings.*`. 8 thin async functions.
**Verify:** `bun run typecheck` clean.
**Commit:** `feat(api): add settings renderer wrapper`

### Task 1.6: Add settings flows (CRUD)
**Files:**
- `src/flows/settings/crud/list-providers.ts`
- `src/flows/settings/crud/set-provider.ts`
- `src/flows/settings/crud/delete-provider.ts`
- `src/flows/settings/crud/list-models.ts`
- `src/flows/settings/crud/set-model-enabled.ts`
- `src/flows/settings/crud/add-model.ts`
- `src/flows/settings/crud/delete-model.ts`
- `src/flows/settings/crud/get-enabled-models.ts`
- `src/flows/settings/crud/index.ts`
- `src/flows/settings/index.ts`
- `src/flows/index.ts` (edit barrel)

**What:** Each flow: typed input → validation → `@/api/settings` call → toast → return `{ ok, data?, error? }`. Use the same shape as `agents/crud`.
**Verify:** `bun run typecheck` clean. `rg "@/api" src/components src/pages` returns 0.
**Commit:** `feat(flows): add settings CRUD flows`

### Task 1.7: Add curated model catalog
**File:** `src/pages/settings/sections/ModelsSection/catalog.ts` (new)
**What:** Export `CATALOG: Model[]` with the 5 existing models: `5.5 Extra High` (minimax), `Claude Sonnet 4.5` (anthropic), `GPT-4o` (openai), `Gemini 2.5 Pro` (google), `DeepSeek V3` (deepseek). Export `type Model = { id: string; provider: string; name: string }`.
**Verify:** `bun run typecheck` clean.
**Commit:** `feat(settings): add curated model catalog`

### Task 1.8: Build `PasswordInput` primitive
**File:** `src/components/common/PasswordInput.tsx` (new)
**What:** Reusable input with password masking, eye/reveal toggle, copy-to-clipboard button. Uses `InputGroup` (already in shadcn).
**Verify:** `bun run typecheck` clean.
**Commit:** `feat(ui): add PasswordInput primitive with reveal and copy`

### Task 1.9: Build `ProviderDialog`
**File:** `src/pages/settings/sections/ModelsSection/ProviderDialog.tsx` (new)
**What:** Shadcn `Dialog` with a form: name (text input, required, unique), base URL (optional text input), API key (PasswordInput). Submit calls `setProvider` flow. Toast on success/error. Closes on success.
**Verify:** `bun run typecheck` clean.
**Commit:** `feat(settings): add ProviderDialog`

### Task 1.10: Build `ModelDialog`
**File:** `src/pages/settings/sections/ModelsSection/ModelDialog.tsx` (new)
**What:** Shadcn `Dialog` with a form: provider (Select from existing providers), model name (text input). Submit calls `addModel` flow.
**Verify:** `bun run typecheck` clean.
**Commit:** `feat(settings): add ModelDialog`

### Task 1.11: Build `ProviderRow` and `ModelRow`
**Files:** `src/pages/settings/sections/ModelsSection/ProviderRow.tsx`, `ModelRow.tsx` (new)
**What:** Single-row components. ProviderRow shows name, base URL (if any), masked key with reveal, edit/delete buttons. ModelRow shows provider, model name, "no provider" badge if missing, enabled Switch, delete button (only for non-catalog models).
**Verify:** `bun run typecheck` clean.
**Commit:** `feat(settings): add ProviderRow and ModelRow`

### Task 1.12: Build `ModelsSection` page
**File:** `src/pages/settings/sections/ModelsSection.tsx` (new)
**What:** The `/settings/models` page. Two sections: Providers (header + `ProviderRow` list + Add button) and Models (header + `ModelRow` list + Add button). Loads data via `useProviders()` and `useModels()` hooks.
**Verify:** `bun run typecheck` clean.
**Commit:** `feat(settings): add ModelsSection page`

### Task 1.13: Add `useProviders` and `useModels` hooks
**Files:** `src/flows/settings/ui/use-providers.ts`, `use-models.ts` (new) + `src/flows/settings/ui/index.ts` (new)
**What:** React hooks that wrap flows with `useState` + `useEffect` (load on mount, expose `refresh`).
**Verify:** `bun run typecheck` clean.
**Commit:** `feat(flows): add useProviders and useModels hooks`

### Task 1.14: Wire `ModelsSection` into the router
**File:** `src/pages/settings/SettingsSectionView.tsx` (edit)
**What:** Replace the placeholder with a `switch (section)` that renders `ModelsSection` for `section === 'models'`, and a generic placeholder for everything else.
**Verify:** `bun run typecheck` clean. Manual: navigate to `/settings/models`, see the page.
**Commit:** `feat(settings): route /settings/models to ModelsSection`

### Task 1.15: Phase 1 verification
**What:** Full smoke test: open settings, add provider, add key, add model, toggle enabled, refresh and verify persistence. `bun run typecheck && bun run build && rg "@/api" src/components src/pages` returns 0. Commit + push.
**Commit:** `chore(settings): phase 1 verification`

---

## Phase 2 — Composer Dropdowns

### Task 2.1: Build `ModelPicker` component
**Files:**
- `src/components/layout/composer/ModelPicker/ModelPicker.tsx` (new)
- `src/components/layout/composer/ModelPicker/ModelMenu.tsx` (new)
- `src/components/layout/composer/ModelPicker/index.ts` (new)

**What:** Shared dropdown. Receives optional `agentId` prop. Reads enabled models from `useEnabledModels()`. If `agentId` is set, reads current selection from `useAgentSettings(agentId).settings.model` and writes back via `patch('model', ...)`. If no `agentId`, the dropdown is decorative (landing page).
**Verify:** `bun run typecheck` clean.
**Commit:** `feat(composer): add ModelPicker component`

### Task 2.2: Wire `ModelPicker` into `AgentChatView`
**File:** `src/pages/agent-chat/AgentChatView.tsx` (edit)
**What:** Replace the hardcoded "5.5 Extra High" button with `<ModelPicker agentId={agentId} />`.
**Verify:** `bun run typecheck` clean. Manual: open agent chat, dropdown works, selection persists across reloads.
**Commit:** `feat(agent-chat): wire ModelPicker into composer`

### Task 2.3: Wire `ModelPicker` into `ProjectChatView`
**File:** `src/pages/project-chat/ProjectChatView.tsx` (edit)
**What:** Same as 2.2 but for the project-coordinator agent. Pass the project agent's agentId.
**Verify:** Same as 2.2.
**Commit:** `feat(project-chat): wire ModelPicker into composer`

### Task 2.4: Wire `ModelPicker` into `ComposerCard` (landing)
**File:** `src/pages/landing/ComposerCard.tsx` (edit)
**What:** Replace the existing `DropdownMenu` with `<ModelPicker />` (no agentId). Behavior: dropdown shows enabled models, label updates. Selection is decorative.
**Verify:** `bun run typecheck` clean. Manual: landing dropdown shows enabled models.
**Commit:** `feat(landing): wire ModelPicker into composer`

### Task 2.5: Phase 2 verification
**What:** Full smoke test on all 3 composers. `bun run typecheck && bun run build && rg "@/api" src/components src/pages` returns 0. Commit + push.
**Commit:** `chore(composer): phase 2 verification`

---

## Phase 3 — Auto-Seed + Remove Right Sidebar

### Task 3.1: Verify global providers read chain
**What:** Confirm `getProviders` is exposed all the way: handler → preload → API wrapper. No new code if already in place. If any layer is missing, fill it in.
**Verify:** `bun run typecheck` clean.
**Commit:** (skip if no change)

### Task 3.2: Implement auto-seed in agent start handler
**File:** `electron/ipc/agents.ts` (edit) — wherever the `start` handler reads/writes the per-agent settings
**What:** Before spawning the agent subprocess, read the global providers via `getProviders()`, read the per-agent settings via `readSettings(agentId)`, merge with **per-agent wins**, write back via `writeSettings(agentId, merged)`. Add a comment explaining the precedence.
**Verify:** `bun run typecheck` clean. Manual: add a key in settings, start a new agent, verify the key is in the per-agent `providers` block.
**Commit:** `feat(agents): auto-seed global providers into per-agent settings on start`

### Task 3.3: Auto-seed env-var MiniMax key as bootstrap default
**File:** `electron/ipc/agents.ts` (edit, same handler as 3.2)
**What:** If `process.env.MINIMAX_API_KEY` exists AND the global store has no `minimax` provider, auto-seed `providers.minimax = { apiKey: process.env.MINIMAX_API_KEY }` in the per-agent file. Non-breaking migration.
**Verify:** Manual: with `.env.local` set, create a new agent, verify the per-agent `providers.minimax` is populated.
**Commit:** `feat(agents): bootstrap minimax provider from env if not set in global store`

### Task 3.4: Remove right sidebar Model section
**Files:**
- Delete `src/components/layout/right-sidebar/sections/ModelSection.tsx`
- Delete `src/components/layout/right-sidebar/sections/ModelManageSection.tsx`
- Edit `src/components/layout/right-sidebar/sections/registry.tsx` to remove the `model` entry from `MANAGE_SECTIONS`

**Verify:** `bun run typecheck` clean. Manual: open agent chat, right sidebar Manage tab has no Model section.
**Commit:** `feat(right-sidebar): remove Model section, composer is the only picker`

### Task 3.5: Remove "Engine Specs" block from `OverviewSection`
**File:** `src/components/layout/right-sidebar/sections/OverviewSection.tsx` (edit)
**What:** Remove the block that shows `settings.model.{provider,name}` + thinking level. Decide on replacement (or no replacement) at the time.
**Verify:** `bun run typecheck` clean. Manual: right sidebar Overview tab no longer shows Engine Specs.
**Commit:** `style(right-sidebar): remove engine specs block from Overview`

### Task 3.6: Phase 3 verification
**What:** Full smoke test: add key in settings → start new agent → verify per-agent `providers` block is correct → check composer dropdown in agent + project + landing → verify right sidebar Manage tab has no Model section. `bun run typecheck && bun run build && rg "@/api" src/components src/pages` returns 0. Commit + push.
**Commit:** `chore(byok): phase 3 verification`

---

## Phase 4 — Polish (optional, defer if heavy)

### Task 4.1: Add "no provider" badge on model rows
**File:** `src/pages/settings/sections/ModelsSection/ModelRow.tsx` (edit)
**What:** If a model references a provider that isn't in the global store, show a small "Missing key" badge.
**Commit:** `feat(settings): warn when model has no provider configured`

### Task 4.2: Add a "Test connection" button per provider (v2)
**File:** `src/pages/settings/sections/ModelsSection/ProviderRow.tsx` (edit)
**What:** "Test" button that pings the provider's base URL with the key. Shows ✓ or ✗. Defer if per-provider implementation is heavy.
**Commit:** `feat(settings): add test connection button per provider`

---

## Verification checklist (run after every task)

```bash
bun run typecheck
bun run build
rg "@/api" src/components src/pages   # must return 0
```

## Workflow per task

1. I do the work for one task.
2. I run the verification checklist.
3. I show you the diff and wait for your "go" or feedback.
4. On "go", I commit + push.
5. Move to the next task.

If a task needs a different approach, pause and revise the plan before moving on.

---

## Total: ~28 small tasks across 4 phases, each a single commit.
