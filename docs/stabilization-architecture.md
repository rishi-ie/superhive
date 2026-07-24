# Superhive Stability Architecture

## Objective

Make a project manager and its specialists reliable before adding more
categories or integrations. Superhive owns durable project state and runtime
policy; Pi executes individual agent turns using the policy snapshot supplied
by Superhive.

## Decisions

- A project has one canonical root path, manager id, and membership roster.
- The Electron main process is the only writer of project and agent settings.
- Each settings write creates a monotonically increasing revision. A Pi turn
  captures that revision before it starts, so a Manage-tab change applies to
  the next user message, never halfway through a response.
- Task dispatch waits for a worker runtime to be ready. A task is never sent
  optimistically to a process that has not started.
- Files remain useful for workspaces and artifacts. They are not the durable
  source of truth for task, mailbox, or membership workflows.

## Milestone acceptance criteria

1. `bun run typecheck` passes.
2. Creating a project seeds the manager with a complete project context.
3. Adding a member updates the canonical roster and the member's runtime
   context.
4. A Manage-tab write is acknowledged only after a new settings revision is
   durable; the next runtime turn sees that revision.
5. A task sent to an idle worker waits for runtime readiness before delivery.
6. Automated tests cover project bootstrap, settings revisions, and task
   dispatch without real provider credentials.

## Boundaries

- Always validate renderer input at IPC boundaries and preserve existing user
  data during migrations.
- Ask before replacing the local persistence backend or adding a dependency.
- Never put provider credentials in agent manifests or rely on an agent-side
  extension as the authority for project state.
