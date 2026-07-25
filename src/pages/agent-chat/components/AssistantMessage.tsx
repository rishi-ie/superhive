import * as React from 'react'
import { HugeIcon } from '@/components/ui/huge-icon'
import { CheckIcon, Copy01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MarkdownPart } from './message-parts/MarkdownPart'
import { ImagePart } from './message-parts/ImagePart'
import { CompactionCard } from './message-parts/CompactionCard'
import { ActivityStatusLine, LiveStatusLine, WorkedHeader, WorkingHeader } from './LiveStatusLine'
import { buildResponseRunView } from './response-run-view'
import { UsageFooter } from './UsageFooter'
import { copyMessage } from '@/flows/agents/ui/copy-message'
import { useCopyFeedback } from '@/flows/ui/use-copy-feedback'
import type {
  AssistantMessage as PersistedAssistantMessage,
  ResponseBlock,
} from '@/models/assistant-message'
import type { RuntimeAssistantState } from '@/models/runtime'

interface AssistantMessageProps {
  message: PersistedAssistantMessage | RuntimeAssistantState
  className?: string
  agentId: string
  /**
   * True while the agent is still streaming any part of the response
   * to the current user prompt — i.e. between the first assistant
   * `message-start` and the next `agent-end`. Gate for the per-message
   * footer (copy + timestamp + usage): while true, the footer stays
   * hidden even for rows that have already frozen per-turn, so the
   * user sees one footer surface at the *end* of the whole response
   * rather than N footers flickering at every turn boundary.
   */
  agentResponseActive?: boolean
  /** Kept for caller compatibility; stopping remains in the composer. */
  onCancel?: () => void
}

/**
 * Discriminant: persisted `AssistantMessage` has a `timestamp` field;
 * in-flight `RuntimeAssistantState` has `ts` instead.
 */
function isPersisted(
  m: PersistedAssistantMessage | RuntimeAssistantState,
): m is PersistedAssistantMessage {
  return 'timestamp' in m
}

/**
 * Render one ResponseBlock. The dispatcher used to live in
 * `message-parts/ResponseBlocks.tsx` — inlined here so we can interleave
 * blocks with timeline items without a separate wrapper.
 */
function ResponseBlockView({ block, streaming }: { block: ResponseBlock; streaming: boolean }) {
  switch (block.type) {
    case 'text':
		return <MarkdownPart source={block.text} streaming={streaming && block.state === 'streaming'} />
    case 'image':
      return <ImagePart data={block.data} mimeType={block.mimeType} />
    case 'compaction-summary':
      return <CompactionCard tokensBefore={block.tokensBefore} summary={block.summary} />
  }
}

