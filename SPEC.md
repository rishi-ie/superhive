# Superhive v1 — Product & Engineering Specification

> A digital agent workspace — a command center for orchestrating autonomous AI agents that run a company's digital workforce.

**Status:** v1 specification, locked
**Date:** 2026-06-30
**Owner:** Rishi

---

## Table of Contents

1. [Vision](#1-vision)
2. [Product overview](#2-product-overview)
3. [v1 scope & non-goals](#3-v1-scope--non-goals)
4. [User personas & first-run experience](#4-user-personas--first-run-experience)
5. [System architecture](#5-system-architecture)
6. [Monorepo layout](#6-monorepo-layout)
7. [On-disk layout](#7-on-disk-layout)
8. [Data model](#8-data-model)
9. [The General v1 agent](#9-the-general-v1-agent)
10. [SuperHive protocol — host implementation](#10-superhive-protocol--host-implementation)
11. [MCP server — tools for the agent](#11-mcp-server--tools-for-the-agent)
12. [Agent lifecycle](#12-agent-lifecycle)
13. [Audit queue & governance](#13-audit-queue--governance)
14. [SuperHive — Project Agent](#14-superhive--project-agent)
15. [MetaHive — read-only preview](#15-metahive--read-only-preview)
16. [Feature flows](#16-feature-flows)
17. [UI surface (panel by panel)](#17-ui-surface-panel-by-panel)
18. [Settings](#18-settings)
19. [OKF — Open Knowledge Format integration](#19-okf--open-knowledge-format-integration)
20. [Vendoring general-v1](#20-vendoring-general-v1)
21. [Cleanup / cut list](#21-cleanup--cut-list)
22. [Milestones](#22-milestones)
23. [Out of scope (v2+ backlog)](#23-out-of-scope-v2-backlog)
24. [Open items / TBDs](#24-open-items--tbds)
25. [Appendix A — current state inventory](#appendix-a--current-state-inventory)
26. [Appendix B — locked decisions log](#appendix-b--locked-decisions-log)

---

## 1. Vision

**Superhive** is a local-first desktop cockpit for managing a digital workforce — autonomous AI agents that execute the work of running a company. The user directs the workforce; the workforce does the work; the user governs the workforce.

The product is built on three pillars:

1. **The Cockpit** — a three-panel operations room (Fleet Command / Operations Deck / Avionics) where the user sees everything happening in real time: agents executing, tickets progressing, OKF concepts being updated, audit items awaiting decision.

2. **The General v1 Agent** — a portable, self-contained CLI agent (vendored as a folder inside the monorepo) that does the actual work. The agent reads the project's knowledge bundle (OKF), plans, edits code, runs commands, posts in channels, requests permission when needed, and reports back. It supports 12 LLM providers out of the box.

3. **SuperHive (Project Agent)** — a manager agent, one per project. The user talks to the project as if it were a colleague. The Project Agent decomposes the user's intent into tickets, assigns them to worker agents, coordinates them via channels, and reports progress. This is the **operational** version of "let the agents run things."

The **MetaHive** killer feature — a fully autonomous company-runner that orchestrates *every* project hands-off — is a v1 **read-only preview**. v1 ships the cockpit that makes MetaHive possible. v2 ships the autopilot.

---

## 2. Product overview

### 2.1 What the user does

A user opens Superhive and:

1. **Creates a workspace** — a logical grouping of projects (e.g., "Acme Robotics", "Quantum Labs").
2. **Creates a project** within a workspace — picks a directory on disk, names the project, describes success criteria. Superhive initializes the project directory: `git init`, OKF bundle (`index.md`, `log.md`, `concepts/`), and automatically spawns a **Project Agent**.
3. **Talks to the project** — opens the project's chat panel and writes: "Add user authentication with OAuth." The Project Agent reads the OKF, plans the work, and creates tickets: "Add OAuth provider config", "Build login UI", "Wire up callback handler". Each ticket is assigned to a worker agent.
4. **Hires worker agents** — creates worker agents (named, configured with model, permissions, system prompt). Assigns them to projects.
5. **Watches them work** — the activity feed shows real-time events; the OKF updates as the agent learns; the ticket board updates as work progresses.
6. **Governs** — when a worker wants to make a commit, run a sensitive command, or write outside its authority, the audit queue surfaces the request. The user clicks **Allow** or **Deny**.
7. **Configures** — sets the model, the commit authority, the budget cap, the data retention, the appearance, the keyboard shortcuts.

### 2.2 What the system does, without asking

- Maintains the General v1 agent's working state in the project's OKF
- Streams the agent's reasoning and tool calls into the chat thread
- Routes permission requests from agent to user
- Persists every state change to SQLite
- Aggregates presence (online/away/busy/offline) across the agent fleet
- Brokers inter-agent messages (channels)
- Snapshots the entire host state in `~/.superhive/superhive.db`

### 2.3 Product principles

1. **Local-first** — no cloud, no account, no sync. The user's data lives on the user's machine.
2. **Transparent** — every agent action is visible in real time.
3. **Governable** — every sensitive action is auditable and approvable.
4. **Composable** — agents are portable folders; projects are portable directories; everything is git-trackable.
5. **Standards-based** — OKF (Open Knowledge Format) for project knowledge, MCP for agent tools, WebSocket for host↔agent IPC, SQLite for storage.

---

## 3. v1 scope & non-goals

### 3.1 In scope (ships in v1)

- Three-panel desktop UI (Fleet Command / Operations Deck / Avionics)
- Workspace + project + agent + ticket + channel + chat data model, SQLite-backed
- Project directory creation with `git init` + OKF bundle + Project Agent auto-spawn
- General v1 agent vendored as a folder; spawn as child process; speak WS protocol
- SuperHive host (WS :7711 public, :7712 internal, SQLite, agent registry, permission router, message broker, presence, authority)
- MCP server exposing 17 tools to the agent
- Audit queue: live PERMISSION_REQUEST inbox; allow / deny / always-allow
- Settings push to agent (Control Matrix) via SETTINGS_UPDATE + agent ack
- Commit Authority (REVIEW_ONLY / AUTO_MERGE / DIRECT_MAIN) gates git operations
- Channels: project-scoped inter-agent communication threads; user can post
- Chat: per-agent user↔agent thread; messages stream to/from agent
- OKF viewer/editor in UI; agent reads/writes via MCP
- MetaHive read-only preview tab
- 10 settings pages, all wired
- Command palette, activity feed, telemetry deck, sessions panel, wizard — all real
- Activity feed with live events (auto-refresh + pause)
- Soft delete (archive) for projects and workspaces
- 12 LLM provider support (via the General v1 agent's env-var auto-detection)
- Bun workspace monorepo with three packages: `@superhive/app`, `@superhive/host`, `@superhive/protocol`, plus vendored `@superhive/general-v1`

### 3.2 Out of scope (v2+)

- **MetaHive functionality** — preview only in v1. The autonomous company-runner is v2.
- **Workspace Agent** — only Project Agent in v1. Cross-project orchestration is v2.
- **Cloud sync / multi-user / accounts** — strictly local.
- **Remote SuperHive** (binding to 0.0.0.0, TLS, API key auth) — wired but disabled. v1 binds to 127.0.0.1 only.
- **Notifications settings page** — removed from registry.
- **Accessibility settings page** — removed from registry.
- **Integrations settings page** — removed from registry (the sidebar entry is also removed).
- **Capability-tag matching for worker assignment** — explicit user assignment only in v1.
- **Cross-project channels** — channels are project-scoped only in v1.
- **Hard delete for projects** — soft (archive) only in v1.
- **Cloud-hosted git (GitHub/GitLab push)** — local repos only in v1.
- **Multi-project concurrent execution per worker** — one worker, one project at a time. Reassignment triggers a hard restart.
- **Workflows settings page functionality** — page exists but is "coming soon" (defer to v2).
- **Cost & Usage budget controls / spend alerts** — chart is functional; controls are "coming soon" (defer to v2).
- **Billing payment / plan changes beyond cosmetic** — tier selection works; "Update card" / "Add card" / "Contact sales" stubs removed.
- **OS keychain for API keys** — SQLite (plaintext) in v1, keychain in v2.
- **Per-tick rebase of general-v1** — manual only.
- **Drag-and-drop on Kanban** — optional in v1 (search/sort/filter work; DnD can be added incrementally).
- **Right-click context menus on tabs** — currently swallowed with no menu. Defer to v2.

---

## 4. User personas & first-run experience

### 4.1 Primary persona

**Rishi** — a founder or technical lead at a small-to-mid company, running operations with a small team. He wants AI agents to do the work that doesn't require human judgment — boilerplate code, data lookups, ticket triage, documentation updates. He needs to **see what the agents are doing** at all times, **approve** their sensitive actions, and **direct** them at a high level without micromanaging.

### 4.2 First-run experience

A user downloads Superhive, installs, and launches it. They see:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│             Superhive — Digital agent workspace                  │
│                                                                  │
│   You don't have any workspaces yet. Let's get started.          │
│                                                                  │
│   [ Create your first workspace ]                                │
│                                                                  │
│   [ Skip for now ]                                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

The user clicks **Create your first workspace** and a dialog prompts for a name. After creation:

```
┌──────────────────────────────────────────────────────────────────┐
│  Workspaces                                                       │
│  ─────────                                                       │
│  ✓ Create your workspace            [Acme Robotics]               │
│  • Add a project to a workspace     (coming soon)                 │
│  • Hire your first agent            (coming soon)                 │
│  • Configure models                 (coming soon)                 │
│                                                                  │
│  [ Skip for now ]                                                │
└──────────────────────────────────────────────────────────────────┘
```

The "Add a project" row opens the create-project dialog. The user fills in title, success criteria, picks a directory. Superhive:
1. Creates `~/.superhive/projects/<slug>/`
2. Runs `git init` with a default `.gitignore`
3. Seeds `index.md`, `log.md` with the user's success criteria
4. Spawns the **Project Agent** (a General v1 instance with a project-manager system prompt)
5. Returns the user to the project view

From there, the user opens the project's chat panel and starts talking to the Project Agent.

### 4.3 Returning-user experience

A returning user opens Superhive and sees their last workspace's home view: stats strip, top projects, top agents, top channels, mini kanban, activity feed. They click into whatever they were last working on.

---

## 5. System architecture

### 5.1 Process topology

```
┌────────────────────────────────────────────────────────────────────┐
│  Electron App (Superhive)                                           │
│                                                                    │
│  ┌──────────────┐  child_process.spawn  ┌──────────────────┐       │
│  │  Main        │──────────────────────▶│ General v1 agent │       │
│  │  Process     │  per agent            │ (portable CLI)   │       │
│  │              │                       │                  │       │
│  │  - Window    │                       │ SUPERHIVE_WS_URL │       │
│  │  - WS :7711  │◀───────────────────── │ =127.0.0.1:7711  │       │
│  │  - WS :7712  │  WS frames            │                  │       │
│  │  - MCP srv   │                       │ ~/.general-v1/   │       │
│  │  - SQLite    │                       │ state per agent  │       │
│  │  - Settings  │                       │                  │       │
│  │  - Agent     │                       └──────────────────┘       │
│  │    spawner   │                                                 │
│  └──────┬───────┘                                                 │
│         │ contextBridge IPC                                        │
│  ┌──────▼───────┐                                                 │
│  │  Preload     │  ws://127.0.0.1:7712 client (reconnect loop)    │
│  │  (sandbox)   │                                                 │
│  └──────┬───────┘                                                 │
│         │                                                          │
│  ┌──────▼───────┐                                                 │
│  │  Renderer    │  React SPA — three-panel UI                      │
│  │  (UI)        │  data ← host bridge (via preload IPC + WS :7712)│
│  └──────────────┘                                                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 Modules in `@superhive/host`

| Module | Responsibility |
|---|---|
| `server/` | WebSocket server on :7711. Per-connection handler. Frame validation. Heartbeat. Rate limiting. Close codes. |
| `connection.ts` | One `Connection` per agent socket. Envelope encode/decode. Lifecycle. |
| `envelope.ts` | The `Envelope<T>` type. ULID generation. Version check. |
| `registry/` | In-memory `AgentRecord` table. Manifest validation on AGENT_HELLO. Persistence to SQLite. Restoration on startup. |
| `permissions/` | PERMISSION_REQUEST queue. Default policy engine. PERMISSION_DECISION routing. Per-agent policy map (allowed/denied/ask). Persisted. |
| `messaging/` | Inter-agent broker. DM / broadcast / group. Channel DB-backed. History in `channel_messages` table. |
| `presence/` | online/away/busy/offline aggregation. Diffed snapshots to renderer. |
| `authority/` | Grant/revoke registry. Scope check. Auto-revoke on disconnect. |
| `state/` | Agent state aggregation. Latest AGENT_STATE per agent. |
| `ipc/` | Internal WS server on :7712 for the renderer. Auto-reconnect on the renderer side. Request/response correlation. |
| `persistence/` | SQLite via better-sqlite3. Schema migrations. Atomic writes. |
| `mcp/` | MCP server. Exposes 17 tools to the agent. Validates args. Writes to SQLite. |
| `agent-spawner/` | child_process.spawn for the General v1 CLI. Per-agent env vars. Lifecycle (start, kill, restart). |

### 5.3 Renderer data flow

```
User clicks "Allow" on audit item
  → React onClick → ipcRenderer.send('superhive:approve', { requestId })
  → preload forwards to host bridge (via WS :7712)
  → host updates audit_items table, sends PERMISSION_DECISION to agent (via :7711)
  → agent unblocks, continues
  → host emits PERMISSION_RESOLVED to renderer (via :7712)
  → React state updates, audit item moves to "Resolved" column
```

### 5.4 The two WebSocket ports

| Port | Direction | Purpose |
|---|---|---|
| **7711** | agent → host | Public (localhost in v1). General v1 agents connect here. |
| **7712** | renderer → host | Internal (always loopback). The Electron renderer connects here. |

The renderer never speaks 7711 directly. The host is the only process that knows about both ports.

---

## 6. Monorepo layout

```
superhive/                                    # repo root
├── package.json                              # bun workspaces
├── bun.lock
├── tsconfig.base.json                        # shared TS config
├── biome.json                                # shared lint/format
├── AGENTS.md                                 # contributor guide
├── README.md
├── SPEC.md
│
├── apps/
│   └── superhive/                            # Electron app (@superhive/app)
│       ├── src/                              # React renderer
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── index.css
│       │   ├── screens/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── types/
│       │   └── lib/                          # host-client.ts, data-shim.ts
│       ├── electron/
│       │   ├── main.ts                       # imports @superhive/host
│       │   └── preload.ts                    # exposes superhive API to renderer
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── electron-builder.yml
│       ├── components.json
│       └── package.json                      # name: @superhive/app
│
├── packages/
│   ├── general-v1/                           # git submodule (vendored, syncs with upstream)
│   │   ├── v1/                               # 12 modules (untouched)
│   │   │   ├── identity/
│   │   │   ├── docs/
│   │   │   ├── planning/
│   │   │   ├── browser/
│   │   │   ├── lancedb/
│   │   │   ├── mission-control/
│   │   │   ├── permission/
│   │   │   ├── sub-agent/
│   │   │   ├── sub-agent-context/
│   │   │   ├── communication/
│   │   │   ├── superhive/                    # reference impl of host protocol
│   │   │   └── integrations/
│   │   ├── meta-agent/
│   │   ├── scripts/
│   │   ├── docs/
│   │   ├── agent.sh
│   │   ├── setup.sh
│   │   ├── package.json
│   │   └── VENDORED.md                       # provenance + rebase notes
│   │
│   ├── superhive-host/                       # ported host (@superhive/host)
│   │   ├── src/
│   │   │   ├── server/
│   │   │   │   ├── public-server.ts          # WS :7711 (agent connections)
│   │   │   │   ├── internal-server.ts        # WS :7712 (renderer connections)
│   │   │   │   └── registry.ts               # in-memory agent table
│   │   │   ├── connection.ts                  # per-connection envelope handler
│   │   │   ├── envelope.ts                   # Envelope<T> + newId()
│   │   │   ├── host.ts                       # main orchestrator (startHost)
│   │   │   ├── persistence/                  # bun:sqlite schema + repos
│   │   │   │   ├── db.ts
│   │   │   │   ├── schema.ts                 # 18 tables
│   │   │   │   └── repos/                    # typed data access
│   │   │   ├── mcp/                          # MCP server (17 tools)
│   │   │   │   └── server.ts
│   │   │   ├── agent-spawner.ts              # child_process for general-v1
│   │   │   ├── project-creator.ts            # OKF + git init + Project Agent
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── superhive-protocol/                   # shared types (@superhive/protocol)
│       ├── src/
│       │   ├── envelope.ts                   # Envelope<T> + newId() + isEnvelope()
│       │   ├── close-codes.ts                 # 1000/1001/4400/4401/4403/4408/4500
│       │   ├── manifest.ts                    # AgentManifest, AgentRecord, etc.
│       │   ├── messages.ts                    # all message types
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
└── scripts/
    └── sync-general-v1.sh                    # git submodule update --remote wrapper
```

### 6.1 Root `package.json`

```json
{
  "name": "superhive",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "bun run --filter '@superhive/app' dev",
    "build": "bun run --filter '*' build",
    "typecheck": "bun run --filter '*' typecheck",
    "sync:v1": "bash scripts/sync-general-v1.sh"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^6.0.3"
  }
}
```

### 6.2 Dependency graph

```
@superhive/protocol  ◀── @superhive/host
                ◀────────── @superhive/app

@superhive/app  ──spawns as child process──▶  general-v1/agent.sh
```

- `@superhive/app` depends on `@superhive/host` and `@superhive/protocol` (workspace deps)
- `@superhive/host` depends on `@superhive/protocol` (workspace dep) — **not** on `general-v1`
- `general-v1/` is a **git submodule** — the app spawns it as a child process; the app never imports its code
- `@superhive/protocol` is **leaf** — no internal deps

### 6.3 Implementation status (as of v1 first cut)

| Layer | Status |
|---|---|
| `apps/superhive` (renderer + Electron main) | ✓ Working — uses shim backed by host client |
| `packages/superhive-protocol` | ✓ All message types from §10 |
| `packages/superhive-host` | ✓ Public server :7711, internal :7712, all 18 SQLite tables, agent registry, agent spawner, MCP server, project creator |
| `packages/general-v1` (submodule) | ✓ Vendored, untouched |
| Persistence | ✓ bun:sqlite, all repos typed |
| MCP server | ✓ 17 tools implemented |
| Build | ✓ `bun run build` produces dist/ and dist-electron/ |
| Typecheck | ✓ `bun run typecheck` passes strict |

---

## 7. On-disk layout

### 7.1 User-level (`$HOME`)

```
~/.superhive/
├── superhive.db                              # SQLite — all host data
├── config.json                               # host config (port, mode, etc.)
├── agents/                                   # General v1 agent folders (portable, separate)
│   ├── 01HXXXXXXXXXXXXXXXXXXXXXXXXX/         # worker "Elena" (ULID)
│   │   ├── .general-v1/                      # agent private state
│   │   │   ├── .identity                     # ULID
│   │   │   ├── sac/                          # cognitive state
│   │   │   │   ├── decisions.jsonl
│   │   │   │   ├── goals.jsonl
│   │   │   │   ├── open-loops.jsonl
│   │   │   │   └── epochs/
│   │   │   ├── vectors/                      # LanceDB
│   │   │   │   ├── decisions.lance
│   │   │   │   ├── epochs.lance
│   │   │   │   ├── events.lance
│   │   │   │   └── snapshots.lance
│   │   │   ├── mission-control/              # per-agent tickets
│   │   │   │   ├── open.json
│   │   │   │   ├── in-progress.json
│   │   │   │   └── done.json
│   │   │   ├── audit/                        # per-agent audit
│   │   │   └── communication/                # SuperHive settings store
│   │   ├── agent.sh                          # portable entry point
│   │   ├── setup.sh
│   │   └── identity.json                     # host-side metadata
│   └── 01HYYYYYYYYYYYYYYYYYYYYYYYY/         # project manager for proj-atlas
└── projects/                                 # project root directories
    └── atlas/                                # project slug
        ├── .git/                             # git init on project create
        ├── .gitignore                        # ignores node_modules, build artifacts
        ├── index.md                          # OKF root
        ├── log.md                            # OKF update log
        ├── concepts/                         # OKF concept files
        │   ├── architecture.md
        │   ├── decisions/
        │   │   ├── 2026-06-15-auth-strategy.md
        │   │   └── ...
        │   ├── schemas/
        │   │   └── users-table.md
        │   ├── playbooks/
        │   │   └── deploy.md
        │   └── references/
        │       └── external-api.md
        ├── src/                              # project work files
        ├── tests/
        └── README.md
```

### 7.2 Per-project — what the agent sees at runtime

When the host spawns a General v1 agent for a project, the agent's `--cwd` is set to the project root. The agent reads OKF files (markdown) for project context, writes back to them, edits project work files, runs commands, and operates within the `.git` repo.

The agent's own private state (`.general-v1/`) lives in its own folder at `~/.superhive/agents/<ulid>/.general-v1/`, **not** in the project. This separation means:

- A project is a portable directory — you can `tar` it up and move it; the agent's private state stays with the agent folder.
- A single agent can be reassigned to a different project; its memory (SAC, vectors, mission-control) follows the agent, not the project.
- The OKF is the shared knowledge; the agent's `.general-v1/` is the agent's private working memory.

### 7.3 Vendoring general-v1 — what ships in the monorepo

```
packages/general-v1/
├── v1/                                       # the agent source
├── meta-agent/                               # Pi Agent bootstrap
├── scripts/                                  # smoke tests
├── agent.sh                                  # portable entry
├── setup.sh
├── package.json                              # renamed to @superhive/general-v1
└── VENDORED.md                                # provenance
```

The vendored code is **not modified** in v1. Future patches are tracked in `VENDORED.md`. To update, the developer runs:

```bash
cd packages/general-v1
git remote add upstream https://github.com/rishi-ie/general-v1.git
git fetch upstream
git merge upstream/main --ff-only  # or resolve conflicts
```

---

## 8. Data model

### 8.1 SQLite tables (canonical)

```sql
-- Workspaces -----------------------------------------------------------------
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  color TEXT,
  created_at INTEGER NOT NULL,
  archived_at INTEGER
);

-- Projects -------------------------------------------------------------------
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  slug TEXT UNIQUE NOT NULL,
  root_path TEXT UNIQUE NOT NULL,             -- ~/.superhive/projects/<slug>
  title TEXT NOT NULL,
  description TEXT,
  success_criteria TEXT,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',     -- ACTIVE | ARCHIVED
  project_manager_agent_id TEXT REFERENCES agents(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  archived_at INTEGER
);

CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Agents ---------------------------------------------------------------------
CREATE TABLE agents (
  id TEXT PRIMARY KEY,                        -- host agent id (e.g., 'agent-elena')
  agent_ulid TEXT UNIQUE NOT NULL,            -- FK to ~/.superhive/agents/<ulid>
  name TEXT NOT NULL,
  role TEXT NOT NULL,                         -- WORKER | PROJECT_MANAGER
  model TEXT NOT NULL,                        -- default model
  system_prompt TEXT,                         -- constitution
  status TEXT NOT NULL DEFAULT 'IDLE',        -- IDLE | EXECUTING | COMPILING | AWAITING_HUMAN | ERROR_LOOP
  status_message TEXT,                        -- current task or status
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_seen_at INTEGER
);

-- Many-to-many: workers can be in multiple projects
CREATE TABLE agent_projects (
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_at INTEGER NOT NULL,
  PRIMARY KEY (agent_id, project_id)
);

-- Per-agent permissions (Control Matrix)
CREATE TABLE agent_permissions (
  agent_id TEXT PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  write_access INTEGER NOT NULL DEFAULT 1,    -- boolean
  commit_authority TEXT NOT NULL DEFAULT 'REVIEW_ONLY', -- REVIEW_ONLY | AUTO_MERGE | DIRECT_MAIN
  max_tokens INTEGER NOT NULL DEFAULT 8192,
  write_messages INTEGER NOT NULL DEFAULT 1,  -- can post in channels
  install_deps INTEGER NOT NULL DEFAULT 0,    -- can run npm install etc.
  model_engine TEXT,                          -- e.g., 'claude-sonnet-4-5'
  updated_at INTEGER NOT NULL
);

-- Per-agent latest telemetry (overwritten on each AGENT_STATE)
CREATE TABLE agent_telemetry (
  agent_id TEXT PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  context_saturation REAL,                    -- 0..1
  tokens_per_second REAL,
  current_cost REAL,
  evolution_loop TEXT,                        -- phase name
  logic_kernel_integrity REAL,                -- 0..1
  session_cost REAL,
  budget REAL,
  updated_at INTEGER NOT NULL
);

-- Per-agent action log (rolling buffer)
CREATE TABLE agent_action_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  time INTEGER NOT NULL,
  action TEXT NOT NULL
);
CREATE INDEX idx_action_log_agent ON agent_action_log(agent_id, time DESC);

-- Per-agent next step (most recent)
CREATE TABLE agent_next_step (
  agent_id TEXT PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  next_step TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Tickets --------------------------------------------------------------------
CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'BACKLOG',     -- BACKLOG | EXECUTING | REVIEW | MERGED | CLOSED
  priority TEXT NOT NULL DEFAULT 'MEDIUM',    -- HIGH | MEDIUM | LOW
  type TEXT NOT NULL DEFAULT 'FEATURE',       -- BUG | FEATURE | REFACTOR | INFRA
  assignee_agent_id TEXT REFERENCES agents(id),
  origin TEXT NOT NULL DEFAULT 'USER',        -- USER | PROJECT_AGENT
  origin_request TEXT,                        -- the user prompt that created this (if from PROJECT_AGENT)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  closed_at INTEGER
);
CREATE INDEX idx_tickets_project ON tickets(project_id);
CREATE INDEX idx_tickets_assignee ON tickets(assignee_agent_id);
CREATE INDEX idx_tickets_status ON tickets(status);

-- Channels (project-scoped) --------------------------------------------------
CREATE TABLE channels (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',        -- OPEN | AWAITING_REPLY | RESOLVED
  related_ticket_id TEXT REFERENCES tickets(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_message_at INTEGER
);
CREATE INDEX idx_channels_project ON channels(project_id);

CREATE TABLE channel_participants (
  channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,              -- agent_id or 'host' (the user)
  PRIMARY KEY (channel_id, participant_id)
);

CREATE TABLE channel_messages (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,                    -- agent_id or 'host'
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_ai INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_channel_messages_channel ON channel_messages(channel_id, created_at);

-- Chat threads (user ↔ agent) ------------------------------------------------
CREATE TABLE chat_threads (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_chat_threads_agent ON chat_threads(agent_id);

CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                         -- 'user' | 'assistant'
  content TEXT NOT NULL,
  model TEXT,
  token_count INTEGER,
  duration_ms INTEGER,
  feedback TEXT,                              -- 'up' | 'down' | null
  status TEXT NOT NULL DEFAULT 'sent',        -- sending | sent | error
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_chat_messages_thread ON chat_messages(thread_id, created_at);

-- Audit items (PERMISSION_REQUEST inbox) -------------------------------------
CREATE TABLE audit_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,                         -- AUTH_INTERCEPT | DIFF_REVIEW
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scope TEXT,                                 -- e.g., 'repo:proj-atlas' | 'paths:src/auth/*'
  pr_id TEXT,                                 -- for diff review
  touched_files TEXT,                         -- JSON array
  request_id TEXT UNIQUE NOT NULL,            -- the protocol's requestId
  tool TEXT NOT NULL,                         -- the tool that was requested
  tool_args TEXT,                             -- JSON of the tool args
  reason TEXT,                                -- the agent's reason
  severity TEXT NOT NULL DEFAULT 'medium',    -- low | medium | high | critical
  status TEXT NOT NULL DEFAULT 'PENDING',     -- PENDING | APPROVED | DENIED
  decided_at INTEGER,
  decided_by TEXT,                            -- 'user' | 'policy:allow' | 'policy:deny'
  remember INTEGER NOT NULL DEFAULT 0,        -- did the user mark "remember"?
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_audit_items_agent ON audit_items(agent_id);
CREATE INDEX idx_audit_items_status ON audit_items(status);

-- Pending questions (agent asks user) ----------------------------------------
CREATE TABLE pending_questions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  thread_id TEXT,
  message_id TEXT,
  question TEXT NOT NULL,
  options TEXT,                               -- JSON array of options
  status TEXT NOT NULL DEFAULT 'PENDING',     -- PENDING | ANSWERED
  answer TEXT,
  answered_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_questions_agent ON pending_questions(agent_id);

-- Favorites ------------------------------------------------------------------
CREATE TABLE favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                         -- 'project' | 'agent'
  target_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(type, target_id)
);

-- Activity events (unified activity feed) ------------------------------------
CREATE TABLE activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,                         -- see ActivityKind enum
  workspace_id TEXT,
  project_id TEXT,
  actor_id TEXT,                              -- agent_id or 'host' or 'user'
  actor_name TEXT,
  target_id TEXT,
  target_name TEXT,
  message TEXT NOT NULL,
  ref_type TEXT,                              -- 'ticket' | 'agent' | 'channel' | 'audit'
  ref_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_activity_created ON activity_events(created_at DESC);
CREATE INDEX idx_activity_project ON activity_events(project_id);
CREATE INDEX idx_activity_workspace ON activity_events(workspace_id);

-- OKF concept cache ----------------------------------------------------------
CREATE TABLE okf_concepts_cache (
  id TEXT PRIMARY KEY,                        -- project_id + '/' + path
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,                         -- path within the OKF, e.g., 'schemas/users.md'
  type TEXT,                                  -- OKF frontmatter type
  title TEXT,
  description TEXT,
  tags TEXT,                                  -- JSON array
  mtime INTEGER NOT NULL,                     -- last modified time
  sha TEXT NOT NULL                           -- content hash for change detection
);
CREATE INDEX idx_okf_concepts_project ON okf_concepts_cache(project_id);

-- Authority grants -----------------------------------------------------------
CREATE TABLE authority_grants (
  id TEXT PRIMARY KEY,
  from_agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  to_agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,                        -- JSON: { tools, paths, actions }
  granted_at INTEGER NOT NULL,
  expires_at INTEGER,
  revoked_at INTEGER,
  revoked_reason TEXT
);

-- Presence (latest snapshot per agent) ---------------------------------------
CREATE TABLE presence (
  agent_id TEXT PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL,                       -- online | away | busy | offline
  activity TEXT,
  last_seen_at INTEGER NOT NULL
);

-- API keys (plaintext in v1) -------------------------------------------------
CREATE TABLE api_keys (
  provider TEXT PRIMARY KEY,                  -- 'anthropic' | 'openai' | 'google' | ...
  api_key TEXT NOT NULL,
  base_url TEXT,
  added_at INTEGER NOT NULL,
  last_used_at INTEGER
);

-- Settings (the renderer-side appearance/preferences) ------------------------
-- This is the existing settings storage, unchanged in v1. Already in
-- localStorage as 'superhive-settings-v2'. In v1, we keep it there OR move
-- to SQLite. Decision: keep in localStorage (it's a renderer concern).
-- Models settings (provider configs) ALSO live here.
```

### 8.2 Two "workspaces" sets — resolved

In the current code, there are two parallel "workspaces" sets:

- `mockableData.workspaces` (4 entries: acme/quantum/field/cs) — runtime
- `settings.workspaces.workspaces` (2 entries: ws-vela/ws-cosmos) — settings page

In v1, the runtime `workspaces` table is the **only** source of truth. The Workspaces settings page reads from this same table. The `settings.workspaces` field is **removed** from the `Settings` type.

### 8.3 What changes from current code

| Current | v1 |
|---|---|
| `mockableData.workspaces` | `workspaces` SQLite table |
| `mockableData.projects` | `projects` SQLite table |
| `mockableData.agents` | `agents` SQLite table |
| `mockableData.telemetry` | `agent_telemetry` SQLite table |
| `mockableData.permissions` | `agent_permissions` SQLite table |
| `mockableData.actionLogs` | `agent_action_log` SQLite table |
| `mockableData.nextSteps` | `agent_next_step` SQLite table |
| `mockableData.auditItems` | `audit_items` SQLite table |
| `mockableData.pendingQuestions` | `pending_questions` SQLite table |
| `mockableData.chatThreads` | `chat_threads` + `chat_messages` SQLite tables |
| `mockableData.favorites` | `favorites` SQLite table |
| `mockableData.channelMessages` | `channel_messages` SQLite table |
| `mockableData.costUsage` | (cost tracking in `agent_telemetry.current_cost`, `session_cost`) |
| `mockableData.chatQuickStart` | static config in `packages/superhive-host/src/config/chat-quickstart.ts` |
| `mockableData.customThemes` | (themes are in settings, unchanged) |
| `mockableData.homeActivityEvents` | derived at runtime from other tables (no cache) |
| `mock.json` | **removed** |
| `src/data/mock/` | **removed** |
| `VITE_USE_MOCK_DATA` env var | **removed** |

### 8.4 Data layer convention (preserved)

Each domain still has `interface.ts` (types) and `store.ts` (functions). The store is the only public API. But the implementation now reads from / writes to SQLite via the host bridge (or directly via better-sqlite3 in main).

Renderer-side stores:

- Call the host bridge via the preload IPC surface
- Receive a `Promise<T>` per call
- React components use the same `useState`/Context patterns as today

Main-side stores (used by the host and the spawner):

- Direct better-sqlite3 access
- Synchronous reads, async writes
- Schema migrations in `packages/superhive-host/src/persistence/migrations/`

---

## 9. The General v1 agent

### 9.1 What it is

General v1 is a portable, self-contained CLI agent built on [Pi Agent](https://github.com/earendil-works/pi). It has 12 integrated modules:

- `identity` — name, role, principles, boundaries
- `docs` — command reference, self-description
- `planning` — file-based plans (`task_plan.md`), SHA-256 attestation
- `browser` — browser automation via browser-use
- `lancedb` — hybrid vector + full-text semantic memory
- `mission-control` — ticket tracking with LLM auto-capture
- `permission` — policy-based tool/bash permissions
- `sub-agent` — spawn child agents (8 built-in types + custom)
- `sub-agent-context` (SAC) — persistent memory: decisions, goals, open loops, lineage epochs
- `communication` — SuperHive WS client
- `superhive` — host-side reference implementation (we **port** this, don't reuse it directly)
- `integrations` — 7 cross-module wirings

It supports 12 LLM providers via env-var auto-detection:

| Provider | Env var | Default model |
|---|---|---|
| MiniMax | `MINIMAX_API_KEY` | MiniMax-M3 |
| Anthropic | `ANTHROPIC_API_KEY` | claude-sonnet-4-5 |
| Google Gemini | `GEMINI_API_KEY` | gemini-2.5-flash |
| OpenAI | `OPENAI_API_KEY` | gpt-4o |
| DeepSeek | `DEEPSEEK_API_KEY` | deepseek-chat |
| Groq | `GROQ_API_KEY` | llama-3.3-70b-versatile |
| Mistral | `MISTRAL_API_KEY` | mistral-large-latest |
| OpenRouter | `OPENROUTER_API_KEY` | anthropic/claude-3.5-sonnet |
| Together AI | `TOGETHER_API_KEY` | meta-llama/Llama-3.3-70B-Instruct |
| Fireworks AI | `FIREWORKS_API_KEY` | llama-v3p1-70b |
| NVIDIA NIM | `NVIDIA_API_KEY` | nvidia/llama-3.1-nemotron-70b-instruct |
| HuggingFace | `HF_TOKEN` | meta-llama/Llama-3.3-70B-Instruct |

The host's role is to **set the right env vars** when spawning the agent. The agent handles provider detection internally.

### 9.2 How the host spawns an agent

When the user opens an agent's chat tab, or assigns it a ticket, the host calls `agent-spawner.spawn(agent)`:

```typescript
function spawn(agent: Agent): ChildProcess {
  const agentDir = `~/.superhive/agents/${agent.agentUlid}/`;
  const projectDir = `~/.superhive/projects/${currentProjectSlug}/`;

  const env = {
    ...process.env,
    SUPERHIVE_WS_URL: 'ws://127.0.0.1:7711',
    SUPERHIVE_API_KEY: getOrCreateHostApiKey(),
    ANTHROPIC_API_KEY: getApiKey('anthropic'),
    OPENAI_API_KEY: getApiKey('openai'),
    // ... other provider keys from api_keys table
  };

  return spawn(`${agentDir}/agent.sh`, [
    '--cwd', projectDir,
    '--provider', 'anthropic',
    '--model', agent.model,
    '-n', agent.name,
  ], { env, cwd: projectDir });
}
```

The agent boots, reads the OKF, connects to `ws://127.0.0.1:7711`, sends `AGENT_HELLO` with its manifest. The host validates, replies `HOST_WELCOME`, adds it to the registry.

### 9.3 Per-agent folder layout

```
~/.superhive/agents/<ulid>/
├── .general-v1/                              # agent private state
├── agent.sh                                  # portable entry
├── setup.sh                                  # one-time setup
└── identity.json                             # host-side metadata
```

`identity.json` is host-side metadata; the agent's own identity is the ULID stored in `.general-v1/.identity`.

```json
{
  "ulid": "01HXXX...",
  "name": "Elena",
  "role": "WORKER",
  "model": "claude-sonnet-4-5",
  "systemPrompt": "You are a senior backend engineer...",
  "createdAt": 1735689600000
}
```

The host writes this file when the user creates the agent. The agent reads it via its `v1/identity/` module.

### 9.4 Agent capabilities & settings

The agent's `AGENT_HELLO` includes a `manifest` with `capabilities` and a `settingsSchema`. The host stores these in memory and uses the schema to validate `SETTINGS_UPDATE` patches.

Example manifest from the protocol spec:

```json
{
  "manifest": {
    "name": "general-v1",
    "version": "1.0.0",
    "description": "General purpose digital employee",
    "capabilities": ["planning", "browser", "memory"],
    "settingsSchema": {
      "type": "object",
      "properties": {
        "maxConcurrent": { "type": "number", "default": 4 }
      }
    },
    "modules": {
      "memory": { "version": "1.0.0", "settingsSchema": { ... } },
      "permission": { "version": "1.0.0", "settingsSchema": { ... } }
    },
    "interAgent": {
      "acceptsDMs": true,
      "acceptsBroadcasts": true,
      "groups": ["software", "research"]
    }
  }
}
```

The host's **Control Matrix UI** is rendered dynamically from this schema. In v1, the UI shows the static control set from `agent_permissions` table (model, write_access, commit_authority, max_tokens, write_messages, install_deps), and the host translates these into a `SETTINGS_UPDATE` patch against the agent's actual `settingsSchema`.

### 9.5 Agent lifecycle (full)

```
[User creates agent in UI]
  → Host creates ~/.superhive/agents/<ulid>/
  → Inserts agents row (status=IDLE)
  → Inserts agent_projects rows (for each project the user assigned)
  → (No process spawned yet)

[User opens agent chat, OR user assigns a ticket to agent, OR user clicks "Run"]
  → Host calls agent-spawner.spawn(agent)
  → spawn() builds env, sets cwd, launches agent.sh
  → Agent process boots, reads OKF, connects WS :7711
  → Agent sends AGENT_HELLO (manifest, settingsSchema, capabilities)
  → Host validates, stores in registry, sends HOST_WELCOME
  → Host emits AGENT_CONNECTED to renderer (:7712)
  → Renderer: agent appears in registry, status=ONLINE
  → Agent starts heartbeat (15s)

[Agent works — periodic AGENT_STATE pushes]
  → Agent sends AGENT_STATE { state, metrics }
  → Host updates agent_telemetry, agent_presence, emits AGENT_STATE_CHANGED to renderer
  → Renderer: telemetry deck updates live

[Agent wants to do something privileged]
  → Agent sends PERMISSION_REQUEST { requestId, tool, args, reason, severity }
  → Host inserts audit_items row, emits PERMISSION_REQUESTED
  → Renderer: AgentInbox shows new card
  → User clicks Allow / Deny
  → Renderer sends APPROVE_PERMISSION or DENY_PERMISSION via :7712
  → Host updates audit_items, sends PERMISSION_DECISION to agent
  → Agent unblocks
  → If remember=true, host persists a default policy in ~/.superhive/permissions/<agent_id>.json

[User edits Control Matrix]
  → Renderer sends PUSH_SETTINGS { agentId, patch }
  → Host validates against agent's settingsSchema
  → Host sends SETTINGS_UPDATE to agent
  → Agent validates, applies, sends SETTINGS_APPLIED or SETTINGS_REJECTED
  → Host updates agent_permissions, emits SETTINGS_PUSH_RESULT to renderer

[User reassigns agent to a different project]
  → Renderer sends COMMAND { command: 'pause' } to agent
  → Agent pauses (acknowledges via AGENT_STATE)
  → Host sends KICK
  → Agent process exits
  → Host updates agent_projects
  → Host respawns on new project (different --cwd)

[User terminates agent / closes app / agent crashes]
  → Host sends KICK (or detects process exit)
  → Agent sends DISCONNECT
  → Host removes from registry, status=OFFLINE
  → Host emits AGENT_DISCONNECTED to renderer
  → Renderer: agent marked offline
```

---

## 10. SuperHive protocol — host implementation

### 10.1 Source of truth

The full protocol is defined in `packages/general-v1/v1/superhive/docs/PROTOCOL.md`. The host implements the host side of every message type. The renderer-side message types are an internal convention (port :7712).

The `@superhive/protocol` package exports the **types** for all messages. The host validates every inbound frame against these types.

### 10.2 Public port :7711 (agent ↔ host)

**Inbound (agent → host):**

| Type | What the host does |
|---|---|
| `AGENT_HELLO` | Validate manifest. Assign agentId, sessionId. Send HOST_WELCOME. Add to registry. Emit AGENT_CONNECTED. |
| `AGENT_STATE` | Update agent_telemetry, agent_presence. Emit AGENT_STATE_CHANGED. |
| `HEARTBEAT` | Update last_seen. Reply HEARTBEAT_ACK. |
| `PERMISSION_REQUEST` | Insert audit_items row. Emit PERMISSION_REQUESTED. Block agent until decision. |
| `INTER_AGENT_MESSAGE` | Look up recipient. If DM: forward. If group: forward to all group members. If broadcast: forward to all except sender. Persist to channel_messages if a channel. |
| `AUTHORITY_GRANT` | Insert authority_grants row. Emit AUTHORITY_CHANGED. |
| `AUTHORITY_REVOKE` | Update authority_grants.revoked_at. Emit AUTHORITY_CHANGED. |
| `PRESENCE_UPDATE` | Update presence table. Emit PRESENCE_CHANGED. |
| `SETTINGS_APPLIED` | Update settings hash. Emit SETTINGS_PUSH_RESULT { ok: true }. |
| `SETTINGS_REJECTED` | Log errors. Emit SETTINGS_PUSH_RESULT { ok: false, errors }. Roll back local settings. |
| `DISCONNECT` | Mark agent OFFLINE. Emit AGENT_DISCONNECTED. Close connection gracefully. |

**Outbound (host → agent):**

| Type | When sent |
|---|---|
| `HOST_WELCOME` | Reply to AGENT_HELLO |
| `SETTINGS_UPDATE` | On user edits in Control Matrix |
| `PERMISSION_DECISION` | On user approve/deny |
| `INTER_AGENT_DELIVERY` | When another agent sends to this one |
| `AUTHORITY_REVOKED` | When a grant is revoked |
| `PRESENCE_SNAPSHOT` | On connect and on change |
| `COMMAND` | User-initiated: reload / restart / pause / resume |
| `HEARTBEAT_ACK` | Reply to HEARTBEAT |
| `KICK` | User terminates agent / app shutdown |

### 10.3 Internal port :7712 (renderer ↔ host)

**Inbound (renderer → host):**

| Type | What the host does |
|---|---|
| `LIST_AGENTS` | Reply with INITIAL_SNAPSHOT |
| `APPROVE_PERMISSION` | Send PERMISSION_DECISION to agent. Update audit_items. |
| `DENY_PERMISSION` | Send PERMISSION_DECISION. Update audit_items. |
| `PUSH_SETTINGS` | Validate against agent's settingsSchema. Send SETTINGS_UPDATE. |
| `SEND_MESSAGE` | Forward as INTER_AGENT_MESSAGE to target agent. |
| `REVOKE_AUTHORITY` | Update authority_grants. Send AUTHORITY_REVOKED. |
| `KICK_AGENT` | Send KICK. Wait for DISCONNECT or timeout. |
| `SEND_COMMAND` | Send COMMAND to agent. |

**Outbound (host → renderer):**

| Type | When sent |
|---|---|
| `AGENT_CONNECTED` | New agent added to registry |
| `AGENT_DISCONNECTED` | Agent removed from registry |
| `AGENT_STATE_CHANGED` | Agent sent AGENT_STATE |
| `PERMISSION_REQUESTED` | Agent sent PERMISSION_REQUEST |
| `PERMISSION_RESOLVED` | User approved/denied |
| `INTER_AGENT_DELIVERY` | Agent received a message from another agent |
| `AUTHORITY_CHANGED` | Grant/revoke |
| `PRESENCE_CHANGED` | Any agent's presence changed |
| `SETTINGS_PUSH_RESULT` | Agent applied/rejected settings |
| `AUDIT_EVENT` | Significant host action (settings changed, agent killed, etc.) |
| `LOG` | Host log line (level, source, message) |
| `INITIAL_SNAPSHOT` | On renderer connect (replaces LIST_AGENTS reply) |

### 10.4 Connection lifecycle (port :7711)

```
Agent                              Host
  |                                  |
  |--- WS Upgrade ------------------▶|
  |                                  |
  |<-- 101 Switching Protocols ------|
  |                                  |
  |--- AGENT_HELLO (manifest) ------▶|
  |                                  |--- validate manifest
  |<-- HOST_WELCOME (agentId) ------|
  |                                  |
  |--- HEARTBEAT (every 15s) ------▶|
  |<-- HEARTBEAT_ACK ---------------|
  |                                  |
  |--- AGENT_STATE / etc. --------▶|
  |                                  |
  |<-- SETTINGS_UPDATE ------------|
  |--- SETTINGS_APPLIED ---------->|
  |                                  |
  |--- PERMISSION_REQUEST --------▶|
  |                                  |--- (blocks)
  |<-- PERMISSION_DECISION --------|
  |                                  |
  |--- WS Close -------------------▶|
  |<-- 1000 Normal closure ---------|
```

### 10.5 Close codes

| Code | Meaning |
|---|---|
| 1000 | Normal closure |
| 1001 | Server going away |
| 4400 | Bad request / invalid frame |
| 4401 | Unauthorized (deferred in v1) |
| 4403 | Kicked |
| 4408 | Heartbeat timeout |
| 4500 | Internal server error |

### 10.6 Renderer connection (port :7712)

The renderer connects on app startup. The host sends `INITIAL_SNAPSHOT` immediately. After that, all changes are pushed.

If the renderer disconnects, the host buffers the most recent N events (configurable, default 100) and replays them on reconnect. After that, dropped events are lost (the renderer can re-fetch via `LIST_AGENTS`).

### 10.7 Settings push flow (the most complex one)

```
User edits max_tokens from 8192 to 16384 in Control Matrix
  → Renderer sends PUSH_SETTINGS { agentId, patch: [{ op: 'replace', path: '/maxTokens', value: 16384 }] }
  → Host validates patch against agent.settingsSchema (JSON Schema via ajv)
  → Host updates agent_permissions table
  → Host sends SETTINGS_UPDATE to agent
  → Agent validates, applies, sends SETTINGS_APPLIED { settingsHash }
  → Host updates settings hash, emits SETTINGS_PUSH_RESULT { ok: true } to renderer
  → UI: green check, "Settings applied"
```

If the agent rejects:

```
  → Agent sends SETTINGS_REJECTED { settingsHash, reason, errors }
  → Host rolls back agent_permissions to previous value
  → Host emits SETTINGS_PUSH_RESULT { ok: false, errors } to renderer
  → UI: red banner, "Agent rejected: <errors[0].message>"
```

---

## 11. MCP server — tools for the agent

The host runs an MCP server that agents can call. Tools (17 total in v1):

### 11.1 Tickets

| Tool | Args | Returns |
|---|---|---|
| `list_tickets` | `project_id, status?` | `Ticket[]` |
| `get_ticket` | `ticket_id` | `Ticket` |
| `create_ticket` | `project_id, title, description, priority, type, assignee_agent_id?` | `Ticket` |
| `update_ticket` | `ticket_id, patch` (e.g., `{status, assignee_agent_id}`) | `Ticket` |
| `close_ticket` | `ticket_id` | `Ticket` |

### 11.2 OKF

| Tool | Args | Returns |
|---|---|---|
| `list_concepts` | `project_id, tag?` | `[{path, type, title, description, tags}]` (from `okf_concepts_cache`) |
| `get_concept` | `project_id, path` | `{frontmatter, body}` (full markdown read from disk) |
| `create_concept` | `project_id, path, frontmatter, body` | `{path, sha}` (audit-gated if outside agent's authority) |
| `update_concept` | `project_id, path, frontmatter, body` | `{path, sha}` (audit-gated) |
| `append_log_entry` | `project_id, entry` | `void` |

### 11.3 Channels

| Tool | Args | Returns |
|---|---|---|
| `list_channels` | `project_id, status?` | `Channel[]` |
| `get_channel` | `channel_id` | `Channel + recent messages` |
| `post_channel_message` | `channel_id, content` | `ChannelMessage` |
| `mark_channel_status` | `channel_id, status` | `Channel` |

### 11.4 Other agents (for SuperHive coordination)

| Tool | Args | Returns |
|---|---|---|
| `list_project_agents` | `project_id` | `Agent[]` (returns the project manager + all assigned workers) |
| `get_agent` | `agent_id` | `Agent` |
| `send_inter_agent_message` | `to_agent_id, kind, payload` | `void` (sends via INTER_AGENT_MESSAGE) |

### 11.5 Chat (user ↔ agent)

| Tool | Args | Returns |
|---|---|---|
| `post_chat_message` | `thread_id, content, role` | `ChatMessage` |
| `read_chat_history` | `thread_id, limit?` | `ChatMessage[]` |

### 11.6 Project state

| Tool | Args | Returns |
|---|---|---|
| `get_project` | `project_id` | `Project` |
| `get_project_status` | `project_id` | `{open_tickets, executing_tickets, recent_activity, okf_concept_count, last_agent_action_at}` |

That's 17 tools. The full list is a v1 commitment. Adding more is a v1.x iteration; subtracting is a breaking change for any agent that uses the removed tool.

### 11.7 MCP server implementation notes

- **Transport:** stdio (the agent calls the MCP server via its own process; the host launches the MCP server alongside the agent). Alternative: HTTP — but stdio is the MCP default and avoids port conflicts.
- **Validation:** every tool validates args against a JSON Schema before execution.
- **Audit:** `create_concept`, `update_concept`, `post_channel_message`, `create_ticket` are audit-gated (the agent's permissions determine whether the call goes through or returns an error).
- **Errors:** every tool returns either `{ ok: true, data }` or `{ ok: false, error: { code, message } }`. The agent handles errors in its reasoning loop.

---

## 12. Agent lifecycle

### 12.1 States

| State | Meaning |
|---|---|
| `IDLE` | Folder exists, no process running. |
| `STARTING` | Process spawning, WS connecting. |
| `ONLINE` | AGENT_HELLO received, in registry. |
| `EXECUTING` | Currently working on a task. |
| `COMPILING` | Intermediate state (e.g., building code). |
| `AWAITING_HUMAN` | Asked a question, waiting for user. |
| `ERROR_LOOP` | Repeated errors, may need intervention. |
| `OFFLINE` | Process exited or KICKed. |

### 12.2 Spawn triggers

The host spawns an agent when:

1. The user opens the agent's chat tab (idle → online)
2. The user assigns a ticket to the agent (idle → online, ticket → EXECUTING)
3. The user explicitly clicks "Run" on the agent
4. A Project Agent creates a ticket and assigns it (this triggers the host to spawn the worker)

### 12.3 Despawn triggers

The host despawns an agent when:

1. The user clicks "Terminate" (sends COMMAND { pause } then KICK)
2. The app shuts down (sends KICK to all)
3. The agent process exits unexpectedly (detected via child_process 'exit' event)
4. The agent sends DISCONNECT (graceful shutdown)
5. The agent exceeds a configured idle timeout (v1.x; default: 30 minutes of no activity)

### 12.4 Reassignment flow

```
User changes Elena's project assignment from "atlas" to "beacon"
  → Renderer sends UI action (host's internal API, not protocol)
  → Host: if Elena is currently online
    → Host sends COMMAND { command: 'pause' }
    → Agent acknowledges via AGENT_STATE { phase: 'paused' }
    → Host sends KICK
    → Agent process exits
  → Host updates agent_projects table
  → Host respawns on new project (different --cwd)
  → Agent reconnects, AGENT_HELLO, normal lifecycle resumes
```

### 12.5 Failure handling

- If the agent process exits unexpectedly, the host emits `AGENT_DISCONNECTED` with `reason: 'crashed'`, logs the exit code, and marks the agent OFFLINE. The host does **not** auto-restart in v1 (user can click "Run" to manually restart).
- If the agent fails to send `AGENT_HELLO` within 10 seconds of WS connect, the host closes the connection with `4408 Heartbeat timeout` (close code repurposed for connection timeout).
- If the agent's manifest fails validation, the host closes with `4400 Bad request`.

---

## 13. Audit queue & governance

### 13.1 Permission request flow

The agent, when about to do a sensitive action, sends:

```json
{
  "type": "PERMISSION_REQUEST",
  "from": "agent-elena",
  "payload": {
    "requestId": "req-abc123",
    "tool": "file_write",
    "args": { "path": "src/auth/oauth.ts" },
    "reason": "Implementing OAuth provider config from ticket UT-042",
    "severity": "medium"
  }
}
```

The host:

1. Looks up the agent's default policy for `file_write`:
   - `allow` → auto-approve, send PERMISSION_DECISION { decision: 'allow', reason: 'policy' }
   - `deny` → auto-deny
   - `ask` (default for sensitive tools) → enqueue
2. If enqueued, inserts `audit_items` row:
   - `type = 'AUTH_INTERCEPT'`
   - `title = "Write file: src/auth/oauth.ts"`
   - `description = "Implementing OAuth provider config from ticket UT-042"`
   - `touched_files = '["src/auth/oauth.ts"]'`
   - `severity = 'medium'`
   - `status = 'PENDING'`
3. Emits `PERMISSION_REQUESTED` to renderer (port :7712)
4. Renderer's right-panel AgentInbox shows a new card

User reviews in the UI:

- "Allow once" → renderer sends `APPROVE_PERMISSION { requestId }` → host sends `PERMISSION_DECISION { decision: 'allow', reason: 'approved by user' }`
- "Allow + remember" → same, with `remember: true`. Host persists a per-tool default policy.
- "Deny" → renderer sends `DENY_PERMISSION` → host sends `PERMISSION_DECISION { decision: 'deny' }`

The agent unblocks and continues. The audit_items row is updated to `APPROVED` or `DENIED` with `decided_at` and `decided_by`.

### 13.2 Default policy engine

Stored at `~/.superhive/permissions/<agent_id>.json`:

```json
{
  "file_read": { "default": "allow" },
  "file_write": { "default": "ask" },
  "bash": { "default": "ask" },
  "git_commit": { "default": "ask" },
  "git_push": { "default": "ask" },
  "mcp__create_ticket": { "default": "allow" },
  "mcp__update_ticket": { "default": "ask" }
}
```

The host applies the agent's `commit_authority` from `agent_permissions`:

- `REVIEW_ONLY` → `git_commit` default is `ask` (every commit shows the diff)
- `AUTO_MERGE` → `git_commit` default is `allow`; `git_push` default is `ask`
- `DIRECT_MAIN` → both `allow`; only `git_push` to protected branches is `ask`

### 13.3 Diff review (DIFF_REVIEW)

When the agent requests `git_commit`, the host:

1. Computes the diff (via `git diff` in the project root)
2. Inserts audit_items with `type = 'DIFF_REVIEW'`, `pr_id` (commit hash placeholder), `touched_files` (list of changed files), `description` = the diff (truncated to 4000 chars)
3. Emits `PERMISSION_REQUESTED` to renderer
4. Renderer's right panel shows the diff (using CodeBlock with the user's preferred syntax theme)
5. User clicks "Approve & Commit" → host runs `git commit -m "<agent's message>"`, sends PERMISSION_DECISION
6. User clicks "Deny" → host sends PERMISSION_DECISION { decision: 'deny' }

### 13.4 Audit log

Every audit decision is persisted in `audit_items`. The right panel's history view shows:

- All PENDING items (action needed)
- All APPROVED items in the last 7 days
- All DENIED items in the last 7 days
- Filter by agent, by type, by severity

Older items are queryable but not shown by default (configurable retention in Privacy settings).

---

## 14. SuperHive — Project Agent

### 14.1 One per project

When the user creates a project, the host automatically spawns a Project Agent:

- `role = 'PROJECT_MANAGER'`
- `agent_ulid = <new ULID>` (folder created at `~/.superhive/agents/<ulid>/`)
- `model = <user's default model>`
- `system_prompt = <project manager constitution>` (see 14.2)
- `projectId = <new project>`
- `commit_authority = 'REVIEW_ONLY'` (Project Agent creates tickets; rarely commits code itself)
- `write_access = false` (Project Agent reads OKF but doesn't edit code)
- `install_deps = false`

The Project Agent is stored in the `agents` table with `role = 'PROJECT_MANAGER'`. It is **not** in `agent_projects` (that's for workers). Instead, it's referenced from `projects.project_manager_agent_id`.

### 14.2 System prompt (constitution)

The Project Agent's system prompt is a fixed template, loaded by the agent's `v1/identity/` module. v1 template:

```markdown
# Project Manager — {project.title}

You are the project manager for the **{project.title}** project.

## Project context
- Workspace: {workspace.name}
- Description: {project.description}
- Success criteria: {project.success_criteria}

## Your job
1. **Read the OKF** at `{project.root_path}/index.md` to understand current state
2. **Read the log** at `{project.root_path}/log.md` for recent changes
3. **Read concepts** in `{project.root_path}/concepts/` for project knowledge
4. **Receive user intent** via chat
5. **Decompose the intent** into concrete, scoped tickets
6. **Create tickets** using the `create_ticket` MCP tool, one per worker
7. **Assign tickets** to specific worker agents
8. **Coordinate workers** via the project's channels
9. **Report progress** to the user via chat
10. **Surface blockers** using the `ask_user_question` MCP tool when decisions are needed

## Boundaries
- DO NOT execute work yourself. You delegate.
- DO NOT modify code directly. You create tickets for workers.
- DO NOT modify OKF concepts directly. You suggest updates to the user.
- DO read OKF to understand the project.
- DO ask the user for clarification when intent is ambiguous.

## Coordination flow
When the user says "ship X", you:
1. Read `index.md` for project context
2. List current tickets via `list_tickets` to see in-flight work
3. Plan the work (you may write a plan to `log.md` via `append_log_entry`)
4. Create tickets, each scoped to one worker, with a clear description
5. Confirm the plan with the user before creating all tickets

When a worker finishes a ticket, you:
1. Read the worker's report (via channel message or chat)
2. Mark the ticket as REVIEW via `update_ticket`
3. Notify the user
4. If accepted, mark as MERGED via `update_ticket`
5. If rejected, create a follow-up ticket

## Escalation
- If a worker is stuck, ask them in their channel
- If the user needs to make a decision, ask via chat
- If something is unclear in the OKF, ask the user
```

### 14.3 Project Agent UI surface

Each project's detail view (`project` tab in CenterWorkspace) has a "Project Agent" chat panel alongside the existing project views:

```
┌──────────────────────────────────────────────────────────────────┐
│ Project: Atlas                              [Manage] [Archive]   │
├──────────────────────────────────────────────────────────────────┤
│  [ Project ] [ Tickets ] [ Channels ] [ OKF ] [ Project Agent ] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Project Agent chat thread...                                    │
│                                                                  │
│  User: Add OAuth auth with Google as the first provider.         │
│                                                                  │
│  Project Agent: I'll plan this. Reading the OKF...              │
│    [creates 3 tickets: "Add OAuth provider config",              │
│     "Build login UI", "Wire up callback handler"]                │
│    [assigns to Elena, Marcus, and Priya respectively]            │
│                                                                  │
│  User: Looks good. Go.                                           │
│                                                                  │
│  Project Agent: Tickets created. Workers have been notified.     │
│                  I'll coordinate from the #atlas-coordination    │
│                  channel.                                        │
│                                                                  │
│  ┌──────────────────────────────────────────┐                    │
│  │ [type your message...]                   │                    │
│  └──────────────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────────┘
```

The Project Agent's chat is a `chat_thread` with `agent_id = <project_manager_agent_id>`. Messages are sent/received via the host's INTER_AGENT_MESSAGE bridge (the host sends to the agent; the agent replies; the host stores).

### 14.4 Project Agent coordination

The Project Agent:

- Posts in project channels to coordinate workers
- Reads worker status from `agent_telemetry` (via MCP or by reading the registry through INTER_AGENT_DELIVERY)
- Updates tickets as work progresses
- Reports to the user in chat

Workers (the user-configured agents):

- Receive INTER_AGENT_MESSAGE from the Project Agent
- Read their assigned tickets via `list_tickets` / `get_ticket` MCP tools
- Post updates in channels
- Ask the user questions via `ask_user_question` when blocked
- Mark tickets as REVIEW when done

### 14.5 Why this is "SuperHive" in v1

The user can effectively **talk to the project as if it were a colleague**: "Atlas, ship OAuth." The Project Agent plans, delegates, coordinates, and reports. The user governs via the audit queue and the chat. This is the **operational** version of "let the agents run things."

The **killer** version of SuperHive (where the user gives a single annual-goal intent and the Project Agent runs autonomously for weeks, with the user only intervening on audit items) is the MetaHive feature in v2.

---

## 15. MetaHive — read-only preview

### 15.1 What the user sees

Clicking the **Meta Hive** entry in the left nav opens a CenterWorkspace tab of type `metahive`:

```
┌──────────────────────────────────────────────────────────────────┐
│  MetaHive                                                         │
│  ─────────                                                       │
│                                                                  │
│  The autopilot for your company.                                  │
│                                                                  │
│  MetaHive orchestrates all your projects, agents, and channels    │
│  hands-off. You give it a goal; it plans, delegates, monitors,    │
│  and reports.                                                    │
│                                                                  │
│  Coming in v2. The cockpit you're using now is the foundation.   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │              [Preview diagram]                             │ │
│  │                                                            │ │
│  │   Workspace ──► Projects ──► Project Agents ──► Workers   │ │
│  │       │            │              │                │      │ │
│  │       │            │              ▼                │      │ │
│  │       │            │         OKF (shared knowledge)│      │ │
│  │       │            │              │                │      │ │
│  │       │            │              ▼                │      │ │
│  │       └────────────┴────► Channels (inter-agent)   │      │ │
│  │                                                            │ │
│  │   User ◄──── audit queue (governs every action)            │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Status: Preview only — no autonomous execution yet.             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 15.2 Why it's a real screen, not a "coming soon" badge

The user said: "In v1, but read-only / preview only." The preview tab is a real component that explains the architecture and shows the vision. It's not a stub; it's documentation rendered as a UI.

### 15.3 v2 (out of scope for this spec)

MetaHive functionality in v2:

- A new top-level "MetaHive" agent per workspace
- Reads all projects' OKF, all channels, all activity
- Receives high-level intent ("Grow MRR by 20% this quarter")
- Decomposes into project-level goals
- Each goal is handed to a Project Agent
- Reports progress across the entire workspace

For v1, this is the *narrative* the UI tells; the *functionality* is the Project Agent.

---

## 16. Feature flows

### 16.1 Create a workspace

1. User opens the workspace dropdown in the top-left
2. Clicks "New workspace"
3. Dialog: name field, optional color, optional description
4. Submit → host inserts `workspaces` row, sets as current
5. Left nav updates; home view shows the new (empty) workspace
6. Activity event: `workspace_created`

### 16.2 Create a project

1. User clicks "New Project" on the home view (or in the left nav's "Projects" accordion)
2. Dialog: title, workspace (default: current), description, success criteria, color, agent team (multi-select)
3. Submit → host:
   - Inserts `projects` row (`status = 'ACTIVE'`, `slug` derived from title)
   - Creates `~/.superhive/projects/<slug>/` directory
   - Runs `git init`, writes default `.gitignore`
   - Writes `index.md` with project title, description, success criteria
   - Writes empty `log.md`
   - Creates `concepts/` directory
   - For each agent in the team, inserts `agent_projects` row
   - Creates a Project Agent (new ULID, new folder, new row in `agents`)
   - Updates `projects.project_manager_agent_id`
   - Inserts initial activity event: `project_created`
4. Renders the new project's tab
5. Project Agent is now online (or will be when the user opens its chat)

### 16.3 Create a worker agent

1. User clicks "New Agent" on the agents view
2. Dialog: name, role (WORKER), model (from configured providers), system prompt, project assignments (multi-select)
3. Submit → host:
   - Generates new ULID
   - Creates `~/.superhive/agents/<ulid>/` with the portable agent folder (cloned or extracted from `packages/general-v1/`)
   - Writes `identity.json`
   - Inserts `agents` row
   - Inserts `agent_permissions` row (default values)
   - For each assigned project, inserts `agent_projects` row
4. Renders the new agent in the agents list
5. Agent is IDLE; spawns on first interaction

### 16.4 User chats with Project Agent

1. User opens the project tab, clicks "Project Agent" sub-tab
2. Renders the Project Agent's chat thread
3. If the Project Agent is OFFLINE, host spawns it (sets --cwd to project root, env vars with API keys)
4. User types: "Add OAuth auth with Google as the first provider"
5. User clicks Send
6. Host:
   - Inserts `chat_messages` row (role='user')
   - Sends INTER_AGENT_MESSAGE to the Project Agent (kind='text', payload=content)
   - Renders the user message in the chat
7. Project Agent receives the message
8. Project Agent reasons, calls MCP tools:
   - `get_concept` (reads `index.md` and recent concepts)
   - `list_tickets` (sees in-flight work)
   - `create_ticket` × 3 (creates "Add OAuth provider config", etc.)
   - `send_inter_agent_message` × N (notifies workers)
9. Project Agent sends back a reply (INTER_AGENT_MESSAGE to host, kind='text')
10. Host:
    - Inserts `chat_messages` row (role='assistant', model=..., token_count=..., duration_ms=...)
    - Renders the message in the chat
11. Tickets appear in the project's ticket board
12. Workers receive notifications; if IDLE, they spawn and pick up the tickets

### 16.5 Worker executes a ticket

1. Worker agent spawns (or resumes)
2. Worker reads its assigned ticket via `get_ticket` MCP
3. Worker plans the work in its private `task_plan.md`
4. Worker reads the OKF for context
5. Worker edits files, runs commands
6. When the worker wants to write a file, it sends PERMISSION_REQUEST
7. Host enqueues in audit queue; user approves
8. Worker continues
9. When done, worker calls `update_ticket { status: 'REVIEW' }` and posts in the project's channel
10. Project Agent sees the channel message, notifies the user
11. User reviews; either MERGED or new ticket created for fixes

### 16.6 User governs via the audit queue

1. Worker wants to commit changes
2. Worker sends PERMISSION_REQUEST { tool: 'git_commit', args: {...} }
3. Host inserts audit_items row (DIFF_REVIEW), computes diff, emits to renderer
4. Renderer's right panel AgentInbox shows the diff card
5. User reads the diff, clicks "Approve & Commit"
6. Renderer sends APPROVE_PERMISSION via :7712
7. Host sends PERMISSION_DECISION to worker
8. Worker runs git commit
9. Host updates audit_items status to APPROVED
10. Activity event: `audit_diff_resolved`

### 16.7 User reassigns an agent

1. User opens the agent's Manage tab
2. Changes project assignment (multi-select)
3. Host updates `agent_projects` table
4. If the agent is currently online and its active project changed:
   - Host sends COMMAND { command: 'pause' }
   - Worker acknowledges via AGENT_STATE
   - Host sends KICK
   - Worker process exits
5. Host respawns on the new project (different --cwd)
6. Worker reconnects, AGENT_HELLO, normal lifecycle resumes
7. Activity event: `agent_reassigned`

### 16.8 User archives a project

1. User opens project Manage tab, clicks "Archive"
2. Confirmation modal (type-to-confirm)
3. Host updates `projects.status = 'ARCHIVED'`, sets `archived_at`
4. Project moves to the "Archived" section in the left nav
5. Worker agents assigned to this project are notified (AGENT_STATE shows offline if they were on it)
6. Project's OKF remains on disk
7. Activity event: `project_archived`

### 16.9 Activity feed (live)

1. Any of the above actions emits an `activity_events` row
2. The right panel's home view ActivityFeed component subscribes to the renderer-side host client
3. On any new event, the renderer prepends it to the feed
4. The auto-refresh simulates a new event every 12s (in addition to real events) for visual interest
5. User can pause/resume the feed
6. User can filter by kind (agents / tickets / audits / channels)
7. Clicking an event row navigates to the relevant entity

### 16.10 OKF viewer/editor

1. User opens a project, clicks "OKF" sub-tab
2. Renders the OKF tree: `index.md`, `log.md`, `concepts/` with all `.md` files
3. Each file shows: frontmatter (type, title, description, tags, timestamp), body (rendered markdown)
4. User can:
   - Search across concepts (uses `okf_concepts_cache` for fast lookup)
   - Open a concept to read the full content
   - Edit a concept (host writes back to the file; if the agent is currently online and reading it, host sends a notification)
   - Create a new concept (file dialog: path, frontmatter, body)
5. Each edit is logged in `log.md` (via `append_log_entry`)

---

## 17. UI surface (panel by panel)

### 17.1 Left Nav (Fleet Command)

| Section | Behavior in v1 |
|---|---|
| Header (drag handle) | Toggle left/right panels; arrow buttons still disabled (history nav is v2) |
| Team selector | Real workspace dropdown; creates new workspaces; switches workspaces; settings entry point |
| Active agents | Top 5 agents with `status = EXECUTING \| COMPILING \| AWAITING_HUMAN`. Click to open agent tab |
| Favorites | Add/remove favorite (right-click or star icon). Click to navigate. Filterable by type |
| Projects accordion | All projects in current workspace. Click to open. |
| Agents accordion | All worker agents in current workspace. Click to open. |
| Tickets | Click → opens `tickets` tab |
| Communications | Click → opens `channels` tab |
| **Meta Hive** | Click → opens `metahive` preview tab (read-only) |
| Remote | Remains a "coming soon" badge (deferred entirely) |
| Archived | Shows all `status = 'ARCHIVED'` projects. Click to view. |
| Utilities | Settings, Help (popover with docs/changelog/shortcuts) |

### 17.2 Center Workspace (Operations Deck)

| Tab | Source | v1 behavior |
|---|---|---|
| Home | `home` | Real data: stat strip, top projects/agents/channels, mini kanban, activity feed |
| Projects (workspace-scoped) | `projects` | Real: list of projects in current workspace |
| Project detail | `project` | Real: stats, ExecutionStream, SwarmRoster, Communications + Project Agent chat |
| Tickets (workspace-scoped) | `tickets` | Real: kanban with workspace's tickets, search/sort/filter, create |
| Universal tickets | `universal-tickets` | Real: kanban across all workspaces |
| Channels (workspace-scoped) | `channels` | Real: list of channels in current workspace, send/receive |
| Channel detail | `channel` | Real: thread view, compose, send to channel |
| Universal channels | `universal-channels` | Real: across all workspaces |
| Agents (workspace-scoped) | `agents` | Real: list of worker agents in current workspace |
| Universal agents | `universal-agents` | Real: across all workspaces |
| Agent detail | `agent` | Real: chat thread, telemetry, action log, next step |
| Universal projects | `universal-projects` | Real: across all workspaces |
| MetaHive | `metahive` | Read-only preview |
| Settings | (separate page) | 10 settings pages, all wired |

### 17.3 Right Auxiliary (Avionics)

Context-aware. Tabs visible per context (per `CONTEXT_VISIBLE_TABS`):

| Context | Visible tabs |
|---|---|
| `home` | `activity` |
| `agent` | `overview`, `manage`, `inbox`, `sessions` |
| `project` | `overview`, `manage`, `inbox` |
| `channel` | `overview`, `manage`, `inbox` |
| `ticket` | `overview`, `manage`, `inbox` |
| `universal-*` | `overview` (stats only) |
| `dashboard` | `overview`, `inbox` |
| `metahive` | (none — preview only) |

**`overview` (per context):**

- `agent` → TelemetryDeck: brain usage bar, last actions, next step
- `project` → ProjectOverviewTab: stats, contributors, recent activity, top tickets/channels
- `channel` → ChannelOverviewTab: participants, message thread
- `ticket` → TicketOverviewTab: header chips, assignee, recent activity
- `home` → DashboardOverview: greeting, today's stats, awaiting review, bottlenecks
- `universal-*` → GlobalStatsTab: aggregations

**`manage`:**

- `agent` → ControlMatrix: model dropdown, write/messages/deps switches, commit authority segmented, thinking budget slider, terminate button. All changes push to agent via SETTINGS_UPDATE.
- `project` → ProjectManageTab: title editor, description, success criteria, archive button (works)
- `channel` → ChannelManageTab: topic, status, archive (wired to MCP)
- `ticket` → TicketManageTab: status/priority/type, assignee, save (works via `update_ticket` MCP)

**`inbox`:**

- `agent` → AgentInbox: audit queue (AUTH_INTERCEPT, DIFF_REVIEW), pending questions, bulk approve/deny
- `project` → ProjectInbox: project's TODO tickets, bulk mark-done (works)
- `channel` → ChannelInbox: **wire up from placeholder** — new messages, mentions
- `ticket` → TicketInbox: **wire up from placeholder** — related items
- `dashboard` → DashboardInbox: review-pending items across all projects, bulk mark-done (works)

**`sessions`:**

- `agent` only. Real chat thread list. Click → opens thread in center.

**`activity`:**

- `home` only. Live activity feed with auto-refresh.

---

## 18. Settings

### 18.1 Pages (10)

| # | Page | Status in v1 | Wires to |
|---|---|---|---|
| 1 | Account | Active, fully functional | localStorage `superhive-settings-v2` |
| 2 | Appearance | Active, fully functional | localStorage + DOM `data-theme`, `--highlight*` |
| 3 | Privacy & Data | Active, partial (export works; "delete" stubs removed) | localStorage |
| 4 | Defaults | Active, all controls wired (was partially unwired in current code) | localStorage + Dashboard initial state |
| 5 | Keyboard | Active, read-only reference | `src/lib/shortcuts/registry.ts` |
| 6 | Models | Active, fully functional | localStorage (provider CRUD) + `api_keys` SQLite table for actual keys |
| 7 | Workflows | **coming-soon** badge, page disabled in sidebar | (deferred to v2) |
| 8 | Cost & Usage | **coming-soon** badge (chart works; budget controls stubbed) | localStorage + `agent_telemetry` |
| 9 | Workspaces | Active, partial (data retention works; archive works) | SQLite |
| 10 | Billing & Plans | Active, partial (plan selection works; payment stubs removed) | localStorage |

### 18.2 Settings that are stored but currently have no UI — wire them up in v1

- `appearance.fontScale` — slider in Appearance
- `appearance.reduceMotion` — toggle in Appearance
- `account.timezone` — display field in Account
- `account.connectedAccounts` — display in Account
- `defaults.startupView` — radio in Defaults (already exists; ensure Dashboard reads it)
- `defaults.defaultWorkspaceId` — selector in Defaults (ensure Dashboard reads it on first load)
- `defaults.viewMode` — segmented control in Defaults (Compact / Comfortable / Spacious)
- `defaults.timeFormat` — segmented control in Defaults (12h / 24h / Relative)
- `defaults.defaultKanbanColumns` — pill toggle in Defaults
- `defaults.rightPanelDefaultTab` — segmented control in Defaults

### 18.3 Pages to remove from the registry

- **NotificationsSettings.tsx** — page exists but isn't registered; remove the file
- **AccessibilitySettings.tsx** — same
- **IntegrationsSettings.tsx** — same; also remove the hardcoded sidebar row

### 18.4 Stubs to remove

- `AccountSettings.tsx`: "Sign out" button (toast-only) → remove
- `PrivacySettings.tsx`: "Delete workspace data", "Delete account" (toast-only) → remove
- `WorkspacesSettings.tsx`: "Archive workspace" (toast-only) → wire to `archiveWorkspace` in store
- `BillingSettings.tsx`: "Contact sales", "Update card", "Add card" (toast-only) → remove

### 18.5 API key storage

In v1, the `Models` settings page stores provider API keys in the SQLite `api_keys` table (plaintext). On agent spawn, the host reads the relevant key and sets it as an env var.

**v2:** move to OS keychain via `keytar` (macOS Keychain / Windows Credential Manager / libsecret).

**v1 mitigation:** the SQLite file is in `~/.superhive/superhive.db` with default file permissions. Document the security caveat in `AGENTS.md` and in the Models settings page ("API keys are stored in plaintext on this machine. Do not share the database file.").

### 18.6 Settings navigation

`SettingsSidebar` reads from `settingsRegistry`. The registry is updated:

```typescript
// Removed: notifications, accessibility, integrations
// Unchanged: account, appearance, privacy, defaults, keyboard, models, workflows, cost-usage, workspaces, billing
```

The `settingsRegistry` is the single source of truth for nav (already enforced in v1).

---

## 19. OKF — Open Knowledge Format integration

### 19.1 What is OKF

A directory of markdown files with YAML frontmatter. Each file is a "concept." The format is defined at <https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md>.

For Superhive, every project has an OKF bundle at its root:

```
~/.superhive/projects/<slug>/
├── index.md      # OKF root index
├── log.md        # Chronological update log
└── concepts/     # Concept documents
    ├── architecture.md
    ├── decisions/
    ├── schemas/
    ├── playbooks/
    └── references/
```

### 19.2 The agent reads OKF

When the agent boots with `--cwd <project>`, it can:

- Read `index.md` for project summary
- Read `log.md` for recent changes
- List and read any file in `concepts/`
- The agent's `v1/lancedb/` module indexes concepts into vector search for semantic queries

### 19.3 The agent writes OKF

The agent's system prompt instructs it to:

- Update `index.md` when the project summary changes
- Append entries to `log.md` for every meaningful change
- Create new concept files when learning something new (e.g., a new schema, a new decision)
- Update existing concept files when refining understanding

These writes go through the host's `mcp__create_concept` and `mcp__update_concept` tools. In v1, these are **not** audit-gated (the agent is the primary author of OKF). They are, however, recorded in `log.md` for history.

### 19.4 The user reads/edits OKF

The UI's OKF viewer (in the project tab) lets the user:

- Browse the OKF tree
- Read any concept (rendered markdown, with frontmatter as a header)
- Edit a concept (textarea + frontmatter form)
- Create a new concept (path, type, title, description, body)
- Delete a concept (with confirmation)

User edits to OKF are written directly to disk by the host. If the agent is currently online and may be reading the file, the host sends an `OKF_CHANGED` event (a custom host-internal event, not a protocol message) so the agent can re-read.

### 19.5 OKF cache

The host maintains `okf_concepts_cache` in SQLite for fast lookups. On agent access (`list_concepts` MCP), the host reads from cache. On user access (OKF viewer), the host reads from disk and refreshes cache if `mtime` has changed.

### 19.6 OKF compliance

The host enforces OKF v0.1 conformance on writes:

- Every concept must have a `type` field in frontmatter
- Reserved filenames (`index.md`, `log.md`) are not allowed for concepts
- Frontmatter is parseable YAML

The host does **not** enforce OKF v0.1 conformance on agent reads (the agent is allowed to see malformed OKF for repair; the host just doesn't surface them in the UI).

---

## 20. Vendoring general-v1

### 20.1 Vendoring steps (executed when leaving plan mode)

```bash
# from /Users/rishi/work/superhive-2/superhive
mkdir -p apps packages

# Move current Electron app into apps/superhive/
mv src electron index.html vite.config.ts tsconfig.json tailwind.config.js \
   postcss.config.js electron-builder.yml components.json apps/superhive/

# Adjust package.json name
sed -i '' 's/"name": "superhive"/"name": "@superhive\/app"/' apps/superhive/package.json

# Vendor general-v1
git clone https://github.com/rishi-ie/general-v1.git packages/general-v1
cd packages/general-v1
rm -rf .git
sed -i '' 's/"name": "general-v1"/"name": "@superhive\/general-v1"/' package.json

# Create VENDORED.md
cat > VENDORED.md << 'EOF'
# Vendored from https://github.com/rishi-ie/general-v1

Pinned to: <commit-sha>
Vendored on: <date>

## To rebase from upstream
1. `git remote add upstream https://github.com/rishi-ie/general-v1.git`
2. `git fetch upstream`
3. `git merge upstream/main --ff-only` (or resolve conflicts)

## Local modifications
- `package.json` renamed to `@superhive/general-v1`
- `.git` removed
- (no other modifications in v1)
EOF
cd ../..

# Create root package.json with workspaces
cat > package.json << 'EOF'
{
  "name": "superhive",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "bun run --filter @superhive/app dev",
    "build": "bun run --filter * build",
    "typecheck": "bun run --filter * typecheck",
    "lint": "biome check ."
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "typescript": "^6.0.3"
  }
}
EOF

# Create tsconfig.base.json
cat > tsconfig.base.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true
  }
}
EOF

# bun install
bun install
```

### 20.2 VENDORED.md template

```markdown
# Vendored from https://github.com/rishi-ie/general-v1

**Pinned to:** <commit-sha>
**Vendored on:** <date>

## Keeping in sync

To pull upstream changes:

```bash
cd packages/general-v1
git remote add upstream https://github.com/rishi-ie/general-v1.git   # one time
git fetch upstream
git merge upstream/main --ff-only     # or resolve conflicts
```

After merging, run `bun run smoke` at the repo root to verify nothing broke.

## Local modifications

- `package.json` `name` field: `general-v1` → `@superhive/general-v1`
- `.git` removed
- (no other modifications in v1)

## Why vendored (not git submodule or subtree)

- Simple: no extra commands on every clone
- Owned: we can patch and rebase manually
- Workspace-friendly: bun workspaces resolve symlinks cleanly
```

### 20.3 What we touch vs what we don't

In v1, the vendored `general-v1` is **not modified** beyond the `package.json` rename. We can:

- Read its code
- Spawn it as a child process
- Communicate with it over the WS protocol
- Use its public CLI flags and slash commands (via the host's MCP server that wraps them)

We do **not**:

- Import its code into our renderer or host directly
- Patch its source files
- Replace its modules

Future v1.x iterations may add small customizations (tracked in `VENDORED.md`).

---

## 21. Cleanup / cut list

### 21.1 Files to remove

- `src/data/mock/` (entire directory)
- `src/data/mock.json`
- `src/data/mock/index.ts`
- `src/data/mock/types.ts`
- `src/components/settings/NotificationsSettings.tsx` (not in registry)
- `src/components/settings/AccessibilitySettings.tsx` (not in registry)
- `src/components/settings/IntegrationsSettings.tsx` (not in registry)
- `src/data/config/wizard-configs.ts` (referenced in AGENTS.md but doesn't exist)
- All references to `VITE_USE_MOCK_DATA` in code, `.env.example`, `.env.local`

### 21.2 Dead code to remove

- `ProjectsView.tsx:35` — dead `projectId` branch
- `HomeView.tsx:136` — `void onCreateAgent;` unused prop
- `CenterTab.tsx:71` — `onContextMenu` swallow (no menu)
- `ChatInput.tsx:91` — empty paperclip handler
- `ChannelDetailView.tsx` paperclip — empty handler
- `ChatHeader.tsx` model dropdown + more menu — decorative
- `UniversalAgentsView.tsx:93` — `uptime` sort no-op
- `TeamSelector.tsx:102-108` — "Sign out" close-dropdown
- `Dashboard.tsx:308, 312, 333` — `console.warn('[TODO]…')` stubs
- All `stubSoon` toasts in `initialSetupRows.ts` and `emptyWorkspaceRows.ts`
- `SetupWizardView.tsx:13, 58-71` — WorkspaceReadyView commented-out branch (move the file to a `disabled/` folder or delete)
- `AuditQueue.tsx` orphan (UN-ORPHAN: it's the live audit queue; remove from orphan list)

### 21.3 Bugs to fix

- `TicketStatus` enum mismatch — widen to `'BACKLOG' | 'EXECUTING' | 'REVIEW' | 'MERGED'` (matches data and v1 model)
- `favorites` read-only — add add/remove API
- `api_keys` in plaintext localStorage → move to SQLite `api_keys` table
- Two parallel "workspaces" sets → consolidate to single SQLite `workspaces` table
- `HomeView.tsx`'s `onCreateAgent` prop → wire it or remove
- `ProjectInbox` / `DashboardInbox` bulk mark-done — wire to `update_ticket` via MCP
- `TicketManageTab` / `ChannelManageTab` save — wire to MCP mutators
- `ProjectManageTab` title save — wire to MCP `update_concept` or `update_project`

### 21.4 Settings to remove

- `Settings.workspaces.workspaces` (the `ws-vela` / `ws-cosmos` set) — redundant with the runtime `workspaces` table
- "Sign out" button in AccountSettings
- "Delete workspace data", "Delete account" in PrivacySettings
- "Archive workspace" toast-only in WorkspacesSettings
- "Contact sales", "Update card", "Add card" in BillingSettings
- Integrations sidebar row (hardcoded)

### 21.5 What stays unchanged

- Three-panel layout, theme system, command palette, keyboard shortcuts, telemetry deck, sessions view, activity feed, control matrix (visually), AgentInbox logic (already the deepest-implemented surface)

---

## 22. Milestones

### M0 — Foundations (2-3 weeks)

**Goal:** monorepo restructure + vendor general-v1 + create protocol types package + port host skeleton.

- [ ] Restructure into `apps/superhive/` + `packages/{general-v1,superhive-host,superhive-protocol}/`
- [ ] Vendor general-v1; write VENDORED.md
- [ ] Create `@superhive/protocol` with all message types
- [ ] Create `@superhive/host` skeleton: WebSocket server on :7711, agent-registry, internal WS server on :7712
- [ ] Better-sqlite3 + schema migrations for all tables in §8.1
- [ ] Wire `apps/superhive/electron/main.ts` to import `startHost()` from `@superhive/host`
- [ ] `bun install` at root, `bun run typecheck` passes
- [ ] Update AGENTS.md for the monorepo

**Done when:** `bun run dev` starts Electron, the app launches, the host's WS servers are running, the renderer connects to :7712, INITIAL_SNAPSHOT arrives (empty).

### M1 — Agent spawning (2-3 weeks)

**Goal:** agent can be created, spawned, registered, telemetry streamed.

- [ ] Port `agent-spawner/` (child_process.spawn for general-v1)
- [ ] Port `connection.ts` + `envelope.ts`
- [ ] Implement AGENT_HELLO validation
- [ ] Implement AGENT_STATE handling → agent_telemetry + agent_presence tables
- [ ] Implement HEARTBEAT
- [ ] Renderer subscribes to AGENT_STATE_CHANGED via :7712
- [ ] AgentInbox shows live telemetry (replaces mock)
- [ ] TelemetryDeck shows live data

**Done when:** user clicks "New Agent", fills the form, agent is created, opens its chat tab, agent spawns, telemetry updates live.

### M2 — Projects + tickets + chat (3-4 weeks)

**Goal:** user can create a project with OKF + Project Agent, chat with the Project Agent, Project Agent creates tickets, workers pick up tickets.

- [ ] Implement "Create project" flow (§16.2)
- [ ] Auto-spawn Project Agent on project create
- [ ] OKF bundle creation (index.md, log.md, concepts/)
- [ ] `git init` + default .gitignore
- [ ] Implement MCP server with the 17 tools from §11
- [ ] Wire chat thread to Project Agent via INTER_AGENT_MESSAGE
- [ ] Implement ticket create / update / close MCP tools
- [ ] Implement channel create / post MCP tools
- [ ] Channel detail view (real data)
- [ ] Ticket kanban (real data, real create flow)
- [ ] Activity feed live (subscribes to host events)

**Done when:** user creates a project, chats with the Project Agent, the Project Agent creates tickets, the tickets appear in the kanban, the user can drag/move them.

### M3 — Audit + governance (2-3 weeks)

**Goal:** permission requests surface in the audit queue, user can approve/deny, settings push works.

- [ ] Implement PERMISSION_REQUEST handling → audit_items table
- [ ] Implement permission router with default policy engine
- [ ] AuditQueue component (un-orphaned) is the live inbox
- [ ] DIFF_REVIEW for git commits (host computes diff)
- [ ] Commit Authority (REVIEW_ONLY / AUTO_MERGE / DIRECT_MAIN) gates commits
- [ ] ControlMatrix UI pushes settings via SETTINGS_UPDATE
- [ ] Agent SETTINGS_APPLIED / SETTINGS_REJECTED acks are reflected in UI
- [ ] Pending questions flow (ask_user_question MCP tool → pending_questions table → AgentInbox)

**Done when:** agent can request permissions, user approves/denies in the UI, agent unblocks correctly. Settings changes propagate and are acked.

### M4 — Polish (2-3 weeks)

**Goal:** all remaining surfaces wired.

- [ ] OKF viewer/editor in the project tab
- [ ] Universal views (cross-workspace) read from real data
- [ ] Sessions panel (real chat thread list)
- [ ] Wizard (create workspace → create project → spawn first agent) all real
- [ ] Command palette extended with new actions (Spawn agent, Restart host, Open OKF)
- [ ] Activity feed improvements (filters, search)
- [ ] Onboarding fully wired
- [ ] All right-panel "Manage" tabs save correctly

**Done when:** every screen and surface in §17 is wired to real data, no stubs.

### M5 — Cut + ship (1-2 weeks)

**Goal:** remove dead code, wire stored-but-no-UI settings, fix enum mismatches, typecheck, build, AGENTS.md/README update.

- [ ] All items from §21 executed
- [ ] All settings from §18.2 wired
- [ ] All tabs from §17 verified
- [ ] `bun run typecheck` passes (strict, noUnusedLocals, noUnusedParameters)
- [ ] `bun run build` passes
- [ ] AGENTS.md updated for monorepo
- [ ] README updated
- [ ] One end-to-end smoke test written (or manual checklist)

**Done when:** `bun run electron:build` produces a working .dmg / .exe / .AppImage.

**Total estimated duration: 12-18 weeks for v1.**

---

## 23. Out of scope (v2+ backlog)

| Feature | Why v2 |
|---|---|
| MetaHive functionality (autonomous company-runner) | Needs all of v1's surfaces stable; builds on the Project Agent model |
| Workspace Agent (cross-project orchestration) | Adds a second manager agent type; needs MetaHive reasoning layer |
| Cloud sync / multi-user / accounts | Local-first is the v1 product; cloud is a different product surface |
| Remote SuperHive (TLS, API key auth) | Defer until there's a concrete use case (e.g., self-host) |
| Notifications settings page | Out of scope — sonner toasts are sufficient for v1 |
| Accessibility settings page | Defer; existing keyboard nav is sufficient for v1 |
| Integrations settings page (GitHub, Slack, etc.) | Defer; not on the v1 critical path |
| OS keychain for API keys | Plaintext SQLite in v1; keychain in v2 |
| Workflows settings page (triggers, schedules) | Defer; user can run things manually in v1 |
| Cost & Usage budget controls / spend alerts | Defer; chart + telemetry are sufficient in v1 |
| Hard delete for projects | Soft (archive) only in v1 |
| Cross-project channels | Defer; project-scoped covers v1 use cases |
| Capability-tag matching for worker assignment | Defer; explicit assignment is sufficient in v1 |
| Drag-and-drop on Kanban | Optional; can ship without |
| Tab right-click context menus | Defer; not critical |
| Auto-update of vendored general-v1 | Defer; manual rebase only |

---

## 24. Open items / TBDs

| # | Question | Recommendation | Defer? |
|---|---|---|---|
| TBD-1 | When a worker is reassigned mid-execution, hard-restart vs graceful stop+resume? | Hard-restart | OK for v1 |
| TBD-2 | Is the Project Manager in `agent_projects` M2M table? | No — separate `projects.project_manager_agent_id` FK | OK for v1 |
| TBD-3 | Where do user posts in channels go? | Virtual `host` user, in `channel_participants` | OK for v1 |
| TBD-4 | How are worker agents discovered by the Project Agent? | Project Agent calls `list_project_agents` MCP | OK for v1 |
| TBD-5 | What's the default model for new agents? | User's `defaults.defaultModel` (new settings field) | Needs UI in Defaults settings |
| TBD-6 | What happens to in-flight tickets when a worker is killed? | Tickets revert to BACKLOG; another worker can pick up | OK for v1 |
| TBD-7 | How is the OKF `index.md` written initially? | Host writes a default template with project title, description, success criteria | OK for v1 |
| TBD-8 | Are channels persistent (live forever) or auto-archive? | Persistent; user can archive manually | OK for v1 |
| TBD-9 | What if a Project Agent crashes? | Host restarts it (auto-restart on unexpected exit, up to 3 attempts) | OK for v1 |
| TBD-10 | API key rotation flow? | Re-enter the key in Models settings; old key is overwritten | OK for v1 |

---

## Appendix A — current state inventory

Snapshot of the existing `superhive` codebase (pre-v1). Captured for reference.

### A.1 Tech stack

- Electron + React 19 + Vite + TypeScript + Tailwind v4
- shadcn/ui (Radix primitives + CVA) — 48 UI components
- Bun for package management
- No backend; all data in-memory (mock)

### A.2 Working features

- Three-panel layout with resizable widths
- 34 keyboard shortcuts (33 wired, 1 unwired: `chat.newline`)
- Command palette (cmdk + Radix Dialog, 12 items)
- Project creation (the only fully wired "create" flow)
- Theme system (light/dark/system), highlight color, code syntax theme
- Model provider CRUD (OpenAI / Anthropic / Google + custom)
- Agent inbox (approve audit / deny / answer questions) — the most polished surface
- Channel messaging (Enter sends)
- Project archive / unarchive
- Settings export/import JSON
- 10 settings pages

### A.3 Non-working / stub

- Chat one-way echo (no assistant reply)
- "New Ticket" / "New Channel" / "New Agent" buttons just open tabs
- Right-panel Save buttons in Ticket/Channel/Project Manage tabs are toast-only
- `Dashboard.tsx`: 3 explicit `[TODO]` console warnings
- 4 of 5 onboarding wizard rows are "coming soon" toasts
- Custom themes: download/import are `[TODO]`
- 3 orphaned settings pages (Notifications, Accessibility, Integrations)
- `AuditQueue.tsx` is an orphan (live audit queue re-implemented inline in AgentInbox)
- Several stored settings have no UI controls

### A.4 Data layer

- 16 domain stores under `src/data/{domain}/store.ts`
- Mock toggle at `src/data/mock/index.ts` (single source)
- 97KB of seed data in `src/data/mock.json`
- Persistence: settings only (localStorage `superhive-settings-v2`); chat drafts (localStorage per-agent); wizard dismissal (sessionStorage)

### A.5 Existing components (selected)

- `src/components/center-workspace/`: HomeView, ProjectsView, ProjectDetailView, TicketsView, KanbanBoard, KanbanColumn, SwarmRoster, ExecutionStream, Communications, ChannelDetailView, UniversalChannelsView, UniversalProjectsView, AgentsView, UniversalAgentsView, ChatView, ChatThread, ChatThreadList, ChatMessage, ChatInput, ChatHeader, ChatEmptyState, OnboardingWizard, CreateProjectDialog, TicketCard, UniversalTicketCard, PriorityTag, TypeTag
- `src/components/left-nav/`: LeftNav, LeftNavHeader, TeamSelector, ActiveSection, FavoritesSection, ArchivedProjectsSection, AccordionCore, ProjectListItem, AgentListItem, HelpPopover, Utilities
- `src/components/right-auxiliary/`: RightAuxiliary, RightPanelTabs, ControlMatrix, AuditQueue (orphan), TicketOverviewTab, TicketManageTab, ChannelOverviewTab, ChannelManageTab, ProjectManageTab, DashboardOverview, DashboardInbox, AgentInbox, ChannelInbox (placeholder), TicketInbox (placeholder), ProjectInbox, GlobalStatsTab, ChannelStats, AgentStats, UniversalAgentStats, UniversalProjectStats, SessionsView, ThreadRow, EmptyState, BulkActionBar, ConfirmationModal, FilterChips, TelemetryDeck, StatusPill, ProjectOverviewTab
- `src/components/settings/`: 14 pages, sidebar, shared primitives

---

## Appendix B — locked decisions log

All decisions made during the spec conversation, in order.

| # | Decision |
|---|---|
| 1 | **Port** general-v1's `v1/superhive/` host code into the Electron main (don't rewrite) |
| 2 | Agents live in `~/.superhive/agents/<ulid>/` (separate from project dir) |
| 3 | API keys in **SQLite** (plaintext, v1 risk accepted; keychain in v2) |
| 4 | Worker assignment is **explicit** (no capability matching in v1) |
| 5 | Workers are **many-to-many** with projects |
| 6 | Project deletion is **soft** (archive only in v1) |
| 7 | Channels are **project-scoped** only |
| 8 | Git repos are **local-only** (no push to GitHub/GitLab in v1) |
| 9 | Telemetry is **push-based** via `AGENT_STATE` (confirmed) |
| 10 | OKF is canonical; **MCP tools** for agent queries |
| 11 | Monorepo tool: **Bun workspaces** + vite-plugin-electron keeps working |
| 12 | Port scope: **port + leave agent untouched** |
| 13 | Lockfile: **single root lockfile** |
| 14 | general-v1 sync: **vendor as a folder, manual rebase, VENDORED.md tracks provenance** |
| 15 | Project Agent only (no Workspace Agent in v1) |
| 16 | MetaHive: read-only preview in v1 |
| 17 | SuperHive feature: per-project manager agent, fully functional in v1 |
| 18 | Settings pages: 10 kept, 3 removed (Notifications, Accessibility, Integrations) |
| 19 | UI: keep three-panel layout, retain all 48 UI primitives |
| 20 | OKF: every project gets an `index.md` + `log.md` + `concepts/` at the project root |

---

**End of v1 specification.**

When implementation begins, the first action is the vendoring sequence in §20.1. From there, M0 begins.
