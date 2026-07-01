# Superhive — Product Specification

## 1. Vision

Superhive is a local-first desktop cockpit for managing a **digital workforce** — autonomous AI agents that work, integrate, collaborate, and complete projects on the user's behalf. It reframes how a "workforce economy" runs in software: instead of managing human employees through tickets and channels, the user directs a configurable roster of agents that operate inside the same organizational primitives (workspaces, projects, tickets, knowledge).

The user's role shifts from "do the work" to "configure the team that does the work."

The desktop app is the **cockpit** — the UI, configuration layer, and SuperHive host. Agents are **external CLI runtimes** (`general-v1`) that the app invokes over WebSocket. All agent output streams directly into the app surfaces in real time.

---

## 2. Core Hierarchy

```
Workspace  (independent; no global layer above)
└── Project  (scoped to one workspace; cannot escape it)
    └── Agent  (external CLI; works on tickets inside the project)
        └── Ticket  (unit of work, assigned to one agent)
```

**Rules:**
- **Workspaces** are the top of the hierarchy and are mutually independent. There is no layer that aggregates or controls multiple workspaces.
- **Projects** belong to exactly one workspace. They cannot leak across workspace boundaries.
- **Agents** are real, persistent entities (not project-scoped roles). An agent may work on multiple projects simultaneously while keeping each project's context isolated.
- **Tickets** are the atomic unit of work inside a project. Each ticket is assigned to exactly one agent.

Two special agents sit above the regular employee-agent layer:
- **Project Agent** — the user-facing chat surface inside a project (§8)
- **Workspace Agent** — the user-facing chat surface inside a workspace, spanning all of its projects (§9)

---

## 3. Workspaces

A workspace is an isolated organizational container. It owns its projects, its agent roster, its OKF, and its communication lanes. Multiple workspaces can co-exist; each is fully independent.

**Workspace fields:**
- `id`, `name`, `initials`, `avatarColor`
- `createdAt`, `dataRetentionDays`

**Workspace boundaries are strict:**
- An agent's project-specific context cannot leak to another workspace's projects.
- A workspace's OKF is private to that workspace.
- Tickets, channels, and audit logs do not cross workspace boundaries.

**Workspace-level surfaces:**
- Team selector (switch between workspaces)
- Workspace-wide activity feed
- Workspace Agent chat (§9)
- Workspace settings (data retention, archive rules)

---

## 4. Projects

A project is the unit of work inside a workspace — equivalent to a long-running initiative ("the website", "customer-support", "research"). Each project has a defined final objective and operates like a small, contained office.

### 4.1 Project structure

Each project carries:

- **Final objective** — the `successCriteria` that defines "done"
- **Status** — `ACTIVE` or `ARCHIVED`
- **Employees (agents)** — the roster assigned to this project
- **Tickets** — the work queue, each assigned to one agent
- **Communications** — channels between agents with permission rules
- **Project Agent** — the user-facing chat surface for this project (§8)
- **OKF** — the project's persistent knowledge base (§7)

### 4.2 Tickets

Tickets are the atomic unit of work inside a project.

- Created manually by the user, **or** auto-created by the Project Agent (§8)
- Always assigned to one agent
- Statuses: `TODO → EXECUTING → REVIEW → DONE` (or `TODO → EXECUTING → DONE` for non-review flows)
- Linked to one or more communication channels when collaboration is needed

### 4.3 Communications

Communication channels are structured lanes between agents (and the user) inside a project.

- Each channel has a topic and a set of explicit participants
- Channels are linked to the ticket they exist to resolve
- Permissions govern which agents may join which channels
- Messages on a channel are ordered, attributed, and persistent

### 4.4 Project lifecycle

- **Active** — accepting tickets, agents working, OKF growing
- **Archived** — frozen; agents stop working; OKF preserved but read-only; visible in archived list

---

## 5. Agents

An agent is the basic unit of digital labor. Agents are real, persistent entities with their own identity, memory, and history — not project-scoped roles.

### 5.1 Runtime — `general-v1` agent CLI

