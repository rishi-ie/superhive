# Changelog — 2026-07-21 — Gap 2: Mailbox / Agent-to-Project Communication

> Implements GAPS.md § Gap 2. Workers post to a shared project chat; the coordinator can private-ask a specific worker via inbox; the user sees it all in the right panel (UI wiring lands in C7, separate commit). The flow: worker → `post_to_project` → project chat → main-process tailer injects `[mail]` wake into coordinator → coordinator LLM calls `read_inbox` → either replies in chat (`post_to_project`) or private-asks a specific teammate (`ask_member`) → teammate's inbox updates and they wake up → reply in chat. Pure-FS, role-gated, no IPC at the agent layer.

---

## Summary

| | Before | After |
|---|---|---|
| Worker's tools | 0 mailbox | 2 — `read_inbox` (own inbox), `post_to_project` (append to chat) |
| Coordinator's tools | 5 (3 stubbed with "not yet wired" errors) | 5 — all real, role-gated |
| Project chat (`<coordDir>/chat.jsonl`) | Coordinator + user only | Coordinator + user + every project member (tagged with `fromAgentId`, `fromAgentName`, `kind`) |
| Per-worker inbox (`<workerDir>/inbox.jsonl`) | Absent | New. Coordinator writes; member reads. Status flips `pending → acked` on read. |
| `read_inbox` filter | n/a (stubbed) | Coordinator: by kind, exclude self + user, exclude already-delivered. Member: own inbox, status=pending. |
| Cold-start wake | 0–5s polling latency | Immediate on `watchAgent` (worker offline during `ask_member` wakes on attach) |
| Member system prompt | Standard Pi defaults | Standard Pi + one-line role fragment appended (marker-guarded, idempotent) |
| Coordinator system prompt | CEO prompt with "honest Gap 2 stubs" footnote | CEO prompt + new `## Mailbox` section (no stub footnote) |

**Test status:** 51 orchestrator unit tests (was 40) + 11 smoke tests all pass. 13 mailbox-watcher tests (was 11). 177/177 main-repo tests. Typecheck clean for all Gap-2 files (pre-existing errors in `general-kai-runtime.ts` and `TurnFoldRow.tsx` are unrelated to this work).

---

## Files added

| File | Purpose |
|---|---|
| `superhive/changelog/2026-07-21-gap-2-mailbox.md` | This file. |

(No new files in any of the source repos. Gap 2 is pure feature work on existing modules.)

## Files modified

