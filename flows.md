# Superhive Flows — Plain-English Reference

This document walks through every flow in `src/flows/`, what triggers it, where the data goes, and what the user sees. Read it top-to-bottom for the intended flow of working.

The single rule every flow obeys: **UI never talks to data directly**. The path is always:

```
UI Component
   ↓ imports (never @/api)
Flow (src/flows/...)
   ↓ calls
API wrapper (src/api/...)
   ↓ calls
window.api.<area>.<verb>()
   ↓ (preload bridge)
IPC handler (electron/ipc/<area>.ts)
   ↓ calls
Repository (src/storage/repositories/...)
   ↓ reads/writes
JSON file on disk
```

A flow is just a tiny TypeScript function. It does **one** thing, decides whether to toast, sometimes navigates, and returns a structured `{ ok, ... }` result so the caller can render the right next step.

---

## 0. Where everything lives (the map)

| Thing | Folder | Purpose |
|---|---|---|
| Flows | `superhive/src/flows/` | The only thing UI components import for side effects |
| API wrappers | `superhive/src/api/` | Promise-returning wrappers around `window.api.*` |
| Types | `superhive/src/types/electron.d.ts` | The IPC contract surface (preload-safe types) |
| IPC handlers | `superhive/electron/ipc/` | The other side of the bridge — what `window.api.*` actually invokes |
| Repositories | `superhive/src/storage/repositories/` | Read/write JSON files; one per entity |
| JSON DB | `~/Library/Application Support/superhive/` | Where repos persist (macOS) |
| Settings | `<agentDir>/Superhive-pi-<folderName>.json` | Per-agent settings file (owned by pi-truth) |
| Telemetry | `<agentDir>/telemetry.jsonl` | Per-agent telemetry stream (owned by pi-telemetry) |
| Runtime registry | in-memory, lives in `electron/general-kai-runtime.ts` | Tracks running `bash agent.sh` child processes |
| Renderer store | `superhive/src/stores/agent.ts` | Zustand store for live runtime + settings per agent |
| Agent folder | `~/.superhive/agents/<name>/` or `~/.superhive/projects/<name>/agent/` | Where an agent actually lives on disk |
| General-kai template | `~/.superhive/general-kai-template/` | The pre-cloned template each new agent is copied from |
| Channel JSONL | `~/.superhive/channels/<id>.jsonl` | Append-only message log per channel |

---

## 1. Agents — CRUD

### `listAgents()`

- **Where it lives:** `src/flows/agents/crud/list-agents.ts`
- **Called by:** Left sidebar (`SidebarAccordion`, `AgentsSection`), `AgentsListView` (agent-empty page), `ProjectChatView` (to render team), `loadProjectTeam`, `deleteProject`.
- **What it does:** Return every agent the app knows about, sorted by the repo's natural order.
- **How it does it:**
  1. Flow calls `agents.list()` (the API wrapper).
  2. API wrapper calls `window.api.agents.list()`.
  3. Preload bridge hands it to `ipcMain.handle('agents:list', ...)`.
  4. The handler in `electron/ipc/agents.ts:77` returns `AgentRepository.getAll()`.
  5. The repo reads `~/Library/Application Support/superhive/db.agents.json` (a LowDB-backed file).
  6. Returns the array of `Agent` rows.
- **What comes back:** `Promise<Agent[]>`.
- **What the UI does next:** Stores the array in local `useState`, renders rows.

---

### `loadAgentProjects(agentId)`

- **Where it lives:** `src/flows/agents/crud/load-agent-projects.ts`
- **Called by:** Right-panel "Projects" tab when viewing an agent.
- **What it does:** List the projects this agent belongs to.
- **How it does it:**
  1. If `agentId` is empty → return `[]` immediately.
  2. Otherwise call `agents.getProjects(agentId)`.
  3. The IPC handler in `electron/ipc/agents.ts:229` calls `AgentRepository.getProjects(agentId)`.
  4. The repo reads the agent row, takes its `projectIds[]`, and joins against `db.projects.json`.
- **What comes back:** `Promise<Project[]>`.

---

### `createAgent({ name, folderName, parentDir, role?, description? })`

