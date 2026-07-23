# Gap 6 — Drop the "Team" framing from project Manage + Overview tabs

## Summary

The project agent **is** the project. Old code surfaced this in two wrong places (a "Team" block in the Manage tab and a mock "Team" card in the Overview) using a coordinator-plus-members model that didn't match reality. This gap removes both.

| Before | After |
|---|---|
| Manage tab: Team header + Coordinator row + Members list + Assign button above the settings sections | Manage tab: settings sections render directly inside the scroll area |
| Overview: "Team" card rendered a mock-driven list of fabricated members | Overview: "Project agent" card renders ONE card for the project agent itself (name + live status + role/description) |
| `ProjectOverviewSectionData.members: Agent[]` in `models/component.ts` | Field removed; replaced with `coordinator: Agent \| null` |

## Files added

None.

## Files modified

- `superhive/src/components/layout/right-sidebar/ProjectSettingsPanel.tsx`
  Manage tab JSX reduced from 38 lines to 14. Dropped imports:
  `Icon` + `BookOpenTextIcon` + `TreeViewIcon` + `TrayIcon` + `Button` +
  `Empty` + `EmptyDescription` + `EmptyTitle` (kept `Icon` — TabsList
  still uses it) + `loadUnassignedAgents` + `assignAgentToProject` +
  `removeAgentFromProject` + `ProjectMembersList` + `AssignAgentDialog`.
  Dropped state: `teamLoading`, `assignOpen`. Dropped handlers:
  `handleAssign`, `handleRemove`. Dropped `<AssignAgentDialog />` mount.
  The `useEffect` no longer toggles a spinner — settings + overview
  + inbox load data on their own.
  `overviewData` no longer carries `members`.

- `superhive/src/components/layout/right-sidebar/sections/ProjectOverviewSection.tsx`
  "Team" card renamed to "Project agent" + renders ONE `AgentCard` for
  the project agent itself (via new `projectAgentToCard(coordinator)`
  helper). Empty state changed to "Project agent offline.". Dropped
  `members.map(memberToAgentCard)` rendering + `memberToAgentCard`
  helper + `MOCK_AGENT_WORK` constant. Header comment updated to
  describe the 4-section mission control.

- `superhive/src/models/component.ts`
  `ProjectOverviewSectionData.members` removed. `coordinator: Agent | null`
  added (renderer-facing name; the project agent's truth settings own
  the project block). `coordinatorProjectDescription` doc-comment
  updated to reference `overview.json` (post-4-file-split) instead of
  the legacy `Superhive-pi-<basename>.json` path.

- `superhive/src/components/layout/right-sidebar/sections/index.ts`
  Removed `ProjectMembersList` + `AssignAgentDialog` exports; kept
  `UnassignAgentDialog` (still used by `AgentsListView.tsx`).

## Files deleted

- `superhive/src/components/layout/right-sidebar/sections/ProjectMembersList.tsx`
  No remaining consumers (the only importer, `ProjectSettingsPanel`,
  no longer references it). The component was a 1-of-1 with the Team
  block.

- `superhive/src/components/layout/right-sidebar/sections/AssignAgentDialog.tsx`
  No remaining consumers (only the Manage tab's removed Assign button
  triggered it).

## Where to change what

| Future edit | File |
|---|---|
| Add or reorder a settings section in the Manage tab | `sections/registry.tsx` — `MANAGE_SECTIONS` array |
| Add a row inside the existing Identity/Behavior/etc. sections | `sections/<SectionName>.tsx` (each section owns its own layout) |
| Change "Project agent" card visual | `sections/ProjectOverviewSection.tsx` — `projectAgentToCard` mapper + the `<SectionLabel>Project agent</SectionLabel>` block |
| Change the data the Overview card reads (role, description, status) | `sections/ProjectOverviewSection.tsx` (`projectAgentToCard`) + `models/component.ts` (`AgentOverviewCard`) |
| Add members-rendering to Overview again | DO NOT. Use `members` from `loadProjectTeam` only if a future gap reintroduces the team concept; the field is currently dead at the renderer. |
| Wire up a "Project offline" badge to a real signal | `sections/ProjectOverviewSection.tsx` (muted-fallback currently) |

## Out of scope (deferred)

1. **`loadProjectTeam.members` field** — `loadProjectTeam` still loads
   `members: Agent[]`, but the renderer no longer references it.
   Storage-side cleanup is deferred to a future gap so this gap stays
   scoped to UI.
2. **`loadUnassignedAgents` dead export** — exported by
   `flows/projects/crud/load-project-team.ts:20` and re-exported by
   `crud/index.ts:5`, but no consumer calls it now. Dead at the
   renderer; backend IPC handler (if any) is out of scope.
3. **`assignAgentToProject` / `removeAgentFromProject` flows** — still
   legitimately used by `pages/agent-chat/components/AgentsListView.tsx`
   for the agents-list-page assign-to-project UX. Out of scope here.
4. **Overview's Health / Current Focus / Recent Activity mocks** —
   each is its own gap.
5. **Project-agent identity model** — "how does an agent become a
   project agent?" is not addressed here. Currently an agent is
   "promoted" to a project agent by writing `project.id` into its own
   `manage.json` (truth ext cascade mirrors into `superhive-pi-orchestration.json`).
   A first-class toggle is a later gap.

## Known limitations

- The "Project agent" card renders even when the project agent is
  offline — it just shows an Idle status dot. Real-time liveness is
  whatever `loadProjectTeam` + `useAllAgentStatuses` report; no UI
  affordance is added for transient disconnects.
- Dropping `ProjectMembersList` + `AssignAgentDialog` is irreversible
  from this branch — recreating them would need a new gap and a fresh
  discussion of the assigned-members model.

## Risk + rollback

**Risk: low.** UI-only deletions; no behavioral change to the project
agent's truth files, no schema change to anything on disk, no IPC
contract touch. Worst case: visual regression in Manage or Overview.

**Rollback:** `git revert <commit>` to restore both files + the
ProjectSettingsPanel layout. No data to migrate; nothing was persisted
during the gap.
