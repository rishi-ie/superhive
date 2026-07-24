# Agent Settings Reference

> **Audience**: developers (internal reference).
> **Scope**: every setting exposed by the Pi agent runtime + each default extension.
> **Goal**: a developer who reads this file should be able to (a) find where a setting is stored, (b) trace how a UI patch flows to a runtime effect, and (c) add a new setting to the schema without breaking the cascade.

---

## 1. Conventions

### Path notation

- `<agentDir>/` — the agent's folder, e.g. `~/.superhive/projects/<project>/agent/<agent>/`
- `<projectDir>/` — the project's root directory (agent's parent)
- `<coordDir>/` — the coordinator agent's directory

### Tier notation

Every setting is classified by how it reaches the running session:

| Tier | Meaning | How it is applied |
|---|---|---|
| **1** | Live | A Pi runtime API call fires immediately on diff (`pi.setModel`, `pi.setThinkingLevel`, `pi.setActiveTools`, `pi.registerProvider`, `process.env` write, orchestrator's `before_agent_start` injection) |
| **2** | Needs `/reload` | Field is stored; truth ext surfaces `result.needsReload = true` + a `notify('warning')`; the running session is unchanged |
| **3** | Store-only | Field is cascaded to a per-extension file and consumed by that extension's lifecycle hooks (`session_start`, `before_agent_start`) |

For `manage.json` and `settings.json`, the tier model is the same; the difference is which file the setting lives in, which determines which IPC + applier path handles it:

| File | Owns | IPC channel | Applier |
|---|---|---|---|
| `settings.json` | runtime essentials (model, env, providers, runtime, systemPrompt, Tier-2 UI flags, advanced, bookkeeping) | `WRITE_SETTINGS` (`agents:writeSettings`) | truth ext's `applySettingsDiff` |
| `manage.json` | user-tweakable surface (identity, permissions, behavior, skills, extensions, planMode, project) | `WRITE_MANAGE` (`agents:writeManage`) | truth ext's `applyManageDiff` (Tier-1 permissions only) + cascade engine |

### Chain notation

Every entry below includes a "truth chain" — an arrow-notation trace of how a UI patch flows to its runtime effect:

```
UI patch → IPC channel → file path → truth watcher → consumer → runtime effect
```

The chain shows **only the main path**. For Tier-3 store-only fields, the cascade hops to a per-extension file before the consumer reads it. The chain notation is exhaustive — no branch is omitted.

### Schema home

The canonical schema lives in `superhive-pi-truth/settings-schema.ts`. Every setting below points to its schema definition with a `file:line` reference. **If you change a setting's shape, you must update the schema and every consumer that reads it.**

---

## 2. Truth File Map

Every agent directory carries up to 7 sibling JSON files. The 4 truth files are owned by `superhive-pi-truth`. The 3 per-extension files are owned by `superhive-pi-truth` (as cascade writer) but written in cooperation with their consuming extension.

| # | File | Path | Owner (writer) | What it stores | What reads it |
|---|---|---|---|---|---|
| 1 | `settings.json` | `<agentDir>/settings.json` | `superhive-pi-truth` (`applier.ts`) | runtime essentials: model, env, providers, runtime, systemPrompt, Tier-2 UI flags, advanced, catalog, sessionsIndex, lastEvent, checklist | truth ext's applier; Pi runtime; renderer |
| 2 | `manage.json` | `<agentDir>/manage.json` | `superhive-pi-truth` (`applier.ts`, `cascade.ts`) | user-tweakable surface: identity, permissions, behavior, skills, extensions, planMode, project (coord-only) | truth ext's applier; orch ext; plan ext; renderer |
| 3 | `overview.json` | `<agentDir>/overview.json` | `superhive-pi-truth` (`syncOverviewFromManage`) | right-sidebar Overview snapshot: name + description mirrored from `manage.identity`, plus coordinator-authored health/team/focus/activity | renderer Overview tab |
| 4 | `inbox.json` | `<agentDir>/inbox.json` | `superhive-pi-truth` (4 inbox LLM tools) | append-only feed: notifications, permission asks, agent questions | renderer Inbox tab |
| 5 | `superhive-pi-plan.json` | `<agentDir>/superhive-pi-plan.json` | `superhive-pi-truth` (`cascadeManageToExtensions`) | `planMode` block (mirrored from `manage.json.planMode`) | plan ext |
| 6 | `superhive-pi-orchestration.json` | `<agentDir>/superhive-pi-orchestration.json` | `superhive-pi-truth` (cascade for `project`) + `superhive-pi-orchestration` (writes `systemPrompt` + `roleFragmentAppended`) | `project` block (mirrored from `manage.json.project`) + orchestrator-built system prompt | orch ext |
| 7 | `superhive-pi-spawn.json` | `<agentDir>/superhive-pi-spawn.json` | `superhive-pi-truth` (`cascadeSpawnExtensionFromManage`) | spawn config: `enabled`, `allowedTemplates`, `requireApproval` (created on ext toggle) | spawn ext |

**Cascade direction is one-way**:

- `manage.json` → per-extension file (via `cascadeManageToExtensions`)
- `superhive-pi-orchestration.json` → `settings.json` (via `cascadeOrchFileIntoSettings`, only the `systemPrompt` field)

**There is no inverse cascade.** Writing `settings.json.X` does NOT propagate to `manage.json.X` or vice versa. If you find yourself wanting to write `manage.planMode` from `settings.planMode`, fix the writer to target `manage.json` directly.

**Telemetry is separate**: `<agentDir>/telemetry.jsonl` is append-only event stream (not a truth file).

---

## 3. Tier Model (deep dive)

### Main tiers

| Tier | Definition | Applied via | Result |
|---|---|---|---|
| **1** | Live apply | `pi.setModel`, `pi.setThinkingLevel`, `pi.setActiveTools`, `pi.registerProvider`, `process.env` write, orchestrator's `before_agent_start` | Setting change reflects in the running session within ~30ms |
| **2** | Needs `/reload` | truth ext's `applySettingsDiff` or `applyManageDiff` surfaces `result.needsReload = true` + a `notify('warning')` | User must `/reload` to apply; running session is unchanged |
| **3** | Store-only | No direct apply; cascade engine mirrors to a per-extension file; the consuming extension applies via its lifecycle hooks | Setting change is visible to the next plan/build/auto turn |

### Tier-3 sub-tiers

The per-extension files introduce 4 sub-tiers worth distinguishing:

| Sub-tier | Definition | Example |
|---|---|---|
| **3a — orchestrated-cascade** | Field is mirrored from `manage.json` → per-extension file by truth's `cascadeManageToExtensions` within ~30ms of a `manage.json` write | `manage.planMode → superhive-pi-plan.json.planMode` (via `cascadePlanModeIntoPlanFile`) |
| **3b — cascade-out** | Field is mirrored from per-extension file → `settings.json` by truth's `cascadeOrchFileIntoSettings` watcher | `superhive-pi-orchestration.json.systemPrompt → settings.json.systemPrompt` (so Pi runtime reads it) |
| **3c — toggle-cascade** | Field is created/disabled by truth's cascade when `manage.extensions[]` flips | `superhive-pi-spawn.json.{enabled, allowedTemplates, requireApproval}` (via `cascadeSpawnExtensionFromManage`) |
| **3d — write-from-ext** | Field is written by the extension itself, not by truth | `superhive-pi-orchestration.json.{systemPrompt, roleFragmentAppended}` (orch ext owns its own file), `superhive-pi-spawn.json` bookkeeping |

---

## 4. Default Extensions

Six extensions ship with a project-coordinator agent. Plus one user-toggleable.

| Extension | When loaded | Purpose | Files owned (writes) | Files read |
|---|---|---|---|---|
| `superhive-pi-truth` | always | Canonical owner of the 4 truth files. Reads + validates + watches + applies via 16 LLM-callable tools. Runs the cascade engine. | `settings.json`, `manage.json`, `overview.json`, `inbox.json`, `superhive-pi-plan.json`, `superhive-pi-orchestration.json`, `superhive-pi-spawn.json`. Migrates + deletes legacy `Superhive-pi-<basename>.json` on first launch. | All of the above + `<agentDir>/sessions/*.jsonl` + workspace `skills/extensions/prompts/` + `process.env` |
| `superhive-pi-telemetry` | always | Writes append-only `telemetry.jsonl` for the renderer's `TelemetryTailer` to consume | `<agentDir>/telemetry.jsonl` (rotates to `telemetry.jsonl.1` per session) | `process.env` (`PI_AGENT_DIR`, `AGENT_DIR`, `SUPERHIVE_TELEMETRY_DEBUG`), `process.cwd()` |
| `superhive-pi-context` | coord + members | Compaction engine. Maintains a context graph (`<agentDir>/context/`) and injects retrieved context into `before_agent_start`. Slash: `ctx-compact`, `ctx-list`, `ctx-show` | `<agentDir>/context/*.json`, `<agentDir>/context/meta.json` | `<agentDir>/context/meta.json`, legacy pointer at `<agentDir>/{Superhive-pi-agent,agent,manifest}.json` (backward-compat only) |
| `superhive-pi-orchestration` | coord + members | Project-context gateway. Reads `manage.project` to detect role, builds the CEO system prompt from `manage + plan + spawn` config, registers role-aware tools | `superhive-pi-orchestration.json` (systemPrompt, project, roleFragmentAppended), mailbox files (`<projectDir>/agent/chat.jsonl`, `<memberDir>/inbox.jsonl`), task files (`<coordDir>/tasks-plan.json`, `<coordDir>/tasks-complete.jsonl`), seeds `settings.json.systemPrompt` (backward-compat only) | `manage.json`, `superhive-pi-plan.json`, `superhive-pi-spawn.json`, `superhive-pi-orchestration.json`, mailbox files |
| `superhive-pi-plan` | coord-only | Implements Plan mode. Reads `planMode` from `superhive-pi-plan.json`. Enforces default mode on `session_start` + `before_agent_start`. Slash: `plan` (subcommands `show`, `finalize`, `implement`, `exit`, `off`, `tools`) | None (no truth file writes — per `superhive-pi-plan/AGENTS.md`, "I never write the truth file") | `superhive-pi-plan.json`, `manage.json` (fallback during migration + `project.id` for gate) |
| `superhive-pi-spawn` | gated (coord + ext toggle) | Lets the coordinator spawn a new regular agent from a marketplace template, auto-bound to the project. Three gates: project-agent, extension-loaded, spawn-file | `superhive-pi-spawn.json` (own bookkeeping via `writeSpawnFile`) | `superhive-pi-spawn.json`, `manage.json` (gate 1, gate 2), `~/.superhive/templates/<id>.json` |

### LLM-callable tools (16, owned by `superhive-pi-truth`)

| File | Tools |
|---|---|
| `settings.json` (8) | `get_current_settings`, `update_settings`, `list_sessions`, `get_session_detail`, `get_session_tree`, `get_session_stats`, `list_catalog`, `update_checklist` |
| `manage.json` (3) | `get_current_manage`, `update_manage`, `toggle_resource` |
| `overview.json` (2) | `get_current_overview`, `update_overview` |
| `inbox.json` (3) | `append_inbox`, `mark_inbox_read`, `clear_inbox` |

Source: `superhive-pi-truth/tools.ts:49-481`. The orch ext adds 9 more (7 coordinator + 2 member) — see `superhive-pi-orchestration/tools.ts`.

---

## 5. Settings Reference — `<agentDir>/settings.json`

The Pi runtime essentials. Every field below is stored in `<agentDir>/settings.json` and either applied live by `applySettingsDiff` (`superhive-pi-truth/applier.ts:65-163`) or marked as `result.reloadFields` for a user-driven `/reload`.

### Metadata (Tier 3, store-only)

#### `settings.version`

- **Tier**: 3 (store-only)
- **Default**: `1` (filled by `DEFAULT_SETTINGS`)
- **Truth chain**: `first-launch → DEFAULT_SETTINGS.version = 1 → settings.json.version`
- **Schema**: `superhive-pi-truth/settings-schema.ts:231`

#### `settings.managedBy`

- **Tier**: 3 (store-only)
- **Default**: `"superhive-pi-truth@1"` (no counter; first write bumps to `@1#1`)
- **Truth chain**: `WRITE_SETTINGS IPC → writeAtomic → settings.json.managedBy = "superhive-pi-truth@1#N+1"`
- **Schema**: `superhive-pi-truth/settings-schema.ts:232`

#### `settings.lastModified`

- **Tier**: 3 (store-only)
- **Default**: stamped on every write
- **Truth chain**: `WRITE_SETTINGS IPC → writeAtomic → settings.json.lastModified = <new Date().toISOString()>`
- **Schema**: `superhive-pi-truth/settings-schema.ts:233`

### LLM core (Tier 1 / 2)

#### `settings.model`

- **Tier**: 1 (live)
- **Default**: `{ provider: "", name: "" }`
- **Description**: Active model for this agent's session. Set via chat composer → `ModelPicker`.
- **Truth chain**:
  ```
  composer onSelect → setModel(provider, name)
    → useAgentSettings.patch('model', { provider, name })
    → 500ms debounced
    → WRITE_SETTINGS IPC (agents:writeSettings)
    → readFile + writeAtomic (shallow merge)
    → settings.json.model
    → truth ext watcher (~30ms)
    → applySettingsDiff → applyModel
    → pi.setModel(model)
  ```
- **Read by**: Pi runtime (next LLM turn), renderer (status bar)
- **Schema**: `superhive-pi-truth/settings-schema.ts:236`
- **Notes**: `patch('model')` lockstep keeps `defaultProvider` / `defaultModel` / `enabledModels` in sync so the next session restart picks the same model. Source: `use-agent-settings.ts:94-115`.

#### `settings.defaultProvider`

- **Tier**: 2 (lockstep with `model`; truth ext lists it in `reloadFields`)
- **Default**: `""`
- **Truth chain**: same as `settings.model` (lockstep write on `patch('model')`)
- **Schema**: `superhive-pi-truth/settings-schema.ts:237`

#### `settings.defaultModel`

- **Tier**: 2 (lockstep with `model`)
- **Default**: `""`
- **Truth chain**: same as `settings.model`
- **Schema**: `superhive-pi-truth/settings-schema.ts:238`

#### `settings.defaultThinkingLevel`

- **Tier**: 2 (needs `/reload`)
- **Default**: `"medium"`
- **Truth chain**:
  ```
  update_settings LLM tool → WRITE_SETTINGS IPC
    → settings.json.defaultThinkingLevel
    → truth ext watcher (~30ms)
    → applySettingsDiff flags defaultThinkingLevel in reloadFields
    → /reload needed → next session applies
  ```
- **Read by**: Pi runtime (on session_start)
- **Schema**: `superhive-pi-truth/settings-schema.ts:239`

#### `settings.enabledModels`

- **Tier**: 2 (needs `/reload`)
- **Default**: `[]`
- **Truth chain**: same as `settings.model` (lockstep write); LLM-tool path through `update_settings`
- **Read by**: Pi runtime (cycle-scoped model list)
- **Schema**: `superhive-pi-truth/settings-schema.ts:240`

#### `settings.systemPrompt`

- **Tier**: 1 (live — injected via orchestrator's `before_agent_start`)
- **Default**: `""`
- **Description**: The full system prompt the orchestrator builds from `manage.json` + `superhive-pi-plan.json` + `superhive-pi-spawn.json`.
- **Truth chain**:
  ```
  manage.json.{project, planMode, extensions[]} change
    → truth cascade (manage → per-ext file)
    → superhive-pi-orchestration.json.project + superhive-pi-plan.json.planMode + superhive-pi-spawn.json.*
    → orch ext watcher (~500ms)
    → assembleSystemPromptInputs
    → buildSystemPrompt(inputs)
    → superhive-pi-orchestration.json.systemPrompt = built
    → truth cascade OUT (orch → settings)
    → settings.json.systemPrompt
    → orch ext before_agent_start hook
    → event.systemPrompt = fresh
    → next LLM turn
  ```
- **Read by**: orch ext's `before_agent_start` (only consumer)
- **Schema**: `superhive-pi-truth/settings-schema.ts:241`

### Environment + providers (Tier 1)

#### `settings.environment`

- **Tier**: 1 (live)
- **Default**: `{}`
- **Description**: Per-agent env vars. Keys matching `_API_KEY` suffix auto-register a provider.
- **Truth chain**:
  ```
  update_settings LLM tool → WRITE_SETTINGS IPC
    → settings.json.environment
    → truth ext watcher (~30ms)
    → applySettingsDiff → applyEnvironment
    → process.env[k] = v (for every key in next.environment)
    → pi.registerProvider(provider, { apiKey: v }) (for keys matching /_API_KEY$/)
  ```
- **First-launch seed**: truth ext's `session_start` migrates `process.env` `_API_KEY` vars into `settings.environment` (one-shot)
- **Read by**: Pi runtime (`process.env`); Pi provider registry (`pi.registerProvider`)
- **Schema**: `superhive-pi-truth/settings-schema.ts:244`

#### `settings.providers`

- **Tier**: 1 (live)
- **Default**: `{}`
- **Description**: Provider registry. Each key is a provider name (`anthropic`, `openai`, custom). Value is `{ name?, baseUrl?, apiKey? }`.
- **Truth chain**:
  ```
  Settings tab → Models → SET_PROVIDER IPC
    → main process handler (electron/ipc/settings.ts)
    → reSeedProviders
    → settings.json.providers (counter-bump)
    → truth ext watcher (~30ms)
    → applySettingsDiff → applyProviders
    → pi.registerProvider(name, { name, baseUrl, apiKey })
  ```
- **First-launch seed**: main process's `reSeedProviders` runs on every agent start (counter-bump, not counter-reset)
- **Read by**: Pi runtime (provider registry)
- **Schema**: `superhive-pi-truth/settings-schema.ts:245`

### Live runtime state (Tier 1)

#### `settings.runtime.thinkingLevel`

- **Tier**: 1 (live)
- **Default**: `"medium"`
- **Truth chain**:
  ```
  update_settings LLM tool → WRITE_SETTINGS IPC
    → settings.json.runtime.thinkingLevel
    → truth ext watcher (~30ms)
    → applySettingsDiff → pi.setThinkingLevel(next.runtime.thinkingLevel)
  ```
- **Read by**: Pi runtime (next LLM call)
- **Schema**: `superhive-pi-truth/settings-schema.ts:248`

#### `settings.runtime.activeTools`

- **Tier**: 1 (live)
- **Default**: `[]` (all tools available)
- **Truth chain**:
  ```
  update_settings LLM tool → WRITE_SETTINGS IPC
    → settings.json.runtime.activeTools
    → truth ext watcher (~30ms)
    → applySettingsDiff → pi.setActiveTools(next.runtime.activeTools)
  ```
- **Read by**: Pi runtime (next LLM call)
- **Schema**: `superhive-pi-truth/settings-schema.ts:249`

#### `settings.runtime.currentSessionId` *(dead field)*

- **Tier**: — (never written by any producer)
- **Default**: `undefined`
- **Schema**: `superhive-pi-truth/settings-schema.ts:116, 248`
- **Drift**: see §12.

#### `settings.runtime.lastReloadedAt` *(dead field)*

- **Tier**: — (never written by any producer)
- **Default**: `undefined`
- **Schema**: `superhive-pi-truth/settings-schema.ts:117, 248`
- **Drift**: see §12.

### Tier-2 UI flags (all need `/reload`)

These are stored; truth ext lists them in `reloadFields`; user must `/reload`.

#### `settings.theme`

- **Tier**: 2
- **Default**: `""`
- **Schema**: `superhive-pi-truth/settings-schema.ts:251`

#### `settings.hideThinkingBlock`

- **Tier**: 2
- **Default**: `false`
- **Schema**: `superhive-pi-truth/settings-schema.ts:252`

#### `settings.quietStartup`

- **Tier**: 2
- **Default**: `false`
- **Schema**: `superhive-pi-truth/settings-schema.ts:253`

#### `settings.doubleEscapeAction`

- **Tier**: 2
- **Default**: `"tree"`
- **Type**: `"fork" | "tree" | "none"`
- **Schema**: `superhive-pi-truth/settings-schema.ts:254`

#### `settings.treeFilterMode`

- **Tier**: 2
- **Default**: `"default"`
- **Type**: `"default" | "no-tools" | "user-only" | "labeled-only" | "all"`
- **Schema**: `superhive-pi-truth/settings-schema.ts:255`

#### `settings.showHardwareCursor`

- **Tier**: 2
- **Default**: `true`
- **Schema**: `superhive-pi-truth/settings-schema.ts:256`

#### `settings.editorPaddingX`

- **Tier**: 2
- **Default**: `0`
- **Schema**: `superhive-pi-truth/settings-schema.ts:257`

#### `settings.outputPad`

- **Tier**: 2
- **Default**: `1`
- **Type**: `0 | 1`
- **Schema**: `superhive-pi-truth/settings-schema.ts:258`

#### `settings.autocompleteMaxVisible`

- **Tier**: 2
- **Default**: `5`
- **Schema**: `superhive-pi-truth/settings-schema.ts:259`

#### `settings.markdown`

- **Tier**: 2
- **Default**: `{ codeBlockIndent: "  " }`
- **Schema**: `superhive-pi-truth/settings-schema.ts:260`

#### `settings.warnings`

- **Tier**: 2
- **Default**: `{ anthropicExtraUsage: true }`
- **Schema**: `superhive-pi-truth/settings-schema.ts:261`

### Advanced (all Tier 2)

#### `settings.defaultProjectTrust`

- **Tier**: 2
- **Default**: `"ask"`
- **Type**: `"ask" | "always" | "never"`
- **Schema**: `superhive-pi-truth/settings-schema.ts:264`

#### `settings.collapseChangelog`

- **Tier**: 2
- **Default**: `false`
- **Schema**: `superhive-pi-truth/settings-schema.ts:265`

#### `settings.enableInstallTelemetry`

- **Tier**: 2
- **Default**: `true`
- **Schema**: `superhive-pi-truth/settings-schema.ts:266`

#### `settings.enableAnalytics`

- **Tier**: 2
- **Default**: `false`
- **Schema**: `superhive-pi-truth/settings-schema.ts:267`

#### `settings.trackingId`

- **Tier**: 2
- **Default**: `null`
- **Schema**: `superhive-pi-truth/settings-schema.ts:268`

#### `settings.enableSkillCommands`

- **Tier**: 2
- **Default**: `true`
- **Schema**: `superhive-pi-truth/settings-schema.ts:269`

#### `settings.shellPath`

- **Tier**: 2
- **Default**: `null`
- **Schema**: `superhive-pi-truth/settings-schema.ts:270`

#### `settings.shellCommandPrefix`

- **Tier**: 2
- **Default**: `null`
- **Schema**: `superhive-pi-truth/settings-schema.ts:271`

#### `settings.npmCommand`

- **Tier**: 2
- **Default**: `undefined` (unset)
- **Schema**: `superhive-pi-truth/settings-schema.ts:272`

#### `settings.externalEditor`

- **Tier**: 2
- **Default**: `null`
- **Schema**: `superhive-pi-truth/settings-schema.ts:273`

#### `settings.transport`

- **Tier**: 2
- **Default**: `"auto"`
- **Type**: `"auto" | "stdio" | "sse" | "websocket"`
- **Schema**: `superhive-pi-truth/settings-schema.ts:274`

#### `settings.sessionDir`

- **Tier**: 2
- **Default**: `null`
- **Schema**: `superhive-pi-truth/settings-schema.ts:275`

#### `settings.httpProxy`

- **Tier**: 2
- **Default**: `null`
- **Schema**: `superhive-pi-truth/settings-schema.ts:276`

#### `settings.httpIdleTimeoutMs`

- **Tier**: 2
- **Default**: `60000`
- **Schema**: `superhive-pi-truth/settings-schema.ts:277`

#### `settings.websocketConnectTimeoutMs`

- **Tier**: 2
- **Default**: `10000`
- **Schema**: `superhive-pi-truth/settings-schema.ts:278`

#### `settings.terminal`

- **Tier**: 2
- **Default**: `{ showImages: true, imageWidthCells: 60, clearOnShrink: false, showTerminalProgress: false }`
- **Schema**: `superhive-pi-truth/settings-schema.ts:279`

#### `settings.images`

- **Tier**: 2
- **Default**: `{ autoResize: true, blockImages: false }`
- **Schema**: `superhive-pi-truth/settings-schema.ts:280`

#### `settings.thinkingBudgets`

- **Tier**: 2
- **Default**: `{ minimal: 0, low: 1024, medium: 4096, high: 16384 }`
- **Schema**: `superhive-pi-truth/settings-schema.ts:281`

### Truth-internal bookkeeping (Tier 3, store-only)

These are written by truth ext's internal services. Renderers read them; Pi runtime ignores them.

#### `settings.catalog`

- **Tier**: 3 (store-only; rebuilt on `session_start` + `/superhive-rescan`)
- **Default**: `{ lastScanned: "", scanRoots: [], skills: [], extensions: [], prompts: [] }`
- **Description**: Inventory of available skills/extensions/prompts scanned from the workspace. Each entry has `{ path, size?, active }` where `active` is computed from `manage.skills/extensions/prompts`.
- **Truth chain**:
  ```
  truth ext session_start (or /superhive-rescan slash)
    → catalog-scanner scans workspace ./skills, ./extensions, ./prompts
    → catalog-skills/extensions/prompts[] with active flag from manage.{skills,extensions,prompts}
    → settings.json.catalog
    → renderer reads (Manage tab SkillsSection/ExtensionsSection)
  ```
- **Source**: `superhive-pi-truth/catalog-scanner.ts:35-150`
- **Schema**: `superhive-pi-truth/settings-schema.ts:284`

#### `settings.sessionsIndex`

- **Tier**: 3 (store-only; rebuilt on `session_start` + `entry_appended` event, 1Hz throttled)
- **Default**: `{ lastUpdated: "", sessions: [] }`
- **Description**: Index of all session files in `<agentDir>/sessions/`. Each entry has id, name, created/modified timestamps, message count, tokens, cost, path.
- **Truth chain**:
  ```
  truth ext session_start + entry_appended (1Hz throttle)
    → sessions-indexer reads <agentDir>/sessions/*.jsonl
    → settings.json.sessionsIndex
    → renderer reads (sessions list)
  ```
- **Source**: `superhive-pi-truth/sessions-indexer.ts`
- **Schema**: `superhive-pi-truth/settings-schema.ts:285`

#### `settings.checklist`

- **Tier**: 3 (store-only; ALSO emits `checklist` telemetry event)
- **Default**: `undefined`
- **Description**: Current task checklist. Updated by the `update_checklist` LLM tool.
- **Truth chain**:
  ```
  update_checklist LLM tool → settings.json.checklist + telemetry.jsonl (checklist event)
    → renderer Overview tab "Active checklist" (fed by telemetry tailer)
  ```
- **Source**: `superhive-pi-truth/checklist.ts`
- **Schema**: `superhive-pi-truth/settings-schema.ts:286`

#### `settings.lastEvent`

- **Tier**: 3 (store-only)
- **Default**: `undefined`
- **Description**: Last event observed by the sessions-indexer. Used for change detection.
- **Truth chain**: `entry_appended → truth ext sessions-indexer → settings.json.lastEvent`
- **Schema**: `superhive-pi-truth/settings-schema.ts:287`

---

## 6. Settings Reference — `<agentDir>/manage.json`

The user-tweakable surface. Every field below is stored in `<agentDir>/manage.json` and either applied live by `applyManageDiff` (`superhive-pi-truth/applier.ts:169-213`) or cascaded to a per-extension file.

### Metadata (Tier 3, store-only)

#### `manage.version`

- **Tier**: 3
- **Default**: `1` (filled by `DEFAULT_MANAGE`)
- **Schema**: `superhive-pi-truth/settings-schema.ts:311`

#### `manage.managedBy`

- **Tier**: 3
- **Default**: `"superhive-pi-truth@1"` (first write bumps to `@1#1`)
- **Schema**: `superhive-pi-truth/settings-schema.ts:312`

#### `manage.lastModified`

- **Tier**: 3
- **Default**: stamped on every write
- **Schema**: `superhive-pi-truth/settings-schema.ts:313`

### Identity (Tier 3, mirror to overview)

#### `manage.identity.name`

- **Tier**: 3 (store-only; cascaded to `overview.json.name`)
- **Default**: `""`
- **Truth chain**:
  ```
  Manage tab → IdentitySection (DebouncedField, 250ms)
    → useAgentManage.patch('identity.name', v)
    → WRITE_MANAGE IPC (immediate, deep-merge)
    → manage.json.identity.name
    → truth ext watcher (~30ms)
    → syncOverviewFromManage
    → overview.json.name
    → renderer Overview tab
    → orch ext's system prompt (## Your Team header)
  ```
- **Schema**: `superhive-pi-truth/settings-schema.ts:295`

#### `manage.identity.description`

- **Tier**: 3 (store-only; cascaded to `overview.json.description`)
- **Default**: `""`
- **Truth chain**: same as `manage.identity.name`; also mirrored into the orchestrator's `## Mission` section
- **Schema**: `superhive-pi-truth/settings-schema.ts:296`

#### `manage.identity.workspace`

- **Tier**: 3 (cosmetic)
- **Default**: `"./workspace"`
- **Description**: Cosmetic folder path. UI hides this field; truth ext's `DEFAULT_MANAGE` fills it. Spawn ext reads it loosely for context.
- **Schema**: `superhive-pi-truth/settings-schema.ts:297`

### Permissions (Tier 1, live — partial)

#### `manage.permissions.filesystem`

- **Tier**: 1 (live — Tier-1 activeTools exclusion)
- **Default**: `true`
- **Truth chain**:
  ```
  Manage tab → PermissionsSection → Switch
    → useAgentManage.patch('permissions', { ...perms, filesystem: v })
    → WRITE_MANAGE IPC (immediate, deep-merge)
    → manage.json.permissions.filesystem
    → truth ext watcher (~30ms)
    → applyManageDiff → computeExcludeToolsFromPermissions
    → ['read', 'write', 'edit', 'ls', 'find', 'grep'] excluded if filesystem === false
    → pi.setActiveTools(filtered)
  ```
- **Schema**: `superhive-pi-truth/settings-schema.ts:46`

#### `manage.permissions.terminal`

- **Tier**: 1 (live)
- **Default**: `true`
- **Truth chain**: same as `permissions.filesystem`; excludes `bash` when `terminal === false`
- **Schema**: `superhive-pi-truth/settings-schema.ts:47`

#### `manage.permissions.network` *(dead field)*

- **Tier**: — (no tools are network-only; no effect)
- **Default**: `true`
- **Schema**: `superhive-pi-truth/settings-schema.ts:48`
- **Drift**: see §12.

### Behavior (Tier 2)

#### `manage.behavior.steeringMode`

- **Tier**: 2 (needs `/reload`)
- **Default**: `"all"`
- **Type**: `"all" | "one-at-a-time"`
- **Truth chain**:
  ```
  Manage tab → BehaviorSection → Segment
    → useAgentManage.patch('behavior.steeringMode', v)
    → WRITE_MANAGE IPC
    → manage.json.behavior.steeringMode
    → truth ext watcher (~30ms)
    → applyManageDiff flags behavior block → /reload
  ```
- **Schema**: `superhive-pi-truth/settings-schema.ts:301`

#### `manage.behavior.followUpMode`

- **Tier**: 2
- **Default**: `"all"`
- **Type**: `"all" | "one-at-a-time"`
- **Schema**: `superhive-pi-truth/settings-schema.ts:302`

#### `manage.behavior.autoCompaction`

- **Tier**: 2
- **Default**: `true`
- **Truth chain**: same as `steeringMode`; orch ext's `buildBehaviorSection` renders `## Behavior` section only when `false` (or `autoRetry` is `false`)
- **Schema**: `superhive-pi-truth/settings-schema.ts:303`

#### `manage.behavior.autoRetry`

- **Tier**: 2
- **Default**: `true`
- **Truth chain**: same as `autoCompaction`
- **Schema**: `superhive-pi-truth/settings-schema.ts:304`

#### `manage.behavior.compaction`

- **Tier**: 2 (no UI; defaults only)
- **Default**: `{ enabled: true, reserveTokens: 16384, keepRecentTokens: 20000 }`
- **Truth chain**: same as `steeringMode` (whole `behavior` block reload-flagged)
- **Schema**: `superhive-pi-truth/settings-schema.ts:305` (`CompactionSettings` at line 127)

#### `manage.behavior.branchSummary`

- **Tier**: 2 (no UI; defaults only)
- **Default**: `{ reserveTokens: 16384, skipPrompt: false }`
- **Truth chain**: same as `compaction`
- **Schema**: `superhive-pi-truth/settings-schema.ts:306` (`BranchSummarySettings` at line 133)

#### `manage.behavior.retry`

- **Tier**: 2 (no UI; defaults only)
- **Default**: `{ enabled: true, maxRetries: 3, baseDelayMs: 2000 }`
- **Truth chain**: same as `compaction`
- **Schema**: `superhive-pi-truth/settings-schema.ts:307` (`RetrySettings` at line 144)

### Active sets (Tier 2 — toggle lists)

#### `manage.skills`

- **Tier**: 2
- **Default**: `[]`
- **Type**: `string[]` (paths like `"./skills/research.md"` or skill names)
- **Truth chain**:
  ```
  Manage tab → SkillsSection → toggle
    → useAgentManage.patch('skills', [...next])
    → WRITE_MANAGE IPC
    → manage.json.skills
    → truth ext watcher (~30ms)
    → applyManageDiff flags skills → /reload
    → catalog-scanner rebuilds catalog.skills[].active flag
    → orch ext rebuilds system prompt (## Skills section)
  ```
- **Schema**: `superhive-pi-truth/settings-schema.ts:319`

#### `manage.extensions`

- **Tier**: 2
- **Default**: `[]`
- **Truth chain**: same as `skills`; also drives `cascadeSpawnExtensionFromManage` (when `./extensions/superhive-pi-spawn` is added/removed)
- **Schema**: `superhive-pi-truth/settings-schema.ts:320`

#### `manage.prompts`

- **Tier**: 2 (no UI; defaults only)
- **Default**: `[]`
- **Truth chain**: same as `skills`
- **Schema**: `superhive-pi-truth/settings-schema.ts:321`

#### `manage.packages`

- **Tier**: 2 (no UI; defaults only)
- **Default**: `[]`
- **Type**: `string[] | PackageSourceObject[]` (`{ source, extensions?, skills?, prompts?, themes? }`)
- **Truth chain**: same as `skills`
- **Schema**: `superhive-pi-truth/settings-schema.ts:322` (`PackageSource` at line 64)

#### `manage.themes`

- **Tier**: 2 (no UI; defaults only)
- **Default**: `[]`
- **Truth chain**: same as `skills`
- **Schema**: `superhive-pi-truth/settings-schema.ts:323`

### Plan mode (Tier 3 — cascaded to `superhive-pi-plan.json`)

#### `manage.planMode.defaultMode`

- **Tier**: 3 (Tier-3a orchestrated-cascade)
- **Default**: `"auto"`
- **Type**: `"plan" | "build" | "auto"`
- **Truth chain**:
  ```
  Manage tab → PlanModeSection (coordinator-only)
    OR chat composer → ModePicker (post-fix)
    → patch('planMode', { ...block, defaultMode: v })
    → WRITE_MANAGE IPC (immediate)
    → manage.json.planMode.defaultMode
    → truth ext watcher (~30ms)
    → cascadePlanModeIntoPlanFile
    → superhive-pi-plan.json.planMode.defaultMode
    → plan ext session_start / before_agent_start
    → enforce mode (plan ext's `state.defaultMode`)
  ```
- **Schema**: `superhive-pi-truth/settings-schema.ts:194` (`PlanModeSettings`)

#### `manage.planMode.thinkingLevel`

- **Tier**: 3 (Tier-3a)
- **Default**: `"inherit"`
- **Type**: `"inherit" | "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max"`
- **Truth chain**: same as `defaultMode`; plan ext's `configuredThinkingLevel(settings)` calls `pi.setThinkingLevel(fixed)` on every `before_agent_start`
- **Schema**: `superhive-pi-truth/settings-schema.ts:195`

#### `manage.planMode.defaultPlanTools`

- **Tier**: 3 (Tier-3a)
- **Default**: `undefined` (unset)
- **Type**: `string[]`
- **Truth chain**: same as `defaultMode`; plan ext reads for tool policy
- **Schema**: `superhive-pi-truth/settings-schema.ts:196`

#### `manage.planMode.safeSubcommands.git`

- **Tier**: 3 (Tier-3a)
- **Default**: `undefined`
- **Type**: `string[]`
- **Truth chain**: same as `defaultMode`; plan ext's `isSafeCommand` allowlist for `bash`
- **Schema**: `superhive-pi-truth/settings-schema.ts:198`

#### `manage.planMode.safeSubcommands.gh`

- **Tier**: 3 (Tier-3a)
- **Default**: `undefined`
- **Type**: `string[]`
- **Truth chain**: same as `safeSubcommands.git`
- **Schema**: `superhive-pi-truth/settings-schema.ts:199`

### Project block (Tier 3 — coordinator-only, cascaded to `superhive-pi-orchestration.json`)

#### `manage.project.id`

- **Tier**: 3 (Tier-3a)
- **Default**: `undefined`
- **Description**: The project's unique id. **The single gate field**: plan ext and spawn ext both gate on `typeof project.id === 'string' && project.id.length > 0`.
- **Truth chain**: set once in `agents:create` IPC handler (for coord agents with a projectId); never user-edited
- **Schema**: `superhive-pi-truth/settings-schema.ts:218`

#### `manage.project.members`

- **Tier**: 3 (Tier-3a)
- **Default**: `[]`
- **Type**: `MemberRef[]`
- **Truth chain**: orchestrator ext's `addMember` / `patchMemberStatus` / `removeMember` (ext-internal tools); cascades to `superhive-pi-orchestration.json.project.members`
- **Schema**: `superhive-pi-truth/settings-schema.ts:221` (`MemberRef` at line 207)

#### `manage.project.localPath`

- **Tier**: 3 (Tier-3a)
- **Default**: `undefined` (no producer currently fills it; plan ext's "Gap 2" gate)
- **Schema**: `superhive-pi-truth/settings-schema.ts:222`

#### `manage.project.coordinatorAgentId`

- **Tier**: 3 (Tier-3a)
- **Default**: `undefined` (no producer currently fills it)
- **Schema**: `superhive-pi-truth/settings-schema.ts:223`

---

## 7. Settings Reference — `<agentDir>/superhive-pi-plan.json`

The plan ext's per-extension file. Mirrors `manage.json.planMode` (Tier-3a orchestrated-cascade).

### Metadata (Tier 3, store-only)

#### `plan.version`

- **Tier**: 3
- **Default**: `1`
- **Schema**: `superhive-pi-truth/settings-schema.ts:792`

#### `plan.managedBy`

- **Tier**: 3
- **Default**: `"superhive-pi-truth@1"` (first write bumps to `@1#1`)
- **Schema**: `superhive-pi-truth/settings-schema.ts:793`

#### `plan.lastModified`

- **Tier**: 3
- **Default**: stamped on every write
- **Schema**: `superhive-pi-truth/settings-schema.ts:794`

### Plan mode (Tier 3 — consumed by plan ext)

#### `plan.planMode.defaultMode`

- **Tier**: 3
- **Default**: `"auto"`
- **Truth chain**:
  ```
  manage.json.planMode.defaultMode change
    → truth cascade (manage → plan file)
    → superhive-pi-plan.json.planMode.defaultMode
    → plan ext session_start / before_agent_start
    → state.defaultMode → enforce plan/build/auto
  ```
- **Schema**: `superhive-pi-truth/settings-schema.ts:795`

#### `plan.planMode.thinkingLevel`

- **Tier**: 3
- **Default**: `"inherit"`
- **Truth chain**: same as `defaultMode`; plan ext calls `pi.setThinkingLevel(fixed)` on every `before_agent_start`
- **Schema**: `superhive-pi-truth/settings-schema.ts:795`

#### `plan.planMode.defaultPlanTools`

- **Tier**: 3
- **Default**: `undefined`
- **Type**: `string[]`
- **Truth chain**: same as `defaultMode`
- **Schema**: `superhive-pi-truth/settings-schema.ts:795`

#### `plan.planMode.safeSubcommands`

- **Tier**: 3
- **Default**: `undefined`
- **Type**: `{ git?: string[]; gh?: string[] }`
- **Truth chain**: same as `defaultMode`; plan ext's `isSafeCommand` allowlist
- **Schema**: `superhive-pi-truth/settings-schema.ts:795`

---

## 8. Settings Reference — `<agentDir>/superhive-pi-orchestration.json`

The orch ext's per-extension file. Holds `project` (mirror from `manage`) and `systemPrompt` (built by orch ext, mirrored OUT to `settings.json`).

### Metadata (Tier 3, store-only)

#### `orch.version`

- **Tier**: 3
- **Default**: `1`
- **Schema**: `superhive-pi-truth/settings-schema.ts:807`

#### `orch.managedBy`

- **Tier**: 3
- **Default**: `"superhive-pi-truth@1"`
- **Schema**: `superhive-pi-truth/settings-schema.ts:808`

#### `orch.lastModified`

- **Tier**: 3
- **Schema**: `superhive-pi-truth/settings-schema.ts:809`

### Project block (Tier 3 — mirror from `manage.project`)

#### `orch.project`

- **Tier**: 3 (Tier-3a)
- **Default**: `undefined`
- **Type**: `ProjectBlock`
- **Truth chain**:
  ```
  manage.json.project change
    → truth cascade (manage → orch file)
    → superhive-pi-orchestration.json.project = manage.project (verbatim)
    → orch ext session_start (role detection: coord === self ? "coordinator" : "member")
    → orch ext rebuildSystemPrompt reads project.members for ## Your Team section
  ```
- **Schema**: `superhive-pi-truth/settings-schema.ts:810`

### System prompt (Tier 1 — live via `before_agent_start`)

#### `orch.systemPrompt`

- **Tier**: 1 (live — injected via `before_agent_start`)
- **Default**: `""`
- **Truth chain**:
  ```
  manage.json.{project, planMode, extensions[]} change
    → truth cascade (manage → per-ext files)
    → orch ext watcher (~500ms)
    → assembleSystemPromptInputs (reads manage + plan + spawn + orch file)
    → buildSystemPrompt(inputs)
    → superhive-pi-orchestration.json.systemPrompt = built
    → truth cascade OUT (orch → settings)
    → settings.json.systemPrompt
    → orch ext before_agent_start returns { systemPrompt: fresh }
    → next LLM turn
  ```
- **Schema**: `superhive-pi-truth/settings-schema.ts:811`

### Idempotency marker (Tier 3)

#### `orch.roleFragmentAppended`

- **Tier**: 3 (Tier-3d write-from-ext)
- **Default**: `null`
- **Type**: `string | null` (one of `"coordinator"`, `"member"`, `"category:<id>"`)
- **Description**: Marker indicating which role/category fragment was last appended to the systemPrompt. Used by the orchestrator to keep the append idempotent across `session_start`s.
- **Truth chain**: `orch ext session_start → orch file.roleFragmentAppended = role` (no Pi runtime consumption; orch ext uses it for its own write-skip check)
- **Schema**: `superhive-pi-truth/settings-schema.ts:825`

---

## 9. Settings Reference — `<agentDir>/superhive-pi-spawn.json`

The spawn ext's per-extension file. Created on `manage.extensions[]` toggle (Tier-3c toggle-cascade).

### Metadata (Tier 3, store-only)

#### `spawn.version`

- **Tier**: 3
- **Default**: `1`
- **Schema**: `superhive-pi-truth/settings-schema.ts:845`

#### `spawn.managedBy`

- **Tier**: 3
- **Default**: `"superhive-pi-truth@1"`
- **Schema**: `superhive-pi-truth/settings-schema.ts:846`

#### `spawn.lastModified`

- **Tier**: 3
- **Schema**: `superhive-pi-truth/settings-schema.ts:847`

### Spawn config (Tier 3 — consumed by spawn ext)

#### `spawn.enabled`

- **Tier**: 3 (Tier-3c toggle-cascade)
- **Default**: `true` (when cascading on)
- **Truth chain**:
  ```
  Manage tab → ExtensionsSection → toggle superhive-pi-spawn ON
    → useAgentManage.patch('extensions', [...new])
    → WRITE_MANAGE IPC
    → manage.json.extensions[]
    → truth ext watcher (~30ms)
    → cascadeSpawnExtensionFromManage
    → create <agentDir>/superhive-pi-spawn.json with DEFAULT_SPAWN_EXTENSION
    → OR flip enabled: true on existing file (preserving allowedTemplates/requireApproval)
    → spawn ext gate 3 reads spawn.json.enabled
  ```
- **Toggle OFF behavior**: `enabled: false` (preserves user's `allowedTemplates` + `requireApproval`)
- **Schema**: `superhive-pi-truth/settings-schema.ts:848`

#### `spawn.allowedTemplates`

- **Tier**: 3
- **Default**: `null` (allow-all)
- **Type**: `string[] | null`
- **Truth chain**: `WRITE_MANAGE on manage.json...` — actually `allowedTemplates` is set by the renderer on `manage.json` writes, mirrored to `spawn.json`. Empty array is normalized to `null` by `validateAndNormalizeSpawnExtension` so it doesn't block all spawns.
- **Schema**: `superhive-pi-truth/settings-schema.ts:849`

#### `spawn.requireApproval`

- **Tier**: 3
- **Default**: `false`
- **Truth chain**: same as `allowedTemplates`; orchestrator's `rebuildSystemPrompt` reads it to render the `## Tools — Spawn` section's "must approve" / "proceed without a permission ask" text
- **Schema**: `superhive-pi-truth/settings-schema.ts:850`

---

## 10. Per-Extension Catalog

What each extension exposes as user-tweakable settings, organized by extension. (For per-field details, see §§5-9.)

### `superhive-pi-truth` (always loaded)

Exposes the entire `manage.json` schema (13 user-tweakable fields + advanced behavior sub-blocks + cascade-trigger sets) via:

- Renderer UI: 6 sections in the right-sidebar Manage tab (Identity, Behavior, Permissions, Skills, Extensions, Plan Mode)
- 4 LLM-callable tools: `get_current_manage`, `update_manage`, `toggle_resource` (plus the 3 inbox tools)

Also exposes 8 `settings.json` tools (including `update_settings` which can write any settings.json field, though only `model` has a renderer control beyond the chat composer).

### `superhive-pi-telemetry` (always loaded)

No settings exposed. Write-only telemetry. See `superhive-pi-telemetry/index.ts` for event types.

### `superhive-pi-context` (coord + members)

No truth-file-backed settings. The config shape (`ContextCompactionSettings = { pointerTokens?, retrievalBudgetTokens?, retrievalMaxNodes?, retrievalMaxDepth? }`) is read from a legacy pointer location for backward compat only — no path to user-tweakable UI.

### `superhive-pi-orchestration` (coord + members)

No directly-exposed settings. Consumes `manage.json` and per-extension files. Outputs `superhive-pi-orchestration.json.{systemPrompt, roleFragmentAppended}`. The 9 role-aware LLM tools (7 coordinator + 2 member) are in `superhive-pi-orchestration/tools.ts`.

### `superhive-pi-plan` (coord-only)

Exposes `manage.json.planMode.{defaultMode, thinkingLevel, defaultPlanTools, safeSubcommands.git, safeSubcommands.gh}`. See §6 (planMode block) + §7 (superhive-pi-plan.json). 2 LLM tools: `plan_mode_question`, `plan_mode_complete`. 1 slash command: `plan` (with subcommands).

### `superhive-pi-spawn` (gated)

Exposes `superhive-pi-spawn.json.{enabled, allowedTemplates, requireApproval}`. The user toggles the extension on/off via `manage.extensions[]`. See §6 (extensions array) + §9 (superhive-pi-spawn.json). 1 LLM tool: `spawn_agent`.

---

## 11. Chat Composer Dropdowns

### ModelPicker (model selector)

- **UI location**: `superhive/src/components/layout/composer/ModelPicker/ModelPicker.tsx:131-170`. Rendered in both `AgentChatView.tsx:204` and `ProjectChatView.tsx:307`.
- **Trigger**: `DropdownMenuTrigger` with current model name + caret icon.
- **What it writes**: `settings.json.model` + lockstep `defaultProvider`, `defaultModel`, appends to `enabledModels`.
- **IPC channel**: `WRITE_SETTINGS` (`agents:writeSettings`) via `useAgentSettings.patch('model', ...)` → `agents.writeSettings`.
- **Truth chain**:
  ```
  composer onSelect(provider, name)
    → useAgentSettings.setModel(provider, name)
    → patch('model', { provider, name }) (lockstep writes defaultProvider/defaultModel/enabledModels)
    → 500ms debounced
    → WRITE_SETTINGS IPC (agents:writeSettings)
    → shallow merge { ...current, ...patch, managedBy, lastModified }
    → settings.json.model
    → truth ext watcher (~30ms)
    → applySettingsDiff → applyModel → pi.setModel(model)
  ```
- **Live status**: New `activeModelProvider`/`activeModelName` comes back via telemetry `model_select` event → renderer re-syncs.

### ModePicker (plan mode) — post-fix

- **UI location**: `superhive/src/components/layout/composer/ModePicker/ModePicker.tsx:65-88`. Rendered only in `ProjectChatView.tsx:306` (project chat only).
- **Trigger**: `DropdownMenuRadioGroup` with three options: `plan` (Plant01Icon), `execute` (RepairIcon), `auto` (LanternIcon).
- **What it writes**: `manage.json.planMode.defaultMode` (post-fix; was `settings.json.planMode` pre-fix, see §12).
- **IPC channel**: `WRITE_MANAGE` (`agents:writeManage`) via `useAgentManage.patch('planMode', ...)` (post-fix).
- **Mapping**: `MODE_TO_TRUTH`: `plan → plan`, `execute → build`, `auto → auto`.
- **Truth chain**:
  ```
  composer onChange(next)
    → useAgentManage.patch('planMode', { ...current, defaultMode: truthValue })
    → WRITE_MANAGE IPC (immediate, no debounce)
    → deepMerge(manage.json, { planMode: { ...current, defaultMode } })
    → manage.json.planMode.defaultMode
    → truth ext watcher (~30ms)
    → cascadePlanModeIntoPlanFile
    → superhive-pi-plan.json.planMode.defaultMode
    → plan ext before_agent_start enforces mode
  ```

### ContextUsageRing (read-only)

- **UI location**: `superhive/src/components/layout/composer/ContextUsageRing.tsx`. Rendered in `AgentChatView.tsx:193-197` and `ProjectChatView.tsx:295-299`.
- **What it writes**: nothing — read-only.
- **Truth chain**: `telemetry context event → useAgentRuntime().contextUsage → render ring`

---

## 12. Open Issues / Drift

These are findings from the audit that produced this doc. **Fix in a follow-up commit** unless explicitly noted.

### ModePicker drift (RESOLVED in this PR)

**Before this commit**: `ModePicker.tsx` called `useAgentSettings.patch('planMode', ...)`, writing to `<agentDir>/settings.json.planMode`. But `planMode` lives canonically in `<agentDir>/manage.json.planMode` (per `settings-schema.ts:179-201`). The truth cascade only mirrors `manage.json.planMode → superhive-pi-plan.json.planMode`; there is NO inverse cascade from `settings.json.planMode → manage.json.planMode`. The composer's patch was either silently dropped by `validateAndNormalizeSettings` (it doesn't strip the field, so it would persist in `settings.json` but never reach the plan ext) or persisted but inert.

**After this commit**: `ModePicker.tsx` calls `useAgentManage.patch('planMode', ...)`, writing to `manage.json.planMode`. The cascade then mirrors it correctly.

**Files changed**: `superhive/src/components/layout/composer/ModePicker/ModePicker.tsx`.

### WRITE_SETTINGS shallow merge vs WRITE_MANAGE deep merge

`WRITE_MANAGE` (`electron/ipc/agents.ts:553`) uses `deepMerge` (recursive), so partial blocks preserve siblings.

`WRITE_SETTINGS` (`electron/ipc/agents.ts:485-493`) uses `{ ...current, ...patch, managedBy, lastModified }` (shallow). Partial patches of nested blocks (e.g. `markdown.codeBlockIndent`) will clobber siblings unless the patch is shaped correctly.

**Risk**: a renderer bug that writes `{ markdown: { codeBlockIndent: "    "} }` would wipe `markdown.codeBlockIndent`'s other sibling fields. Today no renderer code paths are known to write partial nested blocks; only flat top-level patches are made.

**Fix**: replace `WRITE_SETTINGS` shallow merge with `deepMerge` (mirror `WRITE_MANAGE`). Safe — same semantics, just safer for nested blocks.

### `runtime.currentSessionId` and `runtime.lastReloadedAt` (dead fields)

Both fields exist in the schema (`settings-schema.ts:116-117, 248`) but no producer writes them. They look like externally-managed bookkeeping (maybe by Pi runtime itself, but I couldn't find any read site).

**Fix**: either add a producer (truth ext on `session_start`?) or remove from the schema. Cosmetic; no behavior impact today.

### Loose fields on `manage.json` (not in `ManageFileShape`)

- `manage.agentKind` — written to `AgentRepository` (not manage.json) by `agents:create`. Spawn ext reads it loosely from `manage.json` when present. **Drift** — should be removed from spawn ext's loose read.
- `manage.projectIds` — written by `agents:spawn-from-template` IPC handler. Spawn ext reads it loosely. **Drift** — should be removed; project membership is implicit in `project.members` (orchestrator-managed).

These are part of the "Manage tab settings simplification" plan (Phase 2+3 already removed `identity.category` and the category overlay).

### Permissions.network does nothing

`manage.permissions.network` toggles a switch in the UI (PermissionsSection), but no Pi tool is network-only, so the field has no effect. The `computeExcludeToolsFromPermissions` function (`applier.ts:264-270`) only checks `filesystem` and `terminal`.

**Fix**: drop the network toggle from `PermissionsSection` and from the schema.

### Behavior.followUpMode union

Schema (`settings-schema.ts:302`) says `SteeringMode = "all" | "one-at-a-time"`, but `BehaviorSection.tsx` widens the type to include `"none"` and the picker offers it. Truth ext's `validateAndNormalizeManage` will silently keep `"none"` (it's a string), but it's not in the documented schema.

**Fix**: widen `SteeringMode` (or split into a separate union for `followUpMode`).

### Advanced behavior sub-blocks have no UI

`manage.behavior.{compaction, branchSummary, retry}` have schemas and defaults but no UI in the Manage tab. They get filled by `DEFAULT_MANAGE` and reloaded via Tier-2 flag, but the user has no surface to tweak them. If we want power-user knobs, add an "Advanced" section; otherwise leave as defaults.

---

## 13. How to add a new setting

When you need to add a new tweakable setting to the agent, follow these steps:

1. **Decide where it lives**:
   - Runtime essential (model, env, provider, runtime)? → `settings.json` (Tier 1 or 2)
   - User-tweakable surface (toggle, dropdown, slider)? → `manage.json` (Tier 1, 2, or 3)
   - Per-extension concern (only one ext reads it)? → per-ext file (Tier 3)

2. **Add the field to the schema** (`superhive-pi-truth/settings-schema.ts`):
   - Update the relevant interface (`SettingsFile`, `ManageFile`, `PlanExtensionFile`, `OrchExtensionFile`, or `SpawnExtensionFile`)
   - Update the corresponding `DEFAULT_*` constant
   - For `settings.json` Tier-1 fields, add an applier branch in `applier.ts:65-163`
   - For `settings.json` Tier-2 fields, add the field name to `tier2Fields` in `applier.ts:135-145`
   - For `manage.json` Tier-1 fields (permissions), the existing `computeExcludeToolsFromPermissions` covers it
   - For `manage.json` Tier-2 fields, the existing `reloadFields` covers it
   - For per-ext file fields, the cascade engine in `cascade.ts` covers it

3. **Add a renderer control**:
   - For `manage.json`: create a new section in `superhive/src/components/layout/right-sidebar/sections/` or extend an existing one. Register it in `MANAGE_SECTIONS` (registry.tsx).
   - For `settings.json`: edit the chat composer (`ModelPicker`, `ModePicker`) or the Settings tab (`settings.tsx`).
   - For per-ext file: extend the corresponding ext's UI (or add a new section).

4. **Add the patch path**:
   - For `manage.json`: `useAgentManage.patch('your.field', value)` from the renderer.
   - For `settings.json`: `useAgentSettings.patch('your.field', value)` from the renderer.
   - For per-ext file: write directly to the file via `writePlanExtension` / `writeOrchestrationExtension` / `writeSpawnExtension` from truth ext (cascade), or via the ext's own writer.

5. **Update this doc**:
   - Add an entry to the relevant settings section (§5, §6, §7, §8, §9)
   - Update the truth file map if the field lives in a new file
   - Update the tier model if the field introduces a new tier concept

6. **Update the test suite**:
   - `superhive-pi-truth/test/settings-schema.test.ts` — add a test for the new field's default + validation
   - `superhive-pi-truth/test/cascade.test.ts` — if it's a cascade field, add a test for the cascade direction
   - `superhive-pi-truth/test/applier.test.ts` — if it's a Tier-1/2 field, add a test for the applier branch
   - `superhive-pi-orchestration/test/system-prompt.test.ts` — if the field influences the orchestrator system prompt

7. **Mirror to `general-kai/`** if the change touches any ext. See parent `AGENTS.md` rule 4 (drift audit).

---

## 14. Source files referenced

| File | What it contains |
|---|---|
| `superhive-pi-truth/settings-schema.ts` | All 4 truth file types + 3 per-ext files + defaults + cascade paths |
| `superhive-pi-truth/applier.ts` | Tier-1 / Tier-2 dispatcher for `settings.json` and `manage.json` |
| `superhive-pi-truth/cascade.ts` | IN/OUT cascade engine (`manage → per-ext`, `orch → settings`) |
| `superhive-pi-truth/index.ts` | Boot, watchers, 16 LLM tools |
| `superhive-pi-truth/tools.ts` | 16 LLM-callable tools |
| `superhive-pi-truth/catalog-scanner.ts` | `settings.catalog` writer |
| `superhive-pi-truth/sessions-indexer.ts` | `settings.sessionsIndex` + `lastEvent` writer |
| `superhive-pi-truth/checklist.ts` | `settings.checklist` journal emitter |
| `superhive-pi-truth/file-io.ts` | Atomic write helpers for all 7 files |
| `superhive/electron/agent-settings-defaults.ts` | Main-process path helpers + DEFAULT_* re-exports |
| `superhive/electron/ipc/agents.ts` | `READ/WRITE_SETTINGS` + `READ/WRITE_MANAGE` + `READ/WRITE_OVERVIEW` + `READ/APPEND/MARK/CLEAR_INBOX` handlers |
| `superhive/electron/ipc/runtime.ts` | `START/STOP/RESTART/SEND` + `reSeedProviders` |
| `superhive/electron/ipc/settings.ts` | Global providers + models (`SETTINGS.SET_PROVIDER`, etc.) |
| `superhive/src/api/agents.ts` | Renderer `agents.*` IPC bridge |
| `superhive/src/flows/agents/settings/use-agent-settings.ts` | `useAgentSettings` (settings.json React hook) |
| `superhive/src/flows/agents/settings/use-agent-manage.ts` | `useAgentManage` (manage.json React hook) |
| `superhive/src/flows/agents/settings/use-agent-model.ts` | `useAgentModel` (model patch + lockstep) |
| `superhive/src/components/layout/composer/ModelPicker/ModelPicker.tsx` | Composer model dropdown |
| `superhive/src/components/layout/composer/ModePicker/ModePicker.tsx` | Composer mode dropdown |
| `superhive/src/components/layout/right-sidebar/sections/PlanModeSection.tsx` | Manage-tab plan mode section |
| `superhive/src/components/layout/right-sidebar/ProjectSettingsPanel.tsx` | Project Manage tab (uses `useAgentManage.patch`) |
| `superhive-pi-plan/plan-mode.ts` | Implements the plan-mode lifecycle |
| `superhive-pi-plan/truth-bridge.ts` | `readPlanModeFromTruth` (file + manage.json fallback) |
| `superhive-pi-orchestration/system-prompt.ts` | `buildSystemPrompt(inputs)` (Phase J data-driven) |
| `superhive-pi-orchestration/index.ts` | session_start, watcher-driven `rebuildSystemPrompt`, `before_agent_start` injector |
| `superhive-pi-orchestration/project.ts` | Read/write helpers for manage + orch + plan + spawn files |
| `superhive-pi-orchestration/tools.ts` | 7 coordinator + 2 member tools |
| `superhive-pi-spawn/spawn-file.ts` | `SpawnFileShape` + `readSpawnFile` + `writeSpawnFile` |
| `superhive-pi-spawn/spawn.ts` | `spawnAgent` (3 gates) |
| `superhive-pi-spawn/index.ts` | Extension entry, registers `spawn_agent` tool |
| `superhive-pi-telemetry/index.ts` | Pure telemetry writer (no settings) |
| `superhive-pi-context/index.ts` | Compaction engine, no settings |
| `superhive-pi-context/config.ts` | `ContextCompactionSettings` (legacy pointer-only) |

---

## 15. Version history

| Date | Change |
|---|---|
| 2026-07-25 | Initial doc. ModePicker drift fix: `useAgentSettings` → `useAgentManage`. |