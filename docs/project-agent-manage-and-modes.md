# Spec: Project-agent Manage settings and operating modes

## Objective

Make every project-agent Manage edit durable and effective for the next user
message. Restore an explicit composer control with exactly two operating modes:
Plan and Execute. Plan mode is read-only and planning-only; Execute mode grants
the normal configured tool set. The project record is the canonical source for
the project/workspace display name and description.

## Commands

- Focused renderer tests: `bun test src/flows/agents/runtime/event-translator.test.ts src/pages/agent-chat/components/response-run-view.test.ts`
- Plan extension tests: `bun test` from `../superhive-pi-plan`
- Orchestration tests: `bun test` from `../superhive-pi-orchestration`
- Typecheck: `bun run typecheck`
- Production build: `bun run build`

## Project structure

- `src/components/layout/right-sidebar/sections/` — Manage controls
- `src/components/layout/composer/` — project composer controls
- `src/flows/agents/settings/` — write/flush contract for `manage.json`
- `electron/ipc/agents.ts` — canonical coordinator seed data
- `../superhive-pi-plan/` — Plan/Execute policy and tool gating
- `../superhive-pi-orchestration/` — dynamic project-agent system prompt

## Code style

Use one canonical persisted setting and normalize at its boundary:

```ts
await flushAgentManage(agentId)
await applyProjectAgentTurnSettings(agentId)
await agents.send(agentId, text)
```

Avoid duplicated mode state in React, the runtime, and extensions. The composer
only writes `manage.planMode.defaultMode`; extensions enforce that value.

## Testing strategy

- Unit-test Plan and Execute mode against the actual extension hooks: prompt
  content and allowed tools after a mid-session switch.
- Add an integration-style test that writes Manage settings then immediately
  starts a turn, asserting the rebuilt project prompt uses the new values.
- Test coordinator creation with missing UI metadata and verify its prompt uses
  the project repository's name and description.

## Boundaries

- Always: persist a mode selection before send; apply it before the next turn;
  keep Plan mode read-only at the tool-policy layer.
- Ask first: adding new extensions, widening Plan-mode mutating permissions,
  or changing project data storage.
- Never: treat a system-prompt instruction as the sole Plan-mode safeguard;
  persist raw secrets or tool arguments in the Manage surface.

## Success criteria

- Project composer shows Plan and Execute, and the selected value applies to
  the very next message.
- Plan mode injects its planning prompt and blocks mutating tools.
- Execute mode removes Plan restrictions and restores configured tools.
- Every surfaced Manage field is written to a defined truth file and has a
  declared next-turn or reload behavior.
- First project-agent prompt always has the project name and its saved
  description when present.

## Open question

“Workspace name” is treated as the project display name. The filesystem
workspace path remains an implementation path and is not repurposed as a
second editable project name.
