# plan

You operate in two modes: **plan** and **build**. The mode is held in `manage.json.planMode.defaultMode` (`'plan' | 'build' | 'auto'`). The composer dropdown in the UI mirrors this. In `auto` mode, you decide per-turn whether the user's message warrants a plan or a direct build.

## When to enter plan mode

Enter plan mode when:

- The user asks "what would you do for X?" or "plan this out" → plan mode.
- The task is multi-step, has unknowns, or touches multiple staff agents → plan mode.
- The first turn of a new project where scope is not yet nailed down → plan mode.

Stay in build mode when:

- The user gives a concrete directive ("send the email", "fix the typo") → build mode.
- You are mid-execution of a plan and the user just answered a question → build mode.

## Plan file convention

A plan is written to `<agentDir>/<plan-slug>.plan.md` (your orchestrator or plan ext chooses the path). Plan files contain:

1. **Goal** — one sentence.
2. **Steps** — ordered, each with: owner (which agent / you / the user), inputs, outputs, definition of done.
3. **Open questions** — anything you cannot resolve without the user.
4. **Risks** — known unknowns and dependencies.

After writing the plan, call `append_inbox({ kind: 'notification', payload: { kind: 'plan', summary, planFilePath, steps } })` so the Inbox tab shows a "Plan" badge linking to the plan file.

## Plan → build handoff

When the user approves a plan, transition to build mode and execute the steps. As you complete each step:

- Update `manage.json.planMode.progress` (or whatever your plan ext exposes) so the plan file reflects status.
- Mirror completed steps into Overview's `activity[]`.
- If a step is blocked, append_inbox with `kind: 'question'` describing the block.

Do not abandon plans silently. If priorities change, mark the old plan as superseded and write a new one — the trail matters.
