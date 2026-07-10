# Pre-Implementation Plan: BYOK Pipeline — End-to-End Wiring (Phase 4)

> Each task is 5–10 minutes. Single commit. Granular, modular, buildable in any order within a batch.
> After every task: `bun run typecheck && bun run build && rg "@/api" src/components src/pages`.
> If a task needs a different approach, pause and revise before moving on.

---

## Architecture overview (current state + target)

```
User opens Settings → Models
  -> add provider (name, baseUrl, apiKey) ---+
  -> add model (provider, name)             ---+
  -> enable toggle on model rows            ---+
                  |
                  v
  LowDB db.settings.json  (ownerType='global')
    group='providers':  { anthropic: {name, baseUrl, apiKey}, ... }
    group='models':     { 'openai:gpt-4o': {id, provider, name, enabled, isCustom} }

  Composer (AgentChatView, ProjectChatView, ComposerCard)
    ModelPicker -> list = getEnabledModels() INTERSECT providersWithKey()
    onSelect -> patch('model', {provider, name}) per agent

  Agent start (electron/ipc/runtime.ts)
    autoSeedProviders():
      merged = { ...globalProviders, ...perAgentProviders }   // per-agent wins
      bootstrapEnvProviders(merged)                           // *_API_KEY env vars
      writeSettings(agentId, { providers: merged })

  Agent extension start (extensions/superhive-pi-truth)
    runExtension:
      initState(settings)
      envMigration()                 // moves *_API_KEY to settings.environment
      NEW: applyProviders({}, settings.providers, ctx)   // B1 fix
      startWatcher()

  User picks a model in ModelPicker
    patch('model', {provider, name}) (debounced 500ms)
    writeSettings(agentId, { model: {...}, defaultProvider, defaultModel })
    watcher fires -> applySettingsDiff -> applyModel() (B2: needs api lookup)
    setModel() in running session
```

---

## Locked-in decisions

- **Model row toggle is BLOCKED unless the model's provider has a key (and baseUrl, if it's a custom provider) configured.** No "No key" badge — the toggle is simply disabled, with a tooltip explaining why. The user must save the provider first, then come back and enable the model.
- **ModelPicker filters to only enabled models whose provider has a key.** No "missing key" rows in the dropdown at all.
- **Send is disabled when no model is selected.** Same visual treatment as a busy state.
- **No env-var fallback for non-minimax providers** in Phase 4 batch 1. (Env-var bootstrap is generalized later in batch 3.)
- **All bugs in the report (B1–B18) are addressed** by end of Phase 4, except B11/B12/B14 which are explicitly deferred.

---

## Phase 4 — End-to-end wiring (3 batches, 21 tasks, 21 commits + 3 verification = 24 total)

---

## BATCH 1 — UI guardrails + locked-down enablement (6 tasks)

**Goal:** A user cannot enable a model without a key, and cannot send without picking a model. ModelPicker only shows models the user can actually use.

---

### Task 4.1.1: Add `useProviders` selector keyed by name presence

**File:** `src/flows/settings/ui/use-providers.ts` (edit)
**What:** Add a derived `providerNames: Set<string>` and `hasProvider(name: string): boolean` to the returned object. No IPC changes.
**Verify:** typecheck.
**Commit:** `feat(settings): add hasProvider helper to useProviders`

---

### Task 4.1.2: Gate the model toggle in `ModelRow`

**File:** `src/pages/settings/sections/ModelsSection/ModelRow.tsx` (edit)
**What:** The component already accepts `hasProvider`. Disable the `Switch` when `hasProvider === false`. Add a `Tooltip` (from shadcn) with the text "Add a key for `<provider>` in Providers above to enable". Also visually de-emphasize the row (40% opacity) when disabled.
**Verify:** typecheck.
**Commit:** `feat(settings): disable model toggle when provider has no key`

---

### Task 4.1.3: Verify shadcn `Tooltip` is installed

**File:** `src/components/ui/tooltip.tsx`
**What:** Confirm the file exists. If not, run `bunx shadcn@latest add tooltip`. If present, no-op (no commit).
**Verify:** file exists.
**Commit:** (skip if no change)

---

### Task 4.1.4: Make `onToggleModel` reject toggles on missing provider

