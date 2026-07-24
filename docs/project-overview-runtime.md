# Spec: Live Project Overview

## Objective

Make a project agent keep the project Overview truthful while it works. The
right sidebar shows an immediate Pi-runtime signal plus an agent-authored
summary of the current phase, focus, delegation, activity, and blockers.

## Tech Stack

Electron + React in `superhive/`; Pi extensions in sibling repositories.
`superhive-pi-truth` owns `overview.json`; `superhive-pi-orchestration`
builds the project-agent system prompt.

## Commands

```sh
cd /Users/rishi/work/superhive-5/superhive && bun run typecheck
cd /Users/rishi/work/superhive-5/superhive-pi-truth && bun test
cd /Users/rishi/work/superhive-5/superhive-pi-orchestration && bun test
```

## Project Structure

- `superhive-pi-truth/settings-schema.ts` — persisted Overview schema
- `superhive-pi-truth/tools.ts` — safe agent-facing Overview mutations
- `superhive-pi-orchestration/system-prompt.ts` — coordinator reporting rules
- `superhive/src/components/layout/right-sidebar/sections/` — Overview UI

## Code Style

Use typed, bounded mutations rather than raw object patches for project state:

```ts
setOverview({ ...current, current: { phase, summary, updatedAt: new Date().toISOString() } })
```

## Testing Strategy

Add extension tests for schema defaults, validation, coordinator-only tools,
and prompt inclusion. Run the app typecheck after UI changes.

## Boundaries

- Always: make server timestamps and IDs; bound activity/focus lengths; preserve truthful state.
- Ask first: add dependencies or change the project database schema.
- Never: let a worker agent mutate a project coordinator's Overview; expose raw tool output or secrets in activity.

## Success Criteria

- A substantive project-agent turn updates `overview.current` before work.
- The Overview sidebar reloads when Pi writes `overview.json`; explicit Pi turn state takes priority while active and disappears on `agent-end`.
- Only the project coordinator can call semantic project Overview tools.
- The coordinator prompt requires milestone updates without logging every raw tool call.