Each agent is a [`general-v1`](https://github.com/rishi-ie/general-v1) runtime: a self-contained folder with a ULID identity, persistent SAC cognitive memory, LanceDB semantic vector store, file-based mission-control (ticket tracker), planning module, permission system, sub-agent orchestrator, and a WebSocket client that connects to the SuperHive desktop host.

The agent CLI ships 12 integrated modules:

| Module | Purpose | Storage |
|---|---|---|
| `identity` | Name, role, principles, boundaries | — |
| `docs` | Command reference, self-description | — |
| `planning` | File-based plans (task_plan.md), SHA-256 attestation | `task_plan.md`, `findings.md`, `progress.md` |
| `browser` | Browser automation via browser-use | `~/.config/v1/browser-profiles/` |
| `lancedb` | Hybrid vector + full-text semantic memory | `.general-v1/vectors/` (4 LanceDB tables) |
| `mission-control` | Ticket tracking with LLM auto-capture | `.general-v1/mission-control/` |
| `permission` | Policy-based tool/bash permissions | — |
| `sub-agent` | Spawn child agents (8 builtin + custom) | — |
| `sub-agent-context` (SAC) | Persistent cognitive memory: decisions, goals, open loops, lineage | `.general-v1/sac/` |
| `communication` | SuperHive WS client | `.general-v1/communication/` |
| `superhive` | SuperHive host registry, broker, permissions | `~/.superhive/` |
| `integrations` | 7 cross-module wiring files | — |

12 LLM providers are supported, auto-detected from environment variables (Anthropic, OpenAI, Google Gemini, MiniMax, DeepSeek, Groq, Mistral, OpenRouter, Together AI, Fireworks AI, NVIDIA NIM, Hugging Face). Offline mode is supported — all commands work without an API key, LLM responses are stubbed gracefully.

### 5.2 Integration architecture

The desktop app runs a **WebSocket server on `ws://127.0.0.1:7711`**. This is the SuperHive host.

Agent lifecycle:
1. User creates an agent in the app → app runs the `general-v1` setup wizard → ULID minted for the new agent folder
2. App launches the agent process as a local subprocess (headless, no terminal UI)
3. Agent connects to `ws://127.0.0.1:7711` and sends `AGENT_HELLO` with its ULID identity
4. Host registers the agent; from this point all communication is bidirectional over WS
5. Agent sends `AGENT_STATE` every 30 seconds, `HEARTBEAT` every 15 seconds
6. User interacts with the agent through the app UI; messages route over WS to the agent
7. Agent raises `PERMISSION_REQUEST` for sensitive tool calls; host routes to user for approval
8. On app shutdown, agents are gracefully terminated. On app restart, host reconnects to previously registered agents and re-establishes sessions.

**WebSocket message types (host ↔ agent):**
- `AGENT_HELLO` — agent announces itself on connect (ULID, name, role)
- `AGENT_STATE` — agent pushes current status every 30s (working/idle/error, active task, context saturation)
- `HEARTBEAT` — agent confirms liveness every 15s
- `PERMISSION_REQUEST` — agent asks for approval before sensitive action
- `INTER_AGENT_MESSAGE` — agent-to-agent message via host broker
- User messages and agent responses use the same channel

### 5.3 Sub-agents

Each agent can spawn 8 built-in sub-agents: **scout**, **researcher**, **planner**, **worker**, **reviewer**, **oracle**, **delegate**, **context-builder**. Sub-agents run as child processes of the parent agent; their status is streamed to the SuperHive host via the `comm-subagent` integration. Sub-agents are not independently registered with the host — they appear as nested activity under the parent agent.

### 5.4 Cross-project identity

An agent may be assigned to multiple projects at once. To prevent cross-project hallucination:

- The agent has a stable global identity (ULID, name, role)
- The agent holds a **separate, project-scoped context window** for each project it works on
- The Project Agent writes project-specific context snapshots to the agent's SAC for that project
- The agent's view of "the project" is always filtered to the current project context
- A project's OKF, ticket list, and channels are visible to the agent only when working inside that project

**Core invariant: one agent, many project contexts, zero leakage between them.**

### 5.5 Role-specific memory

Each agent has persistent memory keyed to its **role**, not its project:

- Survives project archival
- Survives the agent being removed from a project and added back later
- Scoped to the agent's role definition; does not carry project-specific facts (those live in the project's OKF)
- Lives entirely in the agent's own `.general-v1/sac/` and `.general-v1/vectors/` directories
- The app does NOT own this data; it can request exports via WS but the agent manages its own persistence

