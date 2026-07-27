import * as React from "react";
import { useMatch } from "react-router-dom";
import { CircleIcon, ClockIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Icon } from "@/components/ui/icon";
import { loadProjectTeam } from "@/flows/projects/crud/load-project-team";
import { useTasksByProject } from "@/flows/tasks/runtime/use-tasks-by-project";
import { useProjectStaff } from "@/flows/projects/runtime/use-project-staff";
import { useAllAgentStatuses } from "@/flows/agents/runtime/use-all-agent-statuses";
import { useAgentInbox, useAgentOverview } from "@/flows/agents/settings";
import type { Agent, Project, Task } from "@/storage/types";
import type { AgentLiveState } from "@/models/agent";

interface RightStatusBarProps {
  open: boolean;
  rightOffset: number;
  isPopover: boolean;
  onDismiss?: () => void;
}

interface ProjectTeamState {
  project: Project | null;
  coordinator: Agent | null;
}

type OverviewTeamMember = { id?: unknown; work?: unknown };

function taskCounts(tasks: Task[]) {
  return tasks.reduce(
    (counts, task) => {
      counts.total += 1;
      counts[task.status] += 1;
      return counts;
    },
    { total: 0, todo: 0, running: 0, blocked: 0, completed: 0, cancelled: 0 },
  );
}

function workerLabel(worker: Agent, state: AgentLiveState | undefined, work: string | undefined): string {
  if (work) return work;
  if (state?.status === "waiting") return "Waiting for coordinator";
  if (state?.status === "busy" || state?.status === "active") return "Working";
  return worker.role ?? "Available";
}

function ProjectWorkboard({ projectId }: { projectId: string }) {
  const [team, setTeam] = React.useState<ProjectTeamState>({ project: null, coordinator: null });
  const tasks = useTasksByProject(projectId);

  React.useEffect(() => {
    let cancelled = false;
    void loadProjectTeam(projectId).then((next) => {
      if (!cancelled) setTeam({ project: next.project, coordinator: next.coordinator });
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const { staff } = useProjectStaff(projectId, team.coordinator?.id ?? null);
  const agentIds = React.useMemo(() => staff.map((worker) => worker.id), [staff]);
  const liveStates = useAllAgentStatuses(agentIds, agentIds.length > 0);
  const overview = useAgentOverview(team.coordinator?.id ?? null);
  const inbox = useAgentInbox(team.coordinator?.id ?? null);

  const counts = taskCounts(tasks);
  const pendingInbox = inbox.items.filter((item) => item.status === "pending");
  const workByAgent = React.useMemo(() => {
    const members = (overview.settings as { team?: unknown } | null)?.team;
    if (!Array.isArray(members)) return new Map<string, string>();
    return new Map(
      members
        .filter((member): member is OverviewTeamMember => Boolean(member) && typeof member === "object")
        .filter((member) => typeof member.id === "string" && typeof member.work === "string")
        .map((member) => [member.id as string, member.work as string]),
    );
  }, [overview.settings]);
  const current = (overview.settings as { current?: { summary?: unknown } } | null)?.current;
  const currentSummary = typeof current?.summary === "string" ? current.summary : null;
  const attention = [
    ...pendingInbox.map((item) => ({ id: `inbox:${item.id}`, label: item.message })),
    ...tasks.filter((task) => task.status === "blocked").map((task) => ({ id: `task:${task.id}`, label: task.blockerReason ?? `${task.title} is blocked` })),
    ...staff.filter((worker) => worker.lastError).map((worker) => ({ id: `error:${worker.id}`, label: `${worker.name} needs attention` })),
  ];
  const progress = counts.total === 0 ? 0 : Math.round((counts.completed / counts.total) * 100);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-1">
        <p className="text-sm font-medium text-sidebar-foreground">{team.project?.name ?? "Project"}</p>
        <p className="text-xs text-muted-foreground">{currentSummary ?? "Waiting for project activity"}</p>
      </section>

      <section className="flex flex-col gap-2 border-t border-sidebar-border/70 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Plan progress</h2>
          <span className="text-xs text-muted-foreground">{counts.completed} / {counts.total}</span>
        </div>
        <div aria-label={`${progress}% of project tasks complete`} className="h-1.5 overflow-hidden rounded-full bg-sidebar-accent">
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          {counts.running} active · {counts.todo} queued · {counts.blocked} blocked
        </p>
      </section>

      <section className="flex flex-col gap-2 border-t border-sidebar-border/70 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Worker hive</h2>
          <span className="text-xs text-muted-foreground">{staff.length}</span>
        </div>
        {staff.length === 0 ? (
          <p className="text-xs text-muted-foreground">No workers assigned yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {staff.map((worker) => {
              const state = liveStates.get(worker.id);
              const isWorking = state?.status === "active" || state?.status === "busy";
              const icon = worker.lastError ? WarningCircleIcon : isWorking ? ClockIcon : CircleIcon;
              return (
                <div key={worker.id} className="flex items-start gap-2">
                  <Icon icon={icon} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-sidebar-foreground">{worker.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{workerLabel(worker, state, workByAgent.get(worker.id))}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2 border-t border-sidebar-border/70 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Needs attention</h2>
          <span className="text-xs text-muted-foreground">{attention.length}</span>
        </div>
        {attention.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing needs you right now.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {attention.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <Icon icon={WarningCircleIcon} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-sidebar-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GenericStatusPanel() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-sidebar-foreground">Status</p>
      <p className="text-xs text-muted-foreground">Open a project to see its plan, workers, and attention items.</p>
    </div>
  );
}

export function RightStatusBar({ open, rightOffset, isPopover, onDismiss }: RightStatusBarProps) {
  const projectMatch = useMatch("/projects/:projectId");
  const projectId = projectMatch?.params.projectId;

  React.useEffect(() => {
    if (!open || !isPopover || !onDismiss) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPopover, onDismiss, open]);

  return (
    <div
      aria-hidden={!open}
      className={`absolute inset-y-0 left-0 z-[50] transition-[right] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        open && isPopover ? "pointer-events-auto" : "pointer-events-none"
      }`}
      style={{ right: rightOffset }}
      onMouseDown={(event) => {
        if (isPopover && event.target === event.currentTarget) onDismiss?.();
      }}
    >
      <aside
        aria-label="Project status panel"
        role="dialog"
        className={`absolute right-3 top-14 flex max-h-[calc(100vh-4.5rem)] w-[304px] flex-col overflow-hidden rounded-3xl border border-sidebar-border bg-sidebar-bg shadow-xl shadow-black/15 will-change-[opacity,transform] transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "pointer-events-auto translate-x-0 opacity-100 delay-50" : "translate-x-2 opacity-0"
        }`}
      >
        <div className="overflow-y-auto p-5">
          {projectId ? <ProjectWorkboard projectId={projectId} /> : <GenericStatusPanel />}
        </div>
      </aside>
    </div>
  );
}
