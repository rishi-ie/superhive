import * as React from 'react'
import { HugeIcon } from '@/components/ui/huge-icon'
import { CheckIcon, Copy01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TimelineItemRow } from './message-parts/TimelineItemRow'
import { ToolCallGroupRow } from './message-parts/ToolCallGroupRow'
import { groupTimelineItems, type TimelineGroup } from './message-parts/group-timeline-items'
import { MarkdownPart } from './message-parts/MarkdownPart'
import { ImagePart } from './message-parts/ImagePart'
import { CompactionCard } from './message-parts/CompactionCard'
import { UsageFooter } from './UsageFooter'
import { copyMessage } from '@/flows/agents/ui/copy-message'
import { useCopyFeedback } from '@/flows/ui/use-copy-feedback'
import type {
  AssistantMessage as PersistedAssistantMessage,
  ResponseBlock,
  TimelineItem,
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

/**
 * Render one ResponseBlock. The dispatcher used to live in
 * `message-parts/ResponseBlocks.tsx` — inlined here so we can interleave
 * blocks with timeline items without a separate wrapper.
 */
function ResponseBlockView({ block }: { block: ResponseBlock }) {
  switch (block.type) {
    case 'text':
      return <MarkdownPart source={block.text} />
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
  const timeline = message.activityTimeline
  const response = message.response
  const timestamp = isPersisted(message) ? message.timestamp : message.ts
  const usage = isPersisted(message) ? message.metadata.usage : message.usage
  const totalDurationMs = isPersisted(message)
    ? message.metadata.totalDurationMs
    : message.totalDurationMs

  // In state 1, we DON'T render prose yet — only the chain. Prose appears
  // in state 2 (and is interleaved with the lineage in chronological order).
  const showProse = frozen

  // Cluster consecutive tool-call items into a single group so parallel
  // tool calls render as one row instead of N stacked rows. Non-tool-call
  // items break the chain and stay standalone.
  const groupedTimeline = React.useMemo(
    () => groupTimelineItems(timeline),
    [timeline],
  )

  // Merge timeline groups and prose blocks into a single chronologically
  // ordered list. The renderer iterates this list top-to-bottom, so the
  // user sees prose appear in the same position it was emitted (between
  // thinking/tool-call rounds that bracketed it).
  //
  // Items without a startedAt (warning / error / legacy completion) sort
  // to the top — harmless in practice since they're rare and the chronological
  // order of the surrounding items is preserved.
  const orderedItems = React.useMemo(() => {
    type Entry =
      | { kind: 'timeline'; at: number; group: TimelineGroup }
      | { kind: 'response'; at: number; block: ResponseBlock }

    const tAt = (item: TimelineItem): number =>
      item.kind === 'thinking' || item.kind === 'tool-call' ? item.startedAt : 0

    const out: Entry[] = []
    for (const group of groupedTimeline) {
      if (group.kind === 'single') {
        out.push({ kind: 'timeline', at: tAt(group.item), group })
      } else {
        out.push({
          kind: 'timeline',
          at: Math.min(...group.items.map(tAt)),
          group,
        })
      }
    }
    if (showProse) {
      for (const block of response) {
        out.push({ kind: 'response', at: block.startedAt, block })
      }
    }
    out.sort((a, b) => a.at - b.at)
    return out
  }, [groupedTimeline, response, showProse])

  return (
    <div
      className={cn(
        'group relative w-full py-button-y flex flex-col gap-2',
        className ?? '',
      )}
    >
      <Indicator frozen={frozen} />

      {orderedItems.length > 0 ? (
        // Plain flex column (not <ol>) because we render mixed kinds —
        // timeline rows and prose blocks. The previous <ol> wrapper only
        // worked when everything in it was a TimelineItem.
        <div className="flex flex-col gap-2">
          {orderedItems.map((entry) => {
            const key =
              entry.kind === 'timeline'
                ? entry.group.kind === 'single'
                  ? entry.group.item.id
                  : entry.group.items[0]!.id
                : `block-${entry.at}-${entry.block.type}`
            return (
              <div key={key}>
                {entry.kind === 'timeline' ? (
                  entry.group.kind === 'single' ? (
                    <TimelineItemRow
                      item={entry.group.item}
                      frozen={frozen}
                      totalDurationMs={totalDurationMs}
                    />
                  ) : (
                    <ToolCallGroupRow
                      items={entry.group.items}
                      frozen={frozen}
                    />
                  )
                ) : (
                  <ResponseBlockView block={entry.block} />
                )}
              </div>
            )
          })}
        </div>
      ) : null}

      {frozen && !agentResponseActive ? (
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
