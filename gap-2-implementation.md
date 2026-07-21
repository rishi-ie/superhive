# Gap 2 — Mailbox / Agent-to-Project Communication

## What changes in plain English

### Before Gap 2 (today)

Superhive today is a manager for independent AI agents. Each agent has its own chat, its own memory, and its own little world. If you have a project with a "Project Agent" (the CEO) and a "Backend Engineer" and a "Frontend Engineer," those three agents don't actually talk to each other. They each have their own chat window. If the Backend Engineer needs to ask the Frontend Engineer a question, the only way to do that today is: the user opens the Backend Engineer's chat, copies the question, opens the Frontend Engineer's chat, and pastes it. The user is the messenger.

The Project Agent knows it has a team (we built that in Gap 1), and it has three tools that are supposed to fix this — `dispatch_to_agent`, `read_inbox`, `send_message_to_agent`. But those tools are honest about the fact that they don't work yet. They return an error message: "mailbox not yet wired (Gap 2)." So the coordinator is a CEO with a team but no email system.

There's also no telemetry, no Inbox tab data, no project chat. The Inbox tab in the right panel shows an empty state placeholder. Worker agents have no way to call out for help.

### After Gap 2

After Gap 2, the project gets a shared chat. Every agent on the project can post into it. The user can read the project chat and see what every agent is doing and saying. The flow looks like this:

1. The Backend Engineer realizes it needs a question answered.
2. It calls a tool (`post_to_project`) that appends a message to the project's shared chat file. The message says "Backend Engineer: I need the latest API spec from Frontend Engineer."
3. The main process sees the new message in the chat and injects a wake-up prompt into the Project Agent's running session: "There's a new message in the project chat from Backend Engineer. Call your `read_inbox` tool to see it."
4. The Project Agent reads the inbox, sees the request, and decides: "I should ask the Frontend Engineer for the API spec." It calls `ask_member(agentId=frontend_id, body="Backend Engineer needs the latest API spec")`.
5. The main process writes that ask to the Frontend Engineer's personal inbox file and injects a wake-up prompt into the Frontend Engineer's running session.
6. The Frontend Engineer reads its inbox, sees the question, and (using the same `post_to_project` tool) writes the answer into the project chat.
7. The Project Agent sees the answer in the project chat and posts a final reply in the chat so the Backend Engineer and the user can both see it.

The whole thing flows through the project chat. The user sees everything in the same place they're already looking. There's no separate messaging app, no email, no Slack. Just a chat file that everyone reads and writes.

The Inbox tab in the right panel now shows real data: who sent what, when, and whether it's been read. Each row is a small card with a sender name, a kind label ("request" / "result" / "broadcast"), a body preview, and a status dot. Clicking a row jumps to the relevant agent's chat.

The CEO's three broken tools now work. The CEO can ask a specific team member a question, can read pending messages, and can post in the project chat. Workers (non-CEO agents) get the simpler version: they can post in the project chat and read their inbox. They can't direct-message other workers — that's the CEO's job.

## Architecture

```
┌──────────────────┐         ┌──────────────────────────────┐
│ Worker A         │         │ <coordDir>/chat.jsonl         │
│ (member agent)   │         │  the project chat             │
│                  │         │                              │
│  post_to_project │────────►│  append entry                 │
│  read_inbox      │◄────────│  read entries                 │
└──────────────────┘         └──────────┬───────────────────┘
                                          │ tailer
                                          ▼
                              ┌──────────────────────────────┐
                              │ Main: MailboxWatcher         │
                              │  - new worker entry →        │
                              │    wake coordinator          │
                              │  - new coord ask_member →    │
                              │    write to member inbox,    │
                              │    wake that member          │
                              │  - new entry in member       │
                              │    inbox → wake member       │
                              └──────────┬───────────────────┘
                                         │ runtime.send(coordId, "[mail] …")
                                         ▼
                              ┌──────────────────────────────┐
                              │ Coordinator (Pi subprocess)  │
                              │  CEO prompt + 5 tools        │
                              │  - read_inbox                │
                              │  - ask_member                │
                              │  - post_to_project           │
                              │  - list_project_agents       │
                              │  - get_agent_status          │
                              └──────────┬───────────────────┘
                                         │ ask_member(workerId, body, kind)
                                         ▼
                              ┌──────────────────────────────┐
                              │ <workerDir>/inbox.jsonl      │
                              │  the worker's direct-ask     │
                              │  inbox                       │
                              └──────────────────────────────┘
```

Two files. One shared surface (project chat), one direct surface (per-member inbox for CEO→worker).

## Storage

**`<coordDir>/chat.jsonl`** — the project chat. Already exists (user↔coordinator chat). Workers and the coordinator now also append here. Tagged with `fromAgentId, fromAgentName, kind, refMessageId, deliveredTo`. Renderer shows worker messages inline with a sender badge.

**`<workerDir>/inbox.jsonl`** — per-member direct-ask inbox. New. Only the coordinator writes here. The worker reads it when it gets a `[mail]` wake prompt.

## Implementation tasks

Each task is a self-contained commit. Tasks MUST be executed in order; each builds on the previous. Each task ends with: typecheck clean, all tests pass, commit made.

---

### Commit 1 — Schema foundation (truth + telemetry)

