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
  const verbs = items.map((item) =>
    getToolDisplay(item.toolName)?.verb ?? formatToolName(item.toolName),
  )
  const label =
    verbs.length <= 3
      ? verbs.join(', ')
      : `${verbs.slice(0, 3).join(', ')}, +${verbs.length - 3}`
  const hasInFlight = !frozen && items.some((item) => item.state !== 'complete')

  return (
    <li className="flex items-start gap-2 pb-3">
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
      </div>
    </li>
  )
}

export const ToolCallGroupRow = React.memo(ToolCallGroupRowBase)