# Gap 2 — Mailbox / Agent-to-Project Communication

## What it is, in one sentence

Workers post to a shared project chat; the coordinator can private-ask a specific worker via inbox; the user sees both inline in the right panel.

## What changes in plain English

### Before Gap 2

The user is the messenger. A worker can't tell the coordinator it needs help, and a worker can't ask another worker anything. The coordinator has 3 tools that are honest about being unimplemented stubs. The right-panel Inbox tab is an empty placeholder. Worker messages don't exist.

### After Gap 2

A worker that needs help calls `post_to_project` → the project chat updates → the coordinator's session wakes ("[mail] call read_inbox") → the coordinator decides: reply in the chat, or `ask_member` a specific teammate → that teammate's inbox updates and they wake up too → they reply in the chat. The user sees every step in the same chat they're already looking at, with a sender badge so they know who's talking. The Inbox tab shows real pending messages.

## Behavior changes per role

| Role | Today | After |
|---|---|---|
| Coordinator | CEO with 5 tools, 3 stubbed | CEO with 5 working tools — `ask_member`, `read_inbox`, `post_to_project` all real |
| Member (worker) | No mailbox awareness | 2 tools — `read_inbox` (its own inbox), `post_to_project` (append to chat). No `ask_member`. |
| Standard agent | Unchanged | Unchanged |
| User | Opens each chat manually; Inbox tabs are placeholders | Sees project chat roll in real time with sender tags; agent + project Inbox tabs show real messages |

## How it works (3 lines)

The project chat file already exists (`<coordDir>/chat.jsonl`); new entries just gain a `fromAgentId`/`kind` tag. The per-worker inbox file (`<workerDir>/inbox.jsonl`) is new. Main process tails both and injects a wake prompt into the appropriate session when a new entry shows up. No separate event bus, no broadcast channel.

## Status — what's already done (commits 1–5, all green)

- **C1 Schema** — `MemberRef.localPath?`, `ProjectBlock.localPath?`/`coordinatorAgentId?`, `MailEvent` added to telemetry union. Mirror kept in sync.
- **C2 Mailbox store** — `electron/mailbox-store.ts` + 29 tests.
- **C3 Mailbox watcher** — `electron/mailbox-watcher.ts` + 11 tests.
- **C4 IPC + AGENT_ID** — 4 handlers, AGENT_ID env var, `attachMailboxWatches` in main.ts. 8 handler tests.
- **C5 Orchestrator role gating** — gate rewritten (any project member), new tool names, 40 tests pass.

Total: 88 tests passing across 5 commits.

---

## Remaining: 2 commits

### Commit 6 — Orchestrator wires the 3 mailbox tools

**One commit, one behavior: the coordinator's stub tools become real.**

**Files to modify:**

- `superhive-pi-orchestration/project.ts` — add 7 small FS helpers. **Reuses** the tmp+rename pattern already in the repo (same as the truth settings file). No new types, no new abstraction.

  ```ts
  appendProjectChat(projectDir, entry): Promise<void>
  readProjectChat(projectDir, opts: { limit?, sinceTs?, kinds?, excludeFromAgentIds? }): Promise<ChatEntry[]>
  markChatDelivered(projectDir, messageId, agentId): Promise<void>
  appendMemberInbox(memberDir, entry): Promise<void>
  readMemberInbox(memberDir, opts: { limit?, status? }): Promise<InboxEntry[]>
  ackInboxMessage(memberDir, messageId): Promise<boolean>
  findMemberById(project, agentId): MemberRef | undefined  // pure
  ```

- `superhive-pi-orchestration/tools.ts` — replace the 3 "not yet wired" stubs with real implementations:

  - `ask_member({ agentId, body, kind })` — find member via `findMemberById`, `appendMemberInbox(member.localPath, entry)`, return `{ ok, messageId }`.
  - `read_inbox({ limit, markAsRead })` — `readProjectChat` with `excludeFromAgentIds: [selfAgentId, null]` (null = user); if `markAsRead`, call `markChatDelivered` for each.
  - `post_to_project({ body, kind, refMessageId? })` — `appendProjectChat` with `fromAgentId`/`fromAgentName`/`kind` set.

- `superhive-pi-orchestration/system-prompt.ts` — drop the 3 stub-acknowledgement lines from the CEO prompt. Add one line: "When `[mail]` shows in your session, call `read_inbox`."

- `superhive-pi-orchestration/test/{project,tools,system-prompt}.test.ts` + `test/smoke.ts` — update assertions to match real behavior. `tools.test.ts` drops the 3 stub-error tests, adds 3 real-behavior tests (one per tool).

- `general-kai/extensions/superhive-pi-orchestration/*` — mirror everything (seam-3).

**`AGENT_ID` plumbing:** the extension reads `process.env.AGENT_ID` to identify itself (set by main process in C4). The role gate is `AGENT_ID === projectBlock.coordinatorAgentId`.

**Verification:**

