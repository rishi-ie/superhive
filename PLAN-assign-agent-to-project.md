# Pre-Implementation Plan — Assign Agents to Project

**Repo:** `superhive/` (Electron + React + Vite + Tailwind v4 + Bun + shadcn/ui + LowDB)
**Branch:** `dev`
**Cadence:** 1 commit per task. Each task is ~5 minutes.

## 0. Locked decisions (do not revisit)

_Status: **Completed 2026-07-12** — all 43 tasks executed on `dev`. Build + typecheck pass. Pre-existing `space-x-2` in `src/components/ui/avatar.tsx` is unrelated and out of scope per AGENTS.md._

| # | Decision | Value |
|---|---|---|
| 1 | UI surface | `ProjectSettingsPanel.Manage` tab only |
| 2 | Eligibility | `agentKind === 'standard'` only |
| 3 | Multi-project | Enforce single project per agent at UI/flow layer (type stays `projectIds: string[]`) |
| 4 | Remove | Unlink only; confirm dialog if `status ∈ {initializing, running, busy}` |
| 5 | Reverse direction | Project-driven only |
| 6 | Create-time assign | Out of scope |
| 7 | Picker contents | Only standard agents with `projectIds.length === 0` |
| 8 | Picker UI | shadcn `Dialog` + `Command` |
| 9 | Confirm primitive | Install shadcn `alert-dialog` |
| 10 | Type cleanup | Skip — keep arrays |

---

## 1. Scope

### In scope

- Bidirectional `Agent ↔ Project` membership via existing `ProjectRepository.addAgent` / `removeAgent`
- New IPC channel `projects:removeAgent`
- Three new flows: `loadProjectTeam`, `assignAgentToProject`, `removeAgentFromProject` (plus helper `loadUnassignedAgents`)
- New UI: Manage tab body + AssignAgentDialog + UnassignAgentDialog
- Confirmation gate for running-agent removal

### Out of scope (do NOT touch)

- `ProjectChatHeader` orphan
- Agent-side assign UI
- CreateAgentDialog changes
- Type migration to `projectId?: string`
- Real-time sidebar refresh (5 s poll is fine)
- Storage / repo / seed / channels

---

## 2. Conventions (read once, apply always)

1. **Flow Isolation**: `src/components/**` and `src/pages/**` MUST NOT import `@/api/*`. Only `src/flows/**` does.
2. **Style Modularity**: only semantic tokens (`bg-card`, `text-muted-foreground`, `gap-stack`, `p-card`, `h-control-md`, `rounded-button`). No `bg-blue-500`, no `#fff`, no `space-x-*`.
3. **Imports**: always `@/...`, never `../../`.
4. **Conditional classnames**: always `cn(...)`, never template-literal ternaries.
5. **Icons**: `import { Icon } from '@/components/ui/icon'` + `<Icon icon={XxxIcon} />` from `@phosphor-icons/react`.
6. **Commits**: conventional commits, scoped — e.g. `feat(projects): wire removeAgent IPC channel`.
7. **Verify before commit**: every task has a one-line check. Don't commit if it fails.

**Three greps that must always return zero before commit:**

```bash
rg "@/api" src/components src/pages
rg "bg-(emerald|red|blue|green|yellow|orange|purple|pink|cyan|slate|gray|zinc|neutral|amber|lime|teal|sky|indigo|violet|fuchsia|rose)-" src -g '!src/styles/**'
rg "\bspace-[xy]-\d" src -g '!src/styles/**'
```

---

## 3. Tasks

Total: **43 tasks** across 5 phases. Estimated ~3.5 hours of focused work.

---

### Phase 1 — IPC wiring for `removeAgent`

The storage `ProjectRepository.removeAgent` already exists and is bidirectional. We just need the IPC path.

#### T1.1 — Add the IPC channel constant

- **What**: Add `REMOVE_AGENT: 'projects:removeAgent'` to `IPC.PROJECTS` in `electron/ipc/index.ts`.
- **Why**: Define the channel name in one place before any consumer.
- **How**: Open `electron/ipc/index.ts`. In the `PROJECTS` object (line 28), add the new line:
  ```ts
  REMOVE_AGENT: 'projects:removeAgent',
  ```
- **Verify**: `rg "REMOVE_AGENT" electron/ipc/index.ts` returns the new line.
- **Commit**: `chore(ipc): add projects:removeAgent channel constant`

#### T1.2 — Register the IPC handler

