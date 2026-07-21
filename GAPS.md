# Gaps — Superhive Today vs. Product Vision

Vision summary: Superhive is an operating system for autonomous organizations. The Project is the primary abstraction. The Project Agent is the permanent CEO/PM/Architect. Specialists are bounded employees. Resources, decisions, and long-term memory belong to the **Project**, not to agents. Work flows through the Project Agent, runs in parallel via a dependency graph, and compounds institutional knowledge over time.

Current state: Superhive is a desktop process manager for independent Pi coding-agent subprocesses. Projects exist as metadata groups; the "coordinator" is a flag, not a runtime role. There is no agent-to-agent communication, no task queue, no dependency graph, no project-level memory, and no parallel-execution surface. Most right-panel and settings surfaces are decorative placeholders.

This document maps the twelve load-bearing gaps between the two. Phasing recommendations are at the end.

---

## Gap 1 — Coordinator is a label, not a runtime role

> **STATUS**: ✅ IMPLEMENTED. See `superhive/changelog/2026-07-21-gap-1-coordinator-runtime-role.md` for full details.
>
> - New extension `superhive-pi-orchestration` (50 tests pass)
> - Truth settings schema gained `project?: ProjectBlock` field
> - Electron: `AGENT_KIND` env var at spawn, project block seed, status mirror
> - 5 coordinator-only tools (2 working, 3 honest Gap 2 stubs)
> - Bundle synced to `general-kai/extensions/superhive-pi-orchestration/`
>
> **Known limitations (deferred to Gap 2)**:
> - 3 tools (dispatch, read_inbox, send_message_to_agent) return Gap 2 stubs
> - Telemetry-driven status changes don't patch truth file
> - Coordinator needs /reload to pick up new members without restart

**Vision**: The Project Agent is the permanent CEO. It owns project memory, routes work, reviews outputs, merges knowledge, owns resources.

**Current (post-Gap-1)**: The coordinator is a regular Pi subprocess that now boots with a project-aware CEO system prompt and has 5 LLM-callable tools no standard agent can see. `agentKind === "project-coordinator"` gates everything. Member roster and statuses are kept fresh by Electron's status-mirror helper on start/stop/update_status.

**Work (completed)**:

- ✅ New extension `superhive-pi-orchestration` with 5 coordinator-only tools
- ✅ Coordinator system-prompt injection on `session_start` from `settings.project`
- ✅ Tool registration gated on `AGENT_KIND === "project-coordinator"` env var
- ✅ Truth settings `project?: ProjectBlock` field
- ✅ Status mirror helper at `electron/project-status-mirror.ts`

---

## Gap 2 — No agent-to-agent communication

> **STATUS**: ✅ IMPLEMENTED. See `superhive/changelog/2026-07-21-gap-2-mailbox.md` for full details.
>
> - Workers post into the project chat (`<coordDir>/chat.jsonl`); coordinator sees them via `read_inbox` filtered by kind, excluding self + user + already-delivered.
> - Coordinator private-asks a specific worker via `ask_member` → writes to `<workerDir>/inbox.jsonl` → main-process tailer wakes the worker.
> - Members get 2 tools (`read_inbox`, `post_to_project`); coordinator gets all 5.
> - `MailboxWatcher.watchAgent` does an immediate cold-start check so a worker that was offline during an `ask_member` wakes the moment it starts.
> - On-disk format identical between orchestrator (Pi subprocess) and main-process IPC, so the watcher treats both writes the same.
> - 51 unit + 11 smoke orchestrator tests; 13 mailbox-watcher tests; 177 main-repo tests. All green.
> - Bundle synced to `general-kai/extensions/superhive-pi-orchestration/`.
>
> **Known limitations (deferred to Gap 7+):**
> - Right-panel `InboxSection` and `ProjectSettingsPanel` Inbox tab are still placeholders. C7 (separate commit) wires them to real data.

**Vision**: Workers never communicate randomly. Everything routes through the Project Agent.

**Current**: Two agents can only "communicate" by the user manually opening each chat. There is no mailbox, no event bus, no dispatch IPC, no shared inbox, no `agents:send-to-agent`.

This is the highest-leverage gap. Without it, none of the coordination stories work.

**Work**:

- Mailbox store: `db.mailbox.json` (or per-agent `inbox.jsonl`). Message shape: `{id, fromAgentId, toAgentId, projectId, kind: 'question' | 'result' | 'request' | 'broadcast', body, refs[], status: 'pending' | 'delivered' | 'acked', createdAt, deliveredAt}`.
- New IPC channels: `agents:send-to-agent`, `agents:read-inbox`, `agents:ack-message`, `agents:list-inbox`.
- Main-side event bus that wakes a recipient agent when a message is delivered.
- Coordinator auto-routing: when a worker sends `request_help`, the coordinator's runtime picks it up, decides, and queues a `result` back.
- Telemetry event `mail` added to `superhive-pi-telemetry/types.ts` so the renderer's runtime slice can render message activity.
- Right-panel `InboxSection.tsx` (already exists as a placeholder) wired to real data.

---

## Gap 3 — No task queue, dependency graph, or parallel execution

**Vision**: Project Agent expands requests into a dependency graph. Independent tasks execute simultaneously.

**Current**: `Task` type exists in `storage/types.ts:46-58` but has no repository, no IPC, no UI, no creation flow, no worker. `taskIds` arrays on agents and projects are scaffolding. `AgentsListRow` shows `—` because nothing populates the count.

**Work**:

- `TaskRepository` in `superhive/src/storage/repositories/TaskRepository.ts` matching `AgentRepository` shape (CRUD + queue-write serialization).
- Task IPC in `superhive/electron/ipc/tasks.ts`: `tasks:list`, `tasks:create`, `tasks:update`, `tasks:cancel`, `tasks:assign`, `tasks:dependencies:add`, `tasks:dependencies:remove`.
- Dependency graph in `superhive/electron/task-graph.ts`: edges stored separately; resolver returns "ready" tasks given current statuses.
- Parallel runner in `superhive/electron/task-runner.ts`: picks ready tasks, ensures assigned runtime is started, calls `agents:send`. Per-project concurrency cap (e.g. 4).
- Coordinator LLM tool `plan_tasks` in `superhive-pi-orchestration`: takes a plan, parses into Task rows + edges, commits them, kicks the runner.
- Project backlog UI in a new `superhive/src/pages/project-chat/tabs/BacklogTab.tsx`: columns for todo / running / blocked / done, drag to reorder, click to inspect.
- Per-agent task badge wired to actual count in `AgentListRow`.

---

## Gap 4 — No project-level persistent memory

**Vision**: Projects never forget. "Why did we abandon Architecture V3?" answers immediately because every decision was preserved.

**Current**: Each agent has its own `chat.jsonl` (display transcript) and an in-memory Pi session that is wiped on restart (`--no-session`). The coordinator's `context/` graph is **seeded but not activated** — extension looks under `<agentDir>/workspace/.pi/agent/context/` while Electron seeds `<agentDir>/context/`. Even when it activates, it is only the coordinator's compaction log; nothing project-level sits above it.

There is no project decision log, no project artifact registry, no project knowledge base, no cross-agent long-term memory, no decision history viewable by user. `meta.json.projectId` is written as `null` because the coordinator is created before being linked to the project, and the later linking step never backfills it.

**Work**:

- Fix the **path mismatch** in `superhive-pi-context/index.ts:19-28` so the graph initializes against the seeded `<agentDir>/context/`.
- Backfill `meta.json.projectId` after `projects:addAgent` for the coordinator (`electron/ipc/agents.ts:144-151` + the linking step in `flows/projects/crud/prepare-project.ts`).
- New project-level `context/` directory at `<projectDir>/context/` that the coordinator writes to and members can read from. Coordinator's `<coordinatorDir>/context/` becomes a personal cache.
- New entities: `Decision` and `Artifact`. Repositories + IPC + UI.
- Project memory timeline UI in `superhive/src/pages/project-chat/`.

---

## Gap 5 — No bounded context for workers

**Vision**: Every specialist operates within ~50,000 tokens. When the limit approaches, the worker informs the Project Agent, which may decompose the task further.

**Current**: Each agent uses the full Pi default `compaction.reserveTokens: 16384, keepRecentTokens: 20000`. There is no per-agent budget enforcement, no worker→coordinator signal when running hot, no automatic decomposition trigger.

**Work**:

- Add `compaction.bound: { soft, hard, strategy: 'signal-coordinator' | 'auto-decompose' }` to the truth settings schema (`superhive-pi-truth/settings-schema.ts`).
- New `superhive-pi-orchestration` worker-side hook: when telemetry `context.usage > soft`, emit a `context-bounded` event into the coordinator's mailbox.
- Coordinator `decompose_task` tool: takes the running task and a list of new specialist roles; spawns new agents; reassigns subtasks.
- Coordinator UI showing each member's token usage as a pill (red/amber/green) above the chat.

---

## Gap 6 — No recursive specialist creation

**Vision**: Backend Lead creates Storage Engineer, who creates Vector DB Engineer, who creates Index Optimization Engineer. Every specialist owns one responsibility.

**Current**: No agent can create another through the active architecture. `agents:create` is exposed only to the renderer. An agent with terminal permission could in theory `bash` something, but it would be off-the-books and not tracked.

**Work**:

- `request_specialist` tool in `superhive-pi-orchestration`. Inputs: `{name, role, description, parentProjectId, parentAgentId}`. Output: new agent ID.
- New IPC `agents:create-child`: same as `agents:create` but auto-assigns to the calling agent's project, stamps `parentAgentId`, and immediately starts the new agent.
- Permission gating: tool exposed only when `agentKind === "project-coordinator"` OR `parentAgentId !== null`.
- Sidebar tree indentation in `ProjectsSection.tsx` for nested specialists, with a "creator" column.

---

## Gap 7 — No project resource ownership

**Vision**: Resources belong to Projects — GitHub, Slack, Google Drive, AWS, Cloudflare, MCP servers, skills, extensions, plugins. Agents inherit permissions. Project Agent decides who gets what.

**Current**: Permissions are per-agent (`permissions: {filesystem, terminal, network}` in truth file). No concept of project-level resources, no permission inheritance, no MCP config at the project level.

**Work**:

- New entity `ProjectResource { id, projectId, kind, config, credentialsRef, grantedTo: 'project' | 'coordinator' | 'specific-agents'[] }` with repo + IPC.
- Truth field `permissions.inheritedFromProject` that the applier merges over the agent's own when set.
- Coordinator tool `grant_resource(agentId, resourceId)` and `revoke_resource`.
- MCP config injection through Pi manifest `packages` entries, gated by per-agent inheritance.

---

## Gap 8 — No long-running / durable execution

**Vision**: Autonomous long-running objectives. Tasks persist across restarts. Idle agents archived but reactivatable. Background work continues without user presence.

**Current**: On app quit, **all** agents are stopped (`electron/main.ts:145-149`). No resume on next launch. No scheduler. No "keep working in background" toggle. `status` enum doesn't include `archived` or `reactivatable`.

**Work**:

- Extend `Agent.status` with `archived`, `reactivatable`. Add `archivedAt`, `lastActiveAt` to `Agent`.
- On app boot, enumerate `tasks` with status `running`; start assigned agents and resume their queue.
- "Keep working in background" toggle per project, persisted in db.
- Optional background scheduler `superhive/electron/scheduler.ts` (cron-like) that runs saved prompts on coordinators.

---

## Gap 9 — UI is decorative in many places

The vision describes a user-facing OS. The UI today shows it isn't built yet.

| Surface | Current | Target |
|---|---|---|
| Landing composer (`/`) | Decorative textarea, no state | Routes user intent to the active project's coordinator; or prompts to create a project |
| Split-pane hint | Hardcoded text | Real tiled multi-agent views (coordinator + member chats side by side) |
| Command palette `New Chat/Agent/Project` | "Coming soon" toasts | Actually create |
| Right-panel `Overview` (agent) | Hardcoded role/tasks/activity | Reads from agent + project + tasks |
| Right-panel `Inbox` | Always empty | Real inbox wired to mailbox |
| Right-panel project tabs | "Coming soon" everywhere | Member status, decisions, artifacts, context nodes, running tasks |
| Settings sections (Account/Appearance/Agents/Plans/Remote/Tools/Rules/Beta/Docs) | Placeholders | Many are required for the org-level view (Plans = billing, Rules = project conventions, Tools = resources, Agents = employee catalog) |

---

## Gap 10 — Pi session continuity is broken

**Vision**: Specialists permanently remember. Compounding intelligence.

