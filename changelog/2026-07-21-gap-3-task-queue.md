# Changelog — 2026-07-21 — Gap 3: Task Queue, Dependency Graph, Serial Execution

> Implements GAPS.md § Gap 3. The coordinator (the project's CEO/PM) breaks a user request into a dependency graph of tasks. The orchestrator watches the graph and dispatches each task to its assigned worker the moment its dependencies are done — one at a time per project. The right-panel "Active tasks" accordion shows live state (running · todo · blocked · done). Workers post results to the project chat; the coordinator acks via `complete_task`. If a worker crashes mid-task, the runner auto-retries after 10 minutes of staleness. Pure-FS at the agent layer, file-drop between Pi subprocess and main process.

---

## Summary

| | Before | After |
|---|---|---|
| Coordinator's tools | 5 (mailbox only) | 7 — adds `plan_tasks`, `complete_task` |
| Worker's tools | 2 (mailbox) | 2 — unchanged |
| `db.tasks.json` | Absent (no repository, no IPC) | New. `TaskRepository` mirrors `AgentRepository` shape (CRUD + cascade + filters). |
| Task state | None | `todo` → `running` → `completed`; also `blocked` (cancelled dep) and `cancelled` |
| Dependency graph | None | `task.dependencies: string[]` (taskIds). Resolved in `ingestPlan` and enforced by the runner. |
| Dispatch | Manual (user relays every step) | Automated: 5s poll, serial, auto-start the agent if stopped, inject `Task <id>: <title>` prompt |
| Stale-task recovery | None | Auto-retry after 10 min of no completion |
| File drop protocol | n/a | `<coordDir>/tasks-plan.json` (atomic write) + `<coordDir>/tasks-complete.jsonl` (append). Main-process tailer ingests + truncates. |
| Right-panel "Active tasks" | Hardcoded `badge={0}` placeholder | Real-time list grouped by status, badge counts active (not done/cancelled) |
| Cross-process contract | n/a | `IPC.TASKS.*` channels (7) + `tasks:changed` broadcast |
| Renderer subscription | n/a | `useTasksByProject(projectId)` + pub-sub `useTasksVersion` (mirrors `useProjectsListVersion`) |

**Test status:** 9 new tests for `TaskRepository` (in isolation — full suite was blocked by the IPC test suite's `mock.module('database', ...)` leak; see "Known limitations" below). 9 new tests for `tasks-file-watcher-core` pure ingest (run in full suite). 194/195 main-repo tests (1 pre-existing flake in `mailbox-watcher`). 51/51 orchestrator tests.

---

## Files added

| File | Purpose |
|---|---|
| `superhive/changelog/2026-07-21-gap-3-task-queue.md` | This file. |
| `superhive/src/storage/repositories/TaskRepository.ts` | New repository: `create` (stamps `status='todo'`, `priority='medium'`, `dependencies=[]`, `tagIds=[]`), `getById`, `getAll`, `getByProject`, `getByAgent`, `update`, `delete` (cascades to `Project.taskIds` + `Agent.taskIds`), `assignAgent` (bidirectional), `changeStatus` (with `staleSince` clear/preserve semantics, `blockerReason` for `blocked`, `outcome` for `completed`), `getStaleRunning(staleAfterMs)` for the runner. |
| `superhive/src/storage/repositories/TaskRepository.test.ts` | 9 unit tests for the above. |
| `superhive/electron/ipc/tasks.ts` | 7 IPC handlers (`LIST`, `GET`, `CREATE`, `UPDATE`, `DELETE`, `ASSIGN`, `CHANGE_STATUS`). All delegate to `TaskRepository`. `LIST` accepts an optional `TaskFilter` (projectId, agentId, status). Every mutation broadcasts `tasks:changed` via `tasksFileWatcher.notifyChanged()`. |
| `superhive/src/api/tasks.ts` | Renderer-side wrapper mirroring `src/api/agents.ts` (8 lines). |
| `superhive/src/flows/tasks/runtime/use-tasks-by-project.ts` | Pub-sub version counter (mirrors `useProjectsListVersion`) + `useTasksByProject` hook + `sortTasksByStatus` (running > todo > blocked > completed > cancelled). |
| `superhive/electron/tasks-file-watcher-core.ts` | Pure-FS ingest: `ingestPlan(coordDir)` (reads `tasks-plan.json`, creates Task rows, resolves `assignedAgent` name → id, resolves `dependencies` titles → ids, truncates the plan file) + `ingestComplete(coordDir)` (reads JSONL, applies `changeStatus('completed', {outcome: summary})`, truncates). Reads `db.projects.json` directly (NOT via `ProjectRepository`) to survive the IPC test suite's mock leakage. |
| `superhive/electron/tasks-file-watcher-core.test.ts` | 9 tests for the pure ingest (run in full suite). |
| `superhive/electron/tasks-file-watcher.ts` | Electron-side wrapper: `attachDbTasksWatch` (watches `db.tasks.json` and broadcasts `tasks:changed`) + `attachCoordinatorFileWatches` (watches every `<coordDir>/tasks-plan.json` and `tasks-complete.jsonl`, debounced 250 ms, calls the core ingest). `BrowserWindow` is exposed via an injectable `setBrowserWindowProvider` so tests can swap in a stub without touching the electron module. |
| `superhive/electron/task-runner.ts` | 5s polling loop. Per project per tick: (1) reset stale `running` → `todo` if `staleSince > 10 min`, (2) mark tasks `blocked` if any dep is `cancelled`, (3) re-fetch, (4) dispatch FIRST ready `todo` task (serial) by starting the assigned agent if not running, then `runtime.send(agentId, prompt)` where `prompt = "Task <id>: <title>\nProject: <name>\n\n<description>"`. `RuntimeLike` is injectable for tests. `getTaskRunner()` is a lazy singleton to avoid pulling `general-kai-runtime` (which imports electron) at module load. |

## Files modified

| File | Change |
|---|---|
| `superhive/src/storage/types.ts` | `Task` extended: `dependencies: string[]`, `blockerReason?: string`, `staleSince?: number`, `outcome?: string`. All optional so pre-Gap-3 db files still read. |
| `superhive/src/storage/database.ts` | Added a shared `handles` map + `__resetDbCache()` test escape hatch. The 3 existing repositories' per-module `_db` caches are now optional (only `AgentRepository` keeps one for `getAllSync`). New `__reset{Agent,Project,Task}Db()` exports clear them. |
| `superhive/src/storage/repositories/AgentRepository.ts` | Added `__resetAgentDb` export. |
| `superhive/src/storage/repositories/ProjectRepository.ts` | Added `__resetProjectDb` export. |
| `superhive/src/storage/repositories/TaskRepository.ts` | New (see above). |
| `superhive/src/storage/repositories/index.ts` | Re-export `TaskRepository`. |
| `superhive/electron/ipc/index.ts` | Added `IPC.TASKS.*` channel constants + `registerTaskIpc()` call inside `registerIpc()`. |
| `superhive/electron/preload.ts` | Added `tasks` block on `window.api`: `list`, `get`, `create`, `update`, `delete`, `assign`, `changeStatus`, `onChanged`. |
| `superhive/src/types/electron.d.ts` | Re-exported `Task`/`TaskStatus`/`TaskPriority`. Added `TaskCreateInput`, `TaskUpdateInput`, `TaskFilter`, `TasksAPI`. |
| `superhive/src/api/index.ts` | Re-exported `tasks`. |
| `superhive/electron/main.ts` | Boot: `tasksFileWatcher.start()` + `getTaskRunner().start()` after `attachMailboxWatches()`. Quit: stop both before `runtime.shutdownAll()`. |
| `superhive/src/components/layout/right-sidebar/sections/ProjectOverviewSection.tsx` | Hardcoded `<Accordion title="Active tasks" badge={0}>` replaced with `<ActiveTasksAccordion projectId={project.id} />`. Renders a `TaskRow` per task (title + status pill). Completed and cancelled are dimmed. `defaultOpen` so the user sees work in progress without clicking. |
| `superhive-pi-orchestration/project.ts` | Added `writeTaskPlan(coordDir, plan)` (atomic tmp+rename) + `appendTaskComplete(coordDir, entry)` (JSONL append). |
| `superhive-pi-orchestration/types.ts` | Added `TaskPlan`, `TaskPlanEntry`, `TaskCompleteEntry` interfaces. |
| `superhive-pi-orchestration/tools.ts` | Two new coordinator-only tools: `plan_tasks({tasks: [{title, description?, dependencies?, assignedAgent}]})` writes the plan file. `complete_task({taskId, summary?})` appends to the complete file. Both tools are pure FS — no Electron call. |
| `superhive-pi-orchestration/system-prompt.ts` | New `buildTasksSection()` in the coordinator CEO prompt: explains `plan_tasks` → dispatch loop, `complete_task` after a result. |
| `superhive-pi-orchestration/AGENTS.md` | Tool set updated to 7 tools. Rule 9 documents the cross-process file drop protocol. |
| `superhive-pi-orchestration/test/tools.test.ts` | Coordinator tool count test updated to 7 (was 5). New tools asserted in the expected list. |
| `general-kai/extensions/superhive-pi-orchestration/` | Seam-3 mirror. `diff -rq` is empty (excludes `.git`, `node_modules`, `package-lock.json`). |
| `superhive/GAPS.md` | Gap 3 flipped to `✅ IMPLEMENTED` with a one-paragraph summary + link to this changelog. |

## Behavioral change (simple words)

**Before.** The Project Agent (coordinator) is a great conversationalist but a bad boss. Ask it "design a reasoner architecture" and it lists steps in prose, but cannot make the work happen. The user manually relays each step to a worker.

**After.** The coordinator becomes a real boss. It breaks a request into Tasks with a dependency graph. The orchestrator watches the graph and dispatches each task to its assigned worker the moment its dependencies are done. One at a time per project. Workers post results to the project chat, the coordinator acks via `complete_task`, the next wave fires. The right-panel "Active tasks" accordion shows live state. If a worker crashes mid-task, the runner auto-retries after 10 minutes of staleness.

The user-visible difference: tell the coordinator "do X" once, then watch it run. The chat becomes a log, not a manual relay.

---

## Where to change what (map)

| Want to… | Edit |
|---|---|
| Change the dispatch cadence (default 5s) | `electron/task-runner.ts` `TICK_MS` |
| Change the stale-retry threshold (default 10 min) | `electron/task-runner.ts` `STALE_MS` |
| Change the per-task dispatch prompt format | `electron/task-runner.ts` `buildTaskPrompt` |
| Change what a "ready" task looks like (e.g. priority) | `electron/task-runner.ts` `runProject` ready filter |
| Change the right-panel sort order | `src/flows/tasks/runtime/use-tasks-by-project.ts` `STATUS_ORDER` |
| Add a new TaskStatus value | `src/storage/types.ts` `TaskStatus` + `STATUS_COLOR` in `ProjectOverviewSection` + `STATUS_ORDER` in the hook |
| Change the file drop format | `superhive-pi-orchestration/types.ts` `TaskPlan*`/`TaskCompleteEntry` AND `electron/tasks-file-watcher-core.ts` ingest helpers (BOTH sides must match) |
| Add a new orchestrator task tool | `superhive-pi-orchestration/tools.ts` + register in `registerOrchestrationTools` coordinator branch |

---

## Out of scope (deferred to later gaps)

- **Backlog kanban** with drag/drop and per-row actions. The right-panel accordion is the conservative default; if users want a kanban it's a separate gap.
- **`tasks:cancel`** as a dedicated channel. Use `tasks:update` with `status: 'cancelled'`. The runner's block check treats `cancelled` deps as a blocker.
- **`tasks:dependencies:add/remove`** as dedicated channels. Use `tasks:update` with the `dependencies` field.
- **Project-level concurrency > 1**. The runner is one-at-a-time per project. Increase when a project needs parallelism.
- **DAG topological sort**. Linear filter is sufficient at N≤50 tasks per project.
- **Priority queue, dead-letter, retry caps, max-attempt counter**. The coordinator can manually `complete_task` a stuck task.
- **`createdBy`, `parentTaskId`, decomposition lineage**. Gap 5 territory.
- **Per-task event channel**. `tasks:changed` global is enough; the renderer filters by `projectId`.
- **Plan versioning, plan queue, plan rollback**. Overwrite only.
- **`request_specialist` (Gap 6)**. `plan_tasks` can ask for new agents, but creating them is a separate gap.
- **Telemetry event for tasks**. The `MailEvent` already covers the "task done" signal via `post_to_project` + `kind: 'result'`.
- **Email/Slack/Calendar notifications on completion**.
- **Task inspector dialog, per-row cancel/re-assign in UI**. Click-to-inspect is a future gap.

---

## Known limitations

1. **Task-runner integration test is missing.** The IPC test suite's `mock.module('database', ...)` leaks forward, so a test that drives `TaskRunner.tick` against a real `TaskRepository` fails in the full suite. Pass in isolation. Fix when Bun's `mock.restore` actually unsticks cross-file mocks. Workaround: run `bun test electron/task-runner.test.ts` by itself.

2. **Plan validation is best-effort.** The orchestrator's `plan_tasks` tool writes titles; the main-process ingest resolves `assignedAgent` (name → id) and `dependencies` (title → id) at ingest time. Orphan `dependencies` (titles that don't exist yet) are silently dropped — the task starts in `todo` with `dependencies: []`. The coordinator LLM should re-plan if it sees a task stuck in `todo` longer than expected.

3. **No auto-completion.** A task moves to `completed` only when the coordinator calls `complete_task(taskId, summary)`. The runner does NOT watch the project chat for `kind: 'result'` messages. This keeps the runner simple but means a forgetful coordinator leaves tasks stuck in `running` until the stale-retry kicks in (10 min).

4. **The `[mail]` wake prompt** (injected by the mailbox watcher for project chat entries) does NOT include task-id annotations. The coordinator must remember the task id from the dispatch prompt and the chat history. Improvement: tag the worker's `post_to_project` call with the task id (via the `refMessageId` field that already exists on `ChatEntry`).

5. **First `read_inbox` after a plan_tasks call** returns the chat history without the new task ids. The coordinator learns the task ids from the `[mail]` wake prompt that fires when the worker posts its result. There's a small UX gap if the coordinator wants to track task state before the worker has responded.

---

## Risk + rollback

| Risk | Likelihood | Mitigation |
|---|---|---|
| Race between plan ingest and runner dispatch | Low | Runner reads task list fresh each tick; worst case = one-tick lag (~5s). |
| Auto-retry thrashing on persistently failing task | Medium | User sees the loop in the right-panel; coordinator can `complete_task` or `tasks:update` to cancel. Future: max-attempt counter. |
| Plan file collision (two coordinators writing simultaneously) | None | Plan file is per-coordinator (`<coordDir>/tasks-plan.json`); one coord per project. |
| `runtime.send` silently fails (worker offline) | Low | `runtime.isRunning()` check first; if false, `runtime.start()`; if still false, leave task as `todo`. |
| Schema migration on existing db files | None | New fields are optional; pre-Gap-3 files read fine (new fields = `undefined`). |
| Orchestrator can't see task ids after `plan_tasks` | By design | Coordinator learns task ids from workers' project chat messages (prompt includes "Task <id>: <title>"). |

**Rollback.** Revert commits 1-8 (superhive: 6 commits, superhive-pi-orchestration: 1, general-kai: 1). `db.tasks.json` is a new file (no migration). Right-panel reverts to `badge={0}`. Orchestrator's two new tools stop appearing on next extension reload. Pre-existing `Task` type fields (`taskIds` arrays) are untouched. Schema extension adds optional fields only.
