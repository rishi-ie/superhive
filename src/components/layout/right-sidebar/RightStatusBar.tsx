import * as React from "react";
import { useMatch } from "react-router-dom";
import { loadProjectTeam } from "@/flows/projects/crud/load-project-team";
import { useTasksByProject } from "@/flows/tasks/runtime/use-tasks-by-project";
import { useProjectStaff } from "@/flows/projects/runtime/use-project-staff";
import { useAllAgentStatuses } from "@/flows/agents/runtime/use-all-agent-statuses";
import { useAgentInbox, useAgentOverview } from "@/flows/agents/settings";
import { useProjectExecution } from "@/flows/orchestration";
import { selectProjectProgress } from "@/orchestration/application";
import {
  projectStatusSections,
  type ProjectStatusViewModel,
} from "@/flows/orchestration/status-sections";
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
    { total: 0, todo: 0, running: 0, waiting: 0, reviewing: 0, blocked: 0, completed: 0, cancelled: 0 },
  );
}

function workerLabel(_worker: Agent, state: AgentLiveState | undefined, work: string | undefined): string {
  if (work) return work;
  if (state?.status === "waiting") return "Waiting for coordinator";
  if (state?.status === "busy") return "Working";
  return "Available";
}

function ProjectWorkboard({ projectId }: { projectId: string }) {
  const [team, setTeam] = React.useState<ProjectTeamState>({ project: null, coordinator: null });
  const tasks = useTasksByProject(projectId);
  const execution = useProjectExecution(projectId);

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
  const progress = execution.snapshot
    ? selectProjectProgress(execution.snapshot)
    : {
        total: counts.total,
        completed: counts.completed,
        active: counts.running,
        reviewing: counts.reviewing,
        waiting: counts.waiting,
        blocked: counts.blocked,
        queued: counts.todo,
      };
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
    ...(execution.snapshot?.unresolvedQuestionIds ?? []).map((id) => ({
      id: `question:${id}`,
      label: "An agent question needs a response",
    })),
    ...staff.filter((worker) => worker.lastError).map((worker) => ({ id: `error:${worker.id}`, label: `${worker.name} needs attention` })),
  ];
  const workersById = new Map(staff.map((worker) => [worker.id, worker]));
  const activeLoops = (execution.snapshot?.activeIterationIds ?? [])
    .map((id) => execution.snapshot?.iterations[id])
    .filter((iteration): iteration is NonNullable<typeof iteration> => Boolean(iteration))
    .map((iteration) => ({
      id: iteration.id,
      workerName: workersById.get(iteration.workerAgentId)?.name ?? iteration.workerAgentId,
      status: iteration.status.replaceAll("_", " "),
      activity: execution.snapshot?.workers[iteration.workerAgentId]?.activity?.summary ?? "Iteration in progress",
    }));
  const executionLabel = execution.snapshot?.state.replaceAll("_", " ") ?? "planning";
  const viewModel: ProjectStatusViewModel = {
    projectName: team.project?.name ?? "Project",
    executionLabel,
    planVersion: execution.snapshot?.activePlanVersion,
    activity: execution.snapshot?.projectAgentActivity?.summary
      ?? currentSummary
      ?? (execution.loading ? "Loading project activity" : "Waiting for project activity"),
    progress,
    activeLoops,
    workers: staff.map((worker) => {
      const projected = execution.snapshot?.workers[worker.id];
      const live = liveStates.get(worker.id);
      return {
        id: worker.id,
        name: worker.name,
        label: projected?.activity?.summary
          ?? (projected?.availability === "awaiting_review" ? "Result awaiting review" : undefined)
          ?? workerLabel(worker, live, workByAgent.get(worker.id)),
        working: projected?.availability === "working"
          || live?.status === "busy",
        error: Boolean(worker.lastError || projected?.availability === "error"),
      };
    }),
    attention,
  };

  return (
    <div className="flex flex-col gap-5">
      {projectStatusSections.list().map(({ id, Component }) => (
        <Component key={id} viewModel={viewModel} />
      ))}
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
        className={`absolute right-3 top-14 flex max-h-[calc(100vh-4.5rem)] w-[304px] flex-col overflow-hidden rounded-3xl bg-sidebar-bg shadow-xl shadow-black/15 will-change-[opacity,transform] transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
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