- `cd superhive-pi-orchestration && bun test` — all pass
- `cd superhive-pi-orchestration && bun test/smoke.ts` — passes
- `diff -rq superhive-pi-orchestration general-kai/extensions/superhive-pi-orchestration` — empty
- `diff -rq superhive-pi-truth general-kai/extensions/superhive-pi-truth` — empty (no changes, but verify)
- `cd superhive && npx tsc --noEmit` — no new errors
- Commit: `feat(superhive-pi-orchestration): Gap 2 wire 3 mailbox tools (ask_member, read_inbox, post_to_project)`

**After this commit:** `ask_member("a1", "what's the API spec?")` writes to `a1/inbox.jsonl` and the main-process tailer wakes agent a1. `read_inbox` returns project-chat entries from other agents. `post_to_project` appends to the chat with `fromAgentId` set.

### Commit 7 — Right panel shows real data

**One commit, one behavior: the Inbox tabs (agent + project) show real messages; the chat shows who's talking.**

**Files to modify:**

- `electron/preload.ts` — add 5 methods on `window.api.agents`:
  ```ts
  postToProject(fromAgentId, data)
  askMember(fromAgentId, data)
  readInbox(agentId, opts)
  ackMessage(agentId, messageId)
  onMail(agentId, cb): () => void  // reuses existing IPC subscribe pattern
  ```

- `src/types/electron.d.ts` — add `MailMessage`, `MailKind`, `MailStatus`, `PostToProjectInput`, `AskMemberInput`, `ReadInboxOpts`, `AckMessageInput`. Extend `AgentsAPI` with the 5 methods. **Reuses** the existing `MailEvent` shape from the telemetry union (committed in C1) for the runtime side.

- `src/api/agents.ts` — 5 thin wrappers that delegate to `window.api.agents`. No new abstraction.

- `src/flows/agents/runtime/slice.ts` — add `inbox: MailMessage[]` and `pendingMailCount: number` to `RuntimeSlice`. Subscribe via `onMail` in the existing `initRuntimeSlice` block. **Reuses** the existing slice/notify pattern.

- `src/components/layout/right-sidebar/sections/InboxSection.tsx` — replace the placeholder. Same component, two modes:

  ```tsx
  <InboxSection mode="agent" agentId={id} />     // one agent's inbox
  <InboxSection mode="project" projectId={id} />  // aggregated across all members
  ```

  On mount, calls `agents.readInbox(agentId)` and subscribes via `agents.onMail`. Empty state if nothing pending. No new primitive file — the row is rendered inline in this file (it's 30 lines, doesn't earn its own component).

- `src/components/layout/right-sidebar/ProjectSettingsPanel.tsx` — the existing inline empty state at lines 128–141 becomes `<InboxSection mode="project" />`. One-line replacement.

- Chat-entry renderer (find it: one file in `src/components/agent-chat/` or `src/components/layout/composer/`) — one-line change: if `entry.fromAgentId` is set, show a small "**WorkerName · request**" label above the body. Subtle, muted, no layout change.

- `superhive-pi-orchestration/README.md` — update tool counts (5 / 2).
- `superhive/GAPS.md` — mark Gap 2 IMPLEMENTED with a one-paragraph summary.

**Verification:**

- `cd superhive && npx tsc --noEmit` — no new errors
- `cd superhive && bun test electron/ src/ --timeout 10000` — full suite still green
- Manual: open an agent's Inbox tab → see real messages (or empty state). Open project's Inbox tab → see aggregated messages. Post from a worker → see sender tag in chat.
- Commit: `feat(superhive): Gap 2 right-panel inbox + chat sender tag`

**After this commit:** the user can open an agent's Inbox tab and see real incoming messages. The Inbox badge on the agent row shows pending count. Worker messages in the project chat are tagged with sender name + kind.

---

## Skipped (add when the next gap needs them)

- Auto-routing without the coordinator LLM — Gap 3 task graph owns this.
- Archive/reactivation of idle inboxes — Gap 8.
- A `MailEvent` telemetry consumer — field exists (C1) but nothing reads it; the run-time IPC `onMail` event covers what the renderer needs today.

## Risk

- **Highest risk:** Commit 6. The orchestrator is loaded by every project agent. A regression breaks the coordinator. Mitigation: the test suite. If `bun test/smoke.ts` fails, revert.
- **Second:** Commit 7. The Inbox tab is user-facing. Mitigation: it's additive to a placeholder, so the worst case is an empty inbox.
- **Pre-existing seam-3 drift** in `superhive-pi-truth` (unchanged files differ from `general-kai/extensions/superhive-pi-truth/`) — flagged, not fixed (AGENTS.md rule 4).

## Total

2 commits, 0 new files in the main repo, ~7 modified files. The 15-commit plan collapsed to 2 by:

- Merging orchestrator "helpers" + "tools" + "prompt" + "tests" into one feature commit.
- Merging renderer "preload" + "types" + "state" + "section" + "project tab" + "chat badge" + "docs" into one feature commit.
- Dropping the standalone `MailboxItemRow.tsx` primitive (rendered inline — doesn't earn its own file at this size).
- Dropping the standalone E2E commit (manual test folded into the verification list of C7).
- Deferring 4 items the old plan listed as separate commits (they belong to later gaps).
