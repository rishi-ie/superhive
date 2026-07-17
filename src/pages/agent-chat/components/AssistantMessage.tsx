import { HugeIcon } from '@/components/ui/huge-icon'
import { Copy01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TurnFoldRow } from './TurnFoldRow'
import { UsageFooter } from './UsageFooter'
import { PartRenderer } from './message-parts/PartRenderer'
import { ToolResultPart } from './message-parts/ToolResultPart'
import { copyToClipboard } from '@/lib/clipboard'
import { isMessageInFlight, type ContentPart } from '@/models/runtime'
import type { RuntimeMessage } from '@/types/electron'

interface AssistantMessageProps {
  message: RuntimeMessage
  className?: string
  agentId: string
}

export function AssistantMessage({
  message,
  className,
}: AssistantMessageProps) {
  const inFlight = isMessageInFlight(message)

  const toolResultsById = new Map<
    string,
    Extract<ContentPart, { type: 'tool-result' }>
  >()
  for (const part of message.parts) {
    if (part.type === 'tool-result') toolResultsById.set(part.id, part)
  }

  const copyText = message.parts
    .filter((p) => p.type === 'text' || p.type === 'thinking')
    .map((p) => (p.type === 'text' || p.type === 'thinking' ? p.text : ''))
    .join('\n\n')

  if (inFlight) return null

  const toolCalls = message.parts.filter(
    (p): p is Extract<ContentPart, { type: 'tool-call' }> =>
      p.type === 'tool-call',
  )

  const shouldFold =
    toolCalls.length >= 2 ||
    message.parts.some(
      (p) =>
        p.type !== 'text' &&
        p.type !== 'thinking' &&
        p.type !== 'tool-call' &&
        p.type !== 'tool-result',
    )

  const lastToolCallIndex = message.parts
    .map((p, i) => (p.type === 'tool-call' ? i : -1))
    .filter((i) => i !== -1)
    .at(-1)

  const nonFoldContent: ContentPart[] =
    lastToolCallIndex !== undefined
      ? message.parts.slice(lastToolCallIndex + 1)
      : []

  const foldContent: ContentPart[] =
    lastToolCallIndex !== undefined
      ? message.parts.slice(0, lastToolCallIndex + 1)
      : message.parts

  return (
    <div
      className={cn(
        'group relative w-full py-button-y flex flex-col gap-2',
        className ?? '',
      )}
    >
      {shouldFold && toolCalls.length >= 2 ? (
        <TurnFoldRow
          startedAt={message.ts}
          endedAt={message.ts + 1}
          toolCount={toolCalls.length}
          totalNonTextParts={
            foldContent.filter(
              (p) =>
                p.type !== 'text' && p.type !== 'thinking' && p.type !== 'compaction-summary',
            ).length
          }
          defaultCollapsed={true}
        >
          {foldContent.map((part, i) => (
            <PartRenderer
              key={`fold-${i}`}
              part={part}
              toolResultsById={toolResultsById}
            />
          ))}
        </TurnFoldRow>
      ) : (
        message.parts.map((part, i) => (
          <PartRenderer
            key={`part-${i}`}
            part={part}
            toolResultsById={toolResultsById}
          />
        ))
      )}

      {shouldFold && nonFoldContent.length > 0 ? (
        nonFoldContent.map((part, i) => (
          <PartRenderer
            key={`post-fold-${i}`}
            part={part}
            toolResultsById={toolResultsById}
          />
        ))
      ) : null}

      {/* Orphan tool-results: persisted JSONL where the call was pruned. */}
      {message.parts
        .filter((p) => p.type === 'tool-result')
        .map((part) => {
          if (Array.from(toolResultsById.values()).includes(part) === false) return null
          const match = toolCalls.find((c) => c.id === part.id)
          if (match) return null
          return (
            <ToolResultPart key={`orphan-${(part as { id: string }).id}`} part={part} />
          )
        })}

      <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-gap-tight mt-1">
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground h-7 w-7 border-0"
          onClick={() => copyToClipboard(copyText)}
          aria-label="Copy message"
        >
          <HugeIcon icon={Copy01Icon} size={14} className="size-3.5" />
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-[11px] text-muted-foreground ml-1 cursor-default">
              {new Date(message.ts).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            {new Date(message.ts).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </TooltipContent>
        </Tooltip>
        {message.usage ? (
          <div className="ml-auto">
            <UsageFooter usage={message.usage} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