export function AssistantMessage({
  message,
  className,
  agentResponseActive = false,
}: AssistantMessageProps) {
  const { copied, trigger } = useCopyFeedback()

  const frozen = isFrozen(message)
  const response = message.response
  const timestamp = isPersisted(message) ? message.timestamp : message.ts
  const usage = isPersisted(message) ? message.metadata.usage : message.usage
	const workedDurationMs = isPersisted(message)
		? message.metadata.totalDurationMs ?? 0
		: message.totalDurationMs ?? Math.max(0, Date.now() - message.ts)
	const [activityExpanded, setActivityExpanded] = React.useState(false)
	React.useEffect(() => {
		if (frozen) setActivityExpanded(false)
	}, [frozen])

	const runView = React.useMemo(
    () => buildResponseRunView(message.activityTimeline, response),
    [message.activityTimeline, response],
  )
	const finalSegment = runView.segments[runView.segments.length - 1]
	const finalBlock = finalSegment?.block
	const traceEvents = runView.auditEvents.filter(
		(event) => event.type === 'status' || event.block !== finalBlock,
	)
	const activityCount = message.activityTimeline.filter((item) => item.kind !== 'completion').length
	const hasTrace = traceEvents.length > 0 || activityCount > 0
	const liveRuntime = !frozen && !isPersisted(message)

  return (
    <div
      className={cn(
        'group relative w-full py-button-y flex flex-col gap-2',
        className ?? '',
      )}
    >
		{frozen ? (
			<WorkedHeader
				durationMs={workedDurationMs}
				expanded={activityExpanded}
				onToggle={() => {
					if (hasTrace) setActivityExpanded((value) => !value)
				}}
			/>
		) : null}

      {liveRuntime ? (
        <>
          <WorkingHeader startedAt={message.ts} />
          {runView.segments.length > 0 ? (
            <div className="flex flex-col gap-3">
              {runView.segments.map((segment) => (
                <React.Fragment key={`block-${segment.block.sequence ?? segment.block.startedAt}-${segment.block.type}`}>
                  {segment.statusBefore ? <ActivityStatusLine status={segment.statusBefore} /> : null}
                  <ResponseBlockView block={segment.block} streaming />
                </React.Fragment>
              ))}
            </div>
          ) : null}
          <LiveStatusLine status={runView.liveStatus} />
        </>
      ) : (
        <>
        {activityExpanded ? (
        <div className="flex flex-col gap-2">
          {traceEvents.map((event, index) => (
            <React.Fragment key={event.type === 'status' ? `trace-status-${event.status.id}` : `trace-block-${event.block.sequence ?? event.block.startedAt}-${event.block.type}-${index}`}>
              {event.type === 'status' ? (
                <ActivityStatusLine status={event.status} />
              ) : (
                <ResponseBlockView block={event.block} streaming={false} />
              )}
            </React.Fragment>
          ))}
          {!traceEvents.length && activityCount > 0 ? <ActivityStatusLine status={runView.liveStatus} /> : null}
        </div>
        ) : null}
        {finalSegment ? (
          <div className="flex flex-col gap-3">
            <ResponseBlockView block={finalSegment.block} streaming={false} />
          </div>
        ) : null}
        </>
      )}

      {frozen && !agentResponseActive ? (
        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-gap-tight mt-1 [--muted-foreground:#707070]">
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground h-7 w-7 border-0"
            onClick={() => {
              void copyMessage(toPersisted(message)).then((ok) => {
                if (ok) trigger()
              })
            }}
            aria-label={copied ? 'Copied' : 'Copy message'}
          >
            {copied ? (
              <HugeIcon icon={CheckIcon} size={14} className="size-3.5" />
            ) : (
              <HugeIcon icon={Copy01Icon} size={14} className="size-3.5" />
            )}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground ml-1 cursor-default">
                {new Date(timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              {new Date(timestamp).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </TooltipContent>
          </Tooltip>
          {usage ? (
            <div className="ml-auto">
              <UsageFooter usage={usage} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function isFrozen(message: PersistedAssistantMessage | RuntimeAssistantState): boolean {
  // `PersistedAssistantMessage` is always frozen (by construction).
  // `RuntimeAssistantState` may or may not be — when frozen, it can be
  // treated like the persisted shape.
  return isPersisted(message) ? true : message.frozen === true
}

/**
 * Narrow an in-flight or persisted assistant message to a `ChatRow`-compatible
 * value for `copyMessage`. In-flight messages don't have a stable `ChatRow`
 * representation, but `copyMessage` only reads `text` from `response` —
 * which exists on both shapes — so a thin ad-hoc object suffices.
 */
function toPersisted(message: PersistedAssistantMessage | RuntimeAssistantState): PersistedAssistantMessage {
  if (isPersisted(message)) return message
  return {
    id: message.id,
    role: 'assistant',
    timestamp: message.ts,
    activityTimeline: message.activityTimeline,
    response: message.response,
    metadata: {
      ...(message.usage ? { usage: message.usage } : {}),
      ...(message.totalDurationMs !== undefined
        ? { totalDurationMs: message.totalDurationMs }
        : {}),
    },
  }
}