---

## 6. OKF — Open Knowledge Format

The OKF is a project's **persistent knowledge base**. It is the shared source of truth that every agent working on the project synchronizes to, conformant to [OKF v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md).

### 6.1 What lives in the OKF

- What the project is, its objective, its current status
- What has happened (recent decisions, ticket outcomes, channel highlights)
- What is happening now (active tickets, in-flight communications)
- What is changing (state transitions, newly created context)
- Anything an agent has learned that is project-scoped (vs. role-specific)

### 6.2 Bundle location

Each project's OKF bundle lives on disk as a directory tree at `~/.superhive/okf/<project_id>/`. This follows the OKF spec literally — markdown files with YAML frontmatter, no database, no schema registry.

```
~/.superhive/okf/<project_id>/
├── index.md                    # Bundle-level listing (project description, key concepts)
├── log.md                     # Update history (ISO date groups, newest first)
├── objectives.md              # Project final objective + success criteria
├── status.md                  # ACTIVE / ARCHIVED, current phase
├── tickets/
│   ├── <ticket-id>.md         # Per-ticket doc (type: Ticket, linked to assigned agent)
│   └── ...
├── decisions/
│   └── <timestamp>-<id>.md    # Decision entries (type: Decision)
├── channels/
│   └── <channel-id>.md        # Channel summaries (type: Channel)
├── agents/
│   └── <agent-id>.md          # Per-agent project-context snapshots (type: AgentContext)
└── events/
    └── <timestamp>-<id>.md    # State-change log entries (type: Event)
```

### 6.3 Concept format

Every `.md` file is a **concept document** with YAML frontmatter:

```yaml
---
type: <type>                    # REQUIRED — see concept types below
title: <display name>           # RECOMMENDED
description: <one-line summary> # RECOMMENDED
resource: <canonical URI>       # Optional — for concrete assets
tags: [<tag>, ...]              # Optional
timestamp: <ISO 8601>           # Last-modified
---
[markdown body]
```

Concept types used in Superhive:

| `type` | Description | Reserved body sections |
|---|---|---|
| `Project` | Root objective doc | `# Objective`, `# Success Criteria` |
| `Ticket` | Per-ticket doc | `# Status`, `# Notes`, `# Assignee` |
| `Decision` | Decision made by an agent | `# Context`, `# Resolution`, `# Rationale` |
| `Channel` | Channel summary | `# Participants`, `# Topic`, `# Related Ticket` |
| `AgentContext` | Per-agent project snapshot | `# Role`, `# Current Task`, `# Open Loops` |
| `Event` | State transition entry | `# Before`, `# After`, `# Trigger` |
| `Finding` | Agent-generated insight | `# Summary`, `# Evidence`, `# Implications` |
| `PlanPhase` | Planning module phase | `# Phase`, `# Goals`, `# Status` |
| `RunSummary` | Sub-agent run result | `# Task`, `# Outcome`, `# Next Steps` |

Required fields: `type` only. All others optional. Consumers MUST tolerate unknown types and extra fields gracefully (per OKF spec §9).

### 6.4 Sync semantics

- Every agent working on the project **tunes into** the OKF — reads it before acting, writes to it when state changes
- The OKF is append-mostly; entries are timestamped and attributed to the agent that wrote them
- The Project Agent (§8) is the primary curator; it writes entries on every material state change
- Other agents write entries as a side-effect of their work (decisions, findings, run summaries)
- Each write produces: a new `.md` file (or append to existing) + a `log.md` entry
- The OKF persists across project lifecycle; archived projects become read-only
- The host renders the OKF in the project sidebar as a navigable tree; users can open any concept inline

### 6.5 Why this format

OKF is human-readable without tooling, diffable in version control, and agent-generatable with no bespoke SDKs. It lets the user export a project's entire knowledge base by copying a directory. It tolerates partial generation — broken links, missing optional fields, unknown types are all handled gracefully.

---

## 7. Project Agent

The Project Agent is the **user-facing chat surface inside a project**.

### 7.1 Responsibilities

