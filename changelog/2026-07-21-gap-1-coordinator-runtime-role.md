# Changelog — 2026-07-21 — Gap 1: Coordinator as Runtime Role

> Implements GAPS.md § Gap 1. The Project Agent is no longer a labeled Pi subprocess — it boots with a project-specific CEO system prompt and has 5 LLM-callable tools no standard agent can see.

---

## Summary

| | Before | After |
|---|---|---|
| Coordinator's system prompt | Generic Pi defaults | Project-specific CEO prompt with live member roster |
| Coordinator's tool list | 9 truth tools + Pi defaults | 9 truth tools + 5 orchestration tools (2 work, 3 are honest Gap 2 stubs) |
| Standard agent's tool list | 9 truth tools | 9 truth tools (no change — orchestration tools never registered for them) |
| Member status freshness | Reflected only in right sidebar | Reflected in sidebar AND coordinator's truth `project.members[].status` |
| `project` block on coordinator's truth file | Absent | Present from coordinator creation, mutated by status-mirror helper |
| `AGENT_KIND` env var on Pi subprocess | Not set | Set at spawn (`'project-coordinator'` or `'standard'`) |

50 unit + smoke tests in the new extension pass. 67 context-extension tests still pass. Typecheck clean for all Gap-1 files (only pre-existing errors in `general-kai-runtime.ts:341,649,665` remain, unrelated to Gap 1).

---

## Files added

| File | Purpose |
|---|---|
| `superhive-pi-orchestration/index.ts` | Session_start handler. Gate on `AGENT_KIND`. Build CEO prompt from truth settings `project` block. Write back. Register 5 tools. |
| `superhive-pi-orchestration/tools.ts` | 5 `defineTool()` definitions (2 working, 3 Gap 2 stubs). |
| `superhive-pi-orchestration/project.ts` | Read/write helpers: `readProjectBlock`, `writeProjectBlock`, `patchMemberStatus`, `addMember`, `removeMember`. Atomic-write with writer-counter bump. |
| `superhive-pi-orchestration/system-prompt.ts` | Pure builder for the CEO system prompt (header, mission, team roster, tools index, decision style, escalation, boundaries). |
| `superhive-pi-orchestration/types.ts` | `ProjectBlock`, `MemberRef`, `MemberStatus`, `CoordinatorSettingsShape` interfaces. |
| `superhive-pi-orchestration/test/system-prompt.test.ts` | 12 unit tests for the prompt builder. |
| `superhive-pi-orchestration/test/project.test.ts` | 16 unit tests for project block read/write roundtrip and atomicity. |
| `superhive-pi-orchestration/test/tools.test.ts` | 10 unit tests for the 5 tool execute() bodies. |
| `superhive-pi-orchestration/test/smoke.ts` | 12 end-to-end smoke tests driving the extension factory. |
| `superhive-pi-orchestration/package.json` | Module manifest with `@earendil-works/pi-coding-agent` and `typebox` deps. |
| `superhive-pi-orchestration/tsconfig.json` | TS config. |
| `superhive-pi-orchestration/AGENTS.md` | Module-level rules (AGENT_KIND gating, pure-filesystem backing, honest stubs, atomic writes, seam-3 sync). |
| `superhive-pi-orchestration/README.md` | Top-level orientation. |
| `superhive-pi-orchestration/IMPLEMENTATION.md` | Implementation notes. |
| `superhive-pi-orchestration/.gitignore` | node_modules + lockfile. |
| `general-kai/extensions/superhive-pi-orchestration/*` | Mirror copy for runtime ship. |
| `superhive/electron/project-status-mirror.ts` | Electron-side helper: patches coordinator's truth file when a member's status changes. Counter-bump pattern mirrors truth extension's `file-io.ts`. |
| `superhive/changelog/2026-07-21-gap-1-coordinator-runtime-role.md` | This file. |

## Files modified

