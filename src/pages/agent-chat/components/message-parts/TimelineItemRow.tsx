import * as React from 'react'
import { BulbIcon } from '@hugeicons/core-free-icons'
import { HugeIcon } from '@/components/ui/huge-icon'
import {
  FALLBACK_ICON,
  getToolDisplay,
  formatToolName,
  type ToolDisplay,
} from './chain-display'
import type { TimelineItem } from '@/models/assistant-message'

interface TimelineItemRowProps {
  item: TimelineItem
  /** True once the message is frozen. */
  frozen: boolean
}

/**
 * One row of the activity timeline.
 *
 * Thinking renders as a compact `Thought` trace entry. Raw reasoning is
 * deliberately not exposed in the persisted chat UI.
 *
 * Tool call: compact, non-expandable. Shows just the tool name. No
 * arguments inline (spec: "No verbose tool output").
 *
 * Warning / Error: `⚠ <message>` / `❌ <message>`. Non-expandable.
 *
 * Note: there is no `completion` case here. The "Completed" marker
 * used to be a row in the lineage but was redundant — the finished
 * state already lives at the top of the message (the `Indicator`
 * component in AssistantMessage). Newer messages never emit a
 * CompletionTimelineItem; legacy ones are filtered in
 * `group-timeline-items.ts`.
 */
function TimelineItemRowBase({
  item,
  frozen,
}: TimelineItemRowProps) {
  if (item.kind === 'thinking') {
    return (
      <li className="flex items-start gap-2 pb-3">
        <Bullet>
          <HugeIcon icon={BulbIcon} size={15} className="text-muted-foreground" />
        </Bullet>
        <div className="flex-1 min-w-0 text-xs leading-snug">
          <span className="text-foreground/80">Thought</span>
        </div>
      </li>
    )
  }

  if (item.kind === 'planning') {
    return (
      <li className="flex items-start gap-2 pb-3">
        <Bullet>
          <HugeIcon icon={BulbIcon} size={15} className="text-muted-foreground" />
        </Bullet>
        <div className="flex-1 min-w-0 text-xs leading-snug text-foreground/80">
          Thought — {item.summary}
        </div>
      </li>
    )
  }

  if (item.kind === 'tool-call') {
    const display: ToolDisplay | undefined = getToolDisplay(item.toolName)
    const Icon = display?.icon ?? FALLBACK_ICON
    return (
      <li className="flex items-start gap-2 pb-3">
        <Bullet>
          <Icon className="size-3.5 text-muted-foreground" />
        </Bullet>
        <div className="flex-1 min-w-0 text-xs leading-snug">
          <span className={item.state === 'error' ? 'text-destructive font-medium' : 'text-foreground/80 font-medium'}>
            {item.state === 'error'
              ? item.error ?? 'Tool execution failed'
              : `${display?.verb ?? formatToolName(item.toolName)}${item.target ? ` ${item.target}` : ''}`}
          </span>
          {!frozen && item.state !== 'complete' && item.state !== 'error' ? (
            <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
          ) : null}
        </div>
      </li>
    )
  }

  if (item.kind === 'warning') {
    return (
      <li className="flex items-start gap-2 pb-3">
        <Bullet>
          <span aria-hidden className="text-amber-500">⚠</span>
        </Bullet>
        <div className="flex-1 min-w-0 text-xs leading-snug">
          <span className="text-foreground/80">{item.message}</span>
        </div>
      </li>
    )
  }

  if (item.kind === 'error') {
    return (
      <li className="flex items-start gap-2 pb-3">
        <Bullet>
          <span aria-hidden className="text-destructive">❌</span>
        </Bullet>
        <div className="flex-1 min-w-0 text-xs leading-snug">
          <span className="text-foreground/80">{item.message}</span>
        </div>
      </li>
    )
  }

  // Planning / System are defined but never emitted today.
  return null
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-background"
    >
      {children}
    </span>
  )
}

export const TimelineItemRow = React.memo(
  TimelineItemRowBase,
  (prev, next) =>
    prev.item === next.item &&
    prev.frozen === next.frozen,
)
