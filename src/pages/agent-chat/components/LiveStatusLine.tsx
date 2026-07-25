import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeIcon } from '@/components/ui/huge-icon'
import { WorkingTimer, formatElapsed } from './WorkingTimer'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import type { ActivityStatus } from './response-run-view'
import type { ToolCallTimelineItem } from '@/models/assistant-message'

export function WorkingHeader({ startedAt }: { startedAt: number }) {
  return (
    <div className="text-xl text-muted-foreground">
      Working for <WorkingTimer startedAt={startedAt} className="tabular-nums" />
    </div>
  )
}

export function WorkedHeader({
  durationMs,
  expanded,
  onToggle,
}: {
  durationMs: number
  expanded: boolean
  onToggle: () => void
}) {
  const Chevron = expanded ? ChevronDownIcon : ChevronRightIcon
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex w-full items-center gap-1.5 border-b border-border/70 pb-4 text-left text-xl text-muted-foreground transition-colors hover:text-foreground"
    >
      <span>Worked for {formatElapsed(Math.max(0, Math.floor(durationMs / 1000)))}</span>
      <Chevron className="size-4" />
    </button>
  )
}

export function ActivityStatusLine({ status, live = false }: { status: ActivityStatus; live?: boolean }) {
  if (!live && status.source && (status.source.kind === 'thinking' || status.source.kind === 'tool-call')) {
    return (
      <details className="group text-sm text-muted-foreground">
        <summary className="flex min-h-7 cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
          <HugeIcon icon={Loading03Icon} size={15} className="shrink-0" />
          <span className="min-w-0">{status.pastLabel}</span>
          <ChevronRightIcon className="size-3.5 transition-transform group-open:rotate-90" />
        </summary>
        <AuditDetail status={status} />
      </details>
    )
  }

  return (
    <div className="flex min-h-7 items-center gap-2 text-sm text-muted-foreground" aria-live={live ? 'polite' : undefined} aria-label={live ? 'Current agent activity' : undefined}>
      <HugeIcon icon={Loading03Icon} size={15} className={live ? 'shrink-0 animate-spin' : 'shrink-0'} />
      <span className={live ? 'min-w-0 animate-pulse truncate' : 'min-w-0'}>{live ? status.label : status.pastLabel}</span>
    </div>
  )
}

export const LiveStatusLine = ({ status }: { status: ActivityStatus }) => <ActivityStatusLine status={status} live />

function AuditDetail({ status }: { status: ActivityStatus }) {
  if (status.source?.kind === 'thinking') {
    return (
      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-border/60 bg-muted/30 p-3 text-xs leading-relaxed text-foreground/80">
        {status.source.text || 'No thinking trace was emitted.'}
      </pre>
    )
  }

  const tool = status.source as ToolCallTimelineItem
  const result = tool.result?.length ? JSON.stringify(tool.result, null, 2) : 'No tool result was returned.'
  return (
    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-border/60 bg-muted/30 p-3 text-xs leading-relaxed text-foreground/80">
      {`Tool: ${tool.toolName}\nTarget: ${tool.target ?? '—'}\nOutcome: ${tool.state}\n\n${result}`}
    </pre>
  )
}
