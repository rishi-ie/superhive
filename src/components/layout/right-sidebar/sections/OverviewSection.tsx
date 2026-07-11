import {
  Accordion,
  ChecklistRow,
  ResponsibilitySlider,
  SessionRow,
} from "../primitives";
import { Badge } from "@/components/ui/badge";

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

export interface OverviewCatalogItem {
  path: string;
  active: boolean;
}

export interface OverviewData {
  name: string;
  description: string;
  previousTasks: OverviewPreviousTask[];
  activeChecklist: OverviewChecklist | null;
  catalog: {
    skills: OverviewCatalogItem[];
    extensions: OverviewCatalogItem[];
    prompts: OverviewCatalogItem[];
  };
  responsibilityCount: number;
}

interface OverviewSectionProps {
  data: OverviewData;
}

function badgeName(item: { path?: string; name?: string }): string {
  return item.name ?? item.path?.split("/").pop() ?? "unknown";
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
              <span className="ml-auto text-xs text-muted-foreground">
                Apollo
              </span>
            </div>
          )}
          {data.description && (
            <span className="text-sm text-muted-foreground">
              {data.description}
            </span>
          )}
        </div>
      )}

      <Accordion title="Previous tasks" badge={data.previousTasks.length} emptyText="No previous tasks">
        {data.previousTasks.map((task, i) => (
          <SessionRow key={i} name={task.name} cost={task.cost} />
        ))}
      </Accordion>

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

      <Accordion
        title="Skills"
        badge={data.catalog.skills.length}
        emptyText="No skills"
      >
        <div className="flex flex-wrap gap-gap-tight">
          {data.catalog.skills.map((item, i) => (
            <Badge key={i} variant="secondary" className="text-sm opacity-60">
              {badgeName(item)}
            </Badge>
          ))}
        </div>
      </Accordion>

      <Accordion
        title="Extensions"
        badge={data.catalog.extensions.length}
        emptyText="No extensions"
      >
        <div className="flex flex-wrap gap-gap-tight">
          {data.catalog.extensions.map((item, i) => (
            <Badge key={i} variant="secondary" className="text-sm opacity-60">
              {badgeName(item)}
            </Badge>
          ))}
        </div>
      </Accordion>

      <Accordion
        title="Prompts"
        badge={data.catalog.prompts.length}
        emptyText="No prompts"
      >
        <div className="flex flex-wrap gap-gap-tight">
          {data.catalog.prompts.map((item, i) => (
            <Badge key={i} variant="secondary" className="text-sm opacity-60">
              {badgeName(item)}
            </Badge>
          ))}
        </div>
      </Accordion>

      <ResponsibilitySlider count={data.responsibilityCount} />
    </div>
  );
}
