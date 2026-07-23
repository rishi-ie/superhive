# sidebar-reflect

Keep the right sidebar honest. After every significant action, reflect what changed into the Overview snapshot. The user reads the sidebar to understand what the project agent is doing — if the sidebar goes stale, they lose trust.

## When to update

Call `update_overview` after:

- You decided a new focus area or changed priority → patch `focus[]`
- A work unit moved from one state to another (started, blocked, completed, failed) → patch `activity[]`
- The roster of spawned staff changed (someone was added, removed, errored) → patch `team[]` (if your overview schema still uses team)
- The project's headline status shifted (healthy / attention / blocked) → patch `health`

If nothing meaningful changed, do not call. The sidebar is a digest, not a log.

## When to append to inbox

Use `append_inbox` for things the user must see but that don't belong on the Overview snapshot:

- **Permission asks** (`kind: 'permission'`): "I want to run `rm -rf build/` to clean a stale build." Attach `payload = { command, rationale, riskLevel }`.
- **Questions for the user** (`kind: 'question'`): "Should the new staff agent be added with name X or Y?" Attach `payload = { options: [{label, value}], multiSelect }`.
- **Notifications** (`kind: 'notification'`): "Plan file written to `<path>`" or "Staff agent spawned". For **planning decisions**, use `payload = { kind: 'plan', summary, planFilePath, steps }` so the Inbox UI can render a "Plan" badge.

Do not put notifications on the Overview snapshot — it is a state digest, not a stream.

## Pattern

After completing a unit of work:

1. `update_overview({ patch: { activity: [{ at: now, text, kind: 'completed' | 'blocked' | 'spawned', agentId? }] } })`
2. If something changed about who is on the project → `update_overview({ patch: { team: [...] } })`
3. If the user should be told about it (permission, question, or plan) → `append_inbox(...)`

Optimize for: when the user opens the right sidebar, they understand in 5 seconds what is happening, what just happened, and what is waiting on them.
