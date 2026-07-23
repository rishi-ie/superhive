# Changelog — 2026-07-23 — Gap 5: Project Manage Tab — Empty-State Race Fix

> Fix for the freshly-generated-project bug: the right sidebar's Manage tab in `ProjectSettingsPanel` rendered "Assign a project coordinator to edit manage settings." even when the project already had its coordinator (the project agent itself). The single-gate ternary at `ProjectSettingsPanel.tsx:179` conflated three distinct states (still-loading, no-coordinator, IPC-in-flight-but-coord-present). Section rendering now fires the moment `loadProjectTeam` resolves with a coordinator.

---

## Summary

| | Before | After |
|---|---|---|
| Empty-state gate | `mergedTeam.coordinator && coordinatorManage.settings ? sections : empty-state` | Three-state render: `teamLoading` placeholder → no-coordinator `<Empty>` → sections (always when coordinator present) |
| `loadProjectTeam` re-fetch | Only on `[projectId]` change | On `[projectId, agentsVersion]` change so an agents-reconcile that adopts a freshly-created coordinator refreshes the panel |
| Loading copy | Inline muted `<div>` ("Assign a project coordinator…") shown for one frame on EVERY project | `<Empty>` + Assign button (genuine no-coord only) or sections with defaults (coord present but IPC in flight) |
| `teamLoading` semantics | Implied ("settings null ⇒ not loaded") | Explicit local state, defaults to `true`, set to `false` on resolve or error |

**Files touched:** 1 file (`ProjectSettingsPanel.tsx`). No IPC, no schema, no other modules.
**Typecheck:** clean for the new code (5 pre-existing electron errors in `runtime/{settings-watcher,spawn}.ts` are unrelated).

---

## Files modified

| File | Change |
|---|---|
| `superhive/src/components/layout/right-sidebar/ProjectSettingsPanel.tsx` | Imports: add `useAgentsListVersion`, `Button`, `Empty`/`EmptyTitle`/`EmptyDescription`. New `teamLoading: boolean` state, defaults `true`. `useEffect` re-runs on `[projectId, agentsVersion]` with cancellation guard + `.finally` so loading always resolves. Three-state render in the manage tab: `(teamLoaded && coord) → sections ; (!teamLoading && !coord) → <Empty> + Assign button ; (teamLoading) → null`. |

---

## Behavioral change (simple words)

**Before.** Create a new project. Open the project's right sidebar → Manage tab. The first frame shows *"Assign a project coordinator to edit manage settings."* even though the coordinator (the project agent) already exists. This is wrong, because the coordinator is created in the same `prepareProject` flow that creates the project — it's never actually missing. The message was leaking through while the `useAgentManage` IPC for the coord's `manage.json` was still in flight (`coordinatorManage.settings` starts at `null` and only populates after the first listener fires).

**After.** Same flow. Right sidebar → Manage tab. Sections appear as soon as the team load resolves. If the project's coordinator genuinely doesn't exist (someone hand-deleted it), the `<Empty>` component shows with an Assign button that opens `AssignAgentDialog`. If the right sidebar is open while a fresh project comes through reconcile, the panel now re-fetches when the agents list version bumps, so a sticky-empty state can't happen.

---

## Where to change what (map)

| Want to… | Edit |
|---|---|
| Show a placeholder during `teamLoading` | Replace the leading `null` branch in the three-state render in `ProjectSettingsPanel.tsx` |
| Adjust empty-state copy | `ProjectSettingsPanel.tsx` `<EmptyDescription>` |
| Open a different dialog from the empty-state button | The Assign button's `onClick={() => setAssignOpen(true)}` |
| Re-run the team load on a different IPC event | Add to the `useEffect` deps array |

---

## Out of scope (deferred to later gaps)

- **The same race pattern in `AgentSettingsPanel.tsx` per-agent tab.** Its manage sections similarly gate on `useAgentSettings` returning a non-null slice. Project tab gets fixed first per the user's report.
- **A live reconcile indicator** (banner saying "syncing agents…" while `teamLoading`). Defer.
- **Manual "refresh now" affordance.** Auto-refresh on `agentsVersion` is enough.

---

## Known limitations

1. **First-frame placeholder is silent.** When the panel first mounts and `teamLoading === true`, the manage tab renders `null` (a small empty space at the bottom of the scroll area) before the team load completes. The team load is sub-frame on a healthy local DB, so this is invisible in practice. If the DB read ever slows down (slow disk), the gap becomes a layout shift. Future: render a muted placeholder row.

2. **`loadProjectTeam` doesn't return an `isLoading` field.** It's resolved by the React effect's `teamLoading` flag. If `loadProjectTeam` ever starts taking >100 ms (network disk, slow SSD), the empty-state flicker goes away but the layout-shift becomes more visible. Same fix as (1).

---

## Risk + rollback

| Risk | Likelihood | Mitigation |
|---|---|---|
| Agents-reconcile flood re-fetches `loadProjectTeam` too often | Low | `useAgentsListVersion` is debounced upstream by `agents-fs-watcher.ts` |
| Section renders briefly with defaults before the IPC returns | Medium (acceptable) | Same pattern AgentSettingsPanel exhibited pre-Gap-4; sections tolerate missing fields via `(settings.X ?? {})` |
| Race between two reconciliations triggering a stale `.then` | None | `cancelled` ref protects against late `setTeam` writes |
| `<Empty>` import path incompatible with shadcn version | Low | Verified import path matches `InboxSection` and `AgentSettingsPanel` usage |

**Rollback.** Revert commit `0eae1d2` on `superhive` dev. The gate rolls back to `mergedTeam.coordinator && coordinatorManage.settings ? sections : empty-state` — identical to the gap-4 state. No IPC changes, no schema changes.
