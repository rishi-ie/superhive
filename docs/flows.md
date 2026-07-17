# Superhive Renderer Flows

## What is a flow?

A `flow` is a TypeScript function that wraps one or more `@/api/*` (or store) operations into a single user-facing action and handles its UX (validation, toasts, rollback, navigation). They live under `src/flows/` and are the only path renderer code takes into the IPC layer.

**The rule:** components and pages never import from `@/api/*` directly. They import flows. This keeps the IPC surface replaceable and every user action auditable in one place.

```
src/flows/
├── agents/
│   ├── crud/        create, delete, prepare, reveal, list, load, wait
│   ├── settings/    update settings
│   ├── ui/          modal state hook (useOpenCreateAgent)
│   └── runtime/     re-export of useAgentRuntime (zustand store)
├── projects/
│   ├── crud/        create, delete, assign, load, prepare, team
│   └── ui/          modal state hook (useOpenCreateProject)
├── settings/
│   ├── crud/        provider + model persistence
│   └── ui/          list hooks (useProviders, useModels)
├── navigation/      route helpers (goBackHome, goToSettings)
└── ui/              chat, palette, breadcrumb, app update
```

Every entry below uses the same shape:
- **What** — one sentence, the user-facing action.
- **How** — the steps the flow takes, in order, with `file:line` of each step so you can jump to it.
- **Used by** — call sites with `file:line` so you can trace who depends on it.
- **Edit guide** — which line(s) to change for a specific kind of edit.

---

## Agents CRUD

### createAgent  `src/flows/agents/crud/create-agent.ts:32`
- **What**: validate input and create a new standalone agent (DB row + disk folder + settings seed). Does not start the runtime.
- **How**:
  1. Trim the three required fields at lines 35-37.
  2. Validation guard `name` (39) -> `{ ok: false, error }`.
  3. Validation guard `folderName` (42) -> `{ ok: false, error }`.
  4. Validation guard `parentDir` (45) -> `{ ok: false, error }`.
  5. `agents.create({ name, folderName, parentDir, role, description })` at line 50 (single IPC; no toast on success here).
  6. On throw: return `{ ok: false, error: <message> }` (line 60).
- **Used by**: no UI. Internal step of `prepareStandaloneAgent` (`prepare-standalone-agent.ts:48`).
- **Edit guide**: change the input shape at lines 18-24 + the IPC payload at line 50. To start the runtime after create, do not add logic here — switch the caller to `prepareStandaloneAgent` instead.

### createProjectAgent  `src/flows/agents/crud/create-project-agent.ts:25`
- **What**: validate input and create a project-coordinator agent row. Does not start the runtime.
- **How**:
  1. Trim `name` / `folderName` / `parentDir` at lines 28-30.
  2. Three guards (lines 32-39) returning `{ ok: false, error }`.
  3. `agents.create({ ..., agentKind: 'project-coordinator' })` at line 43 (single IPC).
  4. On throw: return `{ ok: false, error }` (line 51).
- **Used by**: no UI. Internal step of `prepareProjectAgent` (`prepare-project-agent.ts:35`), which is itself used only by `prepareProject`.
- **Edit guide**: the only thing that makes a project-coordinator is the `agentKind: 'project-coordinator'` payload field at line 47 — change it here, not in `createAgent`.

### prepareStandaloneAgent  `src/flows/agents/crud/prepare-standalone-agent.ts:43`
- **What**: create a standalone agent, start its runtime, and wait until it's ready so the caller can navigate. Rolls back the freshly-created row on any failure.
- **How**:
  1. `agents.create({ name, folderName, parentDir, role?, description? })` at line 48 (trim + optional-trim at 49-53). Catches into `{ ok: false, reason: 'create-failed' }` at line 56.
  2. `agents.start(agent.id)` at line 64. Two failure paths:
     - `startResult.ok === false` -> `agents.delete(agent.id).catch(() => {})` (line 66) -> `{ ok: false, reason: 'start-failed' }` (line 67).
     - thrown -> same delete at line 74, same failure reason at line 77.
  3. `waitForAgentReady(agent.id).then(...)` at line 82 — delegates the runtime-ready poll.
     - On `ok`: return `{ ok: true, agent }` at line 83.
     - On timeout: `agents.delete(agent.id).catch(() => {})` (line 84), return the timeout result unchanged.
     - On error: same delete + remap to `{ ok: false, reason: 'error', message }` at line 86.
- **Used by**: `pages/agent-chat/dialogs/CreateAgentDialog.tsx:95`.
- **Edit guide**:
  - Add a step -> slot it between `agents.create` (line 48) and `agents.start` (line 64).
  - Change the rollback policy -> each `.catch(() => {})` is at lines 66, 74, 84.
  - Change the input/result types -> lines 25-41.

### prepareProjectAgent  `src/flows/agents/crud/prepare-project-agent.ts:30`
- **What**: same shape as `prepareStandaloneAgent`, but for a project-coordinator agent. Building block of `prepareProject`; not called from a dialog.
- **How**:
  1. `agents.create({ ..., agentKind: 'project-coordinator' })` at line 35. Failure -> `{ reason: 'create-failed' }` at line 42.
  2. `agents.start(agent.id)` at line 50; rollback on rejection (line 52) or throw (line 60).
  3. `waitForAgentReady(agent.id)` at line 68; rollback on timeout (line 70) + remap error at line 72.