**Current**: `agent.sh` is launched with `--no-session` (`electron/general-kai-runtime.ts:558-560`). Pi selects an in-memory SessionManager. On restart the Pi context is wiped. `chat.jsonl` survives as a display transcript but is never replayed into Pi's actual context. So after a restart, an agent's *visible history* exists but the *model's actual memory* does not.

This kills "employees improve over time" for any agent that restarts.

**Work**:

- Decide session persistence policy. Per-agent truth field `sessionPersistence: 'none' | 'compact' | 'full'`.
- If `none` (current), keep `--no-session` but replay `chat.jsonl` into Pi's initial messages on startup so visible history becomes model context.
- If `compact` or `full`, stop using `--no-session` and let Pi persist sessions under `<agentDir>/workspace/.pi/agent/sessions/`.
- For coordinator specifically: route compaction into the context graph (this is what `superhive-pi-context` was built for, but doesn't activate today due to Gap 4).

---

## Gap 11 — Identity & permission model

**Vision**: User = executive. Project Agent = CEO. Workers = employees. Permissions cascade from Project.

**Current**: No user identity beyond hardcoded "User / Free plan" footer. No per-MCP/project grants. No audit trail. No quota tracking per project.

**Work**:

- Real user identity model (local-only first; cloud later if/when needed).
- Audit trail entity: every dispatch, every tool call, every message recorded against an actor + project.
- Per-project billing/quota tracking derived from telemetry `usage` events.

---

## Gap 12 — Concrete pre-existing bugs worth fixing first

- **Coordinator context path mismatch** (covered in Gap 4) — graph never initializes. Highest-priority concrete bug.
- **`MINIMAX_API_KEY` hard requirement on agent creation** at `electron/ipc/agents.ts:176-190` and `config.ts:9-18` — blocks any non-MiniMax user from creating agents.
- **Truth session index points to wrong path** at `superhive-pi-truth/index.ts:274-301` — computes `<agentRoot>/.pi/agent/sessions` but Pi manifest mode writes to `<agentRoot>/workspace/.pi/agent`. Indexing is dead.
- **`meta.json.projectId: null`** — coordinator is created before project links to it; linking step never backfills. Makes the context graph unable to associate nodes with their project.

---

## Suggested phasing

Each phase ships something the user can see working and unblocks the next.

### Phase 0 — Stop the bleeding (hours)

Fix the four items in Gap 12. After this: the context graph initializes on every coordinator, agent creation works without a MiniMax key, truth session index points to the right place, project metadata is correct.

### Phase 1 — Make the coordinator a coordinator (the smallest meaningful unit of the vision)

1. Coordinator system-prompt injection on `session_start` (project name + description + member roster + active tasks).
2. New `superhive-pi-orchestration` extension: `list_project_agents`, `get_agent_status`, `dispatch_to_agent`, `read_inbox`, `send_message_to_agent`. Gated on `agentKind === "project-coordinator"`.
3. Mailbox store + IPC (`agents:send-to-agent`, `agents:read-inbox`, `agents:ack-message`).
4. Wire `InboxSection` to real data.

**After Phase 1**: the user can create a project, talk to the coordinator, and watch the coordinator dispatch to a specialist and report back. The core vision story works end to end, manually.

### Phase 2 — Tasks and parallelism

1. `TaskRepository` + IPC.
2. Dependency graph + parallel runner.
3. `plan_tasks` coordinator tool.
4. Project backlog UI.

**After Phase 2**: "design a reasoning architecture" fans out into a dependency graph with parallel workers.

### Phase 3 — Memory and recursion

1. Project-level `context/` (read by coordinator + members, write by coordinator).
2. Decision log + artifact registry.
3. `request_specialist` tool + recursive child-agent creation.
4. Worker→coordinator bounded-context signal.
5. Project memory timeline UI.

**After Phase 3**: the organization grows itself and accumulates institutional knowledge.

### Phase 4 — Resources and lifecycle

1. Project resource registry.
2. Permission inheritance.
3. Agent archive/reactivation states.
4. App-launch task resumption.
5. Background scheduler.
6. Settings pages wired.

### Phase 5 — UI consolidation

1. Split-pane multi-agent view.
2. Landing composer routes to active project.
3. Command palette actions.
4. Real right-panel content for every tab.
