import { BulbIcon, Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeIcon } from '@/components/ui/huge-icon'
import { WorkingTimer, formatElapsed } from './WorkingTimer'
import { ChevronRightIcon } from 'lucide-react'
import type { ActivityStatus } from './response-run-view'
import type { ToolCallTimelineItem } from '@/models/assistant-message'

export function WorkingHeader({ startedAt }: { startedAt: number }) {
  return (
    <div className="text-[15px] leading-6 text-muted-foreground">
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
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex w-full items-center gap-1.5 border-b border-border/70 pb-3 text-left text-[15px] leading-6 text-[#9C9C9C] transition-colors hover:text-foreground"
    >
      <span>Worked for {formatElapsed(Math.max(0, Math.floor(durationMs / 1000)))}</span>
      <ChevronRightIcon className={`size-4 transition-transform duration-150 ease-out motion-reduce:transition-none ${expanded ? 'rotate-90' : ''}`} />
    </button>
  )
}

export function ActivityStatusLine({ status, live = false }: { status: ActivityStatus; live?: boolean }) {
  const StatusIcon = status.kind === 'thinking' ? BulbIcon : Loading03Icon

  if (!live && status.source && (status.source.kind === 'thinking' || status.source.kind === 'tool-call')) {
    return (
      <details className="group border-0 font-sans text-[15px] leading-6 text-[#9C9C9C]">
        <summary className="flex min-h-7 cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
          <HugeIcon icon={StatusIcon} size={16} className="shrink-0" />
          <span className="min-w-0">{status.pastLabel}</span>
          <ChevronRightIcon className="size-3.5 transition-transform duration-150 ease-out motion-reduce:transition-none group-open:rotate-90" />
        </summary>
        <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-150 ease-out motion-reduce:transition-none group-open:grid-rows-[1fr] group-open:opacity-100 group-open:pointer-events-auto pointer-events-none">
          <div className="min-h-0 overflow-hidden">
            <AuditDetail status={status} />
          </div>
        </div>
      </details>
    )
  }

  return (
    <div className="flex min-h-7 items-center gap-2 border-0 font-sans text-[15px] leading-6 text-[#9C9C9C]" aria-live={live ? 'polite' : undefined} aria-label={live ? 'Current agent activity' : undefined}>
      <HugeIcon icon={StatusIcon} size={16} className={live && status.kind !== 'thinking' ? 'shrink-0 animate-spin' : 'shrink-0'} />
      <span className={live ? 'min-w-0 animate-pulse truncate' : 'min-w-0'}>{live ? status.label : status.pastLabel}</span>
    </div>
  )
}

export const LiveStatusLine = ({ status }: { status: ActivityStatus }) => <ActivityStatusLine status={status} live />

function AuditDetail({ status }: { status: ActivityStatus }) {
  if (status.source?.kind === 'thinking') {
    return (
      <div className="ml-4 mt-1 max-h-64 overflow-auto whitespace-pre-wrap text-[15px] leading-6 text-muted-foreground/75">
        {status.source.text || 'No thinking trace was emitted.'}
      </div>
    )
  }

  const tool = status.source as ToolCallTimelineItem
  const result = tool.result?.length ? JSON.stringify(tool.result, null, 2) : 'No tool result was returned.'
  return (
    <pre className="ml-4 mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-border/60 bg-muted/30 p-3 text-xs leading-relaxed text-foreground/80">
      {`Tool: ${tool.toolName}\nTarget: ${tool.target ?? '—'}\nOutcome: ${tool.state}\n\n${result}`}
    </pre>
  )
}