**File:** `src/pages/settings/sections/ModelsSection.tsx:79-85` (edit)
**What:** Change the signature: `onToggleModel(m: MergedModel, enabled: boolean)` -> `onToggleModel(m: MergedModel, enabled: boolean, hasProvider: boolean)`. If `!hasProvider`, return early + `toast.error("Add a key for ${m.provider} first")`. Pass `hasProvider` to `ModelRow` (already plumbed via `providerNames.has(m.provider)`).
**Verify:** typecheck.
**Commit:** `feat(settings): block toggle on missing-provider models`

---

### Task 4.1.5: Add `getProviders` import to `ModelPicker`

**File:** `src/components/layout/composer/ModelPicker/ModelPicker.tsx` (edit)
**What:** Add `listProviders` to the imports. In the existing `useEffect` that calls `getEnabledModels()`, also call `listProviders()` and store the result in a `providerNames: Set<string>` state. Filter `list` to only models whose `provider` is in `providerNames`.
**Verify:** typecheck.
**Commit:** `feat(model-picker): filter to models with a configured key`

---

### Task 4.1.6: Show empty-state CTA in `ModelPicker` when no usable models

**File:** `src/components/layout/composer/ModelPicker/ModelPicker.tsx` (edit)
**What:** When `models.length === 0` AND `!loading`, show a single `DropdownMenuItem` (disabled) with text "Add a key in Settings -> Models" instead of "No models enabled". This replaces the dead-end message.
**Verify:** typecheck.
**Commit:** `feat(model-picker): show empty-state CTA when no keys`

---

### Task 4.1.7: Disable send button when no model is selected