| File | Change |
|---|---|
| `superhive-pi-truth/settings-schema.ts` | Added `project?: ProjectBlock`, `MemberRef`, `ProjectBlock` interfaces. Optional, non-breaking. |
| `general-kai/extensions/superhive-pi-truth/settings-schema.ts` | Seam-3 sync of the above. |
| `superhive/electron/ipc/agents.ts` | (a) Added `SUPERHIVE_PI_ORCHESTRATION_NAME`/`URL` constants and GitHub-clone symlink for coordinators. (b) Added `projectId?: string` to `CreateAgentInput`. (c) Seeded `project: {id, name, description, members: []}` in the coordinator's truth file when `projectId` is provided. (d) Wired `patchCoordinatorForMemberStatus` into `UPDATE_STATUS` handler. |
| `superhive/electron/general-kai-runtime.ts` | Added `resolveAgentKindSync(agentId)` helper that reads `AgentRepository.getAllSync()` and returns `agent.agentKind ?? 'standard'`. Sets `AGENT_KIND` env var at `spawn()`. |
| `superhive/electron/ipc/runtime.ts` | Wired `patchCoordinatorForMemberStatus` into START/STOP/RESTART handlers. |
| `superhive/electron/ipc/projects.ts` | Extended `PROJECTS.ADD_AGENT` and `PROJECTS.REMOVE_AGENT` handlers to populate/drop the coordinator's `project.members[]` roster. |
| `superhive/src/storage/repositories/AgentRepository.ts` | Added `getAllSync(): Agent[]` (used by the runtime's sync spawn path to resolve `AGENT_KIND`). |
| `superhive/src/flows/agents/crud/create-project-agent.ts` | Added `projectId?: string` to input; forward to `agents.create`. |
| `superhive/src/flows/agents/crud/prepare-project-agent.ts` | Added `projectId?: string` to input; forward to `agents.create`. |
| `superhive/src/flows/projects/crud/prepare-project.ts` | Thread `project.id` into `coordinatorInput.projectId` after `projects.create()` succeeds. |
| `superhive/src/types/electron.d.ts` | Added `projectId?: string` to `AgentCreateInput`. |
| `superhive/GAPS.md` | Marked Gap 1 as implemented with link to this changelog. |

---

## Where to change what (the "I need to fix X" map)

### "Change the CEO prompt text"

Edit: `superhive-pi-orchestration/system-prompt.ts`

Each section is its own builder function (`buildHeader`, `buildMission`, `buildTeamSection`, `buildToolsSection`, `buildDecisionStyleSection`, `buildEscalationSection`, `buildBoundariesSection`). Tests at `superhive-pi-orchestration/test/system-prompt.test.ts` cover each section.

### "Add or remove a coordinator-only tool"

Edit: `superhive-pi-orchestration/tools.ts`

`registerOrchestrationTools` lists which tools get registered. Add a new `defineTool()` factory and call `pi.registerTool(toolFactory(...))`. Mirror the JSON-result convention (`{ok, ...payload, ...error}`). Add unit test in `superhive-pi-orchestration/test/tools.test.ts`.

### "Change the gating rule for which agents get orchestration tools"

Edit: `superhive-pi-orchestration/index.ts`

The `session_start` handler's first check is `process.env.AGENT_KIND !== "project-coordinator"`. Change this gate. If you add a new agent kind that should also see orchestration tools, add it here.

### "Change how `AGENT_KIND` is determined at spawn"

Edit: `superhive/electron/general-kai-runtime.ts`

Method `resolveAgentKindSync(agentId: string): string`. Currently reads `AgentRepository.getAllSync()` and returns `agent.agentKind ?? 'standard'`. Sync because `spawn()` is sync.

### "Change how member status is mirrored to the coordinator"

Edit: `superhive/electron/project-status-mirror.ts`

`patchCoordinatorForMemberStatus(memberAgentId, newStatus)` is the single entry point. Called from START/STOP/UPDATE_STATUS in `electron/ipc/runtime.ts` and `electron/ipc/agents.ts`. Add new call sites here.

### "Change the project block fields on the truth settings schema"

Edit: `superhive-pi-truth/settings-schema.ts`

`ProjectBlock` interface. Must be synced to `general-kai/extensions/superhive-pi-truth/settings-schema.ts` (seam-3). The applier at `superhive-pi-truth/applier.ts` passes unknown fields through unchanged, so adding fields is non-breaking.

### "Change how members are added/removed from the project roster"

Edit: `superhive/electron/ipc/projects.ts`

`addMemberToCoordinatorRoster` (called from `PROJECTS.ADD_AGENT`) and `removeMemberFromCoordinatorRoster` (called from `PROJECTS.REMOVE_AGENT`). Atomic-write pattern mirrors `WRITE_SETTINGS` IPC at `electron/ipc/agents.ts:276-321`.

### "Replace a Gap 2 stub with a real implementation"

Edit: `superhive-pi-orchestration/tools.ts`

Three functions currently return `{ok:false, error:GAP2_ERROR, hint, received}`:
- `dispatchToAgent`
- `readInbox`
- `sendMessageToAgent`

Replace the `execute` body. Keep the JSON-result shape (LLM-friendly). Update the `description` field to remove the "[GAP 2 STUB]" prefix and to describe real behavior.

### "Change the bundled-copy location or sync ritual"

Edit: `general-kai/extensions/superhive-pi-orchestration/`

This is the seam-3 mirror of `superhive-pi-orchestration/`. Run `diff -rq superhive-pi-orchestration general-kai/extensions/superhive-pi-orchestration` after every commit. Empty output = sync OK. Lockfile difference (`Only in superhive-pi-orchestration: package-lock.json`) is expected and ignored.

### "Wire telemetry-driven status changes to the coordinator's truth file"

New file or new function: `superhive/electron/project-status-mirror.ts` already exports `patchCoordinatorForMemberStatus`. Add a call site from wherever telemetry-driven status changes happen (currently `runtime.transitionStatus` in `general-kai-runtime.ts:670`). **Deferred to Gap 2.**

---

## Behavior change in the app (user-facing)

### Before Gap 1

- Coordinator chat opens with Pi's default empty system prompt.
- Coordinator has no project context — same tool list as any other agent.
- Member roster only in the right sidebar.
- No programmatic way for the coordinator to enumerate its team.

### After Gap 1

1. Create a project "Foo" → coordinator is created with `project: {id: <uuid>, name: "Foo", description: "...", members: []}` seeded in its truth file.
2. Add 2 specialists to Foo → each add call patches `project.members[]` on the coordinator's truth file with `{agentId, name, role, model, status, joinedAt}`.
3. Start coordinator → `AGENT_KIND=project-coordinator` is in env. On session_start the orchestration extension reads `project`, builds CEO prompt, writes it to `systemPrompt`, registers 5 tools.
4. Tell coordinator "List your team" → calls `list_project_agents` → returns the 2 members with current statuses.
5. Tell coordinator "Get status of Alice" → calls `get_agent_status` → returns `{status, model, role}`.
6. Tell coordinator "Dispatch task to Alice" → calls `dispatch_to_agent` → returns `{ok:false, error:"mailbox not yet wired (Gap 2)"}` honestly.
7. Stop Alice → `PATCH_COORDINATOR_FOR_MEMBER_STATUS('alice', 'idle')` runs → coordinator's truth file updated. Coordinator's next `list_project_agents` call sees new status.

### What still does NOT work

- Real dispatch / inbox messages (Gap 2)
- Coordinator-to-worker communication (Gap 2)
- Recursive specialist creation (Gap 6)
- Project memory / decisions / artifacts (Gap 4)
- Telemetry-driven status changes (Gap 2)

---

## Verification commands

```bash
# All Gap-1 extension tests
cd superhive-pi-orchestration
node --import tsx --test test/system-prompt.test.ts test/project.test.ts test/tools.test.ts test/smoke.ts
# 50/50 pass expected

# Context extension regression (still works)
cd ../superhive-pi-context
bun test
# 67/67 pass expected

# Superhive typecheck
cd ../superhive
npx tsc --noEmit
# 7 pre-existing errors in general-kai-runtime.ts (FSWatcher.on, ChildProcess.on) — unrelated to Gap 1

# Seam audits
diff -rq superhive-pi-orchestration general-kai/extensions/superhive-pi-orchestration
# Empty expected (lockfile excluded)

diff -q superhive-pi-truth/settings-schema.ts general-kai/extensions/superhive-pi-truth/settings-schema.ts
# Empty expected
```

---

## Known seam drift (NOT caused by Gap 1 — flagged per AGENTS.md rule 4)

```
$ diff -rq superhive-pi-truth general-kai/extensions/superhive-pi-truth
Only in superhive-pi-truth: checklist.ts
Files differ: index.ts, package.json, tools.ts
Only in superhive-pi-truth: provider-map.ts
Only in general-kai/extensions/superhive-pi-truth: test

$ diff -rq superhive-pi-context general-kai/extensions/superhive-pi-context
Only in superhive-pi-context: .git, .gitignore, LICENSE, bun.lock, test
Files differ: package.json, tsconfig.json
```

These existed before Gap 1. Per AGENTS.md rule 4 I have not silently fixed them — flagging for the user.

---

## Manual steps remaining

- Push `superhive-pi-orchestration` to `github.com/rishi-ie/superhive-pi-orchestration` (repo was git-init'd locally; remote URL needs GitHub credentials not available in this environment).
- Resolve the seam-3 (truth) and seam-5 (context) drift if desired.