- **Used by**: `flows/projects/crud/prepare-project.ts:70`.
- **Edit guide**: identical structure to `prepareStandaloneAgent` — keep them in sync if you change one.

### loadAgentProjects  `src/flows/agents/crud/load-agent-projects.ts:4`
- **What**: load the projects an agent belongs to.
- **How**:
  1. Early return `[]` if `agentId` falsy (line 5).
  2. `agents.getProjects(agentId)` (line 6). One IPC; no transformation.
- **Used by**: `components/layout/right-sidebar/AgentSettingsPanel.tsx:57` (on mount).
- **Edit guide**: only line 6 IPC call. Wrapper has no validation/toast logic.

### deleteAgent  `src/flows/agents/crud/delete-agent.ts:10`
- **What**: stop the agent's runtime, delete the DB row, tear down the store slice, toast success/failure.
- **How**:
  1. `agents.stop(id).catch(() => {})` (line 12) — fire-and-forget so cleanup continues if stop already raced.
  2. `agents.delete(id)` (line 13). Returns `boolean`.
  3. If `false` (line 14) -> `toast.error('Agent not found')` + return `{ ok: false, error: 'Agent not found' }`.
  4. On success: `toast.success('Agent deleted')` (line 18), `disposeSlice(id)` (line 19) to drop the zustand slice for this id, return `{ ok: true }`.
  5. On throw: catch at line 21, `toast.error(message)`, return `{ ok: false, error: message }`.
- **Used by**: `pages/agent-chat/components/AgentError.tsx:17`; `pages/agent-chat/components/AgentsListView.tsx:319`.
- **Edit guide**:
  - Reorder: delete before stop would race the runtime -> keep stop-first.
  - Add cascade (e.g. settings cleanup): slot it before `disposeSlice` at line 19.

### revealAgent  `src/flows/agents/crud/reveal-agent.ts:9`
- **What**: open the agent's folder in Finder/Explorer.
- **How**:
  1. `agents.reveal(id)` (line 11) -> the IPC delegates to `electron/ipc/reveal-in-finder.ts`.
  2. On throw: `toast.error(message)` (line 15) + return `{ ok: false, error }`.
- **Used by**: `pages/agent-chat/components/AgentRowContextMenu.tsx:73`.
- **Edit guide**: error toast copy is at line 15; success is silent (no toast).

### listAgents  `src/flows/agents/crud/list-agents.ts:4`
- **What**: list every agent row.
- **How**: `agents.list()` (line 5). Pure passthrough; returns the IPC array untouched.
- **Used by**: `flows/projects/crud/delete-project.ts:32`; `flows/projects/crud/load-project-team.ts:14,26`; `pages/project-chat/ProjectChatView.tsx:68`; `components/layout/left-sidebar/SidebarAccordion.tsx:21`; `pages/agent-chat/components/AgentsListView.tsx:82`.
- **Edit guide**: only the IPC call matters; filter/partition downstream.

### waitForAgentReady  `src/flows/agents/crud/wait-for-agent-ready.ts:34`
- **What**: poll until an agent's runtime is ready for sending messages.
- **How**:
  1. Defaults at lines 31-32: `DEFAULT_TIMEOUT_MS = 15_000`, `DEFAULT_POLL_MS = 300`. Caller can override via `options.timeoutMs` / `options.pollMs` (lines 38-39).
  2. Set `deadline = Date.now() + timeoutMs` (line 40).
  3. Loop while `Date.now() < deadline` (line 44):
     - `agents.getRuntimeState(agentId)` (line 47). Rejection -> early `{ ok: false, reason: 'error' }` at line 50.
     - `statusOk = status === 'active' || status === 'busy'` (line 57) AND `bootOk = bootStep === 'ready'` (line 58). Both true -> break with `runtimeReady = true` (line 60).
     - `sleep(pollMs)` at line 65 between polls.
  4. If the loop never flipped `runtimeReady` (line 68) -> `{ ok: false, reason: 'timeout', detail: 'runtime' }` at line 69.
  5. After success: `agents.readSettings(agentId)` (line 79). Rejection -> `{ ok: false, reason: 'error' }` (line 82).
  6. Resolve `{ ok: true, settings: <state> ?? {} }` at line 88.
- **Used by**: `prepareStandaloneAgent` (`prepare-standalone-agent.ts:82`); `prepareProjectAgent` (`prepare-project-agent.ts:68`).
- **Edit guide**:
  - Ready criteria are at line 57-58. Change `bootStep` expectation -> edit the orchestrators too if they care.
  - To shorten the boot window: override `timeoutMs` at call site.
  - After success it always reads settings; to skip that, delete lines 77-87 and re-shape the return.

---

## Projects CRUD

### loadProject  `src/flows/projects/crud/load-project.ts:4`
- **What**: load one project row by id.
- **How**: `projects.get(id)` (line 5). Pure passthrough; returns `null` if not found.
- **Used by**: `flows/projects/crud/load-project-team.ts:13`; `flows/ui/use-center-breadcrumb.ts:27`; `pages/project-chat/ProjectChatView.tsx:60`.

### listProjects  `src/flows/projects/crud/list-projects.ts:4`
- **What**: list every project row.
- **How**: `projects.list()` (line 5). Pure passthrough.
- **Used by**: `pages/agent-chat/components/AgentsListView.tsx:83,276`; `components/layout/left-sidebar/SidebarAccordion.tsx:31,35`.