**File:** `src/pages/agent-chat/AgentChatView.tsx:62-68, 110-111` (edit)
**File:** `src/pages/project-chat/ProjectChatView.tsx:134-140, 182-183` (edit)
**What:** Add a `useAgentSettings(agentId)` call (or use the one already used in `useAgentRuntime`'s siblings). Derive `hasModel = Boolean(settings?.model?.provider && settings?.model?.name)`. Add `&& hasModel` to the `disabled` clause. In `onSend`, if `!hasModel`, `toast.error("Pick a model first")` and return. Add a `title` (tooltip) attribute to the disabled button: "Pick a model first". Apply identically in both `AgentChatView` and `ProjectChatView`.
**Verify:** typecheck.
**Commit:** `feat(composer): disable send when no model selected`

---

### Task 4.1.V: Batch 1 verification
**What:** `bun run typecheck && bun run build && rg "@/api" src/components src/pages`. Manual: add a provider in Settings -> Models, enable a model. Try to enable a model whose provider has no key — switch is disabled with tooltip. Open agent chat, ModelPicker dropdown only shows models whose provider has a key. Click send with no model — button is disabled, toast appears if forced.
**Commit:** `chore(byok): phase 4 batch 1 verification`

---

## BATCH 2 — Wire providers to the running agent (6 tasks)

**Goal:** The provider keys the user saves in Settings actually reach the running agent's session. Picking a model in ModelPicker actually calls the right model.

---

### Task 4.2.1: Read `extensions/superhive-pi-truth/index.ts` to confirm the gap

**File:** `extensions/superhive-pi-truth/index.ts` (read-only, no edit)
**What:** Confirm the `runExtension` function (around lines 79–213) does NOT call `applyProviders` after `initState`. Note the exact insertion point.
**Verify:** read.
**Commit:** (no commit, read-only)

---

### Task 4.2.2: Add `applyProviders` call in `runExtension` on first load

**File:** `extensions/superhive-pi-truth/index.ts` (edit, after `initState` block)
**What:** After the env-migration block (around line 146) and BEFORE `startWatcher()`, add:
```ts
const providersCurrent = stateRef.current.settings?.providers ?? {};
applyProviders({}, providersCurrent, ctx);
```
Where `ctx` is `{ pi, hasUI: ctx.hasUI, notify }`. The empty `prev` ensures all current providers are registered on first load.
**Verify:** typecheck.
**Commit:** `fix(byok): register settings providers on agent start`

---

### Task 4.2.3: Build a provider→`api` lookup table

**File:** `extensions/superhive-pi-truth/provider-map.ts` (new)
**What:** Export a `PROVIDER_API: Record<string, string>` with the known mappings:
```ts
{
  minimax: 'openai-completions',
  anthropic: 'anthropic-messages',
  openai: 'openai-responses',
  google: 'google-generative-ai',
  deepseek: 'openai-completions',
}
```
Also export `apiForProvider(name: string): string` that returns the lookup value or `'openai-completions'` as fallback.
**Verify:** typecheck.
**Commit:** `feat(byok): add provider api lookup table`

---

### Task 4.2.4: Use the lookup in `applyModel`

**File:** `extensions/superhive-pi-truth/applier.ts:228-251` (edit)
**What:** Replace the hardcoded `api: "anthropic-messages" as any` with `api: apiForProvider(b.provider) as any`. Keep the rest of the function unchanged.
**Verify:** typecheck.
**Commit:** `fix(byok): derive api shape from provider in applyModel`

---

### Task 4.2.5: Don't early-return `modelChanged` on empty `name`

**File:** `extensions/superhive-pi-truth/applier.ts:222-226` (edit)
**What:** Change the condition to `if (!a || !b) return false;` (treat empty objects as "not changed"). Keep the rest of the diff logic. Also: when the diff result indicates model was set to `{provider:'', name:''}`, call `notify({type:'warning', message:'No model selected'})`.
**Verify:** typecheck.
**Commit:** `fix(byok): handle empty model in modelChanged`

---

### Task 4.2.6: Add `reSeedProviders` method on the runtime

**File:** `electron/ipc/runtime.ts` (edit)
**What:** Extract the body of `autoSeedProviders` (lines 33–76) into a new exported `reSeedProviders(agentId: string)` function. Have `autoSeedProviders` call it. This makes it re-usable from settings IPC.
**Verify:** typecheck.
**Commit:** `refactor(runtime): extract reSeedProviders from autoSeedProviders`

---

### Task 4.2.7: Call `reSeedProviders` on `SET_PROVIDER` / `DELETE_PROVIDER`

**File:** `electron/ipc/settings.ts:38-67` (edit)
**What:** After a successful `setProvider` and `deleteProvider`, iterate all known agents via `AgentRepository.list()` and call `reSeedProviders(agent.id)` for each. Wrap in try/catch so a single agent's failure doesn't block the others. Log the result.
**Verify:** typecheck.
**Commit:** `feat(byok): re-seed running agents when provider changes`

---

### Task 4.2.V: Batch 2 verification
**What:** `bun run typecheck && bun run build && rg "@/api" src/components src/pages`. Manual: start a new agent, verify per-agent `Superhive-pi-*.json` has providers block. Add a new key in Settings, restart agent, verify the new key is in the file. Pick a model in ModelPicker, verify the picker calls the right model.
**Commit:** `chore(byok): phase 4 batch 2 verification`

---

## BATCH 3 — Polish, sync, validation (8 tasks)

**Goal:** enabledModels stays in sync, defaultProvider/defaultModel propagate, provider names are validated, env-var bootstrap is generalized, delete cascades.

---

### Task 4.3.1: Sync `defaultProvider` + `defaultModel` on `patch('model', ...)`

**File:** `src/flows/agents/agent-store.ts:311-326` (edit)
**What:** In the `patch` function, when `key === 'model'`, expand the patch to also include `defaultProvider: value.provider` and `defaultModel: value.name`. The single debounced flush writes all three fields atomically.
**Verify:** typecheck.
**Commit:** `fix(byok): sync defaultProvider and defaultModel on model change`

---

### Task 4.3.2: Sync `enabledModels` on model toggle in settings

**File:** `src/pages/settings/sections/ModelsSection.tsx:79-90` (edit)
**What:** After `setModelEnabled`, also update the per-agent `enabledModels` array. The model settings are global (not per-agent), so we keep `enabledModels` in the global LowDB settings under a new key. For Phase 4, store the enabled list in the `models` group itself (since each model has `enabled: boolean`) — and the per-agent `enabledModels` array is for cycle-scoped models. This task updates the agent-store `patch` so that when `enabledModels` changes, it's flushed.
**Verify:** typecheck.
**Commit:** `fix(byok): maintain enabledModels array on toggle`

---

### Task 4.3.3: Generalize `bootstrapEnvProviders` to all `*_API_KEY`

**File:** `electron/ipc/runtime.ts:16-23` (edit)
**What:** Replace the hardcoded `MINIMAX_API_KEY` check with a scan of `Object.keys(process.env).filter(k => k.endsWith('_API_KEY'))`. For each, derive the provider name: `key.slice(0, -'_API_KEY'.length).toLowerCase()`. Seed it if not already in the merged providers map.
**Verify:** typecheck.
**Commit:** `feat(byok): bootstrap all env-var api keys on agent start`

---

### Task 4.3.4: Extract shared env-var→provider name map

**File:** `extensions/superhive-pi-truth/provider-map.ts` (edit, append)
**What:** Export `envVarToProvider(name: string): string | null`. Map common vars explicitly first (`MINIMAX_API_KEY -> minimax`, `ANTHROPIC_API_KEY -> anthropic`, `OPENAI_API_KEY -> openai`, `GEMINI_API_KEY -> google`, `DEEPSEEK_API_KEY -> deepseek`), then fall back to the lowercase-strip-suffix rule. Import in `applier.ts:283-291` to replace the inline logic.
**Verify:** typecheck.
**Commit:** `refactor(byok): extract shared provider env-var map`

---

### Task 4.3.5: Validate provider name in `ProviderDialog`

**File:** `src/pages/settings/sections/ModelsSection/ProviderDialog.tsx:104-117` (edit)
**What:** Add a regex check `/^[a-z0-9_-]+$/` on the name field. Show inline error if invalid. Also: error toast on submit if the name is empty after trim. Use `toast.error` from sonner.
**Verify:** typecheck.
**Commit:** `feat(settings): validate provider name format`

---

### Task 4.3.6: Cascade-disable models when provider is deleted

**File:** `electron/ipc/settings.ts:61-67` (edit)
**What:** In `DELETE_PROVIDER`, after `removeSetting`, scan rows in group `models` whose `provider` matches the deleted provider. For each, `setSetting` to set `enabled: false`. Add a toast in the renderer flow for clarity.
**Verify:** typecheck.
**Commit:** `feat(settings): cascade disable models on provider delete`

---

### Task 4.3.7: Re-fetch `ModelPicker` on settings change

**File:** `src/components/layout/composer/ModelPicker/ModelPicker.tsx:39-65` (edit)
**What:** Add a focus listener (`window.addEventListener('focus', refetch)`) so opening an existing chat after editing settings re-fetches the enabled models list. Simple, no event channel needed.
**Verify:** typecheck.
**Commit:** `feat(model-picker): refetch on window focus`

---

### Task 4.3.8: Add a "No API key" empty state to `ModelsSection`

**File:** `src/pages/settings/sections/ModelsSection.tsx:113-129` (edit)
**What:** If `sortedProviderEntries.length === 0`, change the empty state copy from "No providers yet" to "Add a provider to start configuring your own API keys" + a small primary `Button` "Add provider" inline. This is the first-time user funnel.
**Verify:** typecheck.
**Commit:** `feat(settings): add provider empty-state CTA`

---

### Task 4.3.V: Batch 3 verification
**What:** `bun run typecheck && bun run build && rg "@/api" src/components src/pages`. Manual: full smoke test — delete a provider, verify its models are disabled. Set `OPENAI_API_KEY` in `.env.local`, restart app, verify the bootstrap picked it up. Open a chat, focus the window, verify picker refreshes. Pick a model, verify `defaultProvider/defaultModel` are written.
**Commit:** `chore(byok): phase 4 batch 3 verification`

---

## Total: 21 tasks + 3 verification commits = 24 commits

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
4. On "go", I commit + push to `dev`.
5. Move to the next task.

If a task needs a different approach, pause and revise the plan before moving on.

---

## What's explicitly OUT of scope

- **B11** (event-based settings-changed channel) — replaced by `window` focus listener (4.3.7) for now.
- **B12** (modify `agent-session.ts` in the Pi SDK) — out of project scope; the renderer-side sync in 4.3.1 covers the same need.
- **B14** (writer-counter race) — low frequency; not blocking.
- **B15–B17** — polish items, defer.
- **B18** (per-agent env injection) — covered indirectly by 4.3.3 (env-var bootstrap); explicit per-agent env-var editing is a future feature.
- **Test connection button** — the original Phase 4 polish task. Deferred.