| File | Change |
|---|---|
| `superhive-pi-orchestration/project.ts` | Added 7 mailbox FS helpers: `appendProjectChat`, `readProjectChat` (with `excludeDeliveredTo` filter), `markChatDelivered`, `appendMemberInbox`, `readMemberInbox`, `ackInboxMessage`, `findMemberById`. Appends use `appendFileSync` (atomic for writes < PIPE_BUF). Status flips use tmp+rename. |
| `superhive-pi-orchestration/types.ts` | Added `ChatEntry` and `InboxEntry` interfaces. Mirror main-process shape exactly so the watcher treats both writes identically. |
| `superhive-pi-orchestration/tools.ts` | Replaced 3 "not yet wired" stubs with real implementations. `ask_member` writes to member's `<memberDir>/inbox.jsonl`. `read_inbox` is role-aware (coordinator reads filtered project chat, member reads own inbox). `post_to_project` appends to project chat with `fromAgentName` from `settings.name`. |
| `superhive-pi-orchestration/system-prompt.ts` | Dropped `STUB_NOTE` and the "3 of 5 tools are stubs" footnote. Added `buildRolePromptFragment(role)` and a new `## Mailbox` section to the CEO prompt. |
| `superhive-pi-orchestration/index.ts` | Members now get a role fragment appended to their existing `systemPrompt` (marker-guarded so the append is idempotent across `session_start`s; never overwrites the user's prompt). |
| `superhive-pi-orchestration/AGENTS.md` | Rule 4 ("honest stubs") removed. New rule 4 documents role-aware `read_inbox`. Rule 7 documents the marker-guarded fragment injection. |
| `superhive-pi-orchestration/test/{project,tools,system-prompt,smoke}.test.ts` | Tests updated to assert real behavior. 9 new project.ts helper tests. 2 new `buildRolePromptFragment` tests. Tools tests for `ask_member` / `read_inbox` / `post_to_project` rewritten to exercise the FS roundtrip. Smoke rewritten to use `AGENT_ID` gate (replaces Gap-1 `AGENT_KIND`) and assert the 5/2 tool split. |
| `superhive/electron/mailbox-watcher.ts` | `watchAgent()` does an immediate `checkMemberInbox` + `checkProjectChat` so pending entries written before the agent's runtime started fire `onMemberMail` / `onCoordMail` without waiting for the 5s polling tick. Size trackers are updated by the immediate check, so the next poll won't refire. |
| `superhive/electron/mailbox-watcher.test.ts` | 2 new cases under "MailboxWatcher — cold-start wake": one asserts immediate fire for pre-existing entries; one asserts the next polling tick doesn't refire. |
| `superhive/GAPS.md` | Gap 2 flipped to `✅ IMPLEMENTED` with a one-paragraph summary + link to this changelog. |
| `superhive/gap-2-implementation.md` | **Deleted.** The plan is fully shipped; this changelog replaces it. |
| `general-kai/extensions/superhive-pi-orchestration/*` | Seam-3 mirror of the orchestrator repo. `diff -rq` empty against source. |

---

## Where to change what (the "I need to fix X" map)

### "Change a coordinator's mailbox tool"

Edit: `superhive-pi-orchestration/tools.ts`

Three mailbox tools are role-gated inside `registerOrchestrationTools`. Coordinator gets all 5; member gets `read_inbox` + `post_to_project` only. Each tool factory closes over `opts: RegisterOpts` (role, settingsPath, project). Mirror the JSON-result shape `{ok, ...payload, ...error}`. Add unit test in `test/tools.test.ts`.

### "Change the on-disk format for mailbox files"

Edit: `superhive-pi-orchestration/project.ts` (orchestrator side) AND `superhive/electron/mailbox-store.ts` (main-process side).

Both must agree. `electron/mailbox-watcher.ts` treats orchestrator writes and IPC writes indistinguishably because the on-disk shape is identical. If you change one, change the other; if you add a new field, make it optional and tolerant to absence.

### "Change which members get what tools"

Edit: `superhive-pi-orchestration/tools.ts::registerOrchestrationTools`

The role gate is `if (opts.role === "coordinator") {...} else {...}`. Add a new role → add a branch. Don't introduce an abstraction (no `getToolsForRole(role)` factory for two roles — YAGNI).

### "Change the role prompt fragment"

Edit: `superhive-pi-orchestration/system-prompt.ts::buildRolePromptFragment`

Returns a short string. Coordinator gets CEO framing; member gets worker framing. The marker-guarded append is in `index.ts` — change the marker prefix `superhive:role-fragment:` only if you have a migration plan for existing settings files (they'd be re-appended on next `session_start`, which is harmless but worth knowing).

### "Change the cold-start wake behavior"

Edit: `superhive/electron/mailbox-watcher.ts::watchAgent`

The immediate check is the last two lines of the function. They call `this.checkMemberInbox(opts.agentId)` and (if `opts.projectDir`) `this.checkProjectChat(opts.projectDir)`. The size trackers (`lastInboxSize`, `lastChatSize`) start at 0; the immediate check processes all existing lines and sets the trackers, so the polling fallback won't refire.

### "Change the wake prompt text injected into the agent's session"

Edit: `superhive/electron/ipc/mailbox.ts::attachMailboxWatches`

Two callbacks: `onCoordMail` (text injected into the coordinator's session) and `onMemberMail` (text injected into a worker's session). The IPC handlers in `mailbox-handlers.ts` also call broadcast hooks — those are renderer-side, separate from the wake text.

### "Change the message kinds or the read_inbox filter"

Edit: `superhive-pi-orchestration/tools.ts::readInbox` (orchestrator) AND `superhive/electron/ipc/mailbox-handlers.ts::handleReadInbox` (main process).

Both must agree on:
- The `kinds` whitelist (`['request', 'question', 'broadcast', 'result']`).
- The `excludeFromAgentIds` set (`[selfAgentId, null]` — `null` is the user).
- The `excludeDeliveredTo` set (`[selfAgentId]` for the coordinator only — workers see all their own inbox entries).

### "Add a new Gap 3+ feature that needs to read the project chat"

Read `readProjectChat(projectDir, opts)` from `superhive-pi-orchestration/project.ts` (orchestrator side) or `MailboxStore.readProjectChat(coordDir, opts)` from `electron/mailbox-store.ts` (main process side). Don't write a new parser — reuse the existing one.

---

## Behavior change in the app (user-facing)

### Before Gap 2

- Workers can only "communicate" with the user or the coordinator through the existing Pi chat UI. There's no way for a worker to call out for help, no way for one worker to ask another, and no shared log of what the team is doing.
- The coordinator's 3 mailbox tools (`dispatch_to_agent`, `read_inbox`, `send_message_to_agent`) all return `{ok: false, error: "not yet wired (Gap 2)"}` errors. The coordinator LLM can list the team (`list_project_agents`) and check status (`get_agent_status`) but can't actually talk to them.
- The right-panel Inbox tab is an empty placeholder. The project Inbox tab is the same.
- Worker messages don't exist anywhere.

### After Gap 2 (this commit)

- A worker that needs help calls `post_to_project({ body: "...", kind: "request" })` → the project chat gets a tagged entry (`fromAgentId`, `fromAgentName`, `kind`).
- The main-process `MailboxWatcher` tails the chat file. When a new entry from a non-user, non-coordinator agent appears, it injects a `[mail] New message from <name> in project chat. Call read_inbox to inspect.` prompt into the coordinator's session.
- The coordinator LLM calls `read_inbox` → sees the pending message → decides:
  - Reply in the chat: `post_to_project({ body: "...", kind: "result" })`. Visible to the user, the worker, and any other agent.
  - Ask a specific teammate: `ask_member({ agentId: "<workerId>", body: "..." })`. Writes to `<workerDir>/inbox.jsonl`.
- The watcher tails the worker's inbox. On a new pending entry, it injects `[mail] You have a new direct ask. Call read_inbox to inspect.` into the worker's session.
- The worker calls `read_inbox` → sees the ask → replies via `post_to_project`.
- The whole loop flows through the project chat. The user sees every step in the same surface they're already looking at (the chat panel shows the messages; the Inbox tab will be wired in C7).

### What's not yet visible to the user (C7, separate commit)

- The right-panel Inbox tab still shows the empty placeholder. It will read the `inbox: MailMessage[]` runtime slice and render real messages in C7.
- The project Inbox tab still shows the placeholder. Same fix.
- The chat entry renderer doesn't yet show a sender badge for agent messages. C7 adds a one-line "**WorkerName · request**" label.

These are pure renderer changes; the underlying data and the orchestration are fully wired by this commit.

---

## Out of scope (deferred, add when their gap needs them)

- **Auto-routing without coordinator LLM** — Gap 3 task graph.
- **Project memory writes triggered by mail** — Gap 4.
- **Bounded-context signal when inbox overflows** — Gap 5.
- **Recursive specialist creation** — Gap 6.
- **`refMessageId` UI threading** — schema supports it; no UI surfaces it yet.
- **`MailEvent` telemetry consumer** — the field exists in `superhive-pi-telemetry/types.ts` but no consumer reads it. The IPC `onMail` event covers what the renderer needs today. Add the consumer when a feature actually wants it.

---

## Risk + rollback

- **Highest-risk commit:** the orchestrator one (`feat(superhive-pi-orchestration): Gap 2 wire 3 mailbox tools`). The extension is loaded by every project member. A regression breaks the coordinator.
- **Tightest coupling:** the cold-start wake fix in `mailbox-watcher.ts`. If it ever fires twice for the same entry, the agent's session will see duplicate wake prompts. Mitigated by the size tracker logic — the test `cold-start wake does not refire on the next polling tick` pins this.
- **Easiest to revert:** the docs commit (`docs(superhive): Gap 2 changelog + GAPS update`). Just reverts the changelog and the GAPS.md edit.
- **Seam-3 drift:** `diff -rq superhive-pi-orchestration general-kai/extensions/superhive-pi-orchestration` was empty before each commit. Pre-existing seam-3 drift in `superhive-pi-truth` (the `index.ts`, `tools.ts`, etc. files differ from `general-kai/extensions/superhive-pi-truth/`) was NOT touched — flagged, not fixed, per AGENTS.md rule 4.
