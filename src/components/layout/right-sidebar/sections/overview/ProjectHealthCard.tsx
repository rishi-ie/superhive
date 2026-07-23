/**
 * `ProjectHealthCard` — stat rows only.
 *
 * Mock-driven for now. Future source: aggregate runtime status from
 * `useAllAgentStatuses` + `useTasksByProject`. The `status` field on
 * `ProjectHealth` is reserved for future live wiring (drives a banner
 * or pill elsewhere); the overview's glanceable stat block doesn't
 * render it.
 */

import { Users, Clock3 } from 'lucide-react'
import type { ProjectHealth } from '@/models/component'

interface ProjectHealthCardProps {
  health: ProjectHealth
}

export function ProjectHealthCard({ health }: ProjectHealthCardProps) {
  return (
    <div className="flex flex-col gap-2">
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
