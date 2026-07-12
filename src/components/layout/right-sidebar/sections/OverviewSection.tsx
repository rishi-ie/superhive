import { Link } from "react-router-dom";
import type { Project } from "@/storage/types";
import {
  Accordion,
  ActivityRow,
  ChecklistRow,
  SessionRow,
  type ActivityType,
} from "../primitives";

export interface OverviewPreviousTask {
  name: string;
  cost: number;
}

export interface OverviewChecklistItem {
  text: string;
  done: boolean;
}

export interface OverviewChecklist {
  taskName: string;
  items: OverviewChecklistItem[];
}

export interface OverviewRecentActivityItem {
  type: ActivityType;
  label: string;
  timestamp?: string;
}

export interface OverviewData {
  name: string;
  description: string;
  roleSummary?: string;
  previousTasks: OverviewPreviousTask[];
  activeChecklist: OverviewChecklist | null;
  recentActivity: OverviewRecentActivityItem[];
  responsibilityCount: number;
  projects: Project[];
}

interface OverviewSectionProps {
  data: OverviewData;
}

export function OverviewSection({ data }: OverviewSectionProps) {
  const checklistBadge = data.activeChecklist
    ? `${data.activeChecklist.items.filter((i) => i.done).length}/${data.activeChecklist.items.length}`
    : 0;

  return (
    <div className="flex flex-col gap-stack py-button-y">
      {(data.name || data.description) && (
        <div className="flex flex-col gap-0.5">
          {data.name && (
            <div className="flex items-baseline gap-list-item">
              <span className="text-lg font-semibold text-foreground/80">
                {data.name}
              </span>
              {data.projects[0] ? (
                <Link
                  to={`/projects/${data.projects[0].id}`}
                  className="ml-auto rounded-button bg-sidebar-primary/10 px-row py-0.5 text-[10px] font-medium text-sidebar-primary hover:bg-sidebar-primary/20"
                >
                  {data.projects[0].name}
                </Link>
              ) : (
                <span className="ml-auto text-[10px] text-muted-foreground">
                  No project
                </span>
              )}
            </div>
          )}
          {data.description && (
            <span className="text-sm text-muted-foreground">
              {data.description}
            </span>
          )}
          {data.roleSummary && (
            <span className="mt-gap-tight text-xs text-muted-foreground/60 line-clamp-2">
              {data.roleSummary}
            </span>
          )}
        </div>
      )}

      <Accordion
        title="Active checklist"
        badge={checklistBadge}
        defaultOpen={data.activeChecklist !== null}
        emptyText="No active task"
      >
        {data.activeChecklist && (
          <>
            <span className="text-[10px] text-muted-foreground/60">
              {data.activeChecklist.taskName}
            </span>
            {data.activeChecklist.items.map((item, i) => (
              <ChecklistRow key={i} text={item.text} done={item.done} />
            ))}
          </>
        )}
      </Accordion>

      <Accordion title="Previous tasks" badge={data.previousTasks.length} emptyText="No previous tasks">
        {data.previousTasks.map((task, i) => (
          <SessionRow key={i} name={task.name} cost={task.cost} />
        ))}
      </Accordion>

      <Accordion
        title="Recent activity"
        badge={data.recentActivity.length}
        emptyText="No recent activity"
      >
        {data.recentActivity.map((item, i) => (
          <ActivityRow
            key={i}
            type={item.type}
            label={item.label}
            timestamp={item.timestamp}
          />
        ))}
      </Accordion>
    </div>
  );
}
