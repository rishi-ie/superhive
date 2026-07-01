# Superhive — Phase Implementation Plan

## Overview

This is the **step-by-step build plan** for the entire app. 61 phases, each self-contained: build what's missing → wire the flow → verify end-to-end.

After all 61 phases, the app is "almost production ready" for the local-first, single-user AI workforce cockpit the spec describes. See `spec.md` for the vision and `flows.md` for the behavior catalog.

## How to use this document

- **Pick a phase** from the index below
- **Read its section** — every phase is self-contained
- **Build it**: follow "Surfaces to create" + "Surfaces to modify" + "Data layer changes" in order
- **Wire it**: connect the flow listed
- **Verify it**: run the verification steps and tick all acceptance criteria
- **Move to next phase**

Build commands:

```sh
bun run typecheck     # mandatory after every phase
bun run build         # typecheck + vite build
bun run dev           # hot-reload during development
```

## Conventions

### Status

- `[BUILD]` — I implement this phase
- `[MANUAL]` — You implement this phase (the agent creation wizard)
- `[DEFERRED]` — Built after everything else (tiering)

### ID format

- `P-###` — page
- `M-###` — modal
- `C-###` — confirmation modal
- `PL-###` — panel
- `PR-###` — popover / overlay
- `T-###` — table
- `S-###` — store

