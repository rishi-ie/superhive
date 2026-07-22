import type { Task } from "@/storage/types";
import { Accordion } from "../primitives";
import { useTasksByProject } from "@/flows/tasks/runtime/use-tasks-by-project";
import { cn } from "@/lib/utils";
import type { ProjectOverviewSectionData } from "@/models/component";

interface ProjectOverviewSectionProps {
  data: ProjectOverviewSectionData;
}

// Cap matches the truth-side write gate (`update_project_description`
// rejects strings longer than this). Display layer just truncates so the
// right sidebar stays scannable when the coordinator writes a wall of text.
const DESCRIPTION_DISPLAY_MAX_CHARS = 280;
const DESCRIPTION_FALLBACK_TEXT =
  "Interact more with the project agent to set a description.";

const STATUS_COLOR: Record<Task["status"], string> = {
  running: "text-foreground",
  todo: "text-muted-foreground",
  blocked: "text-warning",
  completed: "text-muted-foreground/60",
  cancelled: "text-muted-foreground/40 line-through",
};

function TaskRow({ task }: { task: Task }) {
  return (
    <div className={cn("flex items-center gap-2 py-1", STATUS_COLOR[task.status])}>
      <span className="text-sm">{task.title}</span>
      <span className="text-[10px] uppercase tracking-wide">{task.status}</span>
    </div>
  );
}

function formatDate(ms: number | undefined): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

// Hard-clamp the rendered description to the truth-side write cap. Anything
// past the cap gets an ellipsis so the overview line stays scannable; the
// underlying truth file still holds the full string.
function truncateForDisplay(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1).trimEnd()}…`;
}

function ActiveTasksAccordion({ projectId }: { projectId: string }) {
  const tasks = useTasksByProject(projectId);
  const activeCount = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled",
  ).length;
  return (
    <Accordion
      title="Active tasks"
      badge={activeCount}
      defaultOpen
      emptyText="No tasks yet — ask the coordinator to plan"
    >
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} />
      ))}
    </Accordion>
  );
}

export function ProjectOverviewSection({ data }: ProjectOverviewSectionProps) {
  const { project, members, coordinatorProjectDescription } = data;
  if (!project) {
    return (
      <div className="flex flex-col gap-stack py-button-y">
        <span className="text-sm font-semibold text-foreground">
          Project Overview
        </span>
        <span className="text-xs text-muted-foreground">
          Project not found.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-stack py-button-y">
      <div className="flex flex-col gap-0.5">
        <span className="text-lg font-semibold text-foreground/80">
          {project.name}
        </span>
        {coordinatorProjectDescription ? (
          <span className="text-xs text-muted-foreground line-clamp-2">
            {truncateForDisplay(
              coordinatorProjectDescription,
              DESCRIPTION_DISPLAY_MAX_CHARS,
            )}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/70">
            {DESCRIPTION_FALLBACK_TEXT}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-gap-tight rounded-button border border-border bg-card px-row py-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Specialists
          </span>
          <span className="text-xs text-muted-foreground">
            {members.length}
          </span>
        </div>
        <span className="truncate text-sm">
          {members.length === 0
            ? "No specialists assigned"
            : members.map((m) => m.name).join(", ")}
        </span>
      </div>

      <ActiveTasksAccordion projectId={project.id} />

      <Accordion
        title="Recent activity"
        badge={0}
        defaultOpen={false}
        emptyText="No activity yet"
      />

      <Accordion
        title="Project details"
        defaultOpen={false}
      >
        <div className="flex flex-col gap-gap-tight text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Created</span>
            <span className="text-foreground/80">{formatDate(project.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Updated</span>
            <span className="text-foreground/80">{formatDate(project.updatedAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Project ID</span>
            <span className="font-mono text-[10px] text-foreground/80">
              {project.id}
            </span>
          </div>
        </div>
      </Accordion>
    </div>
  );
}