### prepareProject  `src/flows/projects/crud/prepare-project.ts:38`
- **What**: create a project + its coordinator agent, link them, leave the project ready to navigate to. Captures the full rollback policy.
- **How**:
  1. Trim `name`, `description`, `localPath` at lines 41-43.
  2. Validation guard `name` (line 45) -> `{ ok: false, reason: 'create-failed', message: 'Project name is required' }`.
  3. `projects.create({ name, description?, localPath? })` at line 51. Throws -> `{ reason: 'create-failed', message }` at line 56.
  4. Build `coordinatorInput` at lines 64-68:
     - `name = \`${name} (Coordinator)\`` — always titled.
     - `folderName = 'agent'` — fixed; the coordinator lives under `agent/`.
     - `parentDir = localPath ?? \`~/.superhive/projects/${<slugified name>}\``.
  5. `prepareProjectAgent(coordinatorInput)` at line 70 (composite flow). On failure -> `projects.delete(project.id).catch(() => {})` (line 72) + remap via `mapCoordinatorFailure` (line 73).
  6. `projects.addAgent(project.id, coordinatorAgent.id)` at line 78. On throw -> `projects.delete(project.id)` (line 80) + `agents.delete(coordinatorAgent.id).catch(() => {})` (line 81) + return `{ reason: 'link-failed' }` (line 82).
  7. `{ ok: true, project }` at line 89.
  8. `mapCoordinatorFailure` at line 92 remaps `create-failed`/`start-failed`/`error`/`timeout` reasons to the project-level `coordinator-*` reasons.
- **Used by**: `pages/project-chat/dialogs/CreateProjectDialog.tsx:86`.
- **Edit guide**:
  - Add a step (e.g. add a member agent): slot it between line 78 and line 89.
  - Coordinator naming/parentDir convention: lines 64-68 — also referenced by the project coordinator detection path in `reconcile-runtime.ts`.
  - Rollback order: stop row->link first; if linking fails, also delete the freshly-created coordinator. Do not invert.

### removeAgentFromProject  `src/flows/projects/crud/remove-agent-from-project.ts:7`
- **What**: unassign an agent from a project.
- **How**:
  1. Destructure inputs (line 8).
  2. Guard at line 9 (`!projectId || !agentId`) -> `toast.error('Missing project or agent')` + `{ ok: false }`.
  3. `projects.removeAgent(projectId, agentId)` (line 14). Success -> `toast.success('Agent removed from project')` (line 15).
  4. On throw (line 17): `toast.error(message)` + `{ ok: false, error: message }`.
- **Used by**: `pages/agent-chat/components/AgentsListView.tsx:301`; `components/layout/right-sidebar/ProjectSettingsPanel.tsx:104` (dynamic import).
- **Edit guide**: mutates only the projects DB. Does not touch the agent row.

### assignAgentToProject  `src/flows/projects/crud/assign-agent-to-project.ts:7`
- **What**: assign an agent to a project.
- **How**:
  1. Destructure (line 8).
  2. Guard at line 9 -> `toast.error('Missing project or agent')` + `{ ok: false }`.
  3. `projects.addAgent(projectId, agentId)` (line 14). Success -> `toast.success('Agent assigned to project')`.
  4. On throw (line 17): `toast.error(message)` + `{ ok: false }`.
- **Used by**: `pages/agent-chat/components/AgentsListView.tsx:282`; `components/layout/right-sidebar/ProjectSettingsPanel.tsx:144` (dynamic import).
- **Edit guide**: symmetric to `removeAgentFromProject`.

### deleteProject  `src/flows/projects/crud/delete-project.ts:23`
- **What**: cascade-delete a project and its project-coordinator agent.
- **How**:
  1. `projects.get(projectId)` (line 25). Missing -> `toast.error('Project not found')` + `{ ok: false }`.
  2. `listAgents()` (line 32) then `find` the coordinator: `agentKind === 'project-coordinator'` AND `projectIds.includes(projectId)` (lines 33-37).
  3. `projects.delete(projectId)` (line 40). Falsy result -> `toast.error('Failed to delete project')` + `{ ok: false }`. (Strict ordering: project row first so the agent-side cleanup does not see a stale project link.)
  4. If `projectAgent` is found (line 47):
     - `agents.stop(projectAgent.id).catch(() => {})` (line 48).
     - `agents.delete(projectAgent.id).catch(() => {})` (line 49).
     - `disposeSlice(projectAgent.id)` (line 50).
  5. `toast.success(\`Project "${project.name}" deleted\`)` at line 53 -> `{ ok: true }`.
  6. Top-level catch (line 55): `toast.error(message)` + `{ ok: false, error: message }`.
