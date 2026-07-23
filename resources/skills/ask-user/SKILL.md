# ask-user

You have three inbox kinds for talking to the user, and they are not interchangeable. Pick the right one.

## When to use `kind: 'permission'`

The user must explicitly approve before you can do something risky. Examples:

- Running a destructive shell command (`rm -rf`, `git push --force`, system-level installs).
- Sending an outbound message on the user's behalf (email, chat to a third party).
- Reading a sensitive file outside the project's working directory.
- Spawning an agent that will incur cost or commit work.

Shape: `append_inbox({ kind: 'permission', message: '<plain-language ask>', payload: { command?, rationale, riskLevel: 'low' | 'medium' | 'high' } })`.

The Inbox tab renders this as a yes/no card. Wait for the user's reply before proceeding.

## When to use `kind: 'question'`

The user must make a choice between options. Examples:

- "Should the new staff agent be named X or Y?"
- "Do you want to use Postgres or SQLite for the project?"
- "Which of these three approaches do you prefer?"

Shape: `append_inbox({ kind: 'question', message: '<the question>', payload: { options: [{ label, value }], multiSelect?: boolean } })`.

The Inbox tab renders this as a picker. The user picks one (or many, if `multiSelect`).

## When to use `kind: 'notification'`

The user should be informed, but no decision is required. Examples:

- "Plan written to `<path>`." Use `payload = { kind: 'plan', summary, planFilePath, steps: [...] }` so the Inbox tab renders a "Plan" badge.
- "Spawned staff: AI Competitor Researcher (research template)."
- "Completed: source triangulation pass for paper X."
- "Failed: Z — blocked on W."

Shape: `append_inbox({ kind: 'notification', message: '<the news>', severity?: 'info' | 'warning' | 'error', payload?: Record<string, unknown> })`.

No card. Just a row in the inbox feed. The user can dismiss.

## Decision table

| Situation | Kind |
|---|---|
| "Should I run X?" | `permission` |
| "Pick A, B, or C" | `question` |
| "FYI: plan written" | `notification` (with `payload.kind = 'plan'`) |
| "FYI: spawned staff" | `notification` |
| "FYI: step completed" | `notification` |
| "FYI: step failed" | `notification` (severity: `'error'`) |
| "FYI: blocker" | `notification` (severity: `'warning'`) |

## Anti-patterns

- **Don't ask permission for safe operations.** If the action is reversible and bounded, just do it and tell the user afterward via `notification`.
- **Don't bundle multiple questions into one `question` row.** One row = one decision. If you need two answers, fire two `append_inbox` calls.
- **Don't notify without context.** "Done" is not a useful notification. "Completed source triangulation for the 12-paper batch, top finding: paper #7 contradicts the prevailing assumption" is.
- **Don't put permission asks in `notification`.** A notification has no yes/no card — the user cannot respond.

## Receiving answers

Answers arrive via `agents:mark-inbox-read`. The orchestrator (or your runtime) routes them back to you as user messages. When you receive an answer, acknowledge it briefly, then proceed.