- Accepts the user's natural-language intent for this project
- Translates intent into tickets (creates draft, surfaces for user confirmation)
- Assigns tickets to the right agent in the project (using each agent's role, current load, and skills)
- Reports back on ticket status, blockers, completions
- Curates the project's OKF — writes decision entries, state transitions, and project-level summaries
- Coordinates sub-agents when the project workload warrants it

### 7.2 Authority model — always surfaces decisions for confirmation

The Project Agent **never acts autonomously** on material state changes. It always surfaces a decision for user confirmation before:

- **Creating a new ticket** — auto-creates a draft with title, description, assignee suggestion, and success criteria; user approves or edits before it enters the queue
- **Re-assigning a ticket** between agents
- **Closing a ticket** that was not opened by the user directly
- **Writing a significant decision** to the OKF (routine log entries are written autonomously)
- **Spawning a sub-agent** that consumes meaningful compute or creates new work items

The Project Agent acts autonomously only on: routine OKF log entries, ticket status transitions within an already-approved workflow, and reads.

### 7.3 Properties

- Lives inside one project; does not span projects
- Has full read/write access to the project's OKF, tickets, channels, and roster
- Is the user's "voice into the project" — the user does not manage tickets directly when working through the Project Agent
- Streams its responses directly into the app in real time over WebSocket (same as regular agents)

### 7.4 Difference from regular agents

A regular agent is an **employee**. The Project Agent is the **project manager** plus the user's primary interface. Regular agents do not normally interact with the user directly — they work through tickets and the Project Agent.

---

## 8. Workspace Agent

The Workspace Agent is the **user-facing chat surface inside a workspace**, one level above the Project Agent.

### 8.1 Responsibilities

- Accepts the user's natural-language intent at the workspace level
- Routes work to the appropriate Project Agent (which in turn routes to individual agents)
- Coordinates across projects when a task spans multiple projects
- Reads but does not write each project's OKF directly (delegates to Project Agents)
- Surfaces a unified view of the workspace: what every project is doing, what is blocked, what needs the user's attention

### 8.2 Chat history

The Workspace Agent has its **own persistent chat thread**, separate from per-project histories. This thread lives at the workspace scope and accumulates the user's workspace-level conversations over time. It is reachable from any project context but is owned by the workspace.

### 8.3 Properties

- Lives inside one workspace; does not span workspaces
- Has read access to all projects' OKFs, ticket summaries, and channel metadata
- Has write access only via the Project Agents of each project
- Acts as the "CEO" of the workspace — strategic view, not tactical work
- Streams its responses directly into the app in real time over WebSocket

### 8.4 Why this layer exists

A user managing a workspace doesn't want to context-switch into every project individually. The Workspace Agent gives them one conversation that sees the whole workspace and can act across all of it.

---

## 9. Communication Model

### 9.1 Channel-based (agent ↔ agent)

Communication inside a project happens over channels:

- Each channel has a topic and a set of explicit participants
- Channels are linked to the ticket they exist to resolve
- Permissions govern which agents may join which channels
- The Project Agent has access to all channels in its project
- The Workspace Agent has read-only metadata on channels across its workspace

### 9.2 User ↔ Project Agent

The user speaks to a project through the Project Agent's chat surface. This is the primary user interaction model for day-to-day project work.

### 9.3 User ↔ Workspace Agent

The user speaks to a workspace through the Workspace Agent's chat surface. This is the workspace-level coordination model.

### 9.4 User ↔ individual agent

Direct user-to-agent chat is possible but not the primary interaction model. Used for targeted instructions or asking an agent about its specific work.

### Out of scope for v1: cross-project agent-to-agent channels; cross-workspace channels

---

## 10. Tiering — development strategy

**Tiering is built last, not first.**

The app is designed and built as the **fully-maxed-out product**. Every feature works, every limit is generous, every surface is unlocked. After the max app is built, the four pricing tiers (`free | pro | meta-hive | enterprise`) are introduced by **removing or scoping features per tier** — never by building tier-specific code paths during initial development.

**Rationale:**
- Forces the app to be designed for the full use case before monetization constraints are layered on
- Avoids tier-shaped code in early components (which is hard to remove later)
- Lets the team observe real usage patterns before deciding what to gate
- Makes tier design a product decision made on a working product, not a guess made on a sketch

**Tier definitions:** placeholder — current `BillingSettings.tsx` UI and `Plan` type are cosmetic only. Full feature-to-tier mapping will be specified after the max app is complete.

---

## 11. Data Architecture

### 11.1 Local-first

Superhive is local-first. All data lives on the user's machine:

- **SQLite database** (libSQL) for structured data: workspaces, projects, tickets, agents, channels, chat threads, settings, OKF metadata
- **OKF bundles** as on-disk markdown trees at `~/.superhive/okf/<project_id>/`
- **Agent state** in each agent's `.general-v1/` directory (SAC memory, LanceDB vectors, mission-control tickets, audit logs)
- **Host state** in `~/.superhive/` (agent registry, inter-agent messages, permission history, presence)
- No cloud sync, no multi-device, no real backend required

### 11.2 App DB schema (libSQL via `DbDataSource`)

```
src/data/
├── seed/seed.sql          # Schema + static seed data
├── datasource/
│   ├── index.ts            # Factory — re-exports dbDataSource
│   ├── types.ts            # DataSource interface
│   └── db-source.ts        # DbDataSource implementation
└── {domain}/
    ├── interface.ts        # Types + function signatures
    └── store.ts            # Only public API for that domain
```

Existing tables: workspaces, projects, project_agents, tickets, channels, channel_messages, swarm_activity, agents, telemetry, permissions, audit_items, pending_questions, favorites, chat_threads, chat_messages, settings, schema_meta

**OKF is NOT stored in the app DB** — it lives on disk as markdown files. The app DB stores a pointer to the OKF root (`~/.superhive/okf/<project_id>/`) and OKF metadata (last sync time, entry count) for display purposes.

### 11.3 Settings

Settings live in `src/data/settings/`:
- `settings.json` — seed defaults
- `interface.ts` — all settings types including `PlanTier = 'free' | 'pro' | 'meta-hive' | 'enterprise'`
- `settings-context.tsx` — `SettingsProvider` merging `settings.json` + `localStorage`; `localStorage` wins

---

## 12. Open Questions

The following are resolved or pending:

~~A. Agent CLI repo~~ — resolved: [`general-v1`](https://github.com/rishi-ie/general-v1)

~~B. OKF schema~~ — resolved: OKF v0.1 markdown-bundle format; storage at `~/.superhive/okf/<project_id>/`

~~C. Role-specific memory~~ — resolved: agent's own local storage in `.general-v1/sac/` and `.general-v1/vectors/`

~~D. Project Agent authority~~ — resolved: always surfaces decisions for confirmation before material actions

~~E. Workspace Agent chat history~~ — resolved: yes, own persistent thread per workspace

~~F. Tiering strategy~~ — resolved: build max first, remove features to create tiers

~~G. Agent identity storage~~ — resolved: app tracks agents by ULID; agent registers with `AGENT_HELLO` on WS connect

**Still open:**

1. **Creation flows** — full wizard and dialog flows for creating workspaces, projects, agents, and the Workspace/Project Agents (you mentioned you'd specify these)

2. **Sub-agent visibility** — should sub-agents spawned by a parent agent be visible in the app UI as nested entries under the parent, or only aggregated as status? Recommended: nested view with expand/collapse.

3. **Permission request UX** — when an agent raises `PERMISSION_REQUEST` over WS, where does the user see and act on it? Recommended: top-right toast with Approve/Deny + full history in the agent's Sessions tab.

4. **Agent folder generation** — the setup wizard runs `general-v1`'s `./setup.sh` interactively; does the app need to drive this non-interactively (pre-seed API keys, auto-generate identity), or is interactive acceptable for v1? Recommended: non-interactive with env vars passed at startup for API keys, ULID pre-generated by the app.

---

## 13. Out of Scope (for now)

- Real billing/payment provider integration (current Billing page is a UX prototype)
- Cloud sync or multi-device support
- Real auth or user management beyond local settings
- Cross-project agent-to-agent channels
- Cross-workspace aggregate views
- Importing existing `general-v1` agent folders (only "create new" wizard at launch)
- Agent auto-scaling or cloud-hosted agent runtimes
