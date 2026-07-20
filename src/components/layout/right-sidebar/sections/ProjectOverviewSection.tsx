import type { Agent, Project } from "@/storage/types";
import { AgentStatusBadge } from "@/components/common";
import { Accordion } from "../primitives";

export interface ProjectOverviewSectionData {
  project: Project | null;
  coordinator: Agent | null;
  members: Agent[];
}

interface ProjectOverviewSectionProps {
  data: ProjectOverviewSectionData;
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

export function ProjectOverviewSection({ data }: ProjectOverviewSectionProps) {
  const { project, coordinator, members } = data;
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
        {project.description && (
          <span className="text-sm text-muted-foreground">
            {project.description}
          </span>
        )}
        <span className="mt-gap-tight text-xs text-muted-foreground/60">
          {project.localPath ?? "No path configured"}
        </span>
      </div>

      <div className="flex flex-col gap-gap-tight rounded-button border border-border bg-card px-row py-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Coordinator
          </span>
          {coordinator && (
            <AgentStatusBadge
              status={coordinator.status}
              error={Boolean(coordinator.lastError)}
              compact
            />
          )}
        </div>
        <span className="truncate text-sm">
          {coordinator?.name ?? "Not created"}
        </span>
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

      <Accordion
        title="Active tasks"
        badge={0}
        defaultOpen={false}
        emptyText="No tasks yet — appears once work is planned"
      />

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
