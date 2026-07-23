/**
 * `ProjectHealthCard` — small reassurance block under the project header.
 * No card chrome — just the status row + two stat rows.
 *
 * Mock-driven for now. Future source: aggregate runtime status from
 * `useAllAgentStatuses` + `useTasksByProject`.
 */

import { CheckCircle2, AlertCircle, AlertTriangle, Users, Clock3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectHealth, ProjectHealthStatus } from '@/models/component'

interface ProjectHealthCardProps {
  health: ProjectHealth
}

const STATUS_META: Record<
  ProjectHealthStatus,
  { label: string; Icon: typeof CheckCircle2; dotClass: string; textClass: string }
> = {
  healthy: {
    label: 'Healthy',
    Icon: CheckCircle2,
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
  attention: {
    label: 'Needs attention',
    Icon: AlertTriangle,
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  blocked: {
    label: 'Blocked',
    Icon: AlertCircle,
    dotClass: 'bg-destructive',
    textClass: 'text-destructive',
  },
}

export function ProjectHealthCard({ health }: ProjectHealthCardProps) {
  const meta = STATUS_META[health.status]
  const StatusIcon = meta.Icon

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={cn('size-2 shrink-0 rounded-full', meta.dotClass)} />
        <StatusIcon className={cn('size-3.5 shrink-0', meta.textClass)} />
        <span className={cn('text-xs font-medium', meta.textClass)}>{meta.label}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="size-3 shrink-0" />
        <span>
          {health.agents} Agents · {health.active} Active · {health.idle} Idle
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock3 className="size-3 shrink-0" />
        <span>
          {health.tasks} Tasks · {health.completed} Complete · {health.waiting} Waiting
        </span>
      </div>
    </div>
  )
}