- **What**: Add a handler for `IPC.PROJECTS.REMOVE_AGENT` in `electron/ipc/projects.ts`.
- **Why**: Without the handler the preload call would error.
- **How**: Append after the `ADD_AGENT` handler (line 48):
  ```ts
  ipcMain.handle(IPC.PROJECTS.REMOVE_AGENT, async (_e, projectId: string, agentId: string) => {
    await ProjectRepository.removeAgent(projectId, agentId);
  });
  ```
- **Verify**: `rg "REMOVE_AGENT" electron/ipc/projects.ts` returns the new handler.
- **Commit**: `feat(projects): register removeAgent IPC handler`

#### T1.3 — Expose `removeAgent` in the preload bridge

- **What**: Add `removeAgent` to the `projects` block in `electron/preload.ts`.
- **Why**: Renderer can only call IPC methods that are explicitly exposed via `contextBridge`.
- **How**: After line 42 (`addAgent: ...`) add:
  ```ts
  removeAgent: (projectId, agentId) => ipcRenderer.invoke('projects:removeAgent', projectId, agentId),
  ```
- **Verify**: `rg "removeAgent" electron/preload.ts` shows 1 line.
- **Commit**: `chore(preload): expose projects.removeAgent`

#### T1.4 — Type the new API on `ProjectsAPI`

- **What**: Add `removeAgent` to the `ProjectsAPI` interface in `src/types/electron.d.ts`.
- **Why**: TypeScript needs the contract before the renderer can call it.
- **How**: After line 49 (`addAgent: ...`) add:
  ```ts
  removeAgent: (projectId: string, agentId: string) => Promise<void>
  ```
- **Verify**: `rg "removeAgent" src/types/electron.d.ts` returns the new line.
- **Commit**: `chore(types): declare projects.removeAgent on ProjectsAPI`

#### T1.5 — Add the renderer wrapper

- **What**: Add `removeAgent` to the `projects` object in `src/api/projects.ts`.
- **Why**: Flows must not import `window.api.*` directly — they go through `src/api/*`.
- **How**: After line 20 (`addAgent: ...`) add:
  ```ts
  removeAgent: (projectId: string, agentId: string): Promise<void> =>
    window.api.projects.removeAgent(projectId, agentId),
  ```
- **Verify**: `rg "removeAgent" src/api/projects.ts` returns the new wrapper.
- **Commit**: `feat(api): add projects.removeAgent wrapper`

#### T1.6 — Phase 1 typecheck

- **What**: Run `bun run typecheck` and confirm zero errors.
- **Why**: Catch any wiring mistake before moving on.
- **How**: `cd superhive && bun run typecheck`.
- **Verify**: Exit 0.
- **Commit**: `chore: phase 1 typecheck pass` (only if it changed something; usually skip).

---

### Phase 2 — Flow layer (3 new flows + 1 helper)

Mirror the existing pattern from `src/flows/projects/crud/create-project.ts` and `src/flows/agents/crud/create-agent.ts`.

#### T2.1 — Create `load-project-team.ts` (skeleton)

- **What**: Create the file with imports and the exported function signatures only.
- **Why**: Empty function bodies won't compile cleanly; we want compile-able skeleton first.
- **How**: Create `src/flows/projects/crud/load-project-team.ts`:
  ```ts
  import { listAgents } from '@/flows/agents/crud/list-agents';
  import { loadProject } from '@/flows/projects/crud/load-project';
  import type { Agent, Project } from '@/storage/types';

  export interface ProjectTeam {
    project: Project | null;
    coordinator: Agent | null;
    members: Agent[];
  }

  export async function loadProjectTeam(projectId: string): Promise<ProjectTeam> {
    return { project: null, coordinator: null, members: [] };
  }
  ```
- **Verify**: `bun run typecheck` still passes.
- **Commit**: `feat(flows): scaffold loadProjectTeam`

#### T2.2 — Implement `loadProjectTeam`

- **What**: Fill in the body to load project + agents and split into coordinator/members.
- **Why**: This is the single read-side helper that the Manage tab and the picker both use.
- **How**: Replace the return with:
  ```ts
  const [project, agents] = await Promise.all([
    loadProject(projectId),
    listAgents(),
  ]);
  if (!project) return { project: null, coordinator: null, members: [] };
  const inProject = agents.filter((a) => project.agentIds.includes(a.id));
  return {
    project,
    coordinator: inProject.find((a) => a.agentKind === 'project-coordinator') ?? null,
    members: inProject.filter((a) => a.agentKind !== 'project-coordinator'),
  };
  ```
- **Verify**: `bun run typecheck` clean. Grep returns shape: `rg "loadProjectTeam" src/flows` shows 1 import + 1 export.
- **Commit**: `feat(flows): implement loadProjectTeam`