**Files to modify**:
- `superhive-pi-truth/settings-schema.ts` — add `ProjectBlock.localPath?: string`, `ProjectBlock.coordinatorAgentId?: string`, `MemberRef.localPath?: string`
- `general-kai/extensions/superhive-pi-truth/settings-schema.ts` — mirror (seam-3)
- `superhive-pi-telemetry/types.ts` — add `MailEvent` interface, add to `TelemetryEvent` union

**Implementation**:
1. `ProjectBlock` gains:
   ```ts
   localPath?: string         // <projectDir>; workers need this for post_to_project
   coordinatorAgentId?: string // explicit; was implicit before
   ```
2. `MemberRef` gains:
   ```ts
   localPath?: string         // <memberDir>; coordinator needs this for ask_member
   ```
3. `MailEvent` shape (added to `TelemetryEvent` union):
   ```ts
   interface MailEvent {
     ts: number
     type: 'mail'
     direction: 'sent' | 'received' | 'acked'
     messageId: string
     fromAgentId: string
     toAgentId: string
     kind: 'request' | 'result' | 'question' | 'broadcast'
     projectId?: string
   }
   ```
4. Mirror the truth-schema edits to `general-kai/extensions/superhive-pi-truth/settings-schema.ts` (seam-3).

**Verification**:
- `cd superhive && npx tsc --noEmit` — no new errors
- `cd superhive && bun test electron/ src/ --timeout 10000` — all green
- `diff -rq superhive-pi-truth general-kai/extensions/superhive-pi-truth` — empty
- Commit: `feat(superhive-pi-truth,superhive-pi-telemetry): Gap 2 schema — localPath + MailEvent`

---

### Commit 2 — Mailbox store (main process pure FS helpers)

**Files to add**:
- `electron/mailbox-store.ts` — pure FS helpers
- `electron/mailbox-store.test.ts` — bun:test

**Interface**:
```ts
// electron/mailbox-store.ts
export const MailboxStore = {
  // Project chat (<coordDir>/chat.jsonl)
  appendProjectChat(coordDir: string, entry: ChatEntry): Promise<void>
  readProjectChat(coordDir: string, opts?: {limit?, sinceTs?, kinds?, excludeFromAgentIds?}): Promise<ChatEntry[]>
  markChatEntryDelivered(coordDir: string, messageId: string, agentId: string): Promise<void>

  // Member inbox (<memberDir>/inbox.jsonl)
  appendMemberInbox(memberDir: string, entry: InboxEntry): Promise<void>
  readMemberInbox(memberDir: string, opts?: {limit?, status?, kinds?}): Promise<InboxEntry[]>
  ackInboxMessage(memberDir: string, messageId: string): Promise<boolean>

  // Telemetry write (main process writes telemetry for inbox events)
  writeMailTelemetry(agentDir: string, event: MailEvent): Promise<void>
}
```

