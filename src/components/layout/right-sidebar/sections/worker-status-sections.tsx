import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import type { OverviewData } from '@/models/component'
import {
  Accordion,
  ActivityRow,
  ChecklistRow,
  SessionRow,
} from '../primitives'

interface WorkerStatusSectionProps {
  data: OverviewData
}

interface WorkerStatusSectionDefinition {
  id: string
  Component: ComponentType<WorkerStatusSectionProps>
}

export class WorkerStatusSectionRegistry {
  private readonly sections: WorkerStatusSectionDefinition[] = []

  register(section: WorkerStatusSectionDefinition): void {
    if (!this.sections.some((candidate) => candidate.id === section.id)) {
      this.sections.push(section)
    }
  }

  list(): readonly WorkerStatusSectionDefinition[] {
    return this.sections
  }
}

function IdentitySection({ data }: WorkerStatusSectionProps) {
  if (!data.name && !data.description) return null
  return (
    <div className="flex flex-col gap-0.5">
      {data.name ? (
        <div className="flex items-baseline gap-list-item">
          <span className="text-lg font-semibold text-foreground/80">{data.name}</span>
          {data.projects[0] ? (
            <Link to={`/projects/${data.projects[0].id}`} className="ml-auto text-xs text-muted-foreground">
              {data.projects[0].name}
            </Link>
          ) : <span className="ml-auto text-xs text-muted-foreground">No project</span>}
        </div>
      ) : null}
      {data.description ? <span className="text-sm text-muted-foreground">{data.description}</span> : null}
      {data.roleSummary ? (
        <span className="mt-gap-tight line-clamp-2 text-xs text-muted-foreground/60">
          {data.roleSummary}
        </span>
      ) : null}
    </div>
  )
}

function AssignmentSection({ data }: WorkerStatusSectionProps) {
  const badge = data.activeChecklist
    ? `${data.activeChecklist.items.filter((item) => item.done).length}/${data.activeChecklist.items.length}`
    : 0
  return (
    <Accordion title="Current assignment" badge={badge} defaultOpen={Boolean(data.activeChecklist)} emptyText="No active task">
      {data.activeChecklist ? (
        <>
          <span className="text-[10px] text-muted-foreground/60">{data.activeChecklist.taskName}</span>
          {data.activeChecklist.items.map((item) => (
            <ChecklistRow key={item.text} text={item.text} done={item.done} />
          ))}
        </>
      ) : null}
    </Accordion>
  )
}

function ActivitySection({ data }: WorkerStatusSectionProps) {
  return (
    <Accordion title="Recent activity" badge={data.recentActivity.length} emptyText="No recent activity">
      {data.recentActivity.map((item, index) => (
        <ActivityRow key={`${item.label}:${index}`} {...item} />
      ))}
    </Accordion>
  )
}

function CommunicationSection({ data }: WorkerStatusSectionProps) {
  return (
    <Accordion title="Project communication" badge={data.communication?.length ?? 0} emptyText="No project messages">
      {data.communication?.map((item) => (
        <div key={item.id} className="flex flex-col gap-0.5 py-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium text-foreground">{item.actor}</span>
            {item.timestamp ? <span className="shrink-0 text-[10px] text-muted-foreground/60">{item.timestamp}</span> : null}
          </div>
          <span className="line-clamp-2 text-xs text-muted-foreground">{item.text}</span>
        </div>
      ))}
    </Accordion>
  )
}

function ResultSection({ data }: WorkerStatusSectionProps) {
  return data.resultStatus ? (
    <Accordion title="Result review" badge={1}>
      <span className="text-xs text-muted-foreground">{data.resultStatus}</span>
    </Accordion>
  ) : null
}

function PreviousTasksSection({ data }: WorkerStatusSectionProps) {
  return (
    <Accordion title="Previous tasks" badge={data.previousTasks.length} emptyText="No previous tasks">
      {data.previousTasks.map((task, index) => (
        <SessionRow key={`${task.name}:${index}`} name={task.name} cost={task.cost} />
      ))}
    </Accordion>
  )
}

export const workerStatusSections = new WorkerStatusSectionRegistry()
workerStatusSections.register({ id: 'identity', Component: IdentitySection })
workerStatusSections.register({ id: 'assignment', Component: AssignmentSection })
workerStatusSections.register({ id: 'activity', Component: ActivitySection })
workerStatusSections.register({ id: 'communication', Component: CommunicationSection })
workerStatusSections.register({ id: 'result', Component: ResultSection })
workerStatusSections.register({ id: 'previous-tasks', Component: PreviousTasksSection })