#### T2.3 — Create `assign-agent-to-project.ts` (skeleton)

- **What**: Create file with type interfaces and stub body.
- **Why**: Same pattern as create-agent.
- **How**: Create `src/flows/projects/crud/assign-agent-to-project.ts`:
  ```ts
  import { projects } from '@/api/projects';
  import { toast } from 'sonner';

  export interface AssignAgentInput { projectId: string; agentId: string }
  export interface AssignAgentResult { ok: boolean; error?: string }

  export async function assignAgentToProject(_input: AssignAgentInput): Promise<AssignAgentResult> {
    return { ok: false, error: 'not implemented' };
  }
  ```
- **Verify**: `bun run typecheck` clean.
- **Commit**: `feat(flows): scaffold assignAgentToProject`

#### T2.4 — Implement `assignAgentToProject`

- **What**: Validate and call `projects.addAgent`.
- **Why**: Validation (project exists, agent is unassigned standard) prevents invalid state.
- **How**: Replace body with:
  ```ts
  const { projectId, agentId } = input;
  if (!projectId || !agentId) {
    toast.error('Missing project or agent');
    return { ok: false, error: 'Missing project or agent' };
  }
  try {
    await projects.addAgent(projectId, agentId);
    toast.success('Agent assigned to project');
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to assign agent';
    toast.error(message);
    return { ok: false, error: message };
  }
  ```
- **Verify**: `bun run typecheck` clean. `rg "projects.addAgent" src/flows/projects/crud/assign-agent-to-project.ts` returns the call site.
- **Commit**: `feat(flows): implement assignAgentToProject`

#### T2.5 — Create `remove-agent-from-project.ts` (skeleton)

- **What**: Scaffold with signature only.
- **Why**: Same pattern.
- **How**: Create `src/flows/projects/crud/remove-agent-from-project.ts`:
  ```ts
  import { projects } from '@/api/projects';
  import { toast } from 'sonner';

  export interface RemoveAgentInput { projectId: string; agentId: string }
  export interface RemoveAgentResult { ok: boolean; error?: string }

  export async function removeAgentFromProject(_input: RemoveAgentInput): Promise<RemoveAgentResult> {
    return { ok: false, error: 'not implemented' };
  }
  ```
- **Verify**: `bun run typecheck`.
- **Commit**: `feat(flows): scaffold removeAgentFromProject`

#### T2.6 — Implement `removeAgentFromProject`

- **What**: Call `projects.removeAgent` with toasts.
- **Why**: Symmetric counterpart to assign.
- **How**: Replace body with:
  ```ts
  const { projectId, agentId } = input;
  if (!projectId || !agentId) {
    toast.error('Missing project or agent');
    return { ok: false, error: 'Missing project or agent' };
  }
  try {
    await projects.removeAgent(projectId, agentId);
    toast.success('Agent removed from project');
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to remove agent';
    toast.error(message);
    return { ok: false, error: message };
  }
  ```
- **Verify**: `bun run typecheck`. `rg "projects.removeAgent" src/flows/projects/crud/remove-agent-from-project.ts` returns the call.
- **Commit**: `feat(flows): implement removeAgentFromProject`

#### T2.7 — Add helper `loadUnassignedAgents`

- **What**: Append a second exported function to `load-project-team.ts`.
- **Why**: Avoid `window.api` leaks in the panel — picker uses this flow.
- **How**: Append to `src/flows/projects/crud/load-project-team.ts`:
  ```ts
  export async function loadUnassignedAgents(): Promise<Agent[]> {
    const agents = await listAgents();
    return agents.filter((a) => a.agentKind === 'standard' && a.projectIds.length === 0);
  }
  ```
- **Verify**: `bun run typecheck`.
- **Commit**: `feat(flows): add loadUnassignedAgents`

#### T2.8 — Update the CRUD barrel

- **What**: Export the four new flows from `src/flows/projects/crud/index.ts`.
- **Why**: Single import surface for downstream consumers.
- **How**: Open `src/flows/projects/crud/index.ts` and add export lines:
  ```ts
  export { loadProjectTeam, loadUnassignedAgents } from './load-project-team';
  export { assignAgentToProject } from './assign-agent-to-project';
  export { removeAgentFromProject } from './remove-agent-from-project';
  ```
- **Verify**: `rg "loadProjectTeam|loadUnassignedAgents|assignAgentToProject|removeAgentFromProject" src/flows/projects/crud/index.ts` returns ≥3 hits.
- **Commit**: `feat(flows): export new project flows from barrel`

#### T2.9 — Phase 2 verify