See `pages-and-modals.md` for the surface IDs; `flows.md` for flow IDs (F-###).

### Data layer pattern

- Settings live in `src/data/settings/` (localStorage via `SettingsProvider`)
- Runtime data (workspaces, projects, agents, etc.) lives in `src/data/{domain}/store.ts` which delegates to a `Repository` that wraps `DataSource.{collection}`
- New runtime data goes into the SQL schema (`src/data/seed/seed.sql`) with a corresponding `store.ts` and `repository.ts`
- OKF data lives on disk at `~/.superhive/okf/<project_id>/` (not in DB)
- Agent state lives in each agent's `~/.superhive/agents/<ulid>/.general-v1/` (not in DB; app holds metadata)

### Naming

- Named exports only
- One component per file; filename matches exported name
- JSDoc on every `.tsx` top-of-file + main export
- `@/...` alias for cross-directory; `./...` for siblings

---

## Phase index

| # | Group | Title | Status |
|---|---|---|---|
| 01 | Foundation | Consolidate workspaces storage | [BUILD] |
| 02 | Foundation | Schema: workspaces + workspace_agents tables | [BUILD] |
| 03 | Foundation | Schema: project_agents link table | [BUILD] |
| 04 | Foundation | Schema: OKF metadata table | [BUILD] |
| 05 | Foundation | Schema: agent subprocess registry | [BUILD] |
| 06 | Foundation | Schema: chat_threads scoping | [BUILD] |
| 07 | Foundation | Schema: integrations table | [BUILD] |
| 08 | Foundation | Schema: permission_requests + sub_agents | [BUILD] |
| 09 | Foundation | Schema: channel_participants with permissions | [BUILD] |
| 10 | Cleanup | Fix ProjectsView (workspace) to show all projects | [BUILD] |
| 11 | Cleanup | Wire ProjectManageTab title/brief persistence | [BUILD] |
| 12 | Cleanup | Wire TicketManageTab save bar | [BUILD] |
| 13 | Cleanup | Wire ChannelManageTab save bar | [BUILD] |
| 14 | Cleanup | Wire ControlMatrix model dropdown | [BUILD] |
| 15 | Cleanup | Wire TicketInbox + ChannelInbox to real data | [BUILD] |
| 16 | Cleanup | Wire ProjectInbox + DashboardInbox snooze/done | [BUILD] |
| 17 | Cleanup | Delete AuditQueue orphan + dead path | [BUILD] |
| 18 | Cleanup | Activate OR delete WorkspaceReadyView | [BUILD] |
| 19 | Cleanup | Wire SessionsView row click to open thread | [BUILD] |
| 20 | Cleanup | Wire OR remove Help Popover + handleTogglePin + Back/Forward + Sign Out | [BUILD] |
| 21 | Confirm | Wire Close Ticket confirmation | [BUILD] |
| 22 | Confirm | Wire Archive Ticket confirmation | [BUILD] |
| 23 | Confirm | Wire Archive Workspace confirmation | [BUILD] |
| 24 | Confirm | Wire Delete Workspace Data (incl. OKF cleanup) | [BUILD] |
| 25 | Confirm | Wire Delete Account confirmation | [BUILD] |
| 26 | Confirm | Add Remove Agent from Project confirmation | [BUILD] |
| 27 | Modal | Build Create Ticket dialog | [BUILD] |
| 28 | Modal | Build Create Channel dialog | [BUILD] |
| 29 | Modal | Build Edit Agent dialog | [BUILD] |
| 30 | Modal | Build Integrations settings page | [BUILD] |
| 31 | Modal | Add Disconnect Integration confirmation | [BUILD] |
| 32 | Wizard | Agent creation wizard Step 1 (Identity) | [MANUAL] |
| 33 | Wizard | Agent creation wizard Step 2 (LLM provider) | [MANUAL] |
| 34 | Wizard | Agent creation wizard Step 3 (Skills) | [MANUAL] |
| 35 | Wizard | Agent creation wizard Step 4 (Sub-agent profile) | [MANUAL] |
| 36 | Wizard | Agent creation wizard Step 5 (Generation) | [MANUAL] |
| 37 | Wizard | Agent creation wizard Step 6 (Launch) | [MANUAL] |
| 38 | Wizard | Wire "New Agent" entry point (AgentsView only) | [BUILD] |
| 39 | Wizard | AGENT_HELLO handler | [MANUAL] |
| 40 | Agent | Wire workspace_agents + project_agents CRUD | [BUILD] |
| 41 | Agent | Add new tab kinds (workspace-agent, project-agent) | [BUILD] |
| 42 | Agent | Build Workspace Agent chat view | [BUILD] |
| 43 | Agent | Build Project Agent chat view | [BUILD] |
| 44 | Agent | Auto-spawn Workspace Agent on workspace create | [BUILD] |
| 45 | Agent | Auto-spawn Project Agent on project create | [BUILD] |
| 46 | OKF | OKF initial bundle on project create | [BUILD] |
| 47 | OKF | Project OKF sidebar/tree | [BUILD] |
| 48 | OKF | OKF concept viewer | [BUILD] |
| 49 | OKF | OKF editor | [BUILD] |
| 50 | OKF | OKF search | [BUILD] |
| 51 | WS | WebSocket host server (ws://127.0.0.1:7711) in Electron main | [BUILD] |
| 52 | WS | WS protocol handler | [BUILD] |
| 53 | WS | Permission Request toast + history | [BUILD] |
| 54 | WS | Sub-agent nested view | [BUILD] |
| 55 | WS | Sub-agent spawn toast | [BUILD] |
| 56 | WS | Cross-project agent view | [BUILD] |
| 57 | Ticket | Ticket detail center tab | [BUILD] |
| 58 | Ticket | Project Agent ticket-proposal card | [BUILD] |
| 59 | Ticket | Kanban drag/drop | [BUILD] |
| 60 | Polish | Consolidate ProjectsView vs ProjectDetailView | [BUILD] |
| 61 | Tiering | Tiering layer (deferred per spec §10) | [DEFERRED] |

---

## Foundation (conventions applied by all later phases)

### Schema versioning

Every new table added in phases 02-09 increments `SCHEMA_VERSION` in `src/data/datasource/schema.ts`. The `db-source.ts` `load()` does drop+recreate on version mismatch (already wired in Phase 02 from earlier work).

### New schema additions summary (phases 02-09)

These 9 tables are added across foundation phases. Each phase below details the columns:

- **T-WORKSPACES** (canonical runtime) — replaces settings.workspaces.workspaces
- **T-WORKSPACE-AGENTS** — workspace roster
- **T-PROJECT-AGENTS** — agent ↔ project join
- **T-OKF-BUNDLES** — OKF root paths + sync metadata
- **T-AGENT-PROCESSES** — ULID, pid, status, heartbeat
- **T-INTEGRATIONS** + **T-INTEGRATION-CHANNELS** — runtime integrations (separate from settings)
- **T-PERMISSION-REQUESTS** — agent permission ask history
- **T-SUB-AGENTS** — parent-child sub-agent registry
- **T-CHANNEL-PARTICIPANTS** — channel membership with permissions

### Stores created in foundation phases

- `src/data/workspaces_v2/` — runtime workspace store (Phase 02)
- `src/data/workspace_agents/` — workspace roster
- `src/data/project_agents/` — cross-project agent identity
- `src/data/okf/` — OKF bundle metadata
- `src/data/agent_processes/` — subprocess registry
- `src/data/integrations/` — runtime integrations
- `src/data/permission_requests/` — permission history
- `src/data/sub_agents/` — sub-agent registry
- `src/data/channel_participants/` — channel membership

Each store follows the standard pattern: `interface.ts` (types + signatures) + `store.ts` (public API) + `repository.ts` (DataSource wrapper).

---

## Phases

---

### Phase 01 — Consolidate workspaces storage

**Status:** [BUILD]

**Goal:** Single source of truth for workspaces. `data/workspaces/store` becomes canonical read/write. `settings.workspaces.workspaces` is deprecated (or repurposed for retention-only metadata).

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/settings/WorkspacesSettings.tsx` — call `data/workspaces/store::create()` instead of `useSettings().update('workspaces', ...)`
- `src/components/left-nav/TeamSelector.tsx` — already reads from `data/workspaces/store`; no change
- `src/components/center-workspace/setup/WorkspaceSetupView.tsx` — already calls `data/workspaces/store::create`; no change

**Data layer changes:**
- Read source: `data/workspaces/store.ts` (only)
- Write source: `data/workspaces/store.ts` (only)
- Settings domain: `settings.workspaces.workspaces` becomes read-only retention metadata; add helper `getRetentionDays(workspaceId)` that reads from a new `data/workspaces` field
- New table (Phase 02): `T-WORKSPACES` is the canonical runtime table

**Flows to wire:**
- F001 (Create workspace — already works via setup wizard; this phase unifies settings path too)
- F016 (Rename workspace — already works; verify it writes to data store)
- F017 (Set retention — already works; verify unified)

**Files to touch:**
- `src/components/settings/WorkspacesSettings.tsx` — replace `useSettings().update('workspaces', ...)` with `createWorkspace({ name, ... })`, `renameWorkspace(id, name)`, `setRetention(id, days)` from data store
- `src/data/workspaces/store.ts` — ensure these functions exist; add if missing
- `src/data/settings/interface.ts` — keep `WorkspacesSettings` type but mark deprecated; document migration

**Verification:**
1. `bun run typecheck` passes
2. Open app → setup wizard → create workspace "Test A" → appears in TeamSelector dropdown
3. Settings → Workspaces → "New workspace" → create "Test B" → also appears in TeamSelector
4. Rename "Test A" via pencil icon → both TeamSelector and Settings show new name
5. Set retention on "Test B" → reload app → retention persisted
6. Delete workspace data via Privacy settings → both TeamSelector and Settings show it gone

**Acceptance criteria:**
- Both `WorkspaceSetupView` and `WorkspacesSettings` create the same record visible everywhere
- Rename/retention work from either surface
- Settings `workspaces.workspaces` is empty or unused
- App restarts preserve all workspace data

---

### Phase 02 — Schema: workspaces + workspace_agents tables

**Status:** [BUILD]

**Goal:** Add canonical `workspaces` runtime table + `workspace_agents` table. Migrate Phase 01's unification into the proper schema.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/data/datasource/schema.ts` — add new tables, bump `SCHEMA_VERSION` to 3
- `src/data/seed/seed.sql` — add INSERT statements for default workspaces (existing seed data)
- `src/data/workspaces/store.ts` — `Workspace` type includes `initials`, `avatarColor`
- New file: `src/data/workspace_agents/{interface,store,repository}.ts`

**Data layer changes:**
- New table **T-WORKSPACES** with columns:
  - `id TEXT PRIMARY KEY`
  - `name TEXT NOT NULL`
  - `initials TEXT NOT NULL`
  - `avatar_color TEXT`
  - `created_at TEXT NOT NULL`
  - `retention_days INTEGER NOT NULL DEFAULT 90`
  - `archived_at TEXT` (nullable)
- New table **T-WORKSPACE-AGENTS**:
  - `workspace_id TEXT NOT NULL`
  - `agent_id TEXT NOT NULL`
  - `role TEXT`
  - `joined_at TEXT NOT NULL`
  - `PRIMARY KEY (workspace_id, agent_id)`
- Seed data: 2-3 workspaces (e.g., "Vela", "Cosmos", "Personal") with no agents initially
- Remove (or comment out) the old workspaces seed if it exists in any other table

**Flows to wire:**
- Foundation for F001, F016, F017 (proper runtime persistence)
- Foundation for F040 (delete workspace data — Phase 24)
- Foundation for F005/F040 (workspace agent roster)

**Files to touch:**
- `src/data/datasource/schema.ts` — add CREATE TABLE statements
- `src/data/datasource/db-source.ts` — bump `SCHEMA_VERSION = 3`
- `src/data/seed/seed.sql` — add INSERTs
- `src/data/workspaces/store.ts` — update Workspace type
- New: `src/data/workspace_agents/interface.ts` — types: `WorkspaceAgent = { workspaceId, agentId, role, joinedAt }`
- New: `src/data/workspace_agents/repository.ts` — wraps `DataSource.workspaceAgents`
- New: `src/data/workspace_agents/store.ts` — public API: `listWorkspaceAgents(workspaceId)`, `addAgentToWorkspace(workspaceId, agentId)`, `removeAgentFromWorkspace(workspaceId, agentId)`

**Verification:**
1. Delete `data.db` (drop+recreate will trigger on schema version mismatch)
2. `bun run dev` → app boots → seed inserts 2 workspaces
3. Check SQLite: `sqlite3 data.db "SELECT * FROM workspaces"` → 2 rows
4. `bun run typecheck` passes

**Acceptance criteria:**
- New tables exist with proper schema
- Seed data populates them on first boot
- `listWorkspaces()` reads from the new table
- All Phase 01 verifications still pass

---

### Phase 03 — Schema: project_agents link table

**Status:** [BUILD]

**Goal:** Add `project_agents` join table for cross-project agent identity (per spec §5.4).

**Missing surfaces:** none

**Surfaces to modify:**
- `src/data/datasource/schema.ts` — add table, bump version to 4
- `src/data/seed/seed.sql` — add INSERTs
- `src/data/projects/store.ts` — `Project.agents` reads from this table
- New file: `src/data/project_agents/{interface,store,repository}.ts`

**Data layer changes:**
- New table **T-PROJECT-AGENTS**:
  - `project_id TEXT NOT NULL`
  - `agent_id TEXT NOT NULL`
  - `role TEXT`
  - `current_status TEXT NOT NULL DEFAULT 'IDLE'` (one of WORKING / COMPILING / IDLE / AWAITING_HUMAN / ERROR_LOOP)
  - `assigned_ticket_id TEXT`
  - `joined_at TEXT NOT NULL`
  - `context_snapshot_path TEXT` — path to agent's project-scoped SAC context for this project
  - `PRIMARY KEY (project_id, agent_id)`
- Drop the existing `agents` field on `Project` (or keep it as a denormalized view)
- `ProjectAgent` type updated to match new schema

**Flows to wire:**
- Foundation for F005 (Add agent to project — Phase 40)
- Foundation for F050 (Remove agent from project — Phase 26)
- Foundation for cross-project identity (Phase 56)

**Files to touch:**
- `src/data/datasource/schema.ts` — add table
- `src/data/datasource/db-source.ts` — bump version
- `src/data/seed/seed.sql` — INSERTs
- `src/data/projects/interface.ts` — `ProjectAgent` type matches new columns
- `src/data/projects/store.ts` — read from join table
- `src/data/projects/repository.ts` — query the join table
- New: `src/data/project_agents/{interface,store,repository}.ts`

**Verification:**
1. Drop+recreate triggers → seed populates project_agents
2. `listProjectAgents(workspaceId)` returns agents for each project
3. Add agent to project via existing `CreateProjectDialog` (which calls `patchAgents`) → row created
4. Remove agent via direct DB call → row removed; agent's other projects unaffected

**Acceptance criteria:**
- `project_agents` table exists
- Cross-project agent identity works: same agent can be in multiple projects
- Each project-agent relationship has its own context_snapshot_path (placeholder for now)

---

### Phase 04 — Schema: OKF metadata table

**Status:** [BUILD]

**Goal:** Add `okf_bundles` table to track OKF bundle paths and sync metadata.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/data/datasource/schema.ts` — add table, bump version to 5
- `src/data/seed/seed.sql` — INSERTs (one row per existing project)
- New file: `src/data/okf/{interface,store,repository,fs}.ts`

**Data layer changes:**
- New table **T-OKF-BUNDLES**:
  - `project_id TEXT PRIMARY KEY`
  - `root_path TEXT NOT NULL` (e.g., `~/.superhive/okf/<project_id>`)
  - `last_synced_at TEXT`
  - `entry_count INTEGER NOT NULL DEFAULT 0`
- The actual `.md` files live on disk; this table just tracks metadata
- New store: `data/okf/store.ts`:
  - `getBundlePath(projectId): string`
  - `setBundlePath(projectId, path)`
  - `incrementEntryCount(projectId)`
  - `listConcepts(projectId): OkfConcept[]` — reads directory, parses filenames
- New module: `data/okf/fs.ts` — file-system helpers using Electron IPC:
  - `readBundle(projectId)`: returns `{ [path: string]: { frontmatter, body } }`
  - `writeConcept(projectId, path, content)`
  - `bundleExists(projectId): boolean`

**Flows to wire:**
- Foundation for F015 (Browse OKF — Phase 47)
- Foundation for F074 (Write OKF — Phase 52)
- Foundation for F046 (Initial bundle on project create — Phase 46)

**Files to touch:**
- `src/data/datasource/schema.ts`
- `src/data/datasource/db-source.ts` — bump version
- `src/data/seed/seed.sql`
- New: `src/data/okf/{interface,store,repository,fs}.ts`
- `electron/main.ts` — add IPC handlers `okf:read-bundle`, `okf:write-concept`, `okf:bundle-exists`, `okf:create-bundle`
- `electron/preload.ts` — expose `window.electron.okf.*`

**Verification:**
1. Drop+recreate → okf_bundles populated for existing seed projects
2. `bun run typecheck` passes
3. `data/okf/store.ts::getBundlePath('proj-1')` returns `~/.superhive/okf/proj-1` (even if dir doesn't exist yet)

**Acceptance criteria:**
- Table exists, seeded
- Store functions read/write correctly
- IPC handlers registered

---

### Phase 05 — Schema: agent subprocess registry

**Status:** [BUILD]

**Goal:** Track running agent subprocesses (ULID, pid, status, heartbeat).

**Missing surfaces:** none

**Surfaces to modify:**
- `src/data/datasource/schema.ts` — bump version to 6
- `src/data/seed/seed.sql` — INSERTs (empty initially)
- New file: `src/data/agent_processes/{interface,store,repository}.ts`

**Data layer changes:**
- New table **T-AGENT-PROCESSES**:
  - `ulid TEXT PRIMARY KEY`
  - `pid INTEGER`
  - `status TEXT NOT NULL DEFAULT 'STARTING'` (STARTING / RUNNING / IDLE / ERROR_LOOP / TERMINATED)
  - `last_heartbeat_at TEXT`
  - `started_at TEXT NOT NULL`
  - `port INTEGER` (WS port for IPC with this agent; agents run on their own port from general-v1)
  - `workspace_id TEXT` (which workspace this agent belongs to)
  - `project_id TEXT` (nullable — populated for project-scoped agents)
- New store: `data/agent_processes/store.ts`:
  - `register(ulid, pid, workspaceId?, projectId?)`
  - `setStatus(ulid, status)`
  - `recordHeartbeat(ulid)`
  - `terminate(ulid)` (called by Terminate flow)
  - `get(ulid)`, `list()`, `listByWorkspace(workspaceId)`

**Flows to wire:**
- Foundation for F025 (Terminate agent — Phase 23)
- Foundation for F039 (AGENT_HELLO handler — manual phase)
- Foundation for F072 (AGENT_STATE updates — Phase 52)

**Files to touch:**
- `src/data/datasource/schema.ts`
- `src/data/datasource/db-source.ts` — bump version
- `src/data/seed/seed.sql`
- New: `src/data/agent_processes/{interface,store,repository}.ts`

**Verification:**
1. Schema version bumps; drop+recreate triggers; empty agent_processes table
2. `bun run typecheck` passes
3. After Phase 39 (AGENT_HELLO handler) is built, agent connection populates the table

**Acceptance criteria:**
- Table exists, schema correct
- Store functions typed and callable
- No active agents until Phase 39 lands

---

### Phase 06 — Schema: chat_threads scoping

**Status:** [BUILD]

**Goal:** Allow chat threads to be scoped to agent, project, or workspace. Existing threads are agent-scoped.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/data/datasource/schema.ts` — bump version to 7
- `src/data/seed/seed.sql` — migrate existing chat_threads (set `thread_kind = 'agent'`)
- `src/data/chat/interface.ts` — add `threadKind`, `projectId`, `workspaceId` fields
- `src/data/chat/store.ts` — `listThreads({ scope, projectId?, workspaceId? })`

**Data layer changes:**
- Update table **T-CHAT-THREADS**:
  - Add `thread_kind TEXT NOT NULL DEFAULT 'agent'` (agent / project-agent / workspace-agent)
  - Add `project_id TEXT` (nullable)
  - Add `workspace_id TEXT` (nullable)
  - Existing rows: set `thread_kind = 'agent'`
- Update store:
  - `listThreads({ agentId?, projectId?, workspaceId?, kind? })` — query by scope
  - `getThreadByProject(projectId)`, `getThreadByWorkspace(workspaceId)`
  - `createThreadForProject(projectId, title)`, `createThreadForWorkspace(workspaceId, title)`

**Flows to wire:**
- Foundation for F010 (Workspace Agent session — Phase 42)
- Foundation for F011 (Project Agent session — Phase 43)
- F008/F009 already work; verify they still work after migration

**Files to touch:**
- `src/data/datasource/schema.ts` — add columns
- `src/data/datasource/db-source.ts` — bump version
- `src/data/seed/seed.sql` — add column to existing INSERTs + backfill
- `src/data/chat/interface.ts` — type updates
- `src/data/chat/store.ts` — query helpers
- `src/data/chat/repository.ts` — repository methods

**Verification:**
1. Drop+recreate; existing chat_threads get `thread_kind='agent'`
2. `listThreads()` (no args) returns agent-scoped threads (existing behavior)
3. `listThreads({ projectId: 'proj-1' })` returns empty (no project-agent threads yet)
4. Manually insert a test row with `thread_kind='project-agent'`, `project_id='proj-1'` → `listThreads({ projectId: 'proj-1' })` returns it

**Acceptance criteria:**
- Schema migrated correctly
- Existing agent threads still work
- New thread kinds creatable

---

### Phase 07 — Schema: integrations table

**Status:** [BUILD]

**Goal:** Runtime integrations table (separate from `settings.integrations`).

**Missing surfaces:** none

**Surfaces to modify:**
- `src/data/datasource/schema.ts` — bump version to 8
- `src/data/seed/seed.sql` — seed integration providers (default disconnected)
- New file: `src/data/integrations/{interface,store,repository}.ts`

**Data layer changes:**
- New table **T-INTEGRATIONS**:
  - `id TEXT PRIMARY KEY`
  - `provider TEXT NOT NULL` (github / slack / linear / notion / jira / webhook)
  - `label TEXT NOT NULL`
  - `connected INTEGER NOT NULL DEFAULT 0` (boolean)
  - `api_key TEXT`
  - `base_url TEXT`
  - `config_json TEXT` (provider-specific config)
  - `updated_at TEXT NOT NULL`
- New table **T-INTEGRATION-CHANNELS**:
  - `id TEXT PRIMARY KEY`
  - `integration_id TEXT NOT NULL`
  - `name TEXT NOT NULL`
  - `events_json TEXT NOT NULL DEFAULT '[]'` (JSON array of event names)
- New store: `data/integrations/store.ts`:
  - `listIntegrations()`, `getIntegration(id)`
  - `connect(id, apiKey, baseUrl, config)`, `disconnect(id)`
  - `listChannels(integrationId)`, `addChannel(integrationId, name, events)`, `removeChannel(id)`

**Flows to wire:**
- Foundation for F014 (Add integration — Phase 30)
- Foundation for F058 (Disconnect integration — Phase 31)

**Files to touch:**
- `src/data/datasource/schema.ts`
- `src/data/datasource/db-source.ts` — bump version
- `src/data/seed/seed.sql`
- New: `src/data/integrations/{interface,store,repository}.ts`

**Verification:**
1. Schema version bumps; drop+recreate; seed populates 6 providers (all disconnected)
2. `listIntegrations()` returns 6 rows
3. `connect('int-github', 'fake-key', null, {})` → row updated
4. `bun run typecheck` passes

**Acceptance criteria:**
- Tables exist, seeded
- Store functions work
- Phase 30 (Integrations page) can read from this store

---

### Phase 08 — Schema: permission_requests + sub_agents

**Status:** [BUILD]

**Goal:** Track agent permission asks and sub-agent registry.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/data/datasource/schema.ts` — bump version to 9
- `src/data/seed/seed.sql` — empty initial
- New files: `src/data/permission_requests/`, `src/data/sub_agents/`

**Data layer changes:**
- New table **T-PERMISSION-REQUESTS**:
  - `id TEXT PRIMARY KEY`
  - `agent_ulid TEXT NOT NULL`
  - `action TEXT NOT NULL` (description of the requested action)
  - `tool_name TEXT` (e.g., "bash", "git_push")
  - `args_json TEXT` (JSON of args being passed)
  - `status TEXT NOT NULL DEFAULT 'PENDING'` (PENDING / GRANTED / DENIED / EXPIRED)
  - `requested_at TEXT NOT NULL`
  - `resolved_at TEXT`
  - `resolver_note TEXT` (optional user note)
- New table **T-SUB-AGENTS**:
  - `id TEXT PRIMARY KEY`
  - `parent_ulid TEXT NOT NULL` (parent agent's ULID)
  - `name TEXT NOT NULL`
  - `kind TEXT NOT NULL` (built-in: scout/researcher/planner/worker/reviewer/oracle/delegate/context-builder; custom: anything else)
  - `status TEXT NOT NULL DEFAULT 'STARTING'`
  - `started_at TEXT NOT NULL`
  - `finished_at TEXT`
  - `task TEXT` (description of what the sub-agent is doing)
- New stores:
  - `data/permission_requests/store.ts`: `create({ agentUlid, action, toolName, args })`, `resolve(id, status, note?)`, `list({ agentUlid?, status? })`
  - `data/sub_agents/store.ts`: `register({ id, parentUlid, name, kind, task })`, `setStatus(id, status)`, `finish(id)`, `listByParent(parentUlid)`, `list()`

**Flows to wire:**
- Foundation for F069 (Permission request — Phase 53)
- Foundation for F071 (Sub-agent spawn — Phase 54-55)

**Files to touch:**
- `src/data/datasource/schema.ts`
- `src/data/datasource/db-source.ts` — bump version
- `src/data/seed/seed.sql`
- New: `src/data/permission_requests/{interface,store,repository}.ts`
- New: `src/data/sub_agents/{interface,store,repository}.ts`

**Verification:**
1. Schema version bumps; both tables empty
2. `create({ agentUlid: '01ABC', action: 'rm -rf /tmp/test', toolName: 'bash', args: {} })` → row created with status PENDING
3. `resolve('row-id', 'GRANTED', 'ok')` → status updated
4. `listByParent('parent-ulid')` returns sub-agents
5. `bun run typecheck` passes

**Acceptance criteria:**
- Tables exist
- Stores functional
- Phase 53/54 can read/write

---

### Phase 09 — Schema: channel_participants with permissions

**Status:** [BUILD]

**Goal:** Replace any existing participant list with proper join table for per-participant permissions.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/data/datasource/schema.ts` — bump version to 10
- `src/data/seed/seed.sql` — migrate existing channel participants
- `src/data/channels/store.ts` — read participants from new table
- New file: `src/data/channel_participants/{interface,store,repository}.ts`

**Data layer changes:**
- New table **T-CHANNEL-PARTICIPANTS**:
  - `channel_id TEXT NOT NULL`
  - `agent_id TEXT NOT NULL` (or `user_id` for the human user)
  - `participant_type TEXT NOT NULL DEFAULT 'agent'` (agent / user / workspace-agent / project-agent)
  - `can_read INTEGER NOT NULL DEFAULT 1`
  - `can_write INTEGER NOT NULL DEFAULT 1`
  - `joined_at TEXT NOT NULL`
  - `PRIMARY KEY (channel_id, agent_id, participant_type)`
- New store: `data/channel_participants/store.ts`:
  - `listParticipants(channelId)`, `addParticipant({ channelId, agentId, type, canRead, canWrite })`, `removeParticipant(channelId, agentId, type)`, `updatePermissions(channelId, agentId, type, { canRead, canWrite })`
- Update `data/channels/store.ts` to read participants from this table

**Flows to wire:**
- Foundation for F053 (Add participant — Phase 13 cleanup)
- Foundation for F054 (Remove participant — Phase 13 cleanup)
- Foundation for permission checks in channel messaging

**Files to touch:**
- `src/data/datasource/schema.ts`
- `src/data/datasource/db-source.ts` — bump version
- `src/data/seed/seed.sql` — backfill from existing channel.participants JSON
- `src/data/channels/interface.ts` — type updates
- `src/data/channels/store.ts` — query new table
- New: `src/data/channel_participants/{interface,store,repository}.ts`

**Verification:**
1. Schema version bumps; existing channel participants backfilled
2. `listParticipants('ch-1')` returns the agents that were previously in the channel
3. `addParticipant({ channelId: 'ch-1', agentId: 'agent-5', type: 'agent', canRead: 1, canWrite: 1 })` → row added
4. `removeParticipant('ch-1', 'agent-5', 'agent')` → row removed
5. `bun run typecheck` passes

**Acceptance criteria:**
- Table exists with proper schema
- Backfill correct
- Store functions work

---

### Phase 10 — Fix ProjectsView (workspace) to show all projects

**Status:** [BUILD]

**Goal:** `ProjectsView` (workspace-scoped projects tab) currently shows only the first project. Fix to show all projects for the active workspace.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/center-workspace/ProjectsView.tsx` — iterate over all projects for the workspace

**Data layer changes:**
- Use `listProjects({ workspaceId })` (already exists) and iterate over the result
- Remove the call to `getProjectTitle(workspaceId)` (which only returns the first)

**Flows to wire:**
- F012 (Browse projects in workspace)

**Files to touch:**
- `src/components/center-workspace/ProjectsView.tsx`

**Verification:**
1. Open app → click "Projects" in left nav → see all projects for the active workspace
2. Switch workspace → projects list updates
3. Click project → opens project detail

**Acceptance criteria:**
- All projects visible in workspace Projects tab
- Click-through works
- No regression in other tabs

---

### Phase 11 — Wire ProjectManageTab title/brief persistence

**Status:** [BUILD]

**Goal:** Editing project title/brief/success criteria in `ProjectManageTab` should persist to the DB.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/right-auxiliary/ProjectManageTab.tsx` — Save bar calls `patch(id, { title, brief, successCriteria })`

**Data layer changes:**
- `data/projects/store.ts` — add `patchProject(id, partial)` function (or use existing `patch` from repository)
- `data/projects/repository.ts` — ensure `patch(id, partial)` exists

**Flows to wire:**
- F019 (Edit project title — currently [LOCAL])

**Files to touch:**
- `src/components/right-auxiliary/ProjectManageTab.tsx` — replace toast-only save with `patchProject(...)`
- `src/data/projects/store.ts` — add `patchProject(id, partial)` if missing
- `src/data/projects/repository.ts` — ensure patch method exists

**Verification:**
1. Open project → right-aux → Manage → edit title → Save
2. Reload app → title persists
3. Edit brief → Save → brief persists
4. Edit success criteria → Save → persists
5. Click outside Save area → no accidental save

**Acceptance criteria:**
- All 3 fields persist
- Toast confirms save
- No double-save (idempotent)

---

### Phase 12 — Wire TicketManageTab save bar

**Status:** [BUILD]

**Goal:** Editing ticket status/priority/type/assignee in `TicketManageTab` should persist to the DB.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/right-auxiliary/TicketManageTab.tsx` — Save bar writes to ticket store

**Data layer changes:**
- `data/tickets/store.ts` — ensure `patchTicket(id, partial)` exists
- `data/tickets/repository.ts` — `patch(id, partial)`

**Flows to wire:**
- F026 (Edit ticket status/priority/type/assignee — currently [LOCAL])
- F051 (Assign / reassign ticket)

**Files to touch:**
- `src/components/right-auxiliary/TicketManageTab.tsx` — wire save
- `src/data/tickets/store.ts` — `patchTicket`
- `src/data/tickets/repository.ts` — `patch`

**Verification:**
1. Open ticket → right-aux → Manage → change status → Save → reload → persists
2. Change assignee → Save → assignee shows updated in ticket list
3. Change priority/type → Save → persists

**Acceptance criteria:**
- All 4 fields persist
- Reassigning via picker persists

---

### Phase 13 — Wire ChannelManageTab save bar

**Status:** [BUILD]

**Goal:** Channel topic/status/participants edits persist.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/right-auxiliary/ChannelManageTab.tsx` — Save writes to channel store + channel_participants store

**Data layer changes:**
- `data/channels/store.ts` — `patchChannel(id, partial)` for topic/status
- `data/channel_participants/store.ts` — add/remove/updatePermissions for participant list

**Flows to wire:**
- F030 (Edit channel topic/status/participants — currently [LOCAL])
- F053 (Add participant)
- F054 (Remove participant)

**Files to touch:**
- `src/components/right-auxiliary/ChannelManageTab.tsx` — wire save
- `src/data/channels/store.ts` — `patchChannel`
- `src/data/channel_participants/store.ts` — already created in Phase 09

**Verification:**
1. Open channel → right-aux → Manage → edit topic → Save → reload → persists
2. Change status → Save → persists
3. Add participant via picker → Save → participant added
4. Remove participant via X → Save → participant removed
5. Permission check: removed participant can't read channel messages (verify in channel detail view)

**Acceptance criteria:**
- All channel fields persist
- Participants table correctly updated

---

### Phase 14 — Wire ControlMatrix model dropdown

**Status:** [BUILD]

**Goal:** Agent model/engine dropdown actually writes `modelEngine` to permissions.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/right-auxiliary/ControlMatrix.tsx` — `onModelChange` writes via `setPermissions`

**Data layer changes:**
- `data/agents/store.ts` — `setPermissions` already exists
- `data/agents/repository.ts` — `permissions.upsert`

**Flows to wire:**
- F023 (Change agent model — currently [STUB])

**Files to touch:**
- `src/components/right-auxiliary/ControlMatrix.tsx`

**Verification:**
1. Open agent → right-aux → Manage → change model from dropdown
2. Toast "Model updated"
3. Reload app → model persists
4. Switch agent → agent's model displayed correctly

**Acceptance criteria:**
- Model change persists to permissions table
- Toast feedback works

---

### Phase 15 — Wire TicketInbox + ChannelInbox to real data

**Status:** [BUILD]

**Goal:** Replace always-empty inbox states with real data.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/right-auxiliary/inbox/TicketInbox.tsx` — query relevant tickets
- `src/components/right-auxiliary/inbox/ChannelInbox.tsx` — query mentions/unread

**Data layer changes:**
- TicketInbox: query tickets related to the active ticket (e.g., same project, same assignee)
- ChannelInbox: query unread messages for the user in the active channel

**Flows to wire:**
- F029 (Snooze / mark done — already exists; wire to actually persist)

**Files to touch:**
- `src/components/right-auxiliary/inbox/TicketInbox.tsx`
- `src/components/right-auxiliary/inbox/ChannelInbox.tsx`

**Verification:**
1. Open ticket → right-aux → Inbox → see related tickets
2. Open channel → right-aux → Inbox → see recent messages
3. Click Snooze / Done → updates persist

**Acceptance criteria:**
- Inboxes show real data
- Actions persist

---

### Phase 16 — Wire ProjectInbox + DashboardInbox snooze/done

**Status:** [BUILD]

**Goal:** Snooze/done actions persist (currently local-only).

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/right-auxiliary/inbox/ProjectInbox.tsx` — call `snoozeTicket(id)`, `markDone(id)`
- `src/components/right-auxiliary/dashboard/DashboardInbox.tsx` — same

**Data layer changes:**
- `data/tickets/store.ts` — `snooze(id)`, `markDone(id)`
- `data/tickets/repository.ts` — `snooze`, `markDone`

**Flows to wire:**
- F029 (Snooze / done — currently [LOCAL])

**Files to touch:**
- `src/components/right-auxiliary/inbox/ProjectInbox.tsx`
- `src/components/right-auxiliary/dashboard/DashboardInbox.tsx`
- `src/data/tickets/store.ts`
- `src/data/tickets/repository.ts`

**Verification:**
1. Open project inbox → Snooze ticket → ticket moved out of list
2. Reload → ticket still snoozed (filtered out by query)
3. Click Done → ticket status updates to MERGED

**Acceptance criteria:**
- Snooze persists
- Done persists

---

### Phase 17 — Delete AuditQueue orphan + tab.kind='settings' dead path

**Status:** [BUILD]

**Goal:** Remove dead code.

**Missing surfaces:** none

**Surfaces to modify:**
- Delete `src/components/right-auxiliary/AuditQueue.tsx`
- Remove `AuditQueue` from `src/components/right-auxiliary/index.ts` exports
- Remove `'settings'` from `CenterTabType` in `src/data/tabs/interface.ts`

**Data layer changes:** none

**Flows to wire:** none (cleanup only)

**Files to touch:**
- Delete: `src/components/right-auxiliary/AuditQueue.tsx`
- Edit: `src/components/right-auxiliary/index.ts` — remove AuditQueue export
- Edit: `src/data/tabs/interface.ts` — remove 'settings' from CenterTabType

**Verification:**
1. `bun run typecheck` passes
2. App boots cleanly
3. `rg "AuditQueue" src/` returns no matches
4. `rg "'settings'" src/data/tabs/interface.ts` returns no match

**Acceptance criteria:**
- All references removed
- No typecheck errors
- App still works

---

### Phase 18 — Activate OR delete WorkspaceReadyView

**Status:** [BUILD]

**Goal:** Decide between activating the dormant per-workspace setup wizard or deleting it.

**Recommended:** Activate it. Show when a workspace exists but has no projects.

**Missing surfaces:** none (component exists)

**Surfaces to modify:**
- `src/components/center-workspace/setup/SetupWizardView.tsx` — uncomment the render path
- `src/components/center-workspace/setup/WorkspaceReadyView.tsx` — wire the 4 menu rows to real flows

**Data layer changes:** none

**Flows to wire:**
- Wizard rows: create project (M002 stub here, full in Phase 27), hire agent (Phase 38 stub button), invite teammates (toast)

**Files to touch:**
- `src/components/center-workspace/setup/SetupWizardView.tsx`
- `src/components/center-workspace/setup/WorkspaceReadyView.tsx`

**Verification:**
1. Create workspace → no projects → see WorkspaceReadyView instead of Home
2. Click "Create project" → opens Create Project dialog (existing)
3. Click "Hire agent" → opens agent wizard (or stub button to Phase 38)
4. Click "Skip" → dismisses wizard

**Acceptance criteria:**
- Wizard renders correctly
- All 4 actions work (3 stubs OK for invite)

---

### Phase 19 — Wire SessionsView row click to open thread

**Status:** [BUILD]

**Goal:** Clicking a thread row in `SessionsView` opens the thread in the chat tab.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/right-auxiliary/sessions/SessionsView.tsx` — `onThreadSelect` calls `handleThreadSelect` from Dashboard
- `src/screens/Dashboard.tsx` — `handleThreadSelect` actually opens the thread

**Data layer changes:** none

**Flows to wire:**
- F117 (Reopen thread — currently [STUB])

**Files to touch:**
- `src/components/right-auxiliary/sessions/SessionsView.tsx`
- `src/screens/Dashboard.tsx`

**Verification:**
1. Open agent chat → send a few messages → create another thread
2. Right-aux → Sessions → click thread row
3. Chat tab opens at that thread with messages visible

**Acceptance criteria:**
- Clicking opens correct thread
- Messages scroll into view

---

### Phase 20 — Wire OR remove Help Popover + handleTogglePin + Back/Forward + Sign Out

**Status:** [BUILD]

**Goal:** Decide and execute on dead UI controls.

**Recommendation:**
- Help Popover "Documentation" / "Changelog" → open a simple in-app modal showing "Coming soon" content (or remove)
- `handleTogglePin` → wire to actually pin the active tab
- Back / Forward nav buttons → keep disabled (no navigation history to track)
- Sign Out → keep as toast (no real auth)

**Missing surfaces:** none (small in-app modal for Help docs)

**Surfaces to modify:**
- `src/components/left-nav/HelpPopover.tsx` — replace `app:open-help` event with a small modal
- `src/screens/Dashboard.tsx` — `handleTogglePin` writes to tab store

**Data layer changes:**
- `data/tabs/store.ts` — ensure `togglePin(tabId)` exists

**Files to touch:**
- `src/components/left-nav/HelpPopover.tsx`
- `src/screens/Dashboard.tsx`

**Verification:**
1. Click help button → Documentation row → modal opens with "Coming soon" content
2. Right-click tab → pin → tab pinned, cannot close via X
3. Back/Forward → still disabled (acceptable)
4. Sign Out → toast "Sign out coming soon"

**Acceptance criteria:**
- No more dead event dispatches
- Pin works

---

### Phase 21 — Wire Close Ticket confirmation

**Status:** [BUILD]

**Goal:** Close Ticket button sets status to MERGED (currently toast-only).

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/right-auxiliary/TicketManageTab.tsx` — `onConfirmClose` writes status

**Data layer changes:**
- `data/tickets/store.ts` — `setStatus(id, 'MERGED')` (likely exists from seed)

**Flows to wire:**
- F027 (Close ticket — currently [LOCAL])

**Files to touch:**
- `src/components/right-auxiliary/TicketManageTab.tsx`

**Verification:**
1. Open ticket → Manage → Close Ticket → confirm
2. Reload → status MERGED persists

**Acceptance criteria:**
- Status persists

---

### Phase 22 — Wire Archive Ticket confirmation

**Status:** [BUILD]

**Goal:** Archive Ticket button persists.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/right-auxiliary/TicketManageTab.tsx` — `onConfirmArchive` writes

**Data layer changes:**
- `data/tickets/store.ts` — `archive(id)` if not exists; or use existing setStatus('ARCHIVED')
- Need `archived_at` column on tickets table — already added in Phase 06? If not, add now

**Flows to wire:**
- F028 (Archive ticket — currently [STUB])

**Files to touch:**
- `src/data/datasource/schema.ts` — add `archived_at TEXT` to tickets table; bump version to 11
- `src/data/tickets/store.ts` — `archive(id)` function
- `src/data/tickets/repository.ts` — patch with archived_at
- `src/components/right-auxiliary/TicketManageTab.tsx`

**Verification:**
1. Archive ticket → reload → still archived
2. Filtered views exclude archived

**Acceptance criteria:**
- Archive persists

---

### Phase 23 — Wire Archive Workspace confirmation

**Status:** [BUILD]

**Goal:** Archive Workspace button persists.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/settings/WorkspacesSettings.tsx` — `onConfirmArchive` writes

**Data layer changes:**
- `data/workspaces/store.ts` — `archive(id)` if not exists
- `archived_at` column already added in Phase 02

**Flows to wire:**
- F023 (Archive workspace — currently [STUB])

**Files to touch:**
- `src/components/settings/WorkspacesSettings.tsx`
- `src/data/workspaces/store.ts` — `archive(id)`

**Verification:**
1. Archive workspace → disappears from TeamSelector
2. Show in archived list (if any view)
3. Data persists

**Acceptance criteria:**
- Archive persists

---

### Phase 24 — Wire Delete Workspace Data (incl. OKF cleanup)

**Status:** [BUILD]

**Goal:** Delete Workspace Data cascades to projects, tickets, channels, AND removes OKF bundle from disk.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/settings/PrivacySettings.tsx` — `onConfirmDelete` cascades

**Data layer changes:**
- `data/workspaces/store.ts` — `deleteWorkspace(id)` cascades:
  - Delete workspace row
  - Delete all projects (and their tickets, channels, project_agents)
  - Delete workspace_agents rows
  - Delete OKF bundle directory
- New IPC handler in `electron/main.ts`: `data:delete-okf-bundle(projectIds[])`
- New preload binding: `window.electron.data.deleteOkfBundle`

**Flows to wire:**
- F109 (Delete workspace data — currently [STUB])

**Files to touch:**
- `src/components/settings/PrivacySettings.tsx`
- `src/data/workspaces/store.ts`
- `electron/main.ts`
- `electron/preload.ts`

**Verification:**
1. Create workspace + project
2. Privacy → Delete workspace data → type workspace id → confirm
3. Workspace gone from TeamSelector
4. Project gone from list
5. OKF bundle `~/.superhive/okf/<project_id>/` removed from disk
6. Reload → all gone

**Acceptance criteria:**
- Cascade delete works
- OKF bundle removed from disk

---

### Phase 25 — Wire Delete Account confirmation

**Status:** [BUILD]

**Goal:** Delete Account wipes all app data.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/settings/PrivacySettings.tsx` — `onConfirmDeleteAccount` triggers full wipe

**Data layer changes:**
- `data/workspaces/store.ts` — `deleteAll()` cascades to all workspaces, projects, etc.
- `data/okf/fs.ts` — `deleteAllBundles()` removes `~/.superhive/okf/`
- `data/settings/settings-context.tsx` — `resetAll()` clears localStorage
- `data/agent_processes/store.ts` — terminate all running agent subprocesses
- New IPC: `data:delete-all-okf-bundles`, `agents:terminate-all`

**Flows to wire:**
- F110 (Delete account — currently [STUB])

**Files to touch:**
- `src/components/settings/PrivacySettings.tsx`
- `src/data/workspaces/store.ts`
- `src/data/okf/fs.ts`
- `src/data/settings/settings-context.tsx`
- `src/data/agent_processes/store.ts`
- `electron/main.ts`
- `electron/preload.ts`

**Verification:**
1. Create workspaces, projects, OKF bundles, settings
2. Privacy → Delete account → type "delete" → confirm
3. App restarts as if first launch
4. All data gone, OKF bundles gone

**Acceptance criteria:**
- Full wipe successful

---

### Phase 26 — Add Remove Agent from Project confirmation

**Status:** [BUILD]

**Goal:** Add a confirmation modal for removing an agent from a project.

**Missing surfaces:**
- `C-009 — Remove Agent from Project confirmation modal` (inline in `ProjectManageTab`)

**Surfaces to modify:**
- `src/components/right-auxiliary/ProjectManageTab.tsx` — X icon next to each member triggers confirmation
- `src/data/projects/store.ts` — `removeAgent(projectId, agentId)`

**Data layer changes:**
- `data/projects/store.ts` — `removeAgent(projectId, agentId)` deletes the project_agents row
- Optionally: archive agent's project-context SAC (handled in Phase 40)

**Flows to wire:**
- F050 (Remove agent from project — currently [MISSING])

**Files to touch:**
- `src/components/right-auxiliary/ProjectManageTab.tsx`
- `src/data/projects/store.ts`

**Verification:**
1. Add agent to project (existing F005 path or manual SQL)
2. ProjectManageTab → X next to agent → confirmation modal
3. Confirm → agent removed from project list
4. Agent still in other projects

**Acceptance criteria:**
- Confirmation prevents accidental removal
- Removal persists

---

### Phase 27 — Build Create Ticket dialog

**Status:** [BUILD]

**Goal:** Full create-ticket dialog (currently just opens tab).

**Missing surfaces:**
- `M-002 — Create Ticket dialog` (full)
- File: `src/components/center-workspace/CreateTicketDialog.tsx`

**Surfaces to modify:**
- `src/components/center-workspace/TicketsView.tsx` — New Ticket button opens dialog
- `src/components/shortcuts/CommandPalette.tsx` — `new-ticket` opens dialog
- `src/lib/shortcuts/actions.ts` — `ticket.new` shortcut opens dialog
- `src/screens/Dashboard.tsx` — `handleCreateTicket` opens dialog

**Data layer changes:**
- `data/tickets/store.ts` — `createTicket({ projectId, title, description, priority, type, assigneeId, successCriteria, relatedChannelId? })`
- `data/tickets/repository.ts` — `create(ticket)`
- Phase 04 OKF writes: `data/okf/fs.ts::writeConcept(projectId, 'tickets/<id>.md', frontmatter, body)`

**Flows to wire:**
- F006 (Create ticket)

**Files to touch:**
- New: `src/components/center-workspace/CreateTicketDialog.tsx`
- `src/components/center-workspace/TicketsView.tsx`
- `src/components/shortcuts/CommandPalette.tsx`
- `src/lib/shortcuts/actions.ts`
- `src/screens/Dashboard.tsx`
- `src/data/tickets/store.ts`
- `src/data/tickets/repository.ts`
- `src/data/okf/fs.ts`

**Dialog fields:**
- Title (required)
- Description (optional, multi-line)
- Success criteria (optional)
- Priority (low/medium/high/critical)
- Type (feature/bug/chore/spike)
- Assignee picker (project agents)
- Related channel picker (optional)

**Verification:**
1. Click "New Ticket" in TicketsView → dialog opens
2. Fill fields → Submit → ticket created
3. Reload → ticket persists
4. OKF bundle has `tickets/<id>.md` with type=Ticket frontmatter
5. Command palette `new-ticket` opens dialog
6. Shortcut `Mod+Shift+T` opens dialog

**Acceptance criteria:**
- Dialog opens from all 3 entry points
- Submit creates ticket + OKF entry
- Validation works

---

### Phase 28 — Build Create Channel dialog

**Status:** [BUILD]

**Goal:** Full create-channel dialog.

**Missing surfaces:**
- `M-003 — Create Channel dialog`
- File: `src/components/center-workspace/CreateChannelDialog.tsx`

**Surfaces to modify:**
- `src/components/center-workspace/CommunicationsView.tsx` — New Channel button opens dialog
- `src/components/center-workspace/UniversalChannelsView.tsx` — same
- `src/screens/Dashboard.tsx` — `handleCreateChannel`

**Data layer changes:**
- `data/channels/store.ts` — `createChannel({ workspaceId, topic, status, participants[], relatedTicketId? })`
- `data/channels/repository.ts` — `create(channel)`
- `data/channel_participants/store.ts` — bulk add participants
- `data/okf/fs.ts` — write `channels/<id>.md`

**Flows to wire:**
- F007 (Create channel)

**Files to touch:**
- New: `src/components/center-workspace/CreateChannelDialog.tsx`
- `src/components/center-workspace/CommunicationsView.tsx`
- `src/components/center-workspace/UniversalChannelsView.tsx`
- `src/screens/Dashboard.tsx`
- `src/data/channels/store.ts`
- `src/data/channels/repository.ts`
- `src/data/channel_participants/store.ts`
- `src/data/okf/fs.ts`

**Dialog fields:**
- Topic (required)
- Status (OPEN / AWAITING_REPLY / RESOLVED)
- Initial participants (multi-select from project agents)
- Related ticket picker (optional)

**Verification:**
1. CommunicationsView → New Channel → dialog opens
2. Fill fields → Submit → channel created
3. Reload → channel persists
4. OKF bundle has `channels/<id>.md`
5. Participants appear in channel

**Acceptance criteria:**
- Dialog works from all entry points
- Channel + OKF + participants all created

---

### Phase 29 — Build Edit Agent dialog

**Status:** [BUILD]

**Goal:** Edit agent name/role/principles/boundaries/skills after creation.

**Missing surfaces:**
- `M-010 — Edit Agent dialog`
- File: `src/components/center-workspace/AgentEditDialog.tsx`

**Surfaces to modify:**
- `src/components/right-auxiliary/ControlMatrix.tsx` — "Edit agent" button (or new button) opens dialog
- `src/components/center-workspace/ChatView.tsx` — agent header → Edit

**Data layer changes:**
- `data/agents/store.ts` — `patchAgent(id, { name, role, principles, boundaries, skills })`
- `data/agents/repository.ts` — `patch(id, partial)`
- **NEW-SPEC:** Send update to running agent over WS (Phase 52 will add the WS plumbing; for now, store update only)

**Flows to wire:**
- F024 (Edit agent — currently [MISSING])

**Files to touch:**
- New: `src/components/center-workspace/AgentEditDialog.tsx`
- `src/components/right-auxiliary/ControlMatrix.tsx`
- `src/components/center-workspace/ChatView.tsx`
- `src/data/agents/store.ts`
- `src/data/agents/repository.ts`

**Dialog fields:**
- Name (text)
- Role (text)
- Principles (multi-line text)
- Boundaries (multi-line text)
- Skills (multi-select from skill catalog)

**Verification:**
1. Open agent → Edit Agent → dialog opens with current values
2. Change name → Save → reload → persists
3. (Phase 52 will add) → running agent picks up update over WS

**Acceptance criteria:**
- Dialog opens with current values
- Save persists
- Hot-reload placeholder for Phase 52

---

### Phase 30 — Build Integrations settings page

**Status:** [BUILD]

**Goal:** Real Integrations settings page replacing the sidebar stub.

**Missing surfaces:**
- `P-029 / P-050 — Integrations settings page`
- File: `src/components/settings/IntegrationsSettings.tsx`

**Surfaces to modify:**
- `src/data/config/settings-registry.ts` — add `integrations` entry
- `src/components/settings/SettingsSidebar.tsx` — remove decorative "Coming soon" badge; link to new page

**Data layer changes:**
- Read/write via `data/integrations/store.ts` (Phase 07)

**Flows to wire:**
- F014 (Add integration — currently [MISSING])

**Files to touch:**
- New: `src/components/settings/IntegrationsSettings.tsx`
- `src/data/config/settings-registry.ts`
- `src/components/settings/SettingsSidebar.tsx`
- `src/data/integrations/store.ts`

**Page structure:**
- Header: "Integrations"
- Grid of integration cards (GitHub / Slack / Linear / Notion / Jira / Webhook)
- Each card: provider icon, label, "Connect" / "Disconnect" button, channel count if connected
- Per-provider details: API key field (or OAuth flow), base URL (if applicable), channels/events list
- "Add channel" button per connected integration

**Verification:**
1. Settings → Integrations → see 6 providers
2. Click Connect on GitHub → enter API key → save → status updates
3. Reload → connection persists
4. Click Disconnect → confirmation → status updates
5. Add a channel → channel appears in list

**Acceptance criteria:**
- Page renders
- All 6 providers manageable
- Connect/disconnect persists
- Channels can be added/removed

---

### Phase 31 — Add Disconnect Integration confirmation

**Status:** [BUILD]

**Goal:** Confirmation modal for disconnecting an integration.

**Missing surfaces:**
- `M-008 — Disconnect Integration confirmation modal` (inline in `IntegrationsSettings`)

**Surfaces to modify:**
- `src/components/settings/IntegrationsSettings.tsx` — Disconnect button triggers confirmation

**Data layer changes:**
- `data/integrations/store.ts` — `disconnect(id)` (from Phase 07)

**Flows to wire:**
- F058 (Disconnect integration — currently [MISSING])

**Files to touch:**
- `src/components/settings/IntegrationsSettings.tsx`

**Verification:**
1. Settings → Integrations → click Disconnect on connected integration
2. Confirmation modal appears with provider name
3. Confirm → status changes to disconnected
4. Reload → still disconnected

**Acceptance criteria:**
- Confirmation prevents accidental disconnect
- Disconnect persists

---

### Phase 32 — Agent creation wizard Step 1 (Identity)

**Status:** [MANUAL] — You implement

**Goal:** First step of agent creation wizard: capture name, role, principles, boundaries.

**Surfaces to build:**
- `src/components/center-workspace/AgentCreationWizard.tsx` (skeleton + Step 1)

**Data layer:** Uses `general-v1` (see spec §5.1)

**Files to touch:**
- New: `src/components/center-workspace/AgentCreationWizard.tsx`

**Spec references:** §5.1, §5.2

**Wizard state (carries across all 6 steps):**
```typescript
type WizardState = {
  identity: { name: string; role: string; principles: string; boundaries: string };
  llm: { providerId: string; apiKey: string };
  skills: { enabled: string[] };
  subAgents: { enabledBuiltins: string[]; customSubAgents: { name: string; description: string }[] };
  generated?: { ulid: string; folderPath: string };
  launched?: { pid: number; port: number };
};
```

**Step 1 UI:**
- Title: "Create agent"
- Step indicator: "1 of 6 — Identity"
- Form fields: name (required), role (required), principles (textarea), boundaries (textarea)
- "Next" button (disabled until name + role filled)
- "Cancel" button

**Verification:**
1. Open wizard from AgentsView → Step 1 visible
2. Fill name + role → "Next" enables
3. Click Next → advances to Step 2 (placeholder for now)
4. Refresh wizard → state preserved (or note: state is local, not persisted)

---

### Phase 33 — Agent creation wizard Step 2 (LLM provider)

**Status:** [MANUAL]

**Goal:** Pick LLM provider and validate API key.

**Surfaces to build:**
- `AgentCreationWizard.tsx` — add Step 2 component

**Data layer:**
- Read providers from `data/settings/settings.json::models.providers` (or new models store)

**Files to touch:**
- `src/components/center-workspace/AgentCreationWizard.tsx`

**Step 2 UI:**
- Title: "Pick your LLM provider"
- Dropdown of providers from Models settings (OpenAI / Anthropic / Google / custom)
- API key field (validated against provider)
- Link: "Add new provider" → opens Models settings
- "Back" / "Next" / "Cancel"

**Verification:**
1. From Step 1 → Step 2
2. Pick provider → API key field appears
3. Enter valid-looking key → Next enables
4. Click Next → advances to Step 3

---

### Phase 34 — Agent creation wizard Step 3 (Skills)

**Status:** [MANUAL]

**Goal:** Toggle skills catalog.

**Surfaces to build:**
- `AgentCreationWizard.tsx` — add Step 3

**Data layer:** Static skills catalog (no DB needed yet)

**Files to touch:**
- `src/components/center-workspace/AgentCreationWizard.tsx`

**Step 3 UI:**
- Title: "Configure skills"
- Skill catalog: browser, planning, lancedb memory, mission-control, permission, sub-agent, communication, superhive-host
- Each with description and Switch toggle
- "Back" / "Next" / "Cancel"

**Verification:**
1. From Step 2 → Step 3
2. Toggle skills → state updates
3. Click Next → Step 4

---

### Phase 35 — Agent creation wizard Step 4 (Sub-agent profile)

**Status:** [MANUAL]

**Goal:** Choose built-in sub-agents + optional custom ones.

**Surfaces to build:**
- `AgentCreationWizard.tsx` — add Step 4

**Files to touch:**
- `src/components/center-workspace/AgentCreationWizard.tsx`

**Step 4 UI:**
- Title: "Sub-agents"
- 8 built-in sub-agents (scout, researcher, planner, worker, reviewer, oracle, delegate, context-builder) — all on by default
- "Add custom sub-agent" button → inline form
- "Back" / "Next" / "Cancel"

**Verification:**
1. From Step 3 → Step 4
2. Built-ins all checked by default
3. Add custom sub-agent → appears in list
4. Click Next → Step 5

---

### Phase 36 — Agent creation wizard Step 5 (Generation)

**Status:** [MANUAL]

**Goal:** Run `general-v1` `./setup.sh` non-interactively.

**Surfaces to build:**
- `AgentCreationWizard.tsx` — add Step 5
- `electron/main.ts` — new IPC `agent:create-folder` that invokes general-v1

**Data layer:**
- Electron main process runs `general-v1` setup wizard with env vars
- ULID pre-generated by app, passed as `GENERAL_ULID`
- LLM API key passed as appropriate env var (`ANTHROPIC_API_KEY`, etc.)
- Working directory: `~/.superhive/agents/<ulid>/`
- Returns: ULID + folder path

**Files to touch:**
- `src/components/center-workspace/AgentCreationWizard.tsx`
- `electron/main.ts` — IPC handler
- `electron/preload.ts` — expose

**Step 5 UI:**
- Title: "Generating agent"
- Progress indicator (steps: "Cloning general-v1", "Installing dependencies", "Configuring agent", "Writing identity")
- On success: auto-advance to Step 6
- On error: show error + retry button

**Verification:**
1. From Step 4 → Step 5
2. See progress
3. Folder created at `~/.superhive/agents/<ulid>/`
4. `.general-v1/.identity` contains ULID
5. `.general-v1/sac/` initialized
6. Advance to Step 6

---

### Phase 37 — Agent creation wizard Step 6 (Launch)

**Status:** [MANUAL]

**Goal:** Start agent subprocess, await AGENT_HELLO over WS.

**Surfaces to build:**
- `AgentCreationWizard.tsx` — add Step 6
- `electron/main.ts` — new IPC `agent:start-process(ulid)` that spawns general-v1 process
- WS plumbing: agent connects to `ws://127.0.0.1:7711`

**Files to touch:**
- `src/components/center-workspace/AgentCreationWizard.tsx`
- `electron/main.ts`
- New: `electron/agent-manager.ts` (or similar) — process lifecycle

**Step 6 UI:**
- Title: "Launching agent"
- Progress indicator
- On success: "Agent <name> is now running" + Finish button
- On error: show error

**Verification:**
1. From Step 5 → Step 6
2. Subprocess started
3. WS connection established
4. AGENT_HELLO received (Phase 39 handles this)
5. Agent appears in agent list
6. Reload → agent still in list (registered in DB via Phase 39)

---

### Phase 38 — Wire "New Agent" entry point (AgentsView only)

**Status:** [BUILD]

**Goal:** Single canonical "New Agent" button in `AgentsView` opens the wizard.

**Surfaces to modify:**
- `src/components/center-workspace/AgentsView.tsx` — add "New Agent" button in header
- `src/components/center-workspace/UniversalAgentsView.tsx` — REMOVE any "New Agent" button (per user: one canonical place only)
- `src/screens/Dashboard.tsx` — `handleCreateAgent` opens `AgentCreationWizard`

**Data layer changes:** none (uses wizard stub or real wizard)

**Flows to wire:**
- F004 (Create agent — entry point)

**Files to touch:**
- `src/components/center-workspace/AgentsView.tsx` — add button
- `src/components/center-workspace/UniversalAgentsView.tsx` — verify no button (or remove)
- `src/screens/Dashboard.tsx` — handleCreateAgent opens wizard

**Verification:**
1. Open app → Agents tab in left nav → click Agents
2. "New Agent" button visible in AgentsView header
3. Click → opens wizard
4. Wizard closed → button still there

**Acceptance criteria:**
- One place to create agent
- Button works

---

### Phase 39 — AGENT_HELLO handler

**Status:** [MANUAL]

**Goal:** When agent subprocess sends AGENT_HELLO over WS, register the agent in DB.

**Surfaces to build:**
- WS server in Electron main (Phase 51 will provide the WS server; this phase writes the handler)
- AGENT_HELLO message handler

**Data layer:**
- `data/agent_processes/store.ts` (Phase 05): `register({ ulid, pid, workspaceId?, projectId? })`
- `data/agents/store.ts`: `create({ id: ulid, name, role, ... })`

**Files to touch:**
- New: `electron/agent-handler.ts` — WS message dispatcher (Phase 52 will complete this; phase 39 implements AGENT_HELLO specifically)

**Verification:**
1. After Phase 37 launches agent
2. Agent sends AGENT_HELLO with `{ ulid, name, role }`
3. Host receives → inserts into `agents` and `agent_processes` tables
4. Agent appears in AgentsView list
5. Reload → agent persists

---

### Phase 40 — Wire workspace_agents + project_agents CRUD

**Status:** [BUILD]

**Goal:** Add/remove agents to/from workspaces and projects.

**Missing surfaces:**
- `M-005 / F-005 — Add Agent to Project picker` (could be inline in ProjectManageTab or a separate modal)

**Surfaces to modify:**
- `src/components/right-auxiliary/ProjectManageTab.tsx` — "Add agents" button (currently missing)

**Data layer changes:**
- `data/workspace_agents/store.ts` (Phase 02): `addAgentToWorkspace`, `removeAgentFromWorkspace`
- `data/project_agents/store.ts` (Phase 03): `addAgentToProject`, `removeAgentFromProject`

**Flows to wire:**
- F005 (Add agent to project)

**Files to touch:**
- `src/components/right-auxiliary/ProjectManageTab.tsx`
- `src/data/workspace_agents/store.ts`
- `src/data/project_agents/store.ts`

**Verification:**
1. Open project → Manage → "Add agents" button (new)
2. Picker shows workspace agents
3. Select agents → submit → agents added to project
4. X icon to remove (already Phase 26)
5. Reload → assignments persist

**Acceptance criteria:**
- Add/remove flows work
- Persist

---

### Phase 41 — Add new tab kinds

**Status:** [BUILD]

**Goal:** Add `workspace-agent` and `project-agent` to `CenterTabType` and `TabBody` dispatch.

**Missing surfaces:**
- Tab kinds: `workspace-agent`, `project-agent`
- Both render a placeholder for now (real chat views in Phase 42-43)

**Surfaces to modify:**
- `src/data/tabs/interface.ts` — add new kinds to `CenterTabType`
- `src/components/center-workspace/TabBody.tsx` — add cases (placeholder render)

**Data layer changes:** none

**Files to touch:**
- `src/data/tabs/interface.ts`
- `src/components/center-workspace/TabBody.tsx`

**Verification:**
1. `bun run typecheck` passes
2. Open app → no crashes
3. (Phases 42-43 will replace placeholder with real view)

**Acceptance criteria:**
- New kinds recognized
- Placeholder renders without errors

---

### Phase 42 — Build Workspace Agent chat view

**Status:** [BUILD]

**Goal:** Workspace Agent chat view with persistent thread per workspace.

**Missing surfaces:**
- `P-023 — Workspace Agent chat view`
- File: `src/components/center-workspace/WorkspaceAgentView.tsx`

**Surfaces to modify:**
- `src/components/center-workspace/TabBody.tsx` — `case 'workspace-agent'` renders this
- `src/data/tabs/store.ts` — `buildTab('workspace-agent', workspaceId, 'Workspace Agent')`

**Data layer changes:**
- `data/chat/store.ts` (Phase 06): `listThreads({ workspaceId, kind: 'workspace-agent' })`, `createThreadForWorkspace(workspaceId, title)`

**Flows to wire:**
- F010 (Workspace Agent session start)

**Files to touch:**
- New: `src/components/center-workspace/WorkspaceAgentView.tsx`
- `src/components/center-workspace/TabBody.tsx`
- `src/data/tabs/store.ts`
- `src/data/chat/store.ts`

**UI structure:**
- Similar to existing `ChatView` but workspace-scoped
- Header: "Workspace Agent" + workspace name
- Message thread
- Composer
- (Phase 52 will wire WS streaming)

**Verification:**
1. Open workspace → Workspace Agent tab (button somewhere; could be in Workspace header or left nav)
2. Send a message → appears in thread
3. Reload → thread persists
4. No agent streaming yet — manual response or stub

**Acceptance criteria:**
- View renders
- Thread persists
- Message send persists

---

### Phase 43 — Build Project Agent chat view

**Status:** [BUILD]

**Goal:** Project Agent chat view with persistent thread per project.

**Missing surfaces:**
- `P-022 — Project Agent chat view`
- File: `src/components/center-workspace/ProjectAgentView.tsx`

**Surfaces to modify:**
- `src/components/center-workspace/TabBody.tsx` — `case 'project-agent'`
- `src/data/tabs/store.ts` — `buildTab('project-agent', projectId, 'Project Agent')`

**Data layer changes:**
- `data/chat/store.ts`: `listThreads({ projectId, kind: 'project-agent' })`, `createThreadForProject(projectId, title)`

**Flows to wire:**
- F011 (Project Agent session start)

**Files to touch:**
- New: `src/components/center-workspace/ProjectAgentView.tsx`
- `src/components/center-workspace/TabBody.tsx`
- `src/data/tabs/store.ts`
- `src/data/chat/store.ts`

**UI structure:**
- Similar to existing ChatView but project-scoped
- Header: "Project Agent" + project name
- Message thread
- Composer
- (Phase 58 will add ticket-proposal cards inline)

**Verification:**
1. Open project → Project Agent tab (default tab for project detail?)
2. Send a message → appears
3. Reload → persists

**Acceptance criteria:**
- View renders
- Thread persists

---

### Phase 44 — Auto-spawn Workspace Agent on workspace create

**Status:** [BUILD]

**Goal:** Creating a workspace auto-starts a Workspace Agent subprocess.

**Missing surfaces:** none (logic + stub)

**Surfaces to modify:**
- `src/components/center-workspace/setup/WorkspaceSetupView.tsx` — after `createWorkspace`, spawn agent
- `src/components/settings/WorkspacesSettings.tsx` — same after dialog submit
- New IPC in `electron/main.ts`: `agent:create-default(workspaceId, ulid)` — invokes wizard (or stub for now)

**Data layer changes:**
- Calls the wizard (Phase 32-37) or uses a stub if wizard isn't built yet

**Files to touch:**
- `src/components/center-workspace/setup/WorkspaceSetupView.tsx`
- `src/components/settings/WorkspacesSettings.tsx`
- `electron/main.ts`
- `electron/agent-manager.ts` (or similar)

**Verification:**
1. Create workspace → Workspace Agent subprocess starts
2. WS connects → AGENT_HELLO → registered in DB
3. Open Workspace Agent tab → can chat

**Acceptance criteria:**
- Workspace creation auto-spawns agent

**Note:** If wizard (Phases 32-37) is not yet built, this phase uses a stub that creates a default agent with hard-coded config.

---

### Phase 45 — Auto-spawn Project Agent on project create

**Status:** [BUILD]

**Goal:** Creating a project auto-starts a Project Agent subprocess.

**Missing surfaces:** none (logic + stub)

**Surfaces to modify:**
- `src/components/center-workspace/CreateProjectDialog.tsx` — after `createProject`, spawn agent

**Data layer changes:**
- Calls wizard (Phase 32-37) or stub

**Files to touch:**
- `src/components/center-workspace/CreateProjectDialog.tsx`
- `electron/main.ts`
- `electron/agent-manager.ts`

**Verification:**
1. Create project → Project Agent subprocess starts
2. WS connects → registered
3. Open Project Agent tab → can chat

**Acceptance criteria:**
- Project creation auto-spawns agent

---

### Phase 46 — OKF initial bundle on project create

**Status:** [BUILD]

**Goal:** Creating a project writes initial OKF bundle to disk.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/center-workspace/CreateProjectDialog.tsx` — after `createProject`, create OKF bundle
- `electron/main.ts` — IPC `okf:create-bundle(projectId, title, description, successCriteria)`

**Data layer changes:**
- `data/okf/store.ts` (Phase 04): `createBundle({ projectId, title, description, successCriteria })`
- `data/okf/fs.ts` (Phase 04): write initial files

**Files to write on bundle creation:**
- `~/.superhive/okf/<project_id>/index.md`
- `~/.superhive/okf/<project_id>/objectives.md`
- `~/.superhive/okf/<project_id>/status.md`
- `~/.superhive/okf/<project_id>/log.md`
- Subdirs: `tickets/`, `decisions/`, `channels/`, `agents/`, `events/`

**Files to touch:**
- `src/components/center-workspace/CreateProjectDialog.tsx`
- `electron/main.ts`
- `electron/preload.ts`
- `src/data/okf/store.ts`
- `src/data/okf/fs.ts`

**Verification:**
1. Create project → folder exists at `~/.superhive/okf/<id>/`
2. All 4 root files exist with proper frontmatter
3. Subdirs exist (empty)
4. `data/okf_bundles` table has row

**Acceptance criteria:**
- Bundle created on project create

---

### Phase 47 — Project OKF sidebar/tree

**Status:** [BUILD]

**Goal:** Tree view of `~/.superhive/okf/<project_id>/` inside project detail.

**Missing surfaces:**
- `P-030 — Project OKF sidebar/tree`
- File: `src/components/center-workspace/OkfSidebar.tsx`

**Surfaces to modify:**
- `src/components/center-workspace/ProjectDetailView.tsx` — add OKF sidebar (right of project content)

**Data layer changes:**
- `data/okf/store.ts` (Phase 04): `listConcepts(projectId)` returns tree
- `data/okf/fs.ts` (Phase 04): `listBundleTree(projectId)`

**Files to touch:**
- New: `src/components/center-workspace/OkfSidebar.tsx`
- `src/components/center-workspace/ProjectDetailView.tsx`
- `src/data/okf/fs.ts`

**Verification:**
1. Open project → OKF sidebar visible
2. Tree shows index.md, objectives.md, status.md, subdirs
3. Click file → opens in viewer (Phase 48)
4. Search input visible (Phase 50 will wire)

**Acceptance criteria:**
- Tree renders
- Click → opens viewer

---

### Phase 48 — OKF concept viewer

**Status:** [BUILD]

**Goal:** Open single `.md` concept doc with parsed frontmatter + rendered body.

**Missing surfaces:**
- `P-031 — OKF concept viewer`
- File: `src/components/center-workspace/OkfConceptView.tsx`

**Surfaces to modify:**
- `src/components/center-workspace/ProjectDetailView.tsx` — when OKF sidebar file clicked, show viewer in main content

**Data layer changes:**
- `data/okf/fs.ts` (Phase 04): `readConcept(projectId, path)` returns `{ frontmatter, body }`

**Files to touch:**
- New: `src/components/center-workspace/OkfConceptView.tsx`
- `src/components/center-workspace/ProjectDetailView.tsx`
- `src/data/okf/fs.ts`

**Verification:**
1. Open project → OKF sidebar → click `tickets/<id>.md`
2. Viewer shows frontmatter (type, title, description, tags, timestamp)
3. Body rendered as markdown
4. Edit button visible (Phase 49)

**Acceptance criteria:**
- Concept renders correctly

---

### Phase 49 — OKF editor

**Status:** [BUILD]

**Goal:** Edit a concept `.md` file.

**Missing surfaces:**
- `P-032 — OKF editor`
- File: `src/components/center-workspace/OkfConceptEditor.tsx`

**Surfaces to modify:**
- `src/components/center-workspace/OkfConceptView.tsx` — "Edit" button opens editor

**Data layer changes:**
- `data/okf/fs.ts` (Phase 04): `writeConcept(projectId, path, content)`
- New IPC: `okf:write-concept`

**Files to touch:**
- New: `src/components/center-workspace/OkfConceptEditor.tsx`
- `src/components/center-workspace/OkfConceptView.tsx`
- `electron/main.ts` — IPC
- `electron/preload.ts`
- `src/data/okf/fs.ts`

**Verification:**
1. Open concept viewer → Edit → editor opens
2. Change frontmatter field → Save → file updated on disk
3. Change body → Save → file updated
4. `log.md` updated with new entry

**Acceptance criteria:**
- Edit works
- Persists to disk
- log.md updated

---

### Phase 50 — OKF search

**Status:** [BUILD]

**Goal:** Full-text search across OKF bundle.

**Missing surfaces:**
- `P-033 — OKF search`
- File: `src/components/center-workspace/OkfSearch.tsx`

**Surfaces to modify:**
- `src/components/center-workspace/OkfSidebar.tsx` — search input

**Data layer changes:**
- New IPC: `okf:search(projectId, query)`
- Implementation: use `ripgrep` if available, else simple `fs.readdirSync` + `readFileSync` + match

**Files to touch:**
- New: `src/components/center-workspace/OkfSearch.tsx`
- `src/components/center-workspace/OkfSidebar.tsx`
- `electron/main.ts` — IPC handler

**Verification:**
1. Open project → OKF sidebar → search "TODO"
2. Results list shows matching concepts
3. Click result → opens viewer

**Acceptance criteria:**
- Search works
- Results clickable

---

### Phase 51 — WebSocket host server in Electron main

**Status:** [BUILD]

**Goal:** Run a WS server on `ws://127.0.0.1:7711` inside Electron main process.

**Missing surfaces:** none (infrastructure)

**Surfaces to modify:**
- `electron/main.ts` — start WS server on app ready

**Files to touch:**
- `electron/main.ts`
- New: `electron/ws-server.ts`
- `package.json` — add `ws` dependency (already a common Node lib, not Bun-native)

**WS server behavior:**
- Listens on `ws://127.0.0.1:7711` (localhost only)
- Accepts connections from agent subprocesses
- Routes messages to handlers (Phase 52)
- Heartbeat monitoring: drop connections silent for >60s

**Verification:**
1. `bun run dev` → app boots → WS server starts
2. From terminal: `curl --include --no-buffer -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Key: test' -H 'Sec-WebSocket-Version: 13' http://127.0.0.1:7711/` → upgrade accepted
3. WS server logs connection

**Acceptance criteria:**
- Server running, accepts connections

---

### Phase 52 — WS protocol handler

**Status:** [BUILD]

**Goal:** Implement message handlers for AGENT_HELLO, AGENT_STATE, HEARTBEAT, PERMISSION_REQUEST, INTER_AGENT_MESSAGE.

**Missing surfaces:** none (handlers in Electron main)

**Surfaces to modify:**
- `electron/ws-server.ts` — message dispatcher
- `electron/agent-handler.ts` — handlers

**Data layer changes:**
- AGENT_HELLO → register in `agent_processes` (Phase 05) and `agents` (Phase 39)
- AGENT_STATE → update agent status + telemetry in `agents` table
- HEARTBEAT → update `last_heartbeat_at` in `agent_processes`
- PERMISSION_REQUEST → create row in `permission_requests` (Phase 08) + emit to renderer for toast (Phase 53)
- INTER_AGENT_MESSAGE → route to target agent

**Files to touch:**
- New: `electron/agent-handler.ts`
- `electron/ws-server.ts`
- `electron/main.ts` — IPC bridge to renderer for permission requests etc.
- Renderer-side: `src/lib/ws-client.ts` — receives events from main process IPC

**Verification:**
1. With a stub agent (general-v1 not built yet), send each message type via WS
2. DB updates accordingly
3. Renderer receives permission request events

**Acceptance criteria:**
- All 5 message types handled

---

### Phase 53 — Permission Request toast + history

**Status:** [BUILD]

**Goal:** When agent sends PERMISSION_REQUEST, show toast in UI + persistent history.

**Missing surfaces:**
- `M-020 / PR-003 — Permission Request toast`
- `P-034 — Permission Request history view`
- Files:
  - `src/components/ui/PermissionRequestToast.tsx`
  - `src/components/right-auxiliary/agent/PermissionHistory.tsx`

**Surfaces to modify:**
- `src/components/right-auxiliary/RightPanelTabs.tsx` — show history when agent context + Sessions tab active (or new Permissions tab)
- `src/screens/Dashboard.tsx` — listen for permission request events from main process

**Data layer changes:**
- `data/permission_requests/store.ts` (Phase 08): list, resolve

**Flows to wire:**
- F069 (Permission request)

**Files to touch:**
- New: `src/components/ui/PermissionRequestToast.tsx`
- New: `src/components/right-auxiliary/agent/PermissionHistory.tsx`
- `src/components/right-auxiliary/RightPanelTabs.tsx`
- `src/screens/Dashboard.tsx`

**Verification:**
1. Trigger PERMISSION_REQUEST from a test agent
2. Toast appears top-right with Approve/Deny
3. Click Approve → WS sends PERMISSION_GRANTED, request marked resolved
4. Click Deny → WS sends PERMISSION_DENIED
5. Open agent → Permissions tab → see history

**Acceptance criteria:**
- Toast appears
- Actions work
- History persists

---

### Phase 54 — Sub-agent nested view

**Status:** [BUILD]

**Goal:** Show sub-agents spawned by parent agent.

**Missing surfaces:**
- `P-035 — Sub-agent nested view`
- File: `src/components/right-auxiliary/agent/SubAgentList.tsx`

**Surfaces to modify:**
- `src/components/right-auxiliary/RightPanelTabs.tsx` — add "Sub-agents" tab for agent context (or include in Overview)

**Data layer changes:**
- `data/sub_agents/store.ts` (Phase 08): `listByParent(parentUlid)`

**Flows to wire:**
- F071 (Sub-agent spawn — partially; full WS in Phase 55)

**Files to touch:**
- New: `src/components/right-auxiliary/agent/SubAgentList.tsx`
- `src/components/right-auxiliary/RightPanelTabs.tsx`
- `src/data/sub_agents/store.ts`
- `src/data/config/right-panel-tabs.ts` — add 'sub-agents' tab id

**Verification:**
1. Insert a test sub_agent row with parent_ulid
2. Open parent agent → Sub-agents tab → see the sub-agent row
3. Status updates visible

**Acceptance criteria:**
- List renders
- Status updates

---

### Phase 55 — Sub-agent spawn toast

**Status:** [BUILD]

**Goal:** Toast for custom (non-builtin) sub-agent spawn requests.

**Missing surfaces:**
- `M-021 / PR-004 — Sub-agent spawn toast`
- File: `src/components/ui/SubAgentSpawnToast.tsx`

**Surfaces to modify:**
- `src/screens/Dashboard.tsx` — listen for SUBAGENT_SPAWN_REQUEST events

**Data layer changes:**
- `data/sub_agents/store.ts` (Phase 08): on approval, register sub-agent

**Flows to wire:**
- F071 (Sub-agent spawn — full WS roundtrip)

**Files to touch:**
- New: `src/components/ui/SubAgentSpawnToast.tsx`
- `src/screens/Dashboard.tsx`
- `electron/agent-handler.ts` — add SUBAGENT_SPAWN_REQUEST handler

**Verification:**
1. Trigger SUBAGENT_SPAWN_REQUEST from test agent (kind: custom)
2. Toast appears with agent name + sub-agent name
3. Approve → SUBAGENT_SPAWN_GRANTED sent back, sub_agent row created
4. Deny → SUBAGENT_SPAWN_DENIED sent back

**Acceptance criteria:**
- Toast + approval flow works

---

### Phase 56 — Cross-project agent view

**Status:** [BUILD]

**Goal:** View all projects an agent works on.

**Missing surfaces:**
- `P-036 — Cross-project agent view`
- File: `src/components/center-workspace/AgentProjectsView.tsx`

**Surfaces to modify:**
- `src/components/center-workspace/ChatView.tsx` — header link to "All projects"
- `src/components/center-workspace/TabBody.tsx` — add case (or use existing agent context)

**Data layer changes:**
- `data/project_agents/store.ts` (Phase 03): `listProjectsForAgent(agentId)` joins

**Files to touch:**
- New: `src/components/center-workspace/AgentProjectsView.tsx`
- `src/components/center-workspace/ChatView.tsx`
- `src/components/center-workspace/TabBody.tsx`
- `src/data/project_agents/store.ts`

**Verification:**
1. Assign agent to 2 projects (via Phase 40)
2. Open agent → "All projects" link → view shows both projects
3. Click project → switches context (updates right-aux)

**Acceptance criteria:**
- View shows all projects
- Context switching works

---

### Phase 57 — Ticket detail center tab

**Status:** [BUILD]

**Goal:** Full ticket detail in center panel.

**Missing surfaces:**
- `P-024 — Ticket detail center tab`
- File: `src/components/center-workspace/TicketDetailView.tsx`

**Surfaces to modify:**
- `src/components/center-workspace/TabBody.tsx` — add `case 'ticket'`
- `src/data/tabs/interface.ts` — already allows `ticket` kind? Verify.

**Data layer changes:** none (reads existing data)

**Flows to wire:**
- F026, F027, F028, F051 (manage tab actions all in one place)

**Files to touch:**
- New: `src/components/center-workspace/TicketDetailView.tsx`
- `src/components/center-workspace/TabBody.tsx`
- `src/data/tabs/interface.ts` (verify)
- `src/screens/Dashboard.tsx` — `handleTicketSelect` opens this tab

**UI structure:**
- Header: ticket id, status, priority, type
- Title + description
- Assignee card
- Related channel (clickable)
- Activity timeline
- Manage controls (status/priority/type/assignee) inline

**Verification:**
1. Click ticket in any list → center tab opens
2. All info visible
3. Edit fields → save → persists

**Acceptance criteria:**
- Detail view comprehensive
- Edit works

---

### Phase 58 — Project Agent ticket-proposal card

**Status:** [BUILD]

**Goal:** Inline card in Project Agent chat when agent proposes a ticket.

**Missing surfaces:**
- `M-005 — Project Agent ticket-proposal card`
- File: `src/components/chat/ProposalCard.tsx`

**Surfaces to modify:**
- `src/components/center-workspace/ProjectAgentView.tsx` (Phase 43) — render ProposalCard on TICKET_PROPOSAL message
- `electron/agent-handler.ts` — handle TICKET_PROPOSAL from agent, forward to renderer

**Data layer changes:**
- On Approve: create ticket via `data/tickets/store::create`
- Write OKF entry for the proposal

**Files to touch:**
- New: `src/components/chat/ProposalCard.tsx`
- `src/components/center-workspace/ProjectAgentView.tsx`
- `electron/agent-handler.ts`

**Card UI:**
- Header: "Proposed ticket"
- Body: title, description, suggested assignee
- Buttons: "Approve & Create" / "Edit" / "Cancel"

**Verification:**
1. From a test Project Agent, send TICKET_PROPOSAL message
2. Card appears in chat thread
3. Click Approve → ticket created, OKF entry written, agent notified
4. Click Edit → Create Ticket dialog opens pre-filled
5. Click Cancel → card dismissed

**Acceptance criteria:**
- Card renders
- Approval flow works
- Edit pre-fills

---

### Phase 59 — Kanban drag/drop

**Status:** [BUILD]

**Goal:** Drag tickets between Kanban columns to change status.

**Missing surfaces:** none (interaction on existing `KanbanBoard`)

**Surfaces to modify:**
- `src/components/center-workspace/KanbanBoard.tsx` — add drag handlers
- Could use `@dnd-kit/core` (or build simple drag handlers)

**Data layer changes:**
- `data/tickets/store.ts` — `setStatus(id, status)` already exists; just call it on drop

**Flows to wire:**
- F048 (Kanban drag/drop — currently [MISSING])

**Files to touch:**
- `src/components/center-workspace/KanbanBoard.tsx`
- `package.json` — add drag-drop lib if needed

**Verification:**
1. Open tickets tab → see kanban
2. Drag ticket from BACKLOG to EXECUTING
3. Drop → status updates, persists
4. Reload → still EXECUTING

**Acceptance criteria:**
- Drag works
- Persists

---

### Phase 60 — Consolidate ProjectsView vs ProjectDetailView

**Status:** [BUILD]

**Goal:** Remove duplication between `ProjectsView` and `ProjectDetailView`.

**Missing surfaces:** none

**Surfaces to modify:**
- `src/components/center-workspace/ProjectsView.tsx` — choose:
  - Delete `ProjectsView` and rely on `ProjectDetailView` for per-project + `UniversalProjectsView` for cross-workspace
  - OR make `ProjectsView` truly a workspace-overview (stats + project cards)
- Recommended: delete `ProjectsView`, keep only `universal-projects` and `project` (detail)

**Data layer changes:** none

**Files to touch:**
- `src/components/center-workspace/TabBody.tsx` — remove `case 'projects'` if deleting
- `src/components/center-workspace/ProjectsView.tsx` — delete or refactor
- `src/data/tabs/interface.ts` — remove `'projects'` kind if deleting

**Verification:**
1. Left nav → Projects → opens `universal-projects` (was happening already)
2. Click a project → opens `project` (detail)
3. No dead `projects` tab kind

**Acceptance criteria:**
- Clean, no duplicates

---

### Phase 61 — Tiering layer (deferred)

**Status:** [DEFERRED]

**Goal:** Per spec §10 — build the max-out app first; tiering is built last.

**Notes:** After all 60 phases complete, this phase introduces tier gates by removing/scoping features per the 4 tiers (free / pro / meta-hive / enterprise). The `billing.plan.tier` field already exists in settings.

**What this phase will produce (when run, post-everything-else):**
- Tier policy document
- Tier-gating layer (e.g., `useTier()` hook + `<TierGate required="pro">` component)
- Apply gates to relevant features
- Test each tier

**Verification:**
- Switch plan tier → features become available/unavailable accordingly

---

# End-to-end smoke test (after all phases)

After all 60 build phases complete, run this end-to-end test:

1. **Boot:** `bun run dev` → app launches, seed loads
2. **Create workspace:** Setup wizard → create "Test WS" → Workspace Agent spawns
3. **Create project:** Create project → Project Agent spawns, OKF bundle created
4. **Add agent:** AgentsView → "New Agent" → wizard → agent spawns
5. **Add to project:** Project Manage → add agents
6. **Create ticket:** Tickets → New Ticket → fill → submit
7. **Open ticket:** Click ticket → ticket detail tab opens
8. **Send channel message:** Open a channel → type → send
9. **Chat with Workspace Agent:** Workspace Agent tab → send → response streams
10. **Chat with Project Agent:** Project Agent tab → send → response streams + ticket proposal (if applicable)
11. **Browse OKF:** Open project → OKF sidebar → click file → view
12. **Edit OKF:** Edit a concept → save → file updated
13. **Search OKF:** Search "TODO" → results show
14. **Approve permission:** Trigger PERMISSION_REQUEST → toast → approve
15. **Spawn sub-agent:** Agent spawns custom sub-agent → toast → approve
16. **Cross-project view:** Agent header → All projects → see projects
17. **Drag ticket:** Drag ticket in kanban → status updates
18. **Settings:** All 11 pages render, persist
19. **Confirmations:** Archive project, delete workspace data — all work, OKF cleaned
20. **Restart:** `bun run dev` again → all state persists

---

# Commands cheat sheet

```sh
bun run typecheck      # tsc --noEmit — MANDATORY after every phase
bun run build          # typecheck + vite build
bun run dev            # hot-reload dev
bun run electron:build # build + electron-builder → release/

# Database inspection
sqlite3 "$HOME/Library/Application Support/superhive/.superhive/data.db" ".tables"
sqlite3 "$HOME/Library/Application Support/superhive/.superhive/data.db" "SELECT * FROM workspaces;"

# OKF bundle inspection
ls "$HOME/.superhive/okf/"
cat "$HOME/.superhive/okf/proj-1/index.md"

# Agent folder inspection
ls "$HOME/.superhive/agents/"
cat "$HOME/.superhive/agents/<ulid>/.general-v1/.identity"

# WS server
curl --include --no-buffer --http1.1 \
  -H 'Connection: Upgrade' \
  -H 'Upgrade: websocket' \
  -H 'Sec-WebSocket-Key: dGVzdA==' \
  -H 'Sec-WebSocket-Version: 13' \
  http://127.0.0.1:7711/
```