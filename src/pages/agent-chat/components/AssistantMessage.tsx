import { HugeIcon } from '@/components/ui/huge-icon'
import { CheckIcon, Copy01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TimelineItemRow } from './message-parts/TimelineItemRow'
import { ResponseBlocks } from './message-parts/ResponseBlocks'
import { UsageFooter } from './UsageFooter'
import { copyMessage } from '@/flows/agents/ui/copy-message'
import { useCopyFeedback } from '@/flows/ui/use-copy-feedback'
import type { AssistantMessage as PersistedAssistantMessage } from '@/models/assistant-message'
import type { RuntimeAssistantState } from '@/models/runtime'

interface AssistantMessageProps {
  message: PersistedAssistantMessage | RuntimeAssistantState
  className?: string
  agentId: string
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
 * Top-of-message indicator. State 1 (live): pulsing dot + "Working…".
 * State 2 (frozen): ✓ Finished. The indicator scrolls with the message
 * row (per Q11: not sticky to viewport).
 */
function Indicator({ frozen }: { frozen: boolean }) {
  if (frozen) {
    return (
      <div className="flex items-center gap-2 self-start text-xs text-muted-foreground">
        <span aria-hidden>✓</span>
        <span>Finished</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 self-start text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-muted-foreground opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-muted-foreground" />
      </span>
      <span>Working…</span>
    </div>
  )
}

export function AssistantMessage({
  message,
  className,
}: AssistantMessageProps) {
  const { copied, trigger } = useCopyFeedback()

  const frozen = isFrozen(message)
  const timeline = message.activityTimeline
  const response = message.response
  const timestamp = isPersisted(message) ? message.timestamp : message.ts
  const usage = isPersisted(message) ? message.metadata.usage : message.usage
  const totalDurationMs = isPersisted(message)
    ? message.metadata.totalDurationMs
    : message.totalDurationMs

  // In state 1, we DON'T render prose yet — only the chain. Prose appears
  // in state 2 below the separator. (Q5: hidden in state 1.)
  const showProse = frozen

  return (
    <div
      className={cn(
        'group relative w-full py-button-y flex flex-col gap-2',
        className ?? '',
      )}
    >
      <Indicator frozen={frozen} />

      {timeline.length > 0 ? (
        <ol className="ml-1.5 list-none">
          {timeline.map((item) => (
            <TimelineItemRow
              key={item.id}
              item={item}
              frozen={frozen}
              totalDurationMs={totalDurationMs}
            />
          ))}
        </ol>
      ) : null}

      {showProse && response.length > 0 ? (
        <ResponseBlocks blocks={response} frozen={frozen} />
      ) : null}

      {frozen ? (
        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-gap-tight mt-1">
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
              <span className="text-[11px] text-muted-foreground ml-1 cursor-default">
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
