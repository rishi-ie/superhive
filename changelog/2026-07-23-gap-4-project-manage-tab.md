# Changelog — 2026-07-23 — Gap 4: Project Manage Tab

> Wires the right-sidebar Manage tab in `ProjectSettingsPanel` to render the full 7-section manage surface from `<agentRoot>/manage.json` (coordinator's truth file). Mirrors the per-agent Manage tab in `AgentSettingsPanel`, which already iterates `MANAGE_SECTIONS`. Sections retargeted to manage.json field paths. Plan-mode section is gated on `coordinatorOnly`. `useAutoSave` removed in favor of the slice's own debounced writer (`useAgentManage`).

---

## Summary

| | Before | After |
|---|---|---|
| Project Manage tab | 2 hand-rolled sections (MembersList + PlanModeSection inline) | Registry-driven 7-section list (Identity, Behavior, Permissions, Skills, Extensions, Prompts, Plan Mode) with Team subgroup above |
| Section field paths | Mapped to merged `Superhive-pi-<basename>.json` (flat `name`/`description`/`catalog.skills`) | Mapped to the 4-file truth split: dotted `identity.*`, top-level `permissions`/`planMode`/`behavior`/`project`, active-set `skills`/`extensions`/`prompts` (manage.json) + `catalog.*` (settings.json) |
| Writers | `useAutoSave(coordId).patch/flush` AND `useAgentManage(coordId).patch/flush` (two writers racing on manage.json) | One writer per agent id: `useAgentManage(coordId).patch/flush` owns both reads and writes |
| Plan-mode render | Always (sidebar would show plan-mode controls on non-coordinator agents) | Gated: hidden unless `settings.project.id` is set |
| Identity section | `<Input>` for name + description only (top-level fields) | `<Input>` for name + description + workspace (`identity.{name,description,workspace}`) |
| Behavior section | Showed systemPrompt + permissions (wrong — systemPrompt moved to settings.json) | Show steering mode, follow-up mode, auto-compaction, auto-retry (behavior block) |
| Skills / Extensions / Prompts | Toggled `catalog.{skills,extensions,prompts}[].active` (settings.json relic) | Toggle writes the active-set `string[]` to `manage.json`; checked state derived from intersection with `settings.{skills,extensions,prompts}` |

**Renderer touch:** 8 files. **Truth ext / IPC:** untouched. **Tests:** typecheck clean (5 pre-existing electron errors unrelated).

---

## Files modified

| File | Change |
|---|---|
| `superhive/src/models/component.ts` | Added `ManageFileState` interface mirroring `superhive-pi-truth/settings-schema.ts::ManageFile` (loose; index signature retained). Added `ManagePermissionsBlock`, `ManageBehaviorBlock`, `ManageProjectBlock`, `IdentityBlock`, broaden `SettingsSectionProps.settings` to `AgentSettingsState \| ManageFileState`. New `ManageSectionDef.coordinatorOnly?: boolean`. |
| `superhive/src/components/layout/right-sidebar/sections/registry.tsx` | `getIdentityAtoms` reads `settings.identity.*` (was top-level `settings.name`). `getBehaviorAtoms` enumerates behavior fields (was systemPrompt). `ManageSectionDef.Component` typed against the union. `plan-mode` row carries `coordinatorOnly: true`. |
| `superhive/src/components/layout/right-sidebar/sections/IdentitySection.tsx` | Reads `settings.identity.{name,description,workspace}`. Patch keys `identity.name` / `identity.description` / `identity.workspace`. |
| `superhive/src/components/layout/right-sidebar/sections/BehaviorSection.tsx` | Dropped systemPrompt row + permissions (moved to its own section + settings.json territory). New layout: steering-mode Segmented, follow-up-mode Segmented, auto-compaction SwitchRow, auto-retry SwitchRow. Patch keys dotted (`behavior.steeringMode`, etc.). |
| `superhive/src/components/layout/right-sidebar/sections/SkillsSection.tsx` | Reads catalog items from `settings.catalog.skills`; computes checked state from `settings.skills` (active `string[]`); toggle writes a new `string[]` to manage.json via `patch?.('skills', next)`. Empty-state copy when the catalog is empty. |
| `superhive/src/components/layout/right-sidebar/sections/ExtensionsSection.tsx` | Same pattern as SkillsSection, against `settings.catalog.extensions` / `settings.extensions`. |
| `superhive/src/components/layout/right-sidebar/sections/PromptsSection.tsx` | Same pattern, against `settings.catalog.prompts` / `settings.prompts`. |
| `superhive/src/components/layout/right-sidebar/ProjectSettingsPanel.tsx` | Replaced hand-rolled MembersList + PlanModeSection with a registry-driven `ManageSectionList` (renders each `MANAGE_SECTIONS` row with the coordinator's merged settings object). Merge uses manage.json + a `catalog` overlay from `useAgentSettings`. Removed `useAutoSave` (single debounced writer slice). Plan-mode gating via `coordinatorOnly`. Team subgroup above the section list. New `handleAssign` / `handleRemove` extracted so each is a single function ref. Empty-state when no coordinator. |

---

## Behavioral change (simple words)

**Before.** Open a project's right sidebar → Manage tab → you see the Team (members list) and one Plan Mode block stuck under it. Everything else (identity, behavior, permissions, skills, extensions, prompts) is invisible because the registry that ships in `sections/registry.tsx` was only ever iterated by `AgentSettingsPanel`. Sections were also wired to the merged `Superhive-pi-<basename>.json` paths — pre-truth-split. After the truth split, those flat paths don't exist, so even toggling identity fields against a non-merged file silently dropped the change.

**After.** Open a project's right sidebar → Manage tab → you see Team (members) followed by the same 7 sections the per-agent Manage tab shows: Identity (name, description, workspace), Behavior (steering, follow-up, auto-compaction, auto-retry), Permissions (filesystem, terminal, network), Skills, Extensions, Prompts (toggles against the workspace catalog, writes a clean active-set `string[]` to manage.json), and Plan Mode (coordinator-only). Writes go through one debounced writer (the slice's own), so two writers no longer race. Identity is no longer a flat field — it's `settings.identity.*`, where the truth extension expects it after the split. Plan Mode hides itself when the agent isn't a project coordinator (gated on `settings.project?.id`).

---

## Where to change what (map)

| Want to… | Edit |
|---|---|
| Add a new manage section (e.g. Workspace) | New `sections/WorkspaceSection.tsx` + entry in `sections/registry.tsx::MANAGE_SECTIONS` |
| Mark a section coordinator-only | Add `coordinatorOnly: true` to the entry in `MANAGE_SECTIONS` |
| Change which fields Identity exposes | `sections/IdentitySection.tsx` |
| Change which fields Behavior exposes | `sections/BehaviorSection.tsx` |
| Change the catalog→active-set source split | `sections/{Skills,Extensions,Prompts}Section.tsx` |
| Re-introduce the search bar in the project tab | Mirror `AgentSettingsPanel.tsx`'s `rankedSections` useMemo into `ProjectSettingsPanel`'s manage tab |
| Change the empty-state copy for missing coordinator | `ProjectSettingsPanel.tsx::ManageSectionList` outer empty-state copy |

---

## Out of scope (deferred to later gaps)

- **Catalog re-scan trigger.** Empty-state nudges the user to "reload to re-scan"; no reload button wired (the catalog scan runs on truth-ext boot).
- **Package + theme toggle UI.** manage.json has `packages` / `themes` but no sections render them yet — same loop as Skills/Extensions/Prompts would apply when added.
- **Branch-summary settings block + systemPrompt row.** systemPrompt is in settings.json (not manage.json). A dedicated "System" section for the per-agent tab would live in `AgentSettingsPanel`, not here.
- **`AgentSettingsPanel` per-agent tab.** Its section field paths reference some flat/old paths. PermissionsSection + PlanModeSection are the only ones currently working post-truth-split. The same path-fix would land there but the user wanted the project tab first.
- **Coordinator-claim UX.** When the project has no coordinator, we show a hint; no "claim project" button yet.

---

## Known limitations

1. **The renderer's `useAgentSettings.coordinatorId` reads settings.json.** That IPC call (READ_SETTINGS) returns settings + a possibly-empty `catalog` block. If the catalog hasn't been scanned yet, the skills/extensions/prompts sections render an empty-state instead of a list. Same boot dep as `AgentSettingsPanel` had — pre-existing.

2. **Section write keys must be dotted.** `useAgentManage.patch("skills", ["…"])` writes the top-level `skills` array. `useAgentManage.patch("behavior.steeringMode", "all")` writes `behavior.steeringMode` deep. The slice's `deepMergeDotted` handles both. Sections written against the old `catalog.skills` schema patched a top-level key and silently lost the change. All new patches go through dotted paths or top-level replace.

3. **ManageSectionList is project-side.** Behavior on the per-agent tab is unchanged: `AgentSettingsPanel` still iterates `MANAGE_SECTIONS` with `useAgentSettings(agentId)` for reads and `useAutoSave(agentId)` for writes. Two writers do NOT race there because `useAgentSettings` is read-only against settings.json.

4. **Catalog source split is renderer-only.** The truth's `catalog-scanner.ts` reads `getManage()` to mark entries active in the catalog (so users see what's currently active even when reading `settings.catalog`). The renderer's section pulls the catalog list from `settings.catalog` and cross-references the active set against `settings.skills` (the same `string[]` truth ext pulled from manage.json). The renderer's "what's active" computation must match truth's `applyManageDiff` semantics; both treat `skills: string[]` as the source of truth.

---

## Risk + rollback

| Risk | Likelihood | Mitigation |
|---|---|---|
| Sections patch wrong paths and silently drop | Low (regression over the old code) | All new patch keys are dotted or top-level; old `catalog.skills` writes are gone. Section behavior + visual smoke verifies writes land. |
| Plan-mode controls visible on non-coordinator | None | `coordinatorOnly: true` + per-section gate in `ManageSectionList` (`!isCoordinator` returns null) |
| Lost toggles from pre-gap-4 settings.json active-bool fields | By design | Old `catalog.skills[].active` is no longer a thing. Active set is `manage.skills: string[]`. Old data is best-effort migrated by truth ext into `manage.skills` on first launch. |
| `useAgentSettings` IPC traffic on every project open | Low | Same slice lifecycle as today; one per agent id. |
| Single writer regression | None | We removed a writer; no new race introduced. |

**Rollback.** Revert commits 5d4134c → ce591fd → 2336056 → ac2f86f → 84839ad on `superhive` dev. The renderer falls back to the hand-rolled MembersList + PlanModeSection layout (5 commits ago). No IPC changes, no truth-schema changes, no agent data is migrated or deleted.
