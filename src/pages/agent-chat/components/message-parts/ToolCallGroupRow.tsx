import * as React from 'react'
import { WrenchIcon } from 'lucide-react'
import { getToolDisplay, formatToolName } from './chain-display'
import type { ToolCallTimelineItem } from '@/models/assistant-message'

interface ToolCallGroupRowProps {
  items: ToolCallTimelineItem[]
  /** True once the message is frozen. */
  frozen: boolean
}

function ToolCallGroupRowBase({ items, frozen }: ToolCallGroupRowProps) {
  const labels = items.map((item) => {
    if (item.state === 'error') return item.error ?? 'Tool execution failed'
    const verb = getToolDisplay(item.toolName)?.verb ?? formatToolName(item.toolName)
    return item.target ? `${verb} ${item.target}` : verb
  })
  const verbs = new Set(items.map((item) => getToolDisplay(item.toolName)?.verb ?? formatToolName(item.toolName)))
  const label = items.length === 1
    ? labels[0]!
    : verbs.size === 1
      ? `${verbs.values().next().value} ${items.length} actions`
      : `${labels.slice(0, 2).join(' · ')}${items.length > 2 ? ` · +${items.length - 2}` : ''}`
  const hasInFlight = !frozen && items.some((item) => item.state !== 'complete' && item.state !== 'error')

  return (
    <li className="flex select-none items-start gap-2 pb-3">
      <span
        aria-hidden
        className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-background"
      >
        <WrenchIcon className="size-3.5 text-muted-foreground" />
      </span>
      <div className="flex-1 min-w-0 text-xs leading-snug">
        <span className="text-foreground/80 font-medium">{label}</span>
        {hasInFlight ? (
          <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
        ) : null}
        {items.length > 1 ? (
          <p className="mt-1 truncate text-muted-foreground">{labels.slice(0, 2).join(' · ')}</p>
        ) : null}
      </div>
    </li>
  )
}

export const ToolCallGroupRow = React.memo(ToolCallGroupRowBase)