**Implementation notes**:
- `appendProjectChat` and `appendMemberInbox`: use `appendFileSync` (atomic for single-line appends on POSIX). Entry must be `JSON.stringify(entry) + '\n'`.
- `read*`: read full file, split on `\n`, parse each non-empty line. Skip malformed lines (log warn, don't throw).
- `markChatEntryDelivered` and `ackInboxMessage`: load all, mutate the target line, write back via tmp + rename (atomic).
- `writeMailTelemetry`: append to `<agentDir>/telemetry.jsonl` (single line). The existing `superhive-pi-telemetry/journal.ts::appendEvent` is the canonical writer but lives in the telemetry module — main process needs its own version (or import the function if the module is importable from electron). Decision: import the helper from `superhive-pi-telemetry` since it's a published module.

**Tests** (in `mailbox-store.test.ts`):
- `appendProjectChat → readProjectChat` roundtrip
- `readProjectChat` filters by `kind` and `excludeFromAgentIds`
- `appendMemberInbox → readMemberInbox` roundtrip with `status` filter
- `ackInboxMessage` flips `pending → acked`
- Malformed line in input file → skipped, others returned
- `markChatEntryDelivered` adds agentId to `deliveredTo[]` array (creates if missing)
- `writeMailTelemetry` appends a single valid JSON line to `telemetry.jsonl`

**Verification**:
- `cd superhive && npx tsc --noEmit` — no new errors
- `cd superhive && bun test electron/mailbox-store.test.ts` — all pass
- `cd superhive && bun test electron/ src/ --timeout 10000` — full suite still green
- Commit: `feat(superhive): Gap 2 mailbox-store — per-agent inbox + project chat helpers`

---

### Commit 3 — Main process mailbox watcher

**Files to add**:
- `electron/mailbox-watcher.ts` — tailer for project chat + member inboxes
- `electron/mailbox-watcher.test.ts` — bun:test with mocked `fs.watch`

**Interface**:
```ts
class MailboxWatcher {
  start(): void
  stop(): void

  // Called by main process when an agent starts — watch its inbox
  // and the project's chat if this agent is the coordinator.
  watchAgent(agentId: string, agentDir: string, projectDir?: string): void

  // Called when an agent stops.
  unwatchAgent(agentId: string): void

  // Notification hooks set by main.ts at startup.
  onCoordMail?: (entry: ChatEntry) => void      // wake coordinator
  onMemberMail?: (memberId: string, entry: InboxEntry) => void  // wake member
}
```

**Implementation notes**:
- Use `fs.watch` for each watched dir, plus a 5s polling fallback (mirror `agents-fs-watcher.ts`).
- On `<coordDir>/chat.jsonl` change: read all entries, find ones with `kind` set, filter out the user (`fromAgentId === null`) and the coordinator itself (`fromAgentId === coordId`). For each remaining, call `onCoordMail(entry)`.
- On `<memberDir>/inbox.jsonl` change: read all entries with `status === 'pending'`, call `onMemberMail(memberId, entry)` for each.
- The notification hooks (set by main.ts) call `runtime.send(id, "[mail] New message in {where}. Call read_inbox.")`.

**Tests**:
- `watchAgent(coordId, …)` triggers `onCoordMail` when chat.jsonl is appended to
- `watchAgent(memberId, …)` triggers `onMemberMail` when inbox.jsonl is appended to
- `unwatchAgent` removes the watcher
- `stop()` cleans up all watchers
- Coordinator's own posts do NOT trigger `onCoordMail` (filtered out)
- User messages (no `fromAgentId`) do NOT trigger `onCoordMail`

**Verification**:
- `cd superhive && npx tsc --noEmit` — no new errors
- `cd superhive && bun test electron/mailbox-watcher.test.ts` — all pass
- `cd superhive && bun test electron/ src/ --timeout 10000` — full suite still green
- Commit: `feat(superhive): Gap 2 mailbox-watcher — tails chat + member inboxes`

---

### Commit 4 — IPC layer + AGENT_ID env var

**Files to modify**:
- `electron/ipc/index.ts` — add `MAILBOX` channel group
- `electron/ipc/mailbox.ts` — new, 4 handlers
- `electron/ipc/mailbox.test.ts` — new, bun:test
- `electron/general-kai-runtime.ts` — add `AGENT_ID` env var to `spawnProcess`
- `electron/ipc/agents.ts` — pass `AGENT_ID` when spawning (mirror of `AGENT_KIND`)
- `electron/ipc/projects.ts` — extend `addMemberToCoordinatorRoster` to also write `ProjectBlock` (with `localPath`, `coordinatorAgentId`, full `members[]`) to the **member's** truth file
- `electron/main.ts` — start/stop `MailboxWatcher` alongside `agentsFsWatcher`, wire `onCoordMail` + `onMemberMail` to `runtime.send` wake calls

**Channel additions** (in `electron/ipc/index.ts`):
```ts
MAILBOX: {
  POST_TO_PROJECT: 'agents:post-to-project',
  ASK_MEMBER:      'agents:ask-member',
  READ_INBOX:      'agents:read-inbox',
  ACK_MESSAGE:     'agents:ack-message',
  ON_MAIL:         (id: string) => `agent:${id}:mail`,
}
```

**Handler behavior**:
- `agents:post-to-project({fromAgentId, body, kind, refMessageId?})`:
  1. Resolve `coordDir` = `<projectDir>/agent/` (from `fromAgentId`'s truth file's `project.localPath`)
  2. Build `ChatEntry` with `id: uuid, ts: Date.now(), role: 'assistant', parts: [{type: 'text', text: body}], fromAgentId, fromAgentName, kind, refMessageId`
  3. `MailboxStore.appendProjectChat(coordDir, entry)` — tailer picks up
  4. Write `MailEvent { direction: 'sent' }` to `<fromAgentDir>/telemetry.jsonl`
  5. Return `{ok: true, messageId: entry.id}`
- `agents:ask-member({fromAgentId, toAgentId, body, kind})`:
  1. Resolve `memberDir` from `toAgentId`'s `localPath`
  2. Build `InboxEntry` with `id: uuid, ts: Date.now(), fromAgentId, toAgentId, kind, body, status: 'pending'`
  3. `MailboxStore.appendMemberInbox(memberDir, entry)` — tailer picks up
  4. Write `MailEvent { direction: 'sent' }` to `<fromAgentDir>/telemetry.jsonl`
  5. Return `{ok: true, messageId: entry.id}`
- `agents:read-inbox(agentId, {limit?, markAsRead?})`:
  1. Resolve `coordDir` from agent's truth file's `project.localPath`
  2. `MailboxStore.readProjectChat(coordDir, {limit, kinds: ['request', 'question', 'broadcast', 'result'], excludeFromAgentIds: [agentId, null]})`
  3. If `markAsRead`, call `MailboxStore.markChatEntryDelivered(coordDir, messageId, agentId)` for each
  4. Return the array
- `agents:ack-message({agentId, messageId})`:
  1. Resolve `memberDir` from `agentId`'s `localPath`
  2. `MailboxStore.ackInboxMessage(memberDir, messageId)` — flips pending → acked
  3. Write `MailEvent { direction: 'acked' }` to `<agentDir>/telemetry.jsonl`
  4. Return `{ok: true}`

**`AGENT_ID` env var**:
- In `electron/general-kai-runtime.ts` (`spawnProcess`), mirror the `AGENT_KIND` env var injection with `AGENT_ID`:
  ```ts
  env: {
    ...process.env,
    AGENT_KIND: resolveAgentKindSync(agentId) ?? 'standard',
    AGENT_ID: agentId,
  }
  ```
- `electron/ipc/agents.ts` already calls `spawnProcess`; just need to ensure the env var is read from there (which it is, since `spawnProcess` is the only call site).

**Main.ts wiring**:
```ts
import { mailboxWatcher } from './mailbox-watcher'

// in app.whenReady().then:
mailboxWatcher.onCoordMail = (entry) => {
  const coordId = runtime.getCoordinatorId()  // new helper
  if (coordId) runtime.send(coordId,
    `[mail] New message from ${entry.fromAgentName ?? 'a team member'} in project chat. ` +
    `Call read_inbox to inspect.`
  )
}
mailboxWatcher.onMemberMail = (memberId, entry) => {
  runtime.send(memberId,
    `[mail] You have a new direct ask. Call read_inbox to inspect.`
  )
}
mailboxWatcher.start()
```

**`addMemberToCoordinatorRoster` extension** (in `electron/ipc/projects.ts`):
Today this writes the member to the coordinator's roster. Gap 2 adds: also write a `ProjectBlock` to the **member's** truth file so the member's orchestrator extension can find the project context.
```ts
// After appending to coordinator's roster:
const projectBlock: ProjectBlock = {
  id: project.id,
  name: project.name,
  description: project.description,
  localPath: project.localPath,           // <projectDir>
  coordinatorAgentId: coordinator.id,
  members: updatedRoster,
}
await writeProjectBlockToMember(member, projectBlock)
```

**Tests** (`mailbox.test.ts`):
- `post-to-project` writes a valid chat entry; tailer wakes coordinator
- `ask-member` writes a valid inbox entry; tailer wakes member
- `read-inbox` returns filtered chat entries; markAsRead updates `deliveredTo`
- `ack-message` flips pending → acked
- `AGENT_ID` env var is set on every `spawnProcess` call

**Verification**:
- `cd superhive && npx tsc --noEmit` — no new errors
- `cd superhive && bun test electron/ipc/mailbox.test.ts` — all pass
- `cd superhive && bun test electron/ src/ --timeout 10000` — full suite still green
- Commit: `feat(superhive): Gap 2 IPC + AGENT_ID — post/ask/read/ack mailbox handlers`

---

### Commit 5 — Orchestrator extension: schema mirror + member support

**Files to modify**:
- `superhive-pi-orchestration/types.ts` — mirror `ProjectBlock` + `MemberRef` from truth schema
- `superhive-pi-orchestration/index.ts` — extend gate to all project members, detect role
- `general-kai/extensions/superhive-pi-orchestration/types.ts` — mirror
- `general-kai/extensions/superhive-pi-orchestration/index.ts` — mirror

**`index.ts` gate (revised)**:
```ts
// Today: gates on AGENT_KIND === "project-coordinator"
// Gap 2: gates on project block presence + role detection

const settings = readSettings(settingsPath)
const projectBlock = settings.project
if (!projectBlock?.localPath) return  // not a project agent

const selfAgentId = process.env.AGENT_ID
const isCoordinator = projectBlock.coordinatorAgentId === selfAgentId

if (isCoordinator) {
  // build CEO prompt (unchanged from Gap 1)
  systemPrompt.buildCEO(settingsPath)
  registerOrchestrationTools(pi, { role: 'coordinator', settingsPath, projectBlock })
} else {
  // standard agent prompt stays
  registerOrchestrationTools(pi, { role: 'member', settingsPath, projectBlock })
}
```

**`registerOrchestrationTools` new signature**:
```ts
export function registerOrchestrationTools(
  pi: PiLike,
  opts: {
    role: 'coordinator' | 'member'
    settingsPath: string
    projectBlock: ProjectBlock
  }
): void
```

The tool registration inside branches on `role`: coordinator gets 5 tools, member gets 2.

**Verification**:
- `cd superhive-pi-orchestration && bun test test/index.test.ts` (new) — gate logic
- `diff -rq superhive-pi-orchestration general-kai/extensions/superhive-pi-orchestration` — empty
- Commit: `feat(superhive-pi-orchestration): Gap 2 extension loads for all project members`

---

### Commit 6 — Orchestrator extension: project.ts helpers

**Files to modify**:
- `superhive-pi-orchestration/project.ts` — add `appendProjectChat`, `readProjectInbox`, `appendMemberInbox`, `readMemberInbox`, `findMemberById`
- `superhive-pi-orchestration/test/project.test.ts` — add tests
- `general-kai/extensions/superhive-pi-orchestration/project.ts` — mirror
- `general-kai/extensions/superhive-pi-orchestration/test/project.test.ts` — mirror

**Function signatures**:
```ts
// Reads <projectDir>/agent/chat.jsonl, filters by kind, returns the messages
export async function readProjectInbox(
  projectDir: string,
  opts: { limit?: number; kinds?: ChatKind[]; excludeFromAgentIds?: (string | null)[] }
): Promise<ChatEntry[]>

// Reads <projectDir>/agent/chat.jsonl, finds one entry by id, mutates its deliveredTo[]
export async function markChatDelivered(
  projectDir: string,
  messageId: string,
  agentId: string
): Promise<void>

// Appends to <projectDir>/agent/chat.jsonl
export async function appendProjectChat(
  projectDir: string,
  entry: ChatEntry
): Promise<void>

// Reads <memberDir>/inbox.jsonl, returns matching messages
export async function readMemberInbox(
  memberDir: string,
  opts: { limit?: number; status?: InboxStatus[] }
): Promise<InboxEntry[]>

// Appends to <memberDir>/inbox.jsonl
export async function appendMemberInbox(
  memberDir: string,
  entry: InboxEntry
): Promise<void>

// Flips pending → acked on a specific message in <memberDir>/inbox.jsonl
export async function ackInboxMessage(
  memberDir: string,
  messageId: string
): Promise<boolean>

// Find a member's localPath from the project block (used to look up dirs)
export function findMemberById(project: ProjectBlock, agentId: string): MemberRef | undefined
```

**Implementation notes**:
- All FS operations use the same `node:fs/promises` API.
- Atomic write via tmp + rename pattern (existing convention in `agent-settings-defaults.ts`).
- Filter logic: `readProjectInbox` filters by `kinds` (default all) and excludes `fromAgentId`s matching `excludeFromAgentIds`.
- `findMemberById` is a pure function over the in-memory `projectBlock` (no FS).

**Tests** (in `project.test.ts`):
- `appendProjectChat` + `readProjectInbox` roundtrip
- `readProjectInbox` filters by `kinds`
- `readProjectInbox` excludes specific `fromAgentId`s
- `appendMemberInbox` + `readMemberInbox` roundtrip
- `readMemberInbox` filters by `status`
- `ackInboxMessage` flips status
- `markChatDelivered` adds agentId to `deliveredTo[]`
- `findMemberById` returns the correct member
- Malformed line skip
- Concurrent appends don't lose data (atomicity test)

**Verification**:
- `cd superhive-pi-orchestration && bun test test/project.test.ts` — all pass
- `cd superhive-pi-orchestration && bun test` — full suite still green
- `diff -rq superhive-pi-orchestration general-kai/extensions/superhive-pi-orchestration` — empty
- Commit: `feat(superhive-pi-orchestration): Gap 2 project.ts — chat + inbox helpers`

---

### Commit 7 — Orchestrator extension: tool implementations

**Files to modify**:
- `superhive-pi-orchestration/tools.ts` — replace 3 stubs with real implementations
- `superhive-pi-orchestration/test/tools.test.ts` — drop "Gap 2 stub" assertions, add real-behavior assertions
- `general-kai/extensions/superhive-pi-orchestration/tools.ts` — mirror
- `general-kai/extensions/superhive-pi-orchestration/test/tools.test.ts` — mirror

**Tool implementations** (in `tools.ts`):

`ask_member` (replaces `dispatch_to_agent` + `send_message_to_agent`):
```ts
{
  name: 'ask_member',
  description: 'Send a direct ask to a specific member agent. The member will be woken up and read its inbox.',
  parameters: Type.Object({
    agentId: Type.String(),
    body: Type.String(),
    kind: Type.Optional(Type.Union([Type.Literal('request'), Type.Literal('question'), Type.Literal('result')])),
  }),
  execute: async ({agentId, body, kind = 'request'}, ctx) => {
    const member = findMemberById(ctx.projectBlock, agentId)
    if (!member?.localPath) {
      return { ok: false, error: `unknown agent: ${agentId}`, received: {agentId, bodyLength: body.length} }
    }
    const id = crypto.randomUUID()
    const entry: InboxEntry = {
      id, ts: Date.now(), fromAgentId: ctx.selfAgentId, toAgentId: agentId,
      kind, body, status: 'pending',
    }
    await appendMemberInbox(member.localPath, entry)
    return { ok: true, messageId: id }
  }
}
```

`read_inbox`:
```ts
{
  name: 'read_inbox',
  description: 'Read pending messages in the project chat. Returns entries with kind set, excluding your own messages.',
  parameters: Type.Object({
    limit: Type.Optional(Type.Number()),
    markAsRead: Type.Optional(Type.Boolean({ default: true })),
  }),
  execute: async ({limit = 50, markAsRead = true}, ctx) => {
    const items = await readProjectInbox(ctx.projectBlock.localPath!, {
      limit,
      kinds: ['request', 'question', 'broadcast', 'result'],
      excludeFromAgentIds: [ctx.selfAgentId, null],  // null = user
    })
    if (markAsRead) {
      for (const item of items) {
        await markChatDelivered(ctx.projectBlock.localPath!, item.id, ctx.selfAgentId)
      }
    }
    return { ok: true, items }
  }
}
```

`post_to_project`:
```ts
{
  name: 'post_to_project',
  description: 'Append a message to the project chat. Visible to the user, the coordinator, and other agents.',
  parameters: Type.Object({
    body: Type.String(),
    kind: Type.Optional(Type.Union([Type.Literal('request'), Type.Literal('question'), Type.Literal('result'), Type.Literal('broadcast')])),
    refMessageId: Type.Optional(Type.String()),
  }),
  execute: async ({body, kind = 'request', refMessageId}, ctx) => {
    if (!ctx.projectBlock.localPath) {
      return { ok: false, error: 'not in a project' }
    }
    const id = crypto.randomUUID()
    const entry: ChatEntry = {
      id, ts: Date.now(), role: 'assistant',
      parts: [{type: 'text', text: body}],
      fromAgentId: ctx.selfAgentId,
      fromAgentName: ctx.selfAgentName,
      kind, refMessageId,
    }
    await appendProjectChat(ctx.projectBlock.localPath, entry)
    return { ok: true, messageId: id }
  }
}
```

**Tests** (in `tools.test.ts`):
- Drop existing 3 "Gap 2 stub" assertions (lines per Gap 1's test file)
- Add: `ask_member appends to recipient's inbox.jsonl with correct fields`
- Add: `ask_member returns ok:false for unknown agentId`
- Add: `read_inbox returns only entries with kind set`
- Add: `read_inbox excludes caller's own messages`
- Add: `read_inbox marks entries delivered when markAsRead=true`
- Add: `post_to_project appends a tagged entry to project chat`
- Add: `post_to_project returns ok:false if projectBlock.localPath is missing`

**Verification**:
- `cd superhive-pi-orchestration && bun test test/tools.test.ts` — all pass
- `cd superhive-pi-orchestration && bun test` — full suite still green
- `diff -rq superhive-pi-orchestration general-kai/extensions/superhive-pi-orchestration` — empty
- Commit: `feat(superhive-pi-orchestration): Gap 2 wire 3 mailbox tools (ask_member, read_inbox, post_to_project)`

---

### Commit 8 — Orchestrator extension: system prompt + role gating

**Files to modify**:
- `superhive-pi-orchestration/system-prompt.ts` — drop "Gap 2 stub" notes; add per-role tool descriptions
- `superhive-pi-orchestration/test/system-prompt.test.ts` — update assertions
- `superhive-pi-orchestration/test/role-gating.test.ts` — new, asserts tool count per role
- `superhive-pi-orchestration/test/smoke.ts` — update line 256
- `general-kai/extensions/superhive-pi-orchestration/*` — mirror all of the above

**System prompt additions** (CEO prompt):
- Drop the 3 "honest Gap 2 stubs" lines.
- Add at end: "When you receive a `[mail]` wake prompt, call `read_inbox` to see what's pending. Decide: reply directly in the chat (use `post_to_project`) or ask a specific member (use `ask_member` with the member's id and a clear question). Workers can also see your chat messages, so reply in chat for visibility."

**System prompt additions** (member prompt, new):
- For non-coordinator agents, the extension doesn't inject a CEO prompt. The member's standard Pi agent prompt is used. No change to that prompt.
- Tool registration: members only see `read_inbox` and `post_to_project`. They can post questions to the project chat and read their inbox.

**Tests**:
- `system-prompt.test.ts`: assert CEO prompt contains no "Gap 2" or "stub" text; assert it mentions the 3 wired tools
- `role-gating.test.ts`:
  - When `registerOrchestrationTools` is called with `role: 'coordinator'`, the fake `pi` has 5 tools registered
  - When called with `role: 'member'`, the fake `pi` has 2 tools registered (`read_inbox`, `post_to_project`)
- `smoke.ts:256`: change assertion from "Gap 2 stub error" to "real behavior: appends to inbox"

**Verification**:
- `cd superhive-pi-orchestration && bun test` — full suite still green
- `cd superhive-pi-orchestration && bun test/smoke.ts` — smoke passes
- `diff -rq superhive-pi-orchestration general-kai/extensions/superhive-pi-orchestration` — empty
- Commit: `feat(superhive-pi-orchestration): Gap 2 role-gated tools + clean system prompt`

---

### Commit 9 — Preload + renderer API

**Files to modify**:
- `electron/preload.ts` — add 5 new methods to `window.api.agents`
- `src/types/electron.d.ts` — add `MailMessage`, `PostToProjectInput`, `AskMemberInput`, `ReadInboxOpts`, `AckMessageInput` types; extend `AgentsAPI` interface
- `src/api/agents.ts` — add 5 new methods that delegate to `window.api.agents`

**Preload additions** (in the `agents` object on `window.api`):
```ts
postToProject: (fromAgentId, data) => ipcRenderer.invoke('agents:post-to-project', fromAgentId, data),
askMember:     (fromAgentId, data) => ipcRenderer.invoke('agents:ask-member', fromAgentId, data),
readInbox:     (agentId, opts) => ipcRenderer.invoke('agents:read-inbox', agentId, opts),
ackMessage:    (agentId, messageId) => ipcRenderer.invoke('agents:ack-message', agentId, messageId),
onMail:        (agentId, cb) => subscribe(`agent:${agentId}:mail`, cb),
```

**Types** (in `src/types/electron.d.ts`):
```ts
export type MailKind = 'request' | 'result' | 'question' | 'broadcast'
export type MailStatus = 'pending' | 'delivered' | 'acked'

export interface MailMessage {
  id: string
  ts: number
  fromAgentId: string
  toAgentId?: string
  fromAgentName?: string
  kind?: MailKind
  body: string
  refMessageId?: string
  status?: MailStatus
}

export interface PostToProjectInput {
  body: string
  kind?: MailKind
  refMessageId?: string
}

export interface AskMemberInput {
  toAgentId: string
  body: string
  kind?: Exclude<MailKind, 'broadcast'>
}

export interface ReadInboxOpts {
  limit?: number
  markAsRead?: boolean
}

// Extend AgentsAPI:
postToProject: (fromAgentId: string, input: PostToProjectInput) => Promise<{ok: boolean; messageId?: string}>
askMember:     (fromAgentId: string, input: AskMemberInput) => Promise<{ok: boolean; messageId?: string}>
readInbox:     (agentId: string, opts?: ReadInboxOpts) => Promise<MailMessage[]>
ackMessage:    (agentId: string, messageId: string) => Promise<{ok: boolean}>
onMail:        (agentId: string, cb: (msg: MailMessage) => void) => () => void
```

**API wrapper** (in `src/api/agents.ts`):
```ts
postToProject: (fromAgentId: string, input: PostToProjectInput) =>
  window.api.agents.postToProject(fromAgentId, input),
askMember:     (fromAgentId: string, input: AskMemberInput) =>
  window.api.agents.askMember(fromAgentId, input),
readInbox:     (agentId: string, opts?: ReadInboxOpts) =>
  window.api.agents.readInbox(agentId, opts),
ackMessage:    (agentId: string, messageId: string) =>
  window.api.agents.ackMessage(agentId, messageId),
onMail:        (agentId: string, cb: (msg: MailMessage) => void) =>
  window.api.agents.onMail(agentId, cb),
```

**Verification**:
- `cd superhive && npx tsc --noEmit` — no new errors
- `cd superhive && bun test electron/ src/ --timeout 10000` — full suite still green
- Commit: `feat(superhive): Gap 2 preload + renderer API for mailbox`

---

### Commit 10 — Renderer runtime slice (inbox state)

**Files to modify**:
- `src/flows/agents/runtime/slice.ts` — extend `RuntimeSlice` with `inbox: MailMessage[]` and `pendingMailCount: number`
- `src/flows/agents/runtime/slice.test.ts` — add inbox subscription test (if it exists; otherwise add a new test file)

**Implementation**:
1. `RuntimeSlice` gains:
   ```ts
   inbox: MailMessage[]
   pendingMailCount: number
   ```
2. In `initRuntimeSlice(agentId)`, initialize `inbox: []` and `pendingMailCount: 0`.
3. In the IPC subscription block, add:
   ```ts
   unsubs.push(agents.onMail(agentId, (msg) => {
     const next = [...slice.inbox, msg]
     if (next.length > MAX_INBOX) next.shift()
     slice.inbox = next
     slice.pendingMailCount = next.filter(m => !m.status || m.status === 'pending').length
     notify(slice)
   }))
   ```
4. Add an `appendMail(slice, msg)` reducer for direct manipulation from other parts of the app.

**Tests** (in `slice.test.ts` or new file):
- New mail appended to `inbox`
- `pendingMailCount` reflects count of messages with `status === 'pending'`
- Inbox capped at `MAX_INBOX` (e.g. 200) — oldest evicted

**Verification**:
- `cd superhive && npx tsc --noEmit` — no new errors
- `cd superhive && bun test src/flows/agents/runtime/slice.test.ts` — all pass
- `cd superhive && bun test electron/ src/ --timeout 10000` — full suite still green
- Commit: `feat(superhive): Gap 2 runtime slice — inbox state + onMail subscription`

---

### Commit 11 — Renderer UI: MailboxItemRow primitive

**Files to add**:
- `src/components/layout/right-sidebar/primitives/MailboxItemRow.tsx` — sender avatar + name + kind badge + body preview + status dot + relative timestamp
- `src/components/layout/right-sidebar/primitives/index.ts` — export it

**Props**:
```ts
interface MailboxItemRowProps {
  message: MailMessage
  onClick?: () => void
  onFocus?: () => void  // for keyboard nav
  onAction?: (action: 'open-chat' | 'ack') => void
}
```

**Visual**:
- 32px avatar (sender's avatar or fallback to initials)
- Right of avatar: sender name (font-medium) + kind badge (small pill: "request" / "result" / "broadcast")
- Below: body text truncated to 2 lines
- Right side: relative timestamp (e.g. "2m ago") + status dot (gray=pending, blue=delivered, green=acked)
- Click row → opens that agent's chat
- Right-click menu: "Mark as read" (calls `ackMessage`)

**Verification**:
- `cd superhive && npx tsc --noEmit` — no new errors
- Commit: `feat(superhive): Gap 2 MailboxItemRow primitive`

---

### Commit 12 — Renderer UI: wire InboxSection to real data

**Files to modify**:
- `src/components/layout/right-sidebar/sections/InboxSection.tsx` — replace placeholder with real data
- `src/components/layout/right-sidebar/AgentSettingsPanel.tsx:226-233` — already wires InboxSection for agent panel (no change)

**`InboxSection.tsx` implementation**:
```tsx
export function InboxSection({agentId, settings, patch, flush}: SettingsSectionProps) {
  const [messages, setMessages] = React.useState<MailMessage[]>([])

  React.useEffect(() => {
    let cancelled = false
    agents.readInbox(agentId, {limit: 50, markAsRead: true})
      .then(list => { if (!cancelled) setMessages(list) })
    const off = agents.onMail(agentId, (msg) => {
      setMessages(prev => [...prev, msg].slice(-200))
    })
    return () => { cancelled = true; off() }
  }, [agentId])

  if (messages.length === 0) {
    return <EmptyState />
  }

  return (
    <div>
      {messages.map(msg => (
        <MailboxItemRow
          key={msg.id}
          message={msg}
          onClick={() => goToAgentChat(msg.fromAgentId)}
        />
      ))}
    </div>
  )
}
```

**Verification**:
- `cd superhive && npx tsc --noEmit` — no new errors
- `cd superhive && bun test electron/ src/ --timeout 10000` — full suite still green
- Manual: open an agent's Inbox tab → see real messages (or empty state)
- Commit: `feat(superhive): Gap 2 InboxSection wired to real data`

---

### Commit 13 — Renderer UI: lift project Inbox tab

**Files to modify**:
- `src/components/layout/right-sidebar/ProjectSettingsPanel.tsx:128-141` — replace inline empty state with `<InboxSection mode="project" projectId={projectId} />`

**Implementation**:
- Add a `mode: 'agent' | 'project'` prop to `InboxSection`
- When `mode === 'project'`, the section aggregates `readInbox` for every `project.agentIds` member
- Groups by sender (use a `<Accordion>` per sender, or a flat list sorted by timestamp with sender headers)

**Verification**:
- `cd superhive && npx tsc --noEmit` — no new errors
- `cd superhive && bun test electron/ src/ --timeout 10000` — full suite still green
- Manual: open a project's Inbox tab → see aggregated messages
- Commit: `feat(superhive): Gap 2 project Inbox tab — aggregated by sender`

---

### Commit 14 — Renderer UI: chat sender badge

**Files to modify**:
- The component that renders chat entries (find it: probably `superhive/src/components/agent-chat/...` or `superhive/src/components/layout/composer/...`)
- Add a small badge above any message where `entry.fromAgentId` is set: shows "{fromAgentName} · {kind}" in a smaller font, muted color

**Implementation**:
- Find the chat-entry render component (read agent-chat history first; likely `AgentChatView.tsx` or similar)
- Add a `fromAgentId` lookup to the message render
- If `fromAgentId` is set, show a 1-line badge before the message body

**Verification**:
- `cd superhive && npx tsc --noEmit` — no new errors
- Manual: post a message via `post_to_project` from a worker → see the worker's name + kind badge in the project chat
- Commit: `feat(superhive): Gap 2 chat sender badge for agent messages`

---

### Commit 15 — End-to-end manual test + final wiring

**Manual test plan** (run in dev):
1. Create a project (e.g. "TestMailbox") with at least 2 members (a coordinator + 1 worker)
2. Start the coordinator and the worker
3. Worker uses `post_to_project` to post "test from worker" in the project chat
4. Verify: coordinator's runtime wakes with `[mail] New message in project chat. Call read_inbox.`
5. Coordinator LLM calls `read_inbox` → sees the message
6. Coordinator calls `ask_member(workerId, "reply please")` → worker's inbox updated
7. Worker wakes with `[mail] You have a new direct ask. Call read_inbox.`
8. Worker calls `read_inbox` → sees the ask
9. Worker calls `post_to_project` with the reply → message appears in project chat
10. Coordinator sees the reply in the project chat

**Files to update**:
- `superhive/GAPS.md` — mark Gap 2 as IMPLEMENTED with a one-line summary
- `superhive/changelog/2026-07-21-gap-2-mailbox.md` — full changelog (mirroring the Gap 1 changelog format)
- `superhive-pi-orchestration/AGENTS.md` and `general-kai/extensions/superhive-pi-orchestration/AGENTS.md` — document the new role-based tool gating (seam-3)
- `superhive-pi-orchestration/README.md` — update tool list from "5 (3 stubbed)" to "5 (coordinator) / 2 (member)"

**Verification**:
- `cd superhive && bun test electron/ src/ --timeout 10000` — full suite green
- `cd superhive-pi-orchestration && bun test && bun test/smoke.ts` — full suite green
- `diff -rq superhive-pi-orchestration general-kai/extensions/superhive-pi-orchestration` — empty
- `diff -rq superhive-pi-truth general-kai/extensions/superhive-pi-truth` — empty
- `diff -rq superhive-pi-context general-kai/extensions/superhive-pi-context` — empty (no changes to context, but verify)
- `cd superhive && npx tsc --noEmit` — no new errors
- Commit: `docs(superhive): Gap 2 changelog + GAPS update + role-gating docs`

---

## Out of scope (deferred)

These are explicitly NOT in Gap 2 and are deferred to later gaps:

- **LLM-free auto-routing**: a router that automatically sends `request_help` to the right member without coordinator LLM involvement. (Gap 3+)
- **Project memory writes triggered by mail**: a worker asking a question might be worth remembering. (Gap 4)
- **Bounded-context signal**: when a worker's inbox overflows, signal the coordinator. (Gap 5)
- **Recursive specialist creation**: workers creating sub-workers. (Gap 6)
- **`refMessageId` UI threading**: schema supports it, no UI surfaces it yet.
- **Archive/reactivation of idle inboxes**: when a worker stops, should its inbox be archived? (Gap 8)

## Risk + rollback

- **Highest-risk commit**: Commit 7 (tool implementations) — touches the orchestrator extension and changes the runtime behavior of coordinators. Revert by reverting the commit; the next `session_start` will reload the previous version.
- **Tightest coupling**: Commit 4 (IPC + AGENT_ID) — main process changes that the extension depends on. If reverted, the extension fails at `session_start` with "AGENT_ID not set" — easy to detect.
- **Easiest to revert**: Commits 1, 11, 12, 13, 14 — additive, no behavioral coupling.

Total: 15 commits, 4 new files in main repo, 6 new test files, 2 mirror syncs (orchestrator + truth), 1 changelog file.
