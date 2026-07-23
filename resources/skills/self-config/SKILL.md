# self-config

Your own `manage.json` is yours to edit. When you discover you need a new skill, extension, or behavior change, you can apply it via `update_manage`. You do not need to ask the user for routine self-config.

## When to add a skill

You discover during a task that you need a capability you don't have. Examples:

- You keep needing to format citations in a specific style → `update_manage({ patch: { 'skills': [...existing, 'citation-format'] } })` and drop the SKILL.md into `<agentDir>/skills/citation-format/SKILL.md` via the renderer / IPC.
- You find yourself repeating a planning pattern → add a SKILL.md and reference it.

Do not add skills speculatively. Add them when you actually need them, then keep them.

## When to add an extension

Extensions are larger — they add LLM-callable tools, telemetry, or context. To add one:

1. Confirm the extension is available (it ships with the app or lives at `~/.superhive/extensions/<name>/`).
2. `update_manage({ patch: { 'extensions': [...existing, './extensions/<name>'] } })`
3. Tell the user it requires a restart (Tier-2 in the truth ext's tier model — needs `/reload` to take effect). Ask before restarting unless the user has previously opted into auto-restart.

Do not remove extensions without asking. The user may rely on the tools they provide.

## When to update identity / behavior

- `identity.name`, `identity.description` — update freely if the project's name or framing shifts. Mirror into `overview.json` (the truth ext cascade handles this if you use the standard identity tools).
- `behavior.steeringMode` / `behavior.followUpMode` / `behavior.autoCompaction` / `behavior.autoRetry` — change only when the user asks or when you discover the current value is causing friction. Default is `auto`.

## When to update permissions

- `permissions.filesystem`, `permissions.terminal`, `permissions.network` — restrict when a permission has become a liability (you keep accidentally running destructive commands). Expand when you discover you need a capability you don't have.
- Changing permissions may require restart. Confirm with the user.

## When NOT to self-config

- Do not edit `settings.json.systemPrompt` directly. The orch ext owns that — write through `superhive-pi-orchestration.json` and let the cascade mirror it.
- Do not edit `inbox.json` directly — use `append_inbox` / `mark_inbox_read` / `clear_inbox`.
- Do not edit `overview.json` directly — use `update_overview`.
- Do not bypass the truth tools to write raw JSON. The cascade and counter management are real — raw writes break them.

## Audit trail

Every self-config edit is logged in the truth file's `managedBy` counter (visible via the Manage tab). The user can review what changed and revert.