- **Where it lives:** `src/flows/agents/crud/create-agent.ts`
- **Called by:** Nobody directly — `prepareStandaloneAgent` and `prepareProjectAgent` call this internally. (It's exported in case a future flow needs a "create without start" path.)
- **What it does:** Create one agent row + folder + seed settings file. Does **not** start the runtime.
- **How it does it:**
  1. Trim `name`, `folderName`, `parentDir`. Return `{ ok: false, error }` if any is empty (no toast — caller decides UX).
  2. Call `agents.create(input)`.
  3. IPC handler in `electron/ipc/agents.ts:83` runs the heavy lifting:
     - `ensureGeneralKai()` — clones the template to `~/.superhive/general-kai-template/` if missing.
     - Sanitize `folderName` (lowercase, kebab, reject `.` / `..` / path separators).
     - Expand `~` in `parentDir` to `$HOME`.
     - `mkdir(parentDir/folderName, { recursive: true })`.
     - Copy `agent.sh` from the template into the new folder; `chmod 755`.
     - Symlink `extensions/superhive-pi-truth` and `extensions/superhive-pi-telemetry` from the canonical clones (`ensureExtension` returns the cached path).
     - Write `manifest.json` with `{ superhiveId, version:1, workspace:'./workspace', extensions:[...], environment:{ MINIMAX_API_KEY } }`.
     - Symlink `agent.json → manifest.json` so `agent.sh --manifest` resolves correctly.
     - Pick the top enabled catalog model (5 curated options), seed `Superhive-pi-<folderName>.json` with `DEFAULT_SETTINGS` plus that model + the `extensions` array (this prevents Pi's first-boot from picking the empty seed and loading no extensions).
     - Insert the `Agent` row in `db.agents.json` (`status: 'idle'`).
     - Broadcast `agents:onCreated` to the renderer so any listener knows the agent is ready.
- **What comes back:** `{ ok: true, agent }` or `{ ok: false, error }`.
- **What the UI does next:** None directly — composed by `prepareStandaloneAgent`.

---

### `prepareStandaloneAgent({ name, folderName, parentDir, role?, description? })`

- **Where it lives:** `src/flows/agents/crud/prepare-standalone-agent.ts`
- **Called by:** `CreateAgentDialog` (the dialog's "Create" button).
- **What it does:** Create an agent, start its runtime, and block until the agent is safe to send messages to.
- **How it does it:**
  1. Call `agents.create(...)` (the IPC creates the folder + row).
     - On failure → return `{ ok: false, reason: 'create-failed', message }`. No rollback needed (nothing was created yet).
  2. Call `agents.start(agent.id)` (the runtime IPC).
     - On failure → `agents.delete(agent.id)` (cleanup), return `{ ok: false, reason: 'start-failed' }`.
  3. Call `waitForAgentReady(agent.id)` (see below).
     - On failure → `agents.delete(agent.id)` (cleanup), return the structured failure.
  4. Otherwise → `{ ok: true, agent }`.
- **What comes back:** Discriminated union — either `{ ok: true, agent }` or one of `'create-failed' | 'start-failed' | 'timeout' | 'error'`.
- **What the UI does next:** The dialog owns the `PreparingToast`. On success → toast "Agent ready", `navigate('/agents/<id>')`. On `timeout` with `detail: 'model'` → toast + show CTA to pick a model. On other failures → toast the message.

---

### `createProjectAgent({ name, folderName, parentDir })`

- **Where it lives:** `src/flows/agents/crud/create-project-agent.ts`
- **Called by:** Nobody directly — `prepareProjectAgent` calls this internally.
- **What it does:** Same as `createAgent` but with `agentKind: 'project-coordinator'` stamped on the row.
- **How it does it:** Identical IPC chain. The `agentKind` field flows into `db.agents.json`.
- **What comes back:** `{ ok, agent? }`.

---

### `prepareProjectAgent({ name, folderName, parentDir })`

- **Where it lives:** `src/flows/agents/crud/prepare-project-agent.ts`
- **Called by:** `prepareProject` (only).
- **What it does:** Create a coordinator agent (`agentKind: 'project-coordinator'`) and start its runtime. Wait until ready.
- **How it does it:** Identical to `prepareStandaloneAgent`. The only difference is the `agentKind` field on the create call.
- **What comes back:** Same discriminated union shape.

---

### `waitForAgentReady(agentId, { timeoutMs?, pollMs? })`

- **Where it lives:** `src/flows/agents/crud/wait-for-agent-ready.ts`
- **Called by:** Both `prepare*` flows.
- **What it does:** Poll the main process until the agent is fully ready, or surface a specific failure reason.
- **How it does it:**
  1. Defaults: `timeoutMs = 15_000`, `pollMs = 300`. Compute a `deadline = Date.now() + timeoutMs`.
  2. Loop until the deadline:
     - Call `agents.getRuntimeState(agentId)`.
     - The IPC handler returns `runtime.getStatusPayload(agentId)` — a snapshot of the in-memory runtime registry entry.
     - If `status ∈ { 'active', 'busy' }` **and** `bootStep === 'ready'` → mark runtime ready, break.
     - Otherwise `sleep(pollMs)` and try again.
  3. If we never saw runtime ready → return `{ ok: false, reason: 'timeout', detail: 'runtime' }`.
  4. Call `agents.readSettings(agentId)` to read `<agentDir>/Superhive-pi-<folderName>.json`. (This call also triggers `runtime.ensureSettingsWatcher` so future file changes broadcast.)
  5. If `settings.model.provider` and `settings.model.name` are both set → `{ ok: true, settings }`.
  6. Otherwise → `{ ok: false, reason: 'timeout', detail: 'model' }`.
- **What comes back:** `{ ok: true, settings }` or a 2-shape failure (`'timeout'` with `detail`, or `'error'`).
- **Why two failure shapes:** the UI needs to show different CTAs. `'model'` → "Pick a model" button. `'runtime'` → "Check logs / restart" button.

---

### `deleteAgent(id)`

- **Where it lives:** `src/flows/agents/crud/delete-agent.ts`
- **Called by:** `AgentError` component (when the runtime is in an unrecoverable error state), `AgentsListView` context menu.
- **What it does:** Stop the runtime, delete the row, drop the in-memory store slice, and (via main process) `rm -rf` the agent folder.
- **How it does it:**
  1. `agents.stop(id)` — best-effort, swallows errors (if it was already stopped, that's fine).
  2. `agents.delete(id)` → IPC handler in `electron/ipc/agents.ts:210`:
     - Reads the row; if missing → returns `false`.
     - If the runtime is running → `runtime.stop(id)` again.
     - `AgentRepository.delete(id)` (cascades `projectIds` cleanup on the project side).
     - `rm(agent.localPath, { recursive: true, force: true })` — kills the folder + all its settings + telemetry jsonl.
  3. `disposeSlice(id)` from `@/stores/agent.ts` — drops the Zustand slice for this agent from the store.
  4. Toasts "Agent deleted" on success, error message on failure.
- **What comes back:** `{ ok: boolean, error?: string }`.

---

### `revealAgent(id)`

- **Where it lives:** `src/flows/agents/crud/reveal-agent.ts`
- **Called by:** `AgentRowContextMenu` (right-click "Reveal in Finder").
- **What it does:** Open the agent's folder in Finder (macOS) / Explorer (Windows).
- **How it does it:**
  1. `agents.reveal(id)`.
  2. IPC handler → `revealInFinder(id)` (`electron/ipc/reveal-in-finder.ts`).
  3. Reads the agent row, gets `localPath`, calls Electron's `shell.openPath(localPath)`.
- **What comes back:** `{ ok, error? }`. Toasts on failure.

---

### `forkAgent({ sourceAgentId, parent, parentDir }, navigate)`

- **Where it lives:** `src/flows/agents/crud/fork-agent.ts`
- **Called by:** `AgentRowContextMenu` (right-click "Fork").
- **What it does:** Duplicate an existing agent — same settings + extensions, but a fresh folder and a ` (fork)` suffix on the name.
- **How it does it:**
  1. Derive a safe folder name: kebab-case the parent's name, fallback to `fork`.
  2. Derive a display name: `"<parent name> (fork)"`.
  3. Call `agents.forkFromSettings(sourceAgentId, { name, folderName, parentDir })`.
  4. IPC handler in `electron/ipc/agents.ts:298` delegates to `forkAgentFromSettings(...)` in `electron/ipc/fork-agent.ts`:
     - Reads source agent's settings file.
     - Copies the entire `~/.superhive/agents/<source>/` folder to `<parentDir>/<folderName>/`.
     - Overwrites `name`, `description`, `managedBy: "superhive-pi-truth@1#0"` (resets counter), `lastModified`.
     - Inserts a new `Agent` row pointing at the new folder.
- **What comes back:** `{ ok, agent }`.
- **What the UI does next:** Toasts "Forked <name>". `navigate('/agents/<newId>')`.

---

### `editMessage({ agentId, messageId, newText })`

- **Where it lives:** `src/flows/agents/crud/edit-message.ts`
- **Called by:** `UserMessage` component (inline edit-and-resend).
- **What it does:** Edit a user message and re-send the conversation from there.
- **How it does it:**
  1. Trim text. If empty → toast error, return `{ ok: false }`.
  2. `agents.editMessage(agentId, messageId, text)`.
  3. IPC handler in `electron/ipc/runtime.ts:155` → `runtime.editMessage(agentId, messageId, text)`.
  4. The runtime truncates the conversation JSONL at `messageId`, rewrites the message body, and replays the user message into the agent's Pi session.
- **What comes back:** `{ ok, error? }`. Toasts on success/failure.

---

### `regenerate({ agentId, fromMessageId })`

- **Where it lives:** `src/flows/agents/crud/regenerate.ts`
- **Called by:** `AssistantMessage` (per-message regen button), `shortcutRegenerateLast` (Cmd+Shift+R).
- **What it does:** Ask Pi to redo its answer starting from a given message.
- **How it does it:**
  1. `agents.regenerate(agentId, fromMessageId)`.
  2. IPC → `runtime.regenerate(agentId, fromMessageId)` — truncates the conversation at `fromMessageId`, then re-prompts Pi.
- **What comes back:** `{ ok, error? }`. **No success toast** (the new message appearing in the chat is the feedback). Failure toasts.

---

### `deleteMessage({ agentId, messageId })`

- **Where it lives:** `src/flows/agents/crud/delete-message.ts`
- **Called by:** Message context menus (delete button).
- **What it does:** Remove one message from the conversation.
- **How it does it:**
  1. `agents.deleteMessage(agentId, messageId)`.
  2. IPC → `runtime.deleteMessage(...)` — rewrites the conversation JSONL without that message.
- **What comes back:** `{ ok, error? }`. Toasts.

---

## 2. Agents — Runtime (start / stop / restart)

### `startAgent(id)`

- **Where it lives:** `src/flows/agents/runtime/start-agent.ts`
- **Called by:** Right-panel restart bar, agent-empty page action buttons.
- **What it does:** Boot the runtime for an existing agent.
- **How it does it:**
  1. `agents.start(id)`.
  2. IPC handler in `electron/ipc/runtime.ts:123`:
     - Reads the agent row.
     - `autoSeedProviders(agentId, localPath)` → `reSeedProviders(agentId)` in `electron/ipc/runtime.ts:53`. Reads global provider rows from `db.settings.json`, merges with per-agent `providers` block (per-agent wins), bootstraps any `*_API_KEY` env vars that aren't yet configured, and writes the result into the agent's settings file. Counter is bumped, never reset (so the watcher's self-write guard stays consistent).
     - `runtime.start(agentId, agentDir, GENERAL_KAI_DIR)` — actually spawns `bash agent.sh --manifest <Superhive-pi-...json>` and tracks the child process in the in-memory runtime registry.
     - `AgentRepository.update(agentId, { status: 'active' })`.
  3. Toasts "Agent starting...".
- **What comes back:** `{ ok: boolean }`.
- **Live state:** The runtime registry broadcasts events on `agent:<id>:event`. The Zustand store (`useAgentRuntime` from `@/stores/agent`) subscribes and updates the UI as messages stream in.

### `stopAgent(id)`

- **Where it lives:** `src/flows/agents/runtime/stop-agent.ts`
- **Called by:** Restart bar, error-recovery UIs.
- **What it does:** Tear down the runtime.
- **How it does it:**
  1. `agents.stop(id)`.
  2. IPC handler → `runtime.stop(id)` (SIGTERM the bash child) → `AgentRepository.update(id, { status: 'idle' })`.
  3. Toasts "Agent stopped".

### `restartAgent(id)`

- **Where it lives:** `src/flows/agents/runtime/restart-agent.ts`
- **Called by:** Restart bar (the primary button).
- **What it does:** Re-seed providers, restart the runtime.
- **How it does it:**
  1. `agents.restart(id)`.
  2. IPC → `autoSeedProviders(id, ...)` → `runtime.restart(id)` → status flipped back to `'active'`.
  3. Toasts "Agent restarting...".

---

## 3. Agents — Settings

### `updateAgentSettings({ agentId, patch })`

- **Where it lives:** `src/flows/agents/settings/update-agent-settings.ts`
- **Called by:** `use-auto-save.ts` (the right-panel debounced save hook).
- **What it does:** Apply a partial patch to the agent's settings file.
- **How it does it:**
  1. `agents.writeSettings(agentId, patch)`.
  2. IPC handler in `electron/ipc/agents.ts:243` — read-modify-write loop, up to 3 attempts:
     - Read the current settings file (`Superhive-pi-<folderName>.json`).
     - Compute `next counter = parseCounter(current.managedBy) + 1` (atomic across racing writers).
     - Merge `patch` into current. Bump `managedBy` to `"superhive-pi-truth@1#<n>"` and `lastModified` to now.
     - Write to a `*.tmp.<pid>.<ts>.<attempt>.tmp` file, `rename` to the real path (atomic on POSIX).
     - Read back and re-stringify. If it byte-for-byte matches what we just wrote → success.
     - If it raced → retry up to 3 times, then throw.
  3. On success: `runtime.markSelfWrite(agentId, counter)` so the watcher doesn't broadcast a redundant "settings changed" event for our own write.
  4. Toasts "Settings saved".
- **What comes back:** `{ ok, settings? }`.
- **Why the counter matters:** both `superhive-pi-truth` and the renderer write to this file. The counter lets the watcher tell "this is my write" from "an extension changed something". See `electron/general-kai-runtime.ts` and AGENTS.md §2.

---

## 4. Dialog state (singletons)

These are module-level singletons — no IPC, no DB. They live outside React's lifecycle so the same button can open a dialog mounted in a different part of the tree.

### `useOpenCreateAgent()`
- **Where it lives:** `src/flows/agents/ui/open-create-agent.ts`
- **Called by:** Sidebar's "New Agent" button (sets `true`). `CreateAgentDialog` (reads `open`, sets `false` on close).
- **How it does it:** A module-level `currentState: boolean` plus a `listeners: Array<(open:boolean)=>void>`. `useOpenCreateAgent` subscribes a `useState` setter to the listener list. `setOpen(true/false)` mutates `currentState` and broadcasts.

### `useOpenCreateProject()`
- **Where it lives:** `src/flows/projects/ui/open-create-project.ts`
- **Same pattern** for the `CreateProjectDialog`.

### `useCommandPalette()`
- **Where it lives:** `src/flows/ui/use-command-palette.ts`
- **Called by:** The TopRightControls button (sets open). Cmd/Ctrl+K keydown (toggles). The CommandPalette component (reads `open`).
- **How it does it:** Same singleton pattern + a global `keydown` listener attached once. (Cmd/Ctrl)+K toggles. Suppressed inside editable fields.

### `useCenterBreadcrumb()`
- **Where it lives:** `src/flows/ui/use-center-breadcrumb.ts`
- **Called by:** The center panel header (one consumer).
- **What it does:** Resolves the breadcrumb segments for the current URL.
- **How it does it:**
  1. Reads `useParams()` + `useLocation()`.
  2. For `/agents/:agentId` → calls `agents.get(agentId)` directly (the one place a flow bypasses the wrapper layer — small inconsistency noted in §13).
  3. For `/projects/:projectId` → calls `loadProject(projectId)` (a flow — good).
  4. Returns segments like `[{label:"Projects", href:"/projects"}, {label:"<resolved name>"}]`.
- **What comes back:** `BreadcrumbSegment[] | null`. `null` on `/` and `/landing`.

### `useAppUpdate()` + `installUpdate()`
- **Where it lives:** `src/flows/ui/use-app-update.ts` + `src/flows/ui/install-update.ts`
- **Called by:** `UpdateBanner` (subscribes to pending updates; "Restart to update" button calls `installUpdate`).
- **How `useAppUpdate` does it:**
  1. Subscribes to `window.api.app.onUpdateDownloaded(info => setPending(info))` via `useEffect`.
  2. Returns `{ pendingUpdate, installUpdate }`.
- **How `installUpdate` does it:**
  1. `await window.api.app.installUpdate()`.
  2. The main process side calls Electron's `autoUpdater.quitAndInstall()` which closes the app and reinstalls.

---

## 5. Channels — CRUD

### `createChannel({ name, type, projectId?, participantAgentIds })`
- **Where it lives:** `src/flows/channels/crud/create-channel.ts`
- **Called by:** `prepareProject` (only — every project gets one channel).
- **What it does:** Create one channel row and pick a path for its `chatFile` jsonl.
- **How it does it:**
  1. `channels.create(input)` → IPC handler in `electron/ipc/channels.ts:20`:
     - `mkdir('~/.superhive/channels', { recursive: true })`.
     - Writes `~/.superhive/channels/<channelId>.json` with the channel metadata (`name`, `type`, `projectId`, `participantAgentIds`, `startedAt`, `chatFile: '~/.superhive/channels/<random>.jsonl'`).
     - Returns the channel object (the jsonl file is not created yet — first `appendMessage` creates it).
- **What comes back:** `{ ok, channel? }`.
- **What the UI does next:** `prepareProject` writes `channelId` back onto the project row.

> **Missing flows in this group:** `channels.list`, `channels.get`, `channels.appendMessage`, `channels.readMessages`, and `channels.delete` all have IPC handlers but **no flow wrappers yet**. The IPC is reachable via the API wrapper (`src/api/channels.ts`) but nothing calls it through flows. This is the gap surfaced by `deleteProject.ts:56` ("TODO: delete channel + JSONL when we add channels.delete IPC"). See §13.

---

## 6. Projects — CRUD

### `listProjects()`
- **Where it lives:** `src/flows/projects/crud/list-projects.ts`
- **Called by:** Left sidebar `SidebarAccordion`, `AgentsListView` (for sidebar "Projects" filter).
- **How it does it:** `projects.list` → IPC handler → `ProjectRepository.getAll()` → reads `db.projects.json`.

### `loadProject(id)`
- **Where it lives:** `src/flows/projects/crud/load-project.ts`
- **Called by:** `loadProjectTeam`, `useCenterBreadcrumb`, `ProjectChatView`.
- **How it does it:** `projects.get(id)` → IPC handler → `ProjectRepository.getById(id)` → reads `db.projects.json`.

### `loadProjectTeam(projectId)` + `loadUnassignedAgents()`
- **Where it lives:** `src/flows/projects/crud/load-project-team.ts`
- **Called by:** `ProjectChatView` (and its team panel).
- **What it does:** Resolve a project's full team — the project itself, its coordinator, and the regular members.
- **How it does it:**
  1. `Promise.all([loadProject(id), listAgents()])`.
  2. If the project doesn't exist → return `{ project: null, coordinator: null, members: [] }`.
  3. Otherwise filter agents by `project.agentIds.includes(a.id)`. Coordinator = the one with `agentKind === 'project-coordinator'`. Members = everything else.
  4. `loadUnassignedAgents()` returns agents with `agentKind !== 'project-coordinator' && projectIds.length === 0` (the "available to assign" list).
- **What comes back:** `{ project, coordinator, members }` or `{ agents }`.

### `prepareProject({ name, description?, localPath? })`
- **Where it lives:** `src/flows/projects/crud/prepare-project.ts`
- **Called by:** `CreateProjectDialog`.
- **What it does:** Create the project row, its coordinator agent (started and ready), the project channel, and link the agent to the project — all atomically with rollback on failure.
- **How it does it (in order, with rollback at each step):**
  1. **Create project.** `projects.create({ name, description, localPath })` → IPC handler in `electron/ipc/projects.ts:15`:
     - Validates name.
     - Expands `~` in `localPath`, `mkdir(..., { recursive: true })`.
     - `ProjectRepository.create(...)` → row in `db.projects.json`.
     - If anything fails → `{ reason: 'create-failed' }`.
  2. **Create coordinator agent.** `prepareProjectAgent({ name: "<projectName> (Coordinator)", folderName: 'agent', parentDir: localPath ?? '~/.superhive/projects/<slug>' })`:
     - If anything fails → `projects.delete(project.id)` (rollback), map the coordinator's failure to `{ reason: 'coordinator-create-failed' | 'coordinator-start-failed' | 'coordinator-timeout' | 'coordinator-error' }`.
  3. **Link agent to project.** `projects.addAgent(project.id, coordinatorAgent.id)` → `ProjectRepository.addAgent` keeps both `Project.agentIds` and `Agent.projectIds` in sync.
     - On failure → delete project + coordinator, `{ reason: 'link-failed' }`.
  4. **Create the project channel.** `createChannel({ name: "<projectName> coordination", type: 'project', projectId, participantAgentIds: [coordinator.id] })`.
     - On failure → delete project + coordinator, `{ reason: 'channel-failed' }`.
  5. **Back-link the channelId** via `projects.update(project.id, { channelId })`. **Best-effort**, error swallowed. The channel exists independently.
  6. Return `{ ok: true, project }`.
- **What comes back:** Discriminated union of 7 failure reasons or success.
- **What the UI does next:** The dialog owns the toast + navigation. On success → `navigate('/projects/<id>')`.

> **Concern:** Step 2's fallback `parentDir` is a literal string starting with `~`. The IPC handlers in `electron/ipc/agents.ts:99` and `electron/ipc/projects.ts:24` both expand `~` to `$HOME` — but only at IPC time. The fallback here is constructed **before** the IPC call, so it will be passed in already-expanded-by-agent-IPC. Worth verifying the project-coordinator folder lands in the right place when `localPath` is omitted.

### `assignAgentToProject({ projectId, agentId })`
- **Where it lives:** `src/flows/projects/crud/assign-agent-to-project.ts`
- **Called by:** Team panel "Add member" button.
- **How it does it:** `projects.addAgent(projectId, agentId)` → IPC → `ProjectRepository.addAgent` (maintains both `Project.agentIds` and `Agent.projectIds`).
- **What comes back:** `{ ok, error? }`. Toasts.

### `removeAgentFromProject({ projectId, agentId })`
- **Where it lives:** `src/flows/projects/crud/remove-agent-from-project.ts`
- **Called by:** Team panel per-member "Remove" button.
- **How it does it:** `projects.removeAgent(...)` → IPC → `ProjectRepository.removeAgent`.
- **What comes back:** `{ ok, error? }`. Toasts.

### `deleteProject(projectId)`
- **Where it lives:** `src/flows/projects/crud/delete-project.ts`
- **Called by:** `ProjectAgentError` component (when the project coordinator is in an error state).
- **What it does:** Delete the project + its coordinator (runtime + row + slice + folder). Best-effort channel cleanup.
- **How it does it:**
  1. `projects.get(id)` to read the row. If missing → toast error, return.
  2. `listAgents()` to find the `agentKind: 'project-coordinator'` whose `projectIds` includes this id.
  3. `projects.delete(id)` first → IPC → `ProjectRepository.delete(id)` cascades (removes agent links, deletes tasks, deletes channels). Returns boolean.
  4. If we found a coordinator:
     - `agents.stop(coordinator.id)` (best-effort).
     - `agents.delete(coordinator.id)` → cascades agent folder deletion via `rm`.
     - `disposeSlice(coordinator.id)` drops the Zustand slice.
  5. **TODO:** if `project.channelId` exists, delete the channel + jsonl. No `channels.delete` IPC yet, so this branch is empty and the channel jsonl lingers.
  6. Toasts "Project <name> deleted".
- **What comes back:** `{ ok, error? }`.

---

## 7. Project Dialog State

### `useOpenCreateProject()`
See §4.

---

## 8. Navigation

### `goBackHome(navigate)`
- **Where it lives:** `src/flows/navigation/go-back-home.ts`
- **Called by:** TopHandle / logo button.
- **What it does:** `navigate('/')`. One-liner.

### `goToSettings(navigate)`
- **Where it lives:** `src/flows/navigation/go-to-settings.ts`
- **Called by:** Settings buttons.
- **What it does:** `navigate('/settings')`.

---

## 9. Settings — Providers & Models

All flows in this section go through `settings.setProvider`, `settings.addModel`, etc. The IPC handlers in `electron/ipc/settings.ts` validate input and apply the master-toggle cleanup automatically (e.g. clearing the preferred model when the API key is wiped, disabling all enabled rows for that provider).

The JSON store is generic — settings live in `db.settings.json` under `ownerType='global'`, `ownerId='global'`, in two groups: `providers` and `models`. Each row is a separate entry keyed by provider name (or `provider:modelName` for models).

### `listProviders()`
- **Where it lives:** `src/flows/settings/crud/list-providers.ts`
- **Called by:** `useProviders` hook.
- **How it does it:** `settings.getProviders()` → IPC → reads rows in `providers` group, returns `Record<string, ProviderEntry>`.

### `saveProviderBlock({ provider, baseUrl?, apiKey?, enabled?, preferredModel?, accessKeyId?, secretAccessKey?, region? })`
- **Where it lives:** `src/flows/settings/crud/save-provider-block.ts`
- **Called by:** `ProviderKeyBlock` form (the per-provider block in Settings → API Keys).
- **What it does:** Persist one provider block.
- **How it does it:**
  1. Validate `provider` non-empty. Return `{ ok: false, error }` if not.
  2. `settings.setProvider(...)` → IPC handler in `electron/ipc/settings.ts:129`:
     - Reads the existing row to compute diffs.
     - Computes `keyBeingCleared = previousHadKey && !newHasKey` — when the API key is being emptied, force `enabled: false` and clear `preferredModel`.
     - Writes the merged row into `providers` group.
     - `syncPreferredModelRow(...)` — if `preferredModel` is set, upsert a row in `models` group with `enabled = !!enabled` and `isCustom: true`. If empty, remove the previously stored preferred-model row(s).
     - If `keyBeingCleared`, disable every enabled model row for this provider (curated + custom) so the ModelPicker doesn't show stale entries.
     - `reSeedAllAgents()` — walks `db.agents.json` and calls `reSeedProviders(agentId)` for each. This re-merges global providers into every per-agent settings file so the new key takes effect on the next agent boot.
  3. **No toast** — the form itself owns UX (inline validation, dirty indicator).
- **What comes back:** `{ ok, error? }`.

### `deleteProvider(name)`
- **Where it lives:** `src/flows/settings/crud/delete-provider.ts`
- **Called by:** Provider block "Delete" button.
- **How it does it:**
  1. Validate name.
  2. `settings.deleteProvider(name)` → IPC handler removes the provider row from `providers` group, then disables every enabled model for that provider (rows stay so the user can re-add the key), then `reSeedAllAgents()`.
  3. Toasts "Provider <name> deleted".

### `configureCatalogProvider({ provider, baseUrl?, apiKey, modelName })`
- **Where it lives:** `src/flows/settings/crud/configure-catalog-provider.ts`
- **Called by:** `ModelEditorDialog` (the "Configure" button for one of the 5 curated providers).
- **What it does:** Save an API key for a curated provider and flip its curated model row to enabled.
- **How it does it:**
  1. Validate `provider`, `modelName`, `apiKey`.
  2. `settings.setProvider(...)` (the same path `saveProviderBlock` uses).
  3. `setModelEnabled('${provider}:${modelName}', true)` → IPC handler upserts a non-custom row in `models` group.
  4. Toasts "Saved key for <provider>".

### `setModelEnabled(id, enabled)`
- **Where it lives:** `src/flows/settings/crud/set-model-enabled.ts`
- **Called by:** `configureCatalogProvider`, `ModelsSection` model toggle.
- **How it does it:** `settings.setModelEnabled(id, enabled)` → IPC handler:
  - If a row with that id exists → patch `enabled` on it.
  - If not (curated row that wasn't in the table yet) → derive `provider` and `name` from the id (`provider:modelName` format), insert as a non-custom row.
- **What comes back:** `{ ok, error? }`. **No toast.**

### `addModel({ provider, name })`
- **Where it lives:** `src/flows/settings/crud/add-model.ts`
- **Called by:** `ModelsSection` "Add model" form.
- **What it does:** Add a model row under an existing provider.
- **How it does it:**
  1. Validate `provider`, `name`.
  2. `settings.addModel({ provider, name })` → IPC handler in `electron/ipc/settings.ts:286`:
     - Upserts a row in `models` group with `{ id: 'provider:name', provider, name, enabled: true, isCustom: true, contextWindow: undefined }`.
     - **Does not** set `contextWindow` here. It's resolved later by the `superhive-pi-telemetry` extension on the first `model_select` event from Pi (which itself reads Pi's `modelRegistry` or falls back to `HARDCODED_CONTEXT_WINDOWS`). Main process writes it back to the same row when it sees the telemetry event.
  3. Toasts "Model <name> added".

### `addCustomModel({ provider, modelName, baseUrl?, apiKey })`
- **Where it lives:** `src/flows/settings/crud/add-custom-model.ts`
- **Called by:** `ModelEditorDialog` "Add custom endpoint" button.
- **What it does:** One-shot — create a custom provider (with its baseUrl + apiKey) and its first model in one go.
- **How it does it:**
  1. Validate `provider`, `modelName`, `apiKey`.
  2. `settings.setProvider({ name: provider, baseUrl?, apiKey })` (registers the custom endpoint).
  3. `settings.addModel({ provider, name: modelName })`.
  4. Toasts "Added <provider>:<modelName>".

### `deleteModel(id)`
- **Where it lives:** `src/flows/settings/crud/delete-model.ts`
- **Called by:** Model row delete button.
- **How it does it:** `settings.deleteModel(id)` → IPC removes the row from `models` group. Toasts "Model deleted".

### `getEnabledModels()`
- **Where it lives:** `src/flows/settings/crud/get-enabled-models.ts`
- **Called by:** `ModelPicker` (the composer dropdown).
- **How it does it:** `settings.getEnabledModels()` → IPC handler reads `models` group, filters `enabled === true`, returns `[{id, provider, name, contextWindow?}]`.

---

## 10. Settings — Hooks

### `useProviders()`
- **Where it lives:** `src/flows/settings/ui/use-providers.ts`
- **Called by:** `ModelsSection`, `APIKeysSection`.
- **What it does:** Loads providers, exposes derived helpers.
- **How it does it:**
  1. `useState` for the providers map.
  2. On mount, `useEffect` calls `listProviders()`, stores the result.
  3. Memoizes `providerNames` (Set of provider names), `providersWithKey` (Set of providers with non-empty `apiKey`), `hasProvider(name)`, `hasApiKey(name)`.
  4. Exposes `refresh()` so callers can re-fetch after a write.

### `useModels()`
- **Where it lives:** `src/flows/settings/ui/use-models.ts`
- **Called by:** `ModelsSection`.
- **How it does it:** Same pattern — `useState` + `useEffect` calling `settings.getModels()` on mount. Returns `{ models, loading, error, refresh }`.

---

## 11. Chat UX

### `sendMessage({ text, isLive, send })`
- **Where it lives:** `src/flows/ui/send-message.ts`
- **Called by:** `AgentChatView` and `ProjectChatView` composer.
- **What it does:** Validate input + gate on live status, then dispatch the actual send (which the page wires to `agents.sendMessage`).
- **How it does it:**
  1. Trim `text`.
  2. If empty or `isLive === false` → return `{ ok: false }` (do nothing).
  3. Otherwise call `send(trimmed)` — the page-provided callback that calls `agents.sendMessage(agentId, text)` → IPC → `runtime.send(agentId, message)` → `bash agent.sh` writes the message to the agent's `messages.jsonl` and replays it into Pi's session.
- **What comes back:** `{ ok: boolean }`.
- **Why no model gate:** the runtime surfaces a "no model" error via toast if Pi rejects the send, and the composer stays interactive so the user can fix it and retry.

### `useChatShortcuts({ onCopyLast?, onRegenerate?, onStop?, enabled? })`
- **Where it lives:** `src/flows/ui/use-chat-shortcuts.ts`
- **Called by:** `AgentChatView`, `ProjectChatView` (with `enabled = true`). `enabled = false` on Settings/Landing.
- **What it does:** Attach a global keydown listener (only once across all mounts) and forward matched keys to the page-provided handlers.
- **How it does it:**
  1. Module-level `listenerAttached: boolean` + `lastHandlers: ShortcutHandlers | null`.
  2. `ensureListener()` is called from the hook body on every mount. It no-ops if already attached. Otherwise it adds a `window.keydown` listener that:
     - Requires `metaKey || ctrlKey`.
     - Bails if the active element is `<input>`, `<textarea>`, `<select>`, or `contentEditable`.
     - Cmd/Ctrl+Shift+C → `onCopyLast()`.
     - Cmd/Ctrl+Shift+R → `onRegenerate()`.
     - Cmd/Ctrl+. (or `>`) → `onStop()`.
  3. The hook stores `handlers` in `lastHandlers` so the listener (which has no closure) can reach them.

### `shortcutCopyLastAssistant({ messages })`
- **Where it lives:** `src/flows/ui/shortcut-copy-last-assistant.ts`
- **Called by:** `AgentChatView` / `ProjectChatView` passing it as `onCopyLast` to `useChatShortcuts`.
- **How it does it:**
  1. Walk `messages` reversed; find first `role === 'assistant'`.
  2. Extract text via `getMessageText(message)` from `@/models/runtime` (joins all `text` parts).
  3. `await copyToClipboard(text, 'Copied last assistant message')`.

### `shortcutRegenerateLast({ messages, agentId })`
- **Where it lives:** `src/flows/ui/shortcut-regenerate-last.ts`
- **Called by:** Same as above (passes it as `onRegenerate`).
- **How it does it:**
  1. Find last assistant message (same way).
  2. `regenerate({ agentId, fromMessageId: lastAssistant.id })`.

---

## 12. Cross-cutting rules (worth knowing before you change anything)

- **Toast policy.** Three categories:
  1. **Always toast on success + failure** — `deleteAgent`, `deleteProvider`, `deleteModel`, `addModel`, `addCustomModel`, etc. Used by flows whose only feedback channel is the toast.
  2. **Toast only on failure** — `prepare*` flows, `createChannel`. The caller owns the success UX (navigation, dialog close).
  3. **No toast at all** — `saveProviderBlock`, `setModelEnabled`. Caller (a settings form) owns UX.
- **Failure shape.** CRUD flows return `{ ok, error? }`. `prepare*` flows return a discriminated union (`'create-failed' | 'start-failed' | 'timeout' | 'error'`) so the dialog can render the right next-step CTA. `'timeout'` carries a `detail: 'model' | 'runtime'` field — different CTA each.
- **The settings file `Superhive-pi-*.json`** has a `managedBy: "superhive-pi-truth@1#<N>"` counter that increments on every write. The runtime watcher uses it to ignore its own writes. The renderer's `writeSettings` IPC also bumps it. Never reset to `#0` outside of a fresh agent seed — it breaks the watcher's self-write guard.
- **`contextWindow` is intentionally omitted** when adding a model — `superhive-pi-telemetry` fills it in on the first `model_select` from Pi. This is the seam documented in AGENTS.md §4.
- **Extension symlinks** are created once at agent create time (`extensions/superhive-pi-truth` and `extensions/superhive-pi-telemetry` point to canonical clones in `~/.superhive/extensions/`). Always fresh, never copied. Cloning is handled by `ensureExtension()` in `electron/extension-source.ts`.
- **`agent.json` → `manifest.json` symlink** is also created at agent create time so `bash agent.sh --manifest <Superhive-pi-...json>` resolves correctly on first boot (without the symlink, Pi loads no extensions).

---

## 13. Open issues / drift to fix

1. **`useCenterBreadcrumb` calls `agents.get` directly.** Lives in `src/flows/` so technically allowed, but every other place uses a flow wrapper (e.g. `loadProject`). Inconsistency — should add a `loadAgent(id)` flow or just call `agents.get` consistently.

2. **`prepareProject` parentDir fallback** — `'~/.superhive/projects/<slug>'` is the literal string passed to `prepareProjectAgent`. The agents IPC expands `~` to `$HOME` (line 99 of `electron/ipc/agents.ts`), so this works — but the fallback path is duplicated between the renderer and the IPC layer. Worth folding the expansion into a single utility.

3. **Channels CRUD is half-built.** IPC handlers exist for `create`, `get`, `list`, `appendMessage`, `readMessages` in `electron/ipc/channels.ts`, plus the API wrapper in `src/api/channels.ts` — but **no flow wrappers** for any of them. Only `createChannel` is wrapped. `deleteProject.ts:56` has a dead TODO branch waiting for a `channels.delete` IPC (and it doesn't exist yet either). Channels cannot be deleted today — the JSON metadata file and the `.jsonl` log both linger after project deletion.

4. **`useCommandPalette` and `useOpenCreate*` module singletons.** Fine for one renderer; would clash with multi-window or SSR. Documented behavior, not a bug.

5. **`sendMessage` does not gate on model-selection.** By design — runtime surfaces the error. Worth confirming this is the intended UX for new contributors.

6. **`regenerate` flow does not toast on success.** The reasoning is "the new message is the feedback." Worth confirming, because `editMessage` and `deleteMessage` do toast on success.

7. **Telemetry-driven context-window fill is a cross-module contract.** The seam lives in:
   - `superhive-pi-truth` (writes the `Superhive-pi-*.json` schema)
   - `superhive-pi-telemetry` (writes `model` events with `contextWindow` resolved via `HARDCODED_CONTEXT_WINDOWS` fallback)
   - `superhive/electron/ipc/settings.ts` (writes `contextWindow` back on the model row when it sees the event)
   - AGENTS.md §4 lists this as drift-seam #1. Worth a manual check before any change touches context-window resolution.

8. **`HARDCODED_CONTEXT_WINDOWS` is duplicated** between `superhive-pi-telemetry` and `superhive-pi-truth` (AGENTS.md §4, seam 1). Two separate code paths read it. If you add or rename a provider, both must update.