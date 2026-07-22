import * as React from 'react'
import {
  THINKING_ICON as THOUGHT_ICON,
  FALLBACK_ICON,
  getToolDisplay,
  type ToolDisplay,
} from './chain-display'
import { CheckCircle2Icon } from 'lucide-react'
import type { TimelineItem } from '@/models/assistant-message'

interface TimelineItemRowProps {
  item: TimelineItem
  /** Total response duration in ms (used for thinking row label). */
  totalDurationMs?: number
  /** True once the message is frozen — collapses expanded states. */
  frozen: boolean
}

/**
 * One row of the activity timeline.
 *
 * Thinking: streams inline as `Thinking` while in flight (click the
 * label to expand). Once frozen, the label reads `Thought (3.2s)`
 * and stays clickable to expand the thought text.
 *
 * Tool call: compact, non-expandable. Shows just the tool name. No
 * arguments inline (spec: "No verbose tool output").
 *
 * Completion: `✓ Completed`. Non-expandable.
 *
 * Warning / Error: `⚠ <message>` / `❌ <message>`. Non-expandable.
 */
function TimelineItemRowBase({
  item,
  totalDurationMs,
  frozen,
}: TimelineItemRowProps) {
  const [open, setOpen] = React.useState(false)
  const openForFrozen = open && frozen

  if (item.kind === 'thinking') {
    const label = frozen
      ? `Thought (${formatSeconds(totalDurationMs ?? 0)})`
      : 'Thinking'
    const expandable = item.text.length > 0
    return (
      <li className="flex items-start gap-2 pb-3">
        <Bullet>
          <THOUGHT_ICON className="size-3.5 text-muted-foreground" />
        </Bullet>
        <div className="flex-1 min-w-0 text-xs leading-snug">
          {expandable ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-foreground/80 hover:text-foreground cursor-pointer text-left"
            >
              {label}
            </button>
          ) : (
            <span className="text-foreground/80">{label}</span>
          )}
          {!frozen && expandable ? (
            <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
          ) : null}
          {expandable && openForFrozen ? (
            <p className="mt-1 text-foreground/60 text-[11px] whitespace-pre-wrap">
              {item.text}
            </p>
          ) : null}
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
          <span className="inline-flex items-center gap-1.5 text-foreground/80">
            <CheckCircle2Icon className="size-3 text-foreground/60" />
            <span>{display?.verb ?? item.toolName}</span>
          </span>
          {!frozen && item.state !== 'complete' ? (
            <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
          ) : null}
        </div>
      </li>
    )
  }

  if (item.kind === 'completion') {
    return (
      <li className="flex items-start gap-2 pb-3">
        <Bullet>
          <CheckCircle2Icon className="size-3.5 text-foreground/70" />
        </Bullet>
        <div className="flex-1 min-w-0 text-xs leading-snug">
          <span className="text-foreground/80">Completed</span>
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

function formatSeconds(ms: number): string {
  if (ms < 0) ms = 0
  return `${(ms / 1000).toFixed(1)}s`
}

export const TimelineItemRow = React.memo(
  TimelineItemRowBase,
  (prev, next) =>
    prev.item === next.item &&
    prev.frozen === next.frozen &&
    prev.totalDurationMs === next.totalDurationMs,
)
