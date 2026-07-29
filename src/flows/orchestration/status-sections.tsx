import type { ComponentType } from 'react'
import {
  CircleIcon,
  ClockIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'

export interface ProjectStatusViewModel {
  projectName: string
  executionLabel: string
  planVersion?: number
  activity: string
  progress: {
    total: number
    completed: number
    active: number
    reviewing: number
    waiting: number
    blocked: number
    queued: number
  }
  activeLoops: Array<{
    id: string
    workerName: string
    status: string
    activity: string
  }>
  workers: Array<{
    id: string
    name: string
    label: string
    working: boolean
    error: boolean
  }>
  attention: Array<{ id: string; label: string }>
}

interface ProjectStatusSectionProps {
  viewModel: ProjectStatusViewModel
}

interface ProjectStatusSectionDefinition {
  id: string
  Component: ComponentType<ProjectStatusSectionProps>
}

export class ProjectStatusSectionRegistry {
  private readonly sections: ProjectStatusSectionDefinition[] = []

  register(section: ProjectStatusSectionDefinition): void {
    if (this.sections.some((candidate) => candidate.id === section.id)) return
    this.sections.push(section)
  }

  list(): readonly ProjectStatusSectionDefinition[] {
    return this.sections
  }
}

function ExecutionHeader({ viewModel }: ProjectStatusSectionProps) {
  return (
    <section className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-sidebar-foreground">
          {viewModel.projectName}
        </p>
        <Badge variant="outline">{viewModel.executionLabel}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        {viewModel.planVersion ? `Plan v${viewModel.planVersion} · ` : ''}
        {viewModel.activity}
      </p>
    </section>
  )
}

function ProgressSection({ viewModel }: ProjectStatusSectionProps) {
  const progress = viewModel.progress
  const percent = progress.total === 0
    ? 0
    : Math.round((progress.completed / progress.total) * 100)
  return (
    <section className="flex flex-col gap-2 pt-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Plan progress</h2>
        <span className="text-xs text-muted-foreground">
          {progress.completed} / {progress.total}
        </span>
      </div>
      <div
        aria-label={`${percent}% of project tasks complete`}
        className="h-1.5 overflow-hidden rounded-full bg-sidebar-accent"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {progress.active} active · {progress.reviewing} review · {progress.waiting} waiting · {progress.queued} queued
      </p>
    </section>
  )
}

function ActiveLoopsSection({ viewModel }: ProjectStatusSectionProps) {
  return (
    <section className="flex flex-col gap-2 pt-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Active loops</h2>
        <span className="text-xs text-muted-foreground">{viewModel.activeLoops.length}</span>
      </div>
      {viewModel.activeLoops.length === 0 ? (
        <p className="text-xs text-muted-foreground">No iteration is active.</p>
      ) : viewModel.activeLoops.map((loop) => (
        <div key={loop.id} className="flex items-start gap-2">
          <Icon icon={ClockIcon} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm text-sidebar-foreground">{loop.workerName}</p>
            <p className="truncate text-xs text-muted-foreground">{loop.activity} · {loop.status}</p>
          </div>
        </div>
      ))}
    </section>
  )
}

function WorkerHiveSection({ viewModel }: ProjectStatusSectionProps) {
  return (
    <section className="flex flex-col gap-2 pt-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Worker hive</h2>
        <span className="text-xs text-muted-foreground">{viewModel.workers.length}</span>
      </div>
      {viewModel.workers.length === 0 ? (
        <p className="text-xs text-muted-foreground">No workers assigned yet.</p>
      ) : viewModel.workers.map((worker) => (
        <div key={worker.id} className="flex items-start gap-2">
          <Icon
            icon={worker.error ? WarningCircleIcon : worker.working ? ClockIcon : CircleIcon}
            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
          />
          <div className="min-w-0">
            <p className="truncate text-sm text-sidebar-foreground">{worker.name}</p>
            <p className="truncate text-xs text-muted-foreground">{worker.label}</p>
          </div>
        </div>
      ))}
    </section>
  )
}

function AttentionSection({ viewModel }: ProjectStatusSectionProps) {
  return (
    <section className="flex flex-col gap-2 pt-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Needs attention</h2>
        <span className="text-xs text-muted-foreground">{viewModel.attention.length}</span>
      </div>
      {viewModel.attention.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing needs you right now.</p>
      ) : viewModel.attention.slice(0, 4).map((item) => (
        <div key={item.id} className="flex items-start gap-2">
          <Icon icon={WarningCircleIcon} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-sidebar-foreground">{item.label}</p>
        </div>
      ))}
    </section>
  )
}

export const projectStatusSections = new ProjectStatusSectionRegistry()
projectStatusSections.register({ id: 'execution', Component: ExecutionHeader })
projectStatusSections.register({ id: 'progress', Component: ProgressSection })
projectStatusSections.register({ id: 'active-loops', Component: ActiveLoopsSection })
projectStatusSections.register({ id: 'worker-hive', Component: WorkerHiveSection })
projectStatusSections.register({ id: 'attention', Component: AttentionSection })

