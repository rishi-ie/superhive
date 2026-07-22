/**
 * `AgentCard` — one row in the Team list.
 *
 * Compact, glanceable. Top row: agent icon + name + status dot.
 * Bottom: role / current work.
 */

import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentOverviewCard, AgentOverviewStatus } from '@/models/component'

interface AgentCardProps {
  agent: AgentOverviewCard
}

const STATUS_DOT: Record<AgentOverviewStatus, string> = {
  active: 'bg-emerald-500',
  waiting: 'bg-amber-500',
  idle: 'bg-muted-foreground/40',
  error: 'bg-destructive',
}

const STATUS_LABEL: Record<AgentOverviewStatus, string> = {
  active: 'Active',
  waiting: 'Waiting',
  idle: 'Idle',
  error: 'Error',
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className="flex h-14 flex-col justify-center rounded-button border border-border bg-card px-3 py-2">
      <div className="flex items-center gap-2">
        <Bot className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium text-foreground/90">
          {agent.name}
        </span>
        <span
          aria-label={STATUS_LABEL[agent.status]}
          title={STATUS_LABEL[agent.status]}
          className={cn('ml-auto size-2 shrink-0 rounded-full', STATUS_DOT[agent.status])}
        />
      </div>
      <span className="truncate text-xs text-muted-foreground">{agent.work}</span>
    </div>
  )
}