- **Used by**: `pages/project-chat/components/ProjectAgentError.tsx:25`.
- **Edit guide**:
  - Reordering matters — never run step 4 before step 3.
  - To extend to member agents, add a loop on step 4 before/after the coordinator block; remember `members` are NOT auto-deleted (only the coordinator is, since it's the project-coordinator kind).

### loadProjectTeam + loadUnassignedAgents  `src/flows/projects/crud/load-project-team.ts:11,25`
- **What**: `loadProjectTeam` loads a project + its partitioned agent team (coordinator + members). `loadUnassignedAgents` lists agents with no project assignment.
- **How**:
  - `loadProjectTeam` (line 11):
    1. `Promise.all([loadProject(projectId), listAgents()])` at line 12 — fetch project + full agent list in parallel.
    2. If `!project` -> `{ project: null, coordinator: null, members: [] }` (line 16).
    3. `inProject = agents.filter(a => project.agentIds.includes(a.id))` at line 17.
    4. `coordinator = inProject.find(a => a.agentKind === 'project-coordinator') ?? null` at line 20.
    5. `members = inProject.filter(a => a.agentKind !== 'project-coordinator')` at line 21.
    6. Return `{ project, coordinator, members }` at line 22.
  - `loadUnassignedAgents` (line 25):
    1. `listAgents()` at line 26.
    2. Filter on `agentKind !== 'project-coordinator' && projectIds.length === 0` at line 27.
- **Used by**: `components/layout/right-sidebar/ProjectSettingsPanel.tsx:30,109,129` (`loadProjectTeam`); `:135` (`loadUnassignedAgents`).
- **Edit guide**:
  - Coordinator detection rule is hard-coded at line 20 (and again at line 27). If you add another agent kind with special handling, change both.
  - Both run synchronously per refetch; UI calls `refresh` after each mutation (assign/remove) — do not skip that.

---

## Settings CRUD

### listProviders  `src/flows/settings/crud/list-providers.ts:4`
- **What**: list every provider entry.
- **How**: `settings.getProviders()` (line 5). Returns a `Record<name, ProviderEntry>` from the IPC, unchanged.
- **Used by**: `flows/settings/ui/use-providers.ts:23`; `components/layout/composer/ModelPicker/ModelPicker.tsx:51`.
- **Edit guide**: line 5 only. Filtering / key-set derivation live in `useProviders`.

### saveProviderBlock  `src/flows/settings/crud/save-provider-block.ts:24`
- **What**: persist one API Keys block (provider, baseUrl, apiKey, enabled, preferredModel, AWS fields). No toasts.
- **How**:
  1. Trim `provider` at line 27; missing -> `{ ok: false, error: 'Provider is required' }` (line 29).
  2. Build the settings payload (lines 32-41) — every field is `.trim() || undefined` so empty strings become `undefined`.
  3. `settings.setProvider({ name, baseUrl?, apiKey?, enabled, preferredModel?, accessKeyId?, secretAccessKey?, region? })` at line 32. One IPC.
     - **Important**: the IPC owns the cleanup rules — an empty `apiKey` blunts the row and clears `preferredModel`; AWS fields only persist when filled.
  4. Return `{ ok: true }` on success, `{ ok: false, error: <message> }` on throw (line 44).
- **Used by**: `pages/settings/sections/ModelsSection/APIKeys/ProviderKeyBlock.tsx:134` (Save); `:158` (Clear).
- **Edit guide**:
  - To add a new provider-level field -> extend `SaveProviderBlockInput` at lines 3-12 and the payload at lines 32-41.
  - The Clear handler (line 158 in caller) sends `apiKey: undefined, enabled: false`. To change that, edit the caller, not this flow.

### addModel  `src/flows/settings/crud/add-model.ts:14`
- **What**: add a stored model row, leaving `contextWindow` to be auto-resolved later.
- **How**:
  1. Trim `provider` + `name` at lines 15-16. Missing -> `toast.error(...)` + `{ ok: false }` (lines 18-22).
  2. `settings.addModel({ provider, name })` at line 30 (no `contextWindow`).
  3. `toast.success(\`Model "${name}" added\`)` at line 34.
  4. On throw: `toast.error(message)` + `{ ok: false }` (line 37).
- **Used by**: `pages/settings/sections/ModelsSection.tsx:70` (enable curated model that has no stored row yet).
- **Edit guide**: `contextWindow` back-fill happens on the next model_select via the telemetry extension — if you add an explicit `contextWindow` parameter, accept it here but the canonical flow remains auto-resolution.

### addCustomModel  `src/flows/settings/crud/add-custom-model.ts:16`
- **What**: save the provider credentials + add a custom model row, in one step.
- **How**:
  1. Trim `provider` + `modelName` + `apiKey` at lines 19-21.
  2. Three guards (lines 23-34) with per-field toasts.
  3. `settings.setProvider({ name, baseUrl?, apiKey })` at line 37 — registers/updates the provider row.
  4. `settings.addModel({ provider, name: modelName })` at line 46 — adds the model row.
  5. `toast.success(\`Added ${provider}:${modelName}\`)` at line 50.
  6. On throw (any of step 3 or 4): `toast.error(message)` + `{ ok: false }` at line 53.
- **Used by**: `pages/settings/sections/ModelsSection/ModelEditorDialog.tsx:114` (custom-mode submit).
- **Edit guide**:
  - If the provider row already exists, step 3 overwrites it with the new `apiKey`. To guard against wiping a known-good key on edit, branch on `apiKey.length > 0` before calling `setProvider`.
  - The two IPCs in steps 3 + 4 are not atomic; a partial failure leaves the provider row saved but no model. Add rollback if that's a concern.

### configureCatalogProvider  `src/flows/settings/crud/configure-catalog-provider.ts:22`
- **What**: save a key for one of the curated catalog providers and enable that one specific curated model row.
- **How**:
  1. Trim `provider` + `modelName` + `apiKey` at lines 25-27.
  2. Three guards (lines 29-39) with per-field toasts.
  3. `settings.setProvider({ name, baseUrl?, apiKey })` at line 43.
  4. `setModelEnabled(\`${provider}:${modelName}\`, true)` at line 48 (delegates to the sibling flow).
  5. `toast.success(\`Saved key for ${provider}\`)` at line 49.
  6. On throw: `toast.error(message)` + `{ ok: false }` at line 52.
- **Used by**: `pages/settings/sections/ModelsSection/ModelEditorDialog.tsx:107` (catalog-mode submit).
- **Edit guide**:
  - **No `preferredModel` concept** here on purpose. The API Keys section owns that.
  - The model id format `${provider}:${modelName}` at line 48 must match the id construction elsewhere; if you change it, audit the ModelEditorDialog + ModelsSection.

### setModelEnabled  `src/flows/settings/crud/set-model-enabled.ts:8`
- **What**: flip a stored model's enabled flag.
- **How**:
  1. `settings.setModelEnabled(id, enabled)` (line 13).
  2. Return `{ ok: true }`. On throw: `{ ok: false, error: <message> }` (line 16). No toast.
- **Used by**: `flows/settings/crud/configure-catalog-provider.ts:48`; `pages/settings/sections/ModelsSection.tsx:70` (toggle row).
- **Edit guide**: id format `${provider}:${name}` is enforced upstream — keep callers consistent.

### deleteModel  `src/flows/settings/crud/delete-model.ts:9`
- **What**: delete one stored model row.
- **How**:
  1. Guard `!id?.trim()` at line 10 -> `{ ok: false, error: 'Model id is required' }`.
  2. `settings.deleteModel(id)` at line 14.
  3. `toast.success('Model deleted')` at line 15.
  4. On throw (line 17): `toast.error(message)` + `{ ok: false }`.
- **Used by**: `pages/settings/sections/ModelsSection/ModelEditorDialog.tsx:139`; `pages/settings/sections/ModelsSection.tsx:76`.
- **Edit guide**: does not delete the provider — only the model row.

### deleteProvider  `src/flows/settings/crud/delete-provider.ts:9`
- **What**: delete a provider (master toggle).
- **How**:
  1. Guard `!name?.trim()` at line 10 -> `{ ok: false, error: 'Provider name is required' }`.
  2. `settings.deleteProvider(name)` at line 14.
  3. `toast.success(\`Provider "${name}" deleted\`)` at line 15.
  4. On throw (line 17): `toast.error(message)` + `{ ok: false }`.
- **Used by**: `pages/settings/sections/ModelsSection/ModelEditorDialog.tsx:141`.
- **Edit guide**: the IPC also cascades to its child models; do not call `deleteModel` first or you'll double-delete.

### getEnabledModels  `src/flows/settings/crud/get-enabled-models.ts:10`
- **What**: list every enabled model (provider + name + contextWindow).
- **How**: `settings.getEnabledModels()` at line 11. Pure passthrough.
- **Used by**: `components/layout/composer/ModelPicker/ModelPicker.tsx:50`.
- **Edit guide**: only line 11.

---

## Agents settings

### updateAgentSettings  `src/flows/agents/settings/update-agent-settings.ts:10`
- **What**: persist a settings patch for one agent.
- **How**:
  1. `agents.writeSettings(agentId, patch)` at line 12 — wrapped in try/catch.
  2. `toast.success('Settings saved')` at line 13 -> `{ ok: true, settings }`.
  3. On throw (line 15): `toast.error(message)` + `{ ok: false }` (no `settings` on failure).
- **Used by**: `components/layout/right-sidebar/use-auto-save.ts:45,60,70` (debounced flush + manual + on-unmount).
- **Edit guide**:
  - The 3-attempt race-safe write lives in `electron/ipc/agents.ts:WRITE_SETTINGS`. To add validation (e.g. trim) before write, do it here, not in the IPC.
  - Patch shape is `Partial<AgentSettingsState>` (line 7); the IPC accepts `Record<string, unknown>` and the cast happens at line 12.

---

## UI flows

### sendMessage  `src/flows/ui/send-message.ts:20`
- **What**: synchronous wrapper around the runtime's `send` callback with a live-status guard.
- **How**:
  1. `const trimmed = text.trim()` at line 21.
  2. Early return `{ ok: false }` if `!trimmed || !isLive` (line 22).
  3. Otherwise `send(trimmed)` at line 23 — calls the runtime-supplied callback (the actual IPC is performed by the store/runtime hook, not here).
  4. Return `{ ok: true }`.
- **Used by**: `pages/agent-chat/AgentChatView.tsx:122`; `pages/project-chat/ProjectChatView.tsx:205` (Composer submit handler).
- **Edit guide**:
  - **Model-gating is intentionally not done here** (see comment at lines 1-8). The runtime surfaces a no-model error via toast if Pi rejects, and the composer stays interactive so the user can retry.
  - To add client-side model gating, do it in the composer, not here — this flow is a pure trim/forward guard.

### shortcutCopyLastAssistant  `src/flows/ui/shortcut-copy-last-assistant.ts:20`
- **What**: copy the last assistant message text to the clipboard.
- **How**:
  1. `[...messages].reverse().find(m => m.role === 'assistant')` at line 23 — scan from the end.
  2. If none found -> `{ ok: false }` at line 24.
  3. `getMessageText(lastAssistant)` at line 26 — extract plain text from the structured message parts.
  4. `copyToClipboard(text, 'Copied last assistant message')` at line 27 — wrapper also fires the toast.
  5. Return `{ ok: copied, text }` at line 28.
- **Used by**: `pages/agent-chat/AgentChatView.tsx:147`; `pages/project-chat/ProjectChatView.tsx:231` (both inside the `onCopyLast` handler).
- **Edit guide**:
  - Skips trailing non-assistant messages automatically. To include the latest assistant even if other roles follow, drop the reverse+find.
  - Toast copy lives in the second arg to `copyToClipboard`; change there.

### useChatShortcuts  `src/flows/ui/use-chat-shortcuts.ts:56`
- **What**: wire global keyboard shortcuts for the chat view (Cmd/Ctrl + Shift + C, Cmd/Ctrl + ., etc.) — pure UI, no IPC.
- **How**:
  1. Module-scope `listenerAttached = false` (line 17) ensures a single `keydown` listener even if many chat views mount.
  2. `ensureListener()` (line 33) registers one global listener on first call:
     - Skip if `e.metaKey || e.ctrlKey` is false (line 37-38).
     - Skip if the target is editable (`isEditableTarget` at line 26: input/textarea/select/contentEditable).
     - Match `Cmd/Ctrl + Shift + C` (line 41) -> `e.preventDefault()` + `lastHandlers?.onCopyLast?.()`.
     - Match `Cmd/Ctrl + Shift + R` (line 44) -> calls `onRegenerate` (currently dead — no page view passes a handler).
     - Match `Cmd/Ctrl + .` or `>` (line 47) -> calls `onStop`.
  3. `useChatShortcuts(handlers)` (line 56) just stores `handlers` in module-scope `lastHandlers` (line 58).
- **Used by**: `pages/agent-chat/AgentChatView.tsx:144`; `pages/project-chat/ProjectChatView.tsx:228`.
- **Edit guide**:
  - Adding a new shortcut -> edit line 41-50 + extend the `ShortcutHandlers` interface at lines 19-24.
  - The shortcuts deliberately ignore editable fields (line 39); don't toggle that off without first auditing the chat composer.

### useCenterBreadcrumb  `src/flows/ui/use-center-breadcrumb.ts:14`
- **What**: compute the breadcrumb segments for the current route.
- **How**:
  1. Read `pathname` + `params` (`agentId` / `projectId`) from `react-router-dom` (lines 17-18).
  2. Effect A (line 21): if `agentId`, `agents.get(agentId).then(...)` to resolve agent name (direct API call — exception to the no-direct-api rule because this hook predates the rule, kept for now).
  3. Effect B (line 26): if `projectId`, `loadProject(projectId).then(...)` to resolve project name.
  4. Branch on `pathname` (lines 32-50):
     - `/` or `/landing` -> return `null` (hide breadcrumb).
     - `/agents` / `/agents/*` -> `[{ label: 'Agent' }, { label: agentName ?? agentId }]`.
     - `/projects` / `/projects/*` -> `[{ label: 'Projects', href: '/projects' }, { label: projectName ?? projectId }]`.
     - `/hive` -> `[{ label: 'Meta Hive' }]`.
     - `/remote` -> `[{ label: 'Remote' }]`.
     - Other -> `[{ label: 'Landing', href: '/landing' }]`.
- **Used by**: `components/layout/common/CenterBreadcrumb.tsx:14`.
- **Edit guide**:
  - To fix the `agents.get` direct-API exception, replace line 22 with a tiny `load-agent.ts` flow wrapper.
  - Adding a new route -> add a branch before line 50.

### useCommandPalette  `src/flows/ui/use-command-palette.ts:30`
- **What**: module-level open/close state for the command palette + global Cmd/Ctrl+K binding.
- **How**:
  1. Module-scope: `openState` (line 8), `listeners: Set<listener>` (line 9), `keyListenerAttached: boolean` (line 10).
  2. `setOpenGlobal(next)` (line 12) — short-circuits if `next === openState`, then mutates and broadcasts.
  3. `ensureKeyListener()` (line 16) attaches one global `keydown` listener on first call:
     - Match `(meta||ctrl) && key.toLowerCase() === 'k'` (line 19).
     - `e.preventDefault()` + `setOpenGlobal(!openState)` to toggle.
  4. `useCommandPalette()` (line 30):
     - Calls `ensureKeyListener()` on every render (idempotent).
     - Subscribes via `useState` + `useEffect` (lines 38-45).
     - Returns `{ open, setOpen, toggle }`. `toggle` is a memo-wrapped `setOpenGlobal(!openState)`.
- **Used by**: `components/layout/command-palette/CommandPalette.tsx:20`; `components/layout/left-sidebar/SidebarRepositories.tsx:18`.
- **Edit guide**:
  - Cmd/Ctrl+K binding at line 19 — change key or modifier there. It's a singleton listener; do not attach another one.
  - `setOpen` is `setOpenGlobal`, so calling from any component updates every subscribed hook.

### installUpdate + useAppUpdate  `src/flows/ui/install-update.ts` + `src/flows/ui/use-app-update.ts:9`
- **What**: subscribe to the main-process "update downloaded" event and let the user trigger the install.
- **How**:
  - `installUpdate()` (line 1): `await window.api.app.installUpdate()`; returns `{ ok: false }` on throw.
  - `useAppUpdate()` (line 9):
    1. `useState<UpdateInfo | null>(null)` at line 16.
    2. `useEffect` at line 19: `const offDone = window.api.app.onUpdateDownloaded(info => setPending(info))` + cleanup `offDone()`.
    3. Return `{ pendingUpdate: pending, installUpdate }` (line 28) — `installUpdate` is the imported function, so the hook and the standalone flow share the same call.
- **Used by**: `components/layout/left-sidebar/UpdateBanner.tsx:6` (renders only when `pendingUpdate` exists; the banner uses the returned `installUpdate` in its click handler).
- **Edit guide**:
  - To show progress after the user clicks install, surface a toast/error path through `installUpdate`'s rejection. Currently it returns `{ ok: false }` silently.
  - To change the trigger condition (e.g. require manual acknowledgement even before download), gate the hook caller or change the IPC.

---

## Navigation helpers

### goBackHome  `src/flows/navigation/go-back-home.ts:3`
- **What**: navigate to `/`.
- **How**: `navigate("/")` at line 4. One-liner.
- **Used by**: `components/layout/left-sidebar/SidebarRepositories.tsx:26`; `pages/settings/SettingsSidebar.tsx:15`.
- **Edit guide**: only line 4.

### goToSettings  `src/flows/navigation/go-to-settings.ts:3`
- **What**: navigate to `/settings`.
- **How**: `navigate("/settings")` at line 4. One-liner.
- **Used by**: `components/layout/command-palette/CommandPalette.tsx:57`; `components/layout/left-sidebar/SidebarUser.tsx:58`.
- **Edit guide**: only line 4.

---

## Modal hooks

### useOpenCreateAgent  `src/flows/agents/ui/open-create-agent.ts:16`
- **What**: a tiny pub/sub for "is the CreateAgent dialog open?".
- **How**:
  1. Module-scope `let listeners = []` (line 8) + `let currentState = false` (line 9).
  2. `setGlobalOpen(open)` (line 11) -> mutate + `listeners.forEach(l => l(open))`.
  3. `useOpenCreateAgent()` hook (line 16):
     - Subscribes via `useState(currentState)` (line 17) + `useEffect` (lines 19-25) which pushes a listener and returns cleanup that filters its own listener out.
     - Returns `{ open, setOpen: setGlobalOpen }`.
- **Used by**: `pages/agent-chat/dialogs/CreateAgentDialog.tsx:27`; `components/layout/left-sidebar/sections/AgentsSection.tsx:20`; `pages/agent-chat/components/AgentsListView.tsx:48`; `pages/agent-chat/components/AgentEmpty.tsx:7`; `pages/agent-chat/components/EmptyAgentsState.tsx:7`.
- **Edit guide**: array `listeners` is fine for this scale; if you add many subscribers, switch to a `Set` to avoid the linear filter on cleanup (line 23). The sibling `useOpenCreateProject` already uses a `Set`.

### useOpenCreateProject  `src/flows/projects/ui/open-create-project.ts:10`
- **What**: same shape as `useOpenCreateAgent`, but for the CreateProject dialog.
- **How**:
  1. Module-scope `let currentState = false` (line 3) + `const listeners = new Set<listener>()` (line 4).
  2. `notify()` (line 6) -> `listeners.forEach(l => l(currentState))`.
  3. `useOpenCreateProject()` (line 10):
     - `useState(currentState)` + `useEffect` (lines 11-16) -> `listeners.add/cleanup listeners.delete`.
     - `setOpen` is a `useCallback`-wrapped mutator that flips `currentState` and notifies (lines 18-21).
- **Used by**: `components/layout/left-sidebar/SidebarRepositories.tsx:17`; `pages/project-chat/dialogs/CreateProjectDialog.tsx:27`; `pages/project-chat/components/ProjectAgentEmpty.tsx:13`.
- **Edit guide**: structurally consistent with `useOpenCreateAgent`. To keep them symmetric, port the `Set` change back to the agent variant as well.

---

## Settings UI hooks

### useProviders  `src/flows/settings/ui/use-providers.ts:16`
- **What**: React hook returning the live providers list + a `refresh()` and precomputed `providerNames`/`providersWithKey` sets.
- **How**:
  1. `useState<Record<name, ProviderEntry>>({})` (line 17), `useState(true)` for `loading` (line 18), `useState<string | null>(null)` for `error` (line 19).
  2. `refresh = useCallback(async)` at line 21:
     - `listProviders()` (line 23) -> `setProviders(list)` + clear error (lines 24-25).
     - On throw: `setError(message)` (line 27).
     - In both cases `setLoading(false)` (line 29).
  3. `useEffect(() => void refresh(), [refresh])` (line 33) — initial load on mount.
  4. Memoized derived sets:
     - `providerNames = new Set(Object.keys(providers))` (lines 37-40).
     - `providersWithKey = new Set(...)` built by iterating `providers` and including entries where `apiKey` is non-empty after `.trim()` (lines 42-48).
  5. `hasProvider(name)` -> `providerNames.has(name)` (line 50). `hasApiKey(name)` -> `providersWithKey.has(name)` (line 55).
  6. Return value at line 60.
- **Used by**: `pages/settings/sections/ModelsSection.tsx:26`; `pages/settings/sections/ModelsSection/APIKeys/APIKeysSection.tsx:90`.
- **Edit guide**:
  - `refresh()` clears `loading` on completion (line 29) so subsequent calls re-set it via the caller's `setLoading(true)` if you want a spinner. The current shape fires-and-forgets.
  - To add derived state (e.g. per-provider enabled model count), add another `useMemo` after line 48.

### useModels  `src/flows/settings/ui/use-models.ts:12`
- **What**: React hook that returns the stored models list with `refresh()`.
- **How**:
  1. `useState<ModelEntry[]>([])` (line 13), `useState(true)` for loading (line 14), `useState<string | null>(null)` for error (line 15).
  2. `refresh = useCallback(async)` at line 17: `await settings.getModels()` directly (line 19) -> set state. On throw set error. Always finish loading.
  3. `useEffect(() => void refresh(), [refresh])` at line 29 — initial load.
  4. Return `{ models, loading, error, refresh }` at line 33.
- **Used by**: `pages/settings/sections/ModelsSection.tsx:27`.
- **Edit guide**:
  - Direct API call at line 19 is a small exception to the no-`@/api`-from-flow-files rule. To clean up, add a `listStoredModels` flow under `flows/settings/crud/` and call that instead — it would mirror `listProviders` and `getEnabledModels`.
  - If you add derived sets (like `useProviders`), drop another `useMemo` before the return.

---

## Composition map

How the `prepare*` flows stack — both branches converge on `waitForAgentReady`:

```
prepareProject
  └── projects.create                         (prepare-project.ts:51)
  └── prepareProjectAgent                      (prepare-project.ts:70)
        ├── agents.create({ agentKind:'project-coordinator' })   (prepare-project-agent.ts:35)
        ├── agents.start                       (prepare-project-agent.ts:50)
        └── waitForAgentReady                  (prepare-project-agent.ts:68)
              ├── agents.getRuntimeState       (poll until active|busy AND bootStep==='ready')
              └── agents.readSettings          (return final state)

prepareStandaloneAgent
  ├── agents.create                            (prepare-standalone-agent.ts:48)
  ├── agents.start                             (prepare-standalone-agent.ts:64)
  └── waitForAgentReady                        (prepare-standalone-agent.ts:82)

deleteProject (3-step cascade)
  ├── projects.get                             (delete-project.ts:25)
  ├── listAgents  →  find project-coordinator  (delete-project.ts:32)
  ├── projects.delete                          (delete-project.ts:40)
  └── if coordinator found:
        ├── agents.stop                        (delete-project.ts:48)
        ├── agents.delete                      (delete-project.ts:49)
        └── disposeSlice(id)                   (delete-project.ts:50)

deleteAgent
  ├── agents.stop                              (delete-agent.ts:12)
  ├── agents.delete                            (delete-agent.ts:13)
  └── disposeSlice(id)                         (delete-agent.ts:19)

loadProjectTeam
  └── Promise.all([loadProject, listAgents])   (load-project-team.ts:12)
        ├── partition by agentKind             (load-project-team.ts:17-21)
```

**Rollback rules**:
- Every `prepare*` deletes its freshly-created row on any failure branch (`agents.delete(...).catch(() => {})` at `prepare-standalone-agent.ts:66,74,84` and `prepare-project-agent.ts:52,60,70`).
- `prepareProject` additionally rolls back the project row if the coordinator fails (`prepare-project.ts:72`), and rolls back both project + coordinator if the link fails (`prepare-project.ts:80-81`).
- If the coordinator never reaches ready in `prepareProject`, the project + agent are intentionally **kept** on disk so the user can retry from `/projects/:id` (see comment at `prepare-project.ts:8-12`).

---

## Electron side

Renderer flows are the thin layer the user touches. The heavy lifting lives one level down in the main process and is reachable only through `@/api/*`:

- `electron/general-kai-runtime.ts` owns the per-agent runtime (`start` / `stop` / `restart` / `send`), the chat persistence stream, the settings-file watcher, the telemetry tailer, and the `handleAdapterEvent` state machine that turns Pi's RPC stream into typed `AdapterEvent`s.
- `electron/reconcile-agents.ts` + `electron/reconcile-runtime.ts` reconcile on-disk agent directories with the DB and clear stale runtime states on boot.
- `electron/agents-fs-watcher.ts` watches `~/.superhive/agents` + `~/.superhive/projects/<name>/agent/` and broadcasts `agents:changed` (250 ms debounce, 2 s soft-delete buffer, 5 s polling fallback).
- `electron/agent-chat-store.ts` is the JSONL chat store that powers `start`'s hydration and `send`'s 1 s debounced flush.
- `electron/pi-protocol/telemetry-tailer.ts` tails `<agentDir>/telemetry.jsonl` and emits parsed events into the runtime.
- `electron/pi-protocol/raw-text-adapter.ts` parses the Pi RPC stream into the typed `AdapterEvent` union that drives the whole state machine.
- `superhive-pi-truth` + `superhive-pi-telemetry` extensions own the per-agent settings schema (`<agentDir>/Superhive-pi-<basename>.json`) and the `<agentDir>/telemetry.jsonl` write stream.

All cross-module data passes through the contracts listed in `AGENTS.md`: the settings file, the telemetry stream, the `agent:<id>:event` IPC channel, and the `bash agent.sh --manifest <Superhive-pi-*.json>` launch path.