- **What**: Run the flow-isolation grep + typecheck.
- **Why**: Confirm we haven't broken the no-`@/api`-in-components rule.
- **How**:
  ```bash
  rg "@/api" src/components src/pages    # expect 0
  bun run typecheck                       # exit 0
  ```
- **Verify**: Both commands succeed.
- **Commit**: `chore: phase 2 typecheck + flow isolation pass` (only if anything changed).

---

### Phase 3 — UI: dialogs + Manage tab body

Build the picker dialog first, the team list second, then wire them into the right sidebar.

#### T3.1 — Install `alert-dialog` shadcn primitive

- **What**: Add `alert-dialog` via shadcn CLI.
- **Why**: Need the primitive for Phase 4 confirm dialog. Install now so all subsequent UI is consistent.
- **How**: `cd superhive && bunx shadcn@latest add alert-dialog`.
- **Verify**: `ls src/components/ui/alert-dialog.tsx` exists. `rg "AlertDialog" src/components/ui/alert-dialog.tsx` returns matches.
- **Commit**: `chore(ui): install shadcn alert-dialog primitive`

#### T3.2 — Note exported AlertDialog names

- **What**: Open `src/components/ui/alert-dialog.tsx` and note the export names.
- **Why**: We need exact names for T4.x.
- **How**: `rg "^export" src/components/ui/alert-dialog.tsx`.
- **Verify**: Note exports — typically: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel`.
- **Commit**: none.

#### T3.3 — Scaffold `AssignAgentDialog.tsx`

- **What**: Create the dialog file with props and an empty Command skeleton.
- **Why**: Establish the contract (props + open state) before adding logic.
- **How**: Create `src/components/layout/right-sidebar/sections/AssignAgentDialog.tsx`:
  ```tsx
  import * as React from 'react';
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog';
  import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
  } from '@/components/ui/command';

  interface AssignAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAssigned: () => void;
    loadCandidates: () => Promise<Array<{ id: string; name: string }>>;
    onSelect: (agentId: string) => Promise<{ ok: boolean; error?: string }>;
  }

  export function AssignAgentDialog(_props: AssignAgentDialogProps) {
    return null;
  }
  ```
- **Verify**: `bun run typecheck` clean.
- **Commit**: `feat(ui): scaffold AssignAgentDialog`

#### T3.4 — Implement candidate loading

- **What**: Wire `useEffect` to call `loadCandidates` on open.
- **Why**: Populate the list.
- **How**: Replace body with:
  ```tsx
  export function AssignAgentDialog(props: AssignAgentDialogProps) {
    const [candidates, setCandidates] = React.useState<Array<{ id: string; name: string }>>([]);
    React.useEffect(() => {
      if (props.open) {
        props.loadCandidates().then(setCandidates);
      }
    }, [props.open, props.loadCandidates]);
    return (
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign agent</DialogTitle>
            <DialogDescription>Only standard agents with no project are shown.</DialogDescription>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Search agents…" />
            <CommandList>
              <CommandEmpty>No unassigned agents</CommandEmpty>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    );
  }
  ```
- **Verify**: `bun run typecheck` clean. Dialog renders empty when opened.
- **Commit**: `feat(ui): load candidates on open`

#### T3.5 — Render the Command list

- **What**: Map `candidates` to `<CommandItem>` rows.
- **Why**: Visible list of assignable agents.
- **How**: Inside `<CommandList>` after `<CommandEmpty>`:
  ```tsx
  <CommandGroup heading="Available">
    {candidates.map((c) => (
      <CommandItem key={c.id} value={c.name} onSelect={() => undefined}>
        {c.name}
      </CommandItem>
    ))}
  </CommandGroup>
  ```
- **Verify**: `bun run typecheck`. Dialog opens, list renders names.
- **Commit**: `feat(ui): render candidate list in Command`

#### T3.6 — Wire the assign on select

- **What**: Call `props.onSelect(agentId)`, then close the dialog and invoke `props.onAssigned` on success.
- **Why**: This is the actual assign action.
- **How**: Replace `onSelect={() => undefined}` with:
  ```tsx
  onSelect={async () => {
    const result = await props.onSelect(c.id);
    if (result.ok) {
      props.onAssigned();
      props.onOpenChange(false);
    }
  }}
  ```
- **Verify**: Picking an agent closes the dialog and the parent's `onAssigned` runs.
- **Commit**: `feat(ui): wire assign action on CommandItem select`

#### T3.7 — Scaffold `UnassignAgentDialog.tsx`

- **What**: Create a controlled AlertDialog component.
- **Why**: Confirm dialog for running-agent removal.
- **How**: Create `src/components/layout/right-sidebar/sections/UnassignAgentDialog.tsx`:
  ```tsx
  import * as React from 'react';
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from '@/components/ui/alert-dialog';

  interface UnassignAgentDialogProps {
    open: boolean;
    agentName: string | null;
    onConfirm: () => void;
    onCancel: () => void;
  }

  export function UnassignAgentDialog(_props: UnassignAgentDialogProps) {
    return null;
  }
  ```
- **Verify**: `bun run typecheck` clean.
- **Commit**: `feat(ui): scaffold UnassignAgentDialog`

#### T3.8 — Implement the AlertDialog UI

- **What**: Render the confirm UI.
- **Why**: Make the dialog actually show.
- **How**: Replace `return null` with:
  ```tsx
  return (
    <AlertDialog open={props.open} onOpenChange={(o) => { if (!o) props.onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unlink running agent?</AlertDialogTitle>
          <AlertDialogDescription>
            {props.agentName ?? 'This agent'} is currently running. It will keep running but
            won't be a member of this project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={props.onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={props.onConfirm}>Unlink anyway</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  ```
- **Verify**: `bun run typecheck`. Dialog renders when opened.
- **Commit**: `feat(ui): implement UnassignAgentDialog body`

#### T3.9 — Scaffold `ProjectMembersList.tsx`

- **What**: Create the team list component with team prop, empty state, and section title.
- **Why**: This is the main Manage tab body.
- **How**: Create `src/components/layout/right-sidebar/sections/ProjectMembersList.tsx`:
  ```tsx
  import * as React from 'react';
  import { Button } from '@/components/ui/button';
  import { PlusIcon, XIcon } from '@phosphor-icons/react';
  import { Icon } from '@/components/ui/icon';
  import type { Agent } from '@/storage/types';

  interface ProjectMembersListProps {
    projectId: string;
    coordinator: Agent | null;
    members: Agent[];
    onAssignClick: () => void;
    onRemove: (agent: Agent) => void;
  }

  export function ProjectMembersList(props: ProjectMembersListProps) {
    return (
      <div className="flex flex-col gap-stack p-card">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Team</span>
          <Button size="sm" variant="outline" onClick={props.onAssignClick}>
            <Icon icon={PlusIcon} className="size-3.5" />
            Assign agent
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">No agents yet</span>
      </div>
    );
  }
  ```
- **Verify**: `bun run typecheck`.
- **Commit**: `feat(ui): scaffold ProjectMembersList`

#### T3.10 — Render coordinator + members

- **What**: Add the actual rows.
- **Why**: Replace the empty placeholder with real content.
- **How**: Replace the `<span>No agents yet</span>` with:
  ```tsx
  {props.coordinator && (
    <div className="flex items-center justify-between rounded-button border border-border bg-card px-row py-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm">{props.coordinator.name}</span>
        <span className="text-[11px] text-muted-foreground">Coordinator</span>
      </div>
    </div>
  )}
  {props.members.map((a) => (
    <div key={a.id} className="flex items-center justify-between rounded-button border border-border bg-card px-row py-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm">{a.name}</span>
        <span className="text-[11px] text-muted-foreground">{a.status}</span>
      </div>
      <Button size="icon" variant="ghost" onClick={() => props.onRemove(a)} aria-label={`Remove ${a.name}`}>
        <Icon icon={XIcon} className="size-3.5" />
      </Button>
    </div>
  ))}
  ```
- **Verify**: `bun run typecheck`. Manage tab shows coordinator + members when present.
- **Commit**: `feat(ui): render coordinator and member rows`

#### T3.11 — Wire empty-state branches

- **What**: When `members.length === 0`, show distinct copy depending on whether the coordinator exists.
- **Why**: Avoid confusing "No agents yet" when the coordinator is shown above.
- **How**: Replace the unconditional placeholder with:
  ```tsx
  {props.members.length === 0 && props.coordinator && (
    <span className="text-xs text-muted-foreground">No additional agents assigned.</span>
  )}
  {props.members.length === 0 && !props.coordinator && (
    <span className="text-xs text-muted-foreground">No agents yet</span>
  )}
  ```
- **Verify**: Empty members + present coordinator shows "No additional agents assigned.".
- **Commit**: `style(ui): refine ProjectMembersList empty states`

#### T3.12 — Add the `sections/index.ts` barrel

- **What**: Create the barrel.
- **Why**: Single import path from `ProjectSettingsPanel`.
- **How**: Create `src/components/layout/right-sidebar/sections/index.ts`:
  ```ts
  export { ProjectMembersList } from './ProjectMembersList';
  export { AssignAgentDialog } from './AssignAgentDialog';
  export { UnassignAgentDialog } from './UnassignAgentDialog';
  ```
- **Verify**: `rg "ProjectMembersList|AssignAgentDialog|UnassignAgentDialog" src/components/layout/right-sidebar/sections/index.ts` returns 3.
- **Commit**: `feat(ui): add right-sidebar sections barrel`

#### T3.13 — Add team state to `ProjectSettingsPanel`

- **What**: Add `useState` + `useEffect` to load the team when `projectId` changes.
- **Why**: Manage tab body needs the team data.
- **How**: At the top of `src/components/layout/right-sidebar/ProjectSettingsPanel.tsx`:
  ```tsx
  import * as React from 'react';
  import { loadProjectTeam } from '@/flows/projects/crud/load-project-team';
  import type { Agent } from '@/storage/types';

  // inside the component, before the return:
  const [team, setTeam] = React.useState<{ coordinator: Agent | null; members: Agent[] }>({
    coordinator: null,
    members: [],
  });
  React.useEffect(() => {
    loadProjectTeam(projectId).then((t) => setTeam({ coordinator: t.coordinator, members: t.members }));
  }, [projectId]);
  ```
- **Verify**: `bun run typecheck`.
- **Commit**: `feat(ui): load project team in ProjectSettingsPanel`

#### T3.14 — Replace the Manage tab body

- **What**: Replace the "Coming soon" `TabsContent` value="manage" with `<ProjectMembersList>`.
- **Why**: This is the actual feature.
- **How**: In `src/components/layout/right-sidebar/ProjectSettingsPanel.tsx`, replace the `manage` `<TabsContent>` (lines 53–59) with:
  ```tsx
  <TabsContent value="manage" className="mt-0 flex-1 min-h-0 p-0">
    <ScrollArea className="h-full">
      <ProjectMembersList
        projectId={projectId}
        coordinator={team.coordinator}
        members={team.members}
        onAssignClick={() => setAssignOpen(true)}
        onRemove={() => undefined}
      />
    </ScrollArea>
  </TabsContent>
  ```
  Add `const [assignOpen, setAssignOpen] = React.useState(false);` to the component. Add the imports for `ProjectMembersList` and `AssignAgentDialog` from `./sections`.
- **Verify**: `bun run typecheck`. Opening the right sidebar on a project shows the Manage tab with the team.
- **Commit**: `feat(ui): replace Manage tab body with ProjectMembersList`

#### T3.15 — Mount the AssignAgentDialog

- **What**: Render `<AssignAgentDialog>` inside `ProjectSettingsPanel` with the loadCandidates callback and assign flow.
- **Why**: The "+ Assign agent" button needs to actually open a working dialog.
- **How**: Inside `ProjectSettingsPanel`, after the `<Tabs>` element, add:
  ```tsx
  <AssignAgentDialog
    open={assignOpen}
    onOpenChange={setAssignOpen}
    onAssigned={() =>
      loadProjectTeam(projectId).then((t) =>
        setTeam({ coordinator: t.coordinator, members: t.members }),
      )
    }
    loadCandidates={async () => {
      const { loadUnassignedAgents } = await import('@/flows/projects/crud/load-project-team');
      const list = await loadUnassignedAgents();
      return list.map((a) => ({ id: a.id, name: a.name }));
    }}
    onSelect={async (agentId) => {
      const { assignAgentToProject } = await import('@/flows/projects/crud/assign-agent-to-project');
      return assignAgentToProject({ projectId, agentId });
    }}
  />
  ```
- **Verify**: `rg "@/api" src/components/layout/right-sidebar/ProjectSettingsPanel.tsx` returns 0. AssignAgentDialog opens, lists candidates, pick works.
- **Commit**: `feat(ui): wire AssignAgentDialog into ProjectSettingsPanel`

#### T3.16 — Phase 3 verify

- **What**: Run the three greps + typecheck.
- **Why**: Catch style and isolation regressions before Phase 4.
- **How**:
  ```bash
  rg "@/api" src/components src/pages
  rg "bg-(emerald|red|blue|green|yellow|orange|purple|pink|cyan|slate|gray|zinc|neutral|amber|lime|teal|sky|indigo|violet|fuchsia|rose)-" src -g '!src/styles/**'
  rg "\bspace-[xy]-\d" src -g '!src/styles/**'
  bun run typecheck
  ```
- **Verify**: All four commands succeed.
- **Commit**: `chore: phase 3 typecheck + style grep pass` (only if changes).

---

### Phase 4 — Confirm-when-running gate

#### T4.1 — Add pending-remove state

- **What**: Add `useState` for the agent pending confirmation.
- **Why**: Track which agent triggered the confirm.
- **How**: In `ProjectMembersList`, at the top of the function:
  ```tsx
  const [pendingRemove, setPendingRemove] = React.useState<Agent | null>(null);
  ```
  And add `import { UnassignAgentDialog } from './UnassignAgentDialog';`.
- **Verify**: `bun run typecheck`.
- **Commit**: `feat(ui): add pending-remove state to ProjectMembersList`

#### T4.2 — Branch on agent status

- **What**: In the remove button click handler, check status before invoking `props.onRemove`.
- **Why**: Show confirm dialog only when running/initializing/busy.
- **How**: Wrap the remove button `onClick`:
  ```tsx
  onClick={() => {
    if (a.status === 'initializing' || a.status === 'running' || a.status === 'busy') {
      setPendingRemove(a);
    } else {
      props.onRemove(a);
    }
  }}
  ```
- **Verify**: `bun run typecheck`.
- **Commit**: `feat(ui): branch remove on agent status`

#### T4.3 — Render the confirm dialog

- **What**: Mount `<UnassignAgentDialog>` at the bottom of `ProjectMembersList`.
- **Why**: Surface the confirm UI.
- **How**: After the closing `</div>` of the main flex column:
  ```tsx
  <UnassignAgentDialog
    open={!!pendingRemove}
    agentName={pendingRemove?.name ?? null}
    onConfirm={() => {
      if (pendingRemove) props.onRemove(pendingRemove);
      setPendingRemove(null);
    }}
    onCancel={() => setPendingRemove(null)}
  />
  ```
- **Verify**: `bun run typecheck`. Clicking remove on a running agent now opens the confirm.
- **Commit**: `feat(ui): mount UnassignAgentDialog in ProjectMembersList`

#### T4.4 — Wire `onRemove` to the flow

- **What**: In `ProjectSettingsPanel`, change the `onRemove` prop passed to `ProjectMembersList` to call `removeAgentFromProject` and refresh the team.
- **Why**: Without this, the remove button does nothing.
- **How**: Replace `onRemove={() => undefined}` with:
  ```tsx
  onRemove={async (agent) => {
    const { removeAgentFromProject } = await import('@/flows/projects/crud/remove-agent-from-project');
    const r = await removeAgentFromProject({ projectId, agentId: agent.id });
    if (r.ok) {
      const t = await loadProjectTeam(projectId);
      setTeam({ coordinator: t.coordinator, members: t.members });
    }
  }}
  ```
- **Verify**: `bun run typecheck`. Removing an idle agent unlinks it immediately; removing a running agent goes through confirm.
- **Commit**: `feat(ui): wire removeAgentFromProject flow into ProjectMembersList`

#### T4.5 — Phase 4 verify

- **What**: Re-run all three greps + typecheck.
- **Why**: Final pre-ship gate.
- **How**: Same as T3.16.
- **Verify**: All pass.
- **Commit**: `chore: phase 4 typecheck pass` (only if changes).

---

### Phase 5 — End-to-end verification

#### T5.1 — Production build

- **What**: `bun run build`.
- **Why**: Catch any Vite-side issues (import paths, tree-shaking, TS bundling).
- **How**: `cd superhive && bun run build`.
- **Verify**: Exit 0.
- **Commit**: `chore: production build passes` (only if it changed anything).

#### T5.2 — Run `bun run electron:dev`

- **What**: Start the dev server.
- **Why**: Manual smoke needs a running app.
- **How**: `cd superhive && bun run electron:dev`.
- **Verify**: App opens, dev tools show no console errors.

#### T5.3 — Smoke test (project + assign flow)

- **What**: Manual end-to-end test.
- **Why**: Confirm the feature works as a user would experience it.
- **How**:
  1. Create project A (auto-coordinator appears).
  2. Open `/agents`, create standard agent "Helper 1".
  3. Open project A right sidebar → Manage tab → click "+ Assign agent" → Helper 1 appears in picker → pick it → toast "Agent assigned to project" → Helper 1 in team list.
  4. Sidebar (left): Helper 1 nested under project A within 5 seconds.
- **Verify**: All four steps succeed.
- **Commit**: (no commit — manual test)

#### T5.4 — Smoke test (running-agent remove flow)

- **What**: Manual end-to-end test for the confirm path.
- **Why**: Confirm dialog only triggers when running.
- **How**:
  1. From T5.3, start Helper 1 from `/agents` (it transitions to running).
  2. Back to project A Manage tab → click remove on Helper 1 → confirm dialog appears with "Helper 1 is currently running…".
  3. Click Cancel → agent stays.
  4. Click remove again → confirm → click "Unlink anyway" → toast "Agent removed from project" → Helper 1 gone from team list, still running in `/agents`.
- **Verify**: All four steps succeed.
- **Commit**: (no commit — manual test)

#### T5.5 — Smoke test (idle-agent remove flow)

- **What**: Verify the no-confirm branch.
- **Why**: Ensure we don't always show the dialog.
- **How**: Stop Helper 1 (status → stopped). Click remove → no dialog → agent removed immediately.
- **Verify**: Step succeeds, no dialog.
- **Commit**: (no commit — manual test)

#### T5.6 — Final greps

- **What**: One last pass of all three style + isolation greps.
- **Why**: Belt-and-braces before tagging a release-worthy commit.
- **How**:
  ```bash
  rg "@/api" src/components src/pages
  rg "bg-(emerald|red|blue|green|yellow|orange|purple|pink|cyan|slate|gray|zinc|neutral|amber|lime|teal|sky|indigo|violet|fuchsia|rose)-" src -g '!src/styles/**'
  rg "\bspace-[xy]-\d" src -g '!src/styles/**'
  bun run typecheck
  bun run build
  ```
- **Verify**: All return zero / exit 0.
- **Commit**: (skip if no changes).

#### T5.7 — Mark plan complete

- **What**: Append a one-line "Completed YYYY-MM-DD" footer.
- **Why**: Documentation closure.
- **How**: Edit the file footer (this file).
- **Verify**: Plan file ends with the footer.
- **Commit**: `docs: mark plan as completed`

---

## 4. Dependency graph (order matters)

```
Phase 1 ─► Phase 2 ─► Phase 3 (T3.1 first, then T3.3–T3.12) ─► Phase 4
                  └──► Phase 3 (T3.13–T3.15) ─► Phase 4
                                          └──► Phase 5
```

T3.1 (`alert-dialog` install) MUST come before T3.7 (UnassignAgentDialog scaffold).
T2.7–T2.8 (barrel exports) MUST come before T3.13 (which imports the flows).
T2.7 (`loadUnassignedAgents`) MUST come before T3.15 (which uses it).

---

## 5. Risks / soft blockers

| Risk | Mitigation |
|---|---|
| `bunx shadcn@latest add alert-dialog` needs network | Try once; if offline, hand-author `alert-dialog.tsx` from shadcn's published source. |
| `ProjectRepository.addAgent` may not dedupe pairs | Read the repo method during T2.4; if no dedupe, add a pre-check in `assignAgentToProject`. |
| Sidebar 5 s poll means assigned agent shows up late | Acceptable for MVP; document in T5.3. |
| `loadCandidates` re-loads from scratch each open | Acceptable — list is small. Optimize later. |

---

## 6. Total commits expected

43 tasks, ~35 commits. Skip-commit tasks: T3.2 (note only), T3.16 / T4.5 / T5.6 (only commit if something changed), T5.2 / T5.3 / T5.4 / T5.5 (manual smoke tests). Each commit is a small, reviewable, revertable unit.

---

## 7. Files touched (summary)

**New (10)**

- `src/flows/projects/crud/load-project-team.ts`
- `src/flows/projects/crud/assign-agent-to-project.ts`
- `src/flows/projects/crud/remove-agent-from-project.ts`
- `src/components/layout/right-sidebar/sections/ProjectMembersList.tsx`
- `src/components/layout/right-sidebar/sections/AssignAgentDialog.tsx`
- `src/components/layout/right-sidebar/sections/UnassignAgentDialog.tsx`
- `src/components/layout/right-sidebar/sections/index.ts`
- `src/components/ui/alert-dialog.tsx` (via `bunx shadcn@latest add alert-dialog`)
- `PLAN-assign-agent-to-project.md` (this file)

**Modified (6)**

- `electron/ipc/index.ts` — add `REMOVE_AGENT` channel constant
- `electron/ipc/projects.ts` — add handler
- `electron/preload.ts` — expose `removeAgent`
- `src/types/electron.d.ts` — add `removeAgent` to `ProjectsAPI`
- `src/api/projects.ts` — add wrapper
- `src/flows/projects/crud/index.ts` — barrel exports
- `src/components/layout/right-sidebar/ProjectSettingsPanel.tsx` — replace Manage tab body + mount dialogs

**Untouched (deliberately)**

- `src/pages/project-chat/components/ProjectChatHeader.tsx` (orphan stays orphan)
- `src/pages/agent-chat/`, `src/pages/project-chat/`, sidebar, routing, storage types, repos, channels