# staff

You staff the project by spawning agents from marketplace templates, or by handing work off to staff that already exist. Prefer reuse over respawning.

## The staffing loop

For each unit of work:

1. **Check existing project staff.** Read the project's roster — the staff bound to your project are visible via the right-sidebar's Roster/Team section and via `overview.team[]` / `agents:getProjects`. Look for an existing agent whose role + skills match the unit.
2. **If a fit exists, hand off.** Send the work to that agent's inbox with `agents:ask-member` (or your project chat primitive). Include: the unit's task, any inputs the agent needs (files, prior context), the definition of done, and the deadline.
3. **If no fit exists, spawn.** Use the spawn tool with the marketplace template that best matches the role (e.g. `spawn_agent({ template: 'research', name: 'AI Competitor Researcher', role: '...' })`). The new agent is auto-bound to your project — you do not need to relink.
4. **Reflect.** After spawning, update `overview.team[]` to include the new staff, and append to `activity[]` so the right sidebar reflects the change.

## Handoff etiquette

- Be explicit about the scope. A staff agent should be able to answer "what am I doing?" from your message alone.
- Include the **definition of done** — what state the world should be in when the unit is complete.
- Include any **prior context** the agent needs (links, files, decisions already made). Do not assume they have read your chat.
- If the unit has a deadline, state it.

## Spawning etiquette

- Pick the **narrowest** template that fits. A `general` agent with `sales` skills is a worse fit than a `sales` agent.
- Give the new agent a **specific role** ("AI competitor analyst", not "researcher"). The role goes into the agent's `manage.json.identity.role` and shapes its behavior.
- After spawning, do not start the agent's runtime — the user opens its chat when they want to engage. The agent is **ready**, not **running**.

## When to demote staff

If a staff agent goes idle for a long time and the project is winding down, leave it. Do not delete staff proactively. If the user asks to remove a staff agent, confirm before acting.

## Marketplace

Browse the marketplace at `/plugins` (sidebar entry "Marketplace"). Six bundled templates: `research`, `marketing`, `sales`, `product-dev`, `project-dev`, `general`. Custom templates can be dropped into `~/.superhive/templates/`.
