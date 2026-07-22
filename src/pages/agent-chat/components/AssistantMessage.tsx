import { HugeIcon } from '@/components/ui/huge-icon'
import { CheckIcon, Copy01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ActionChainFold } from './message-parts/ActionChainFold'
import { WorkingStream } from './WorkingStream'
import { UsageFooter } from './UsageFooter'
import { MarkdownPart } from './message-parts/MarkdownPart'
import { ImagePart } from './message-parts/ImagePart'
import { CompactionCard } from './message-parts/CompactionCard'
import { copyMessage } from '@/flows/agents/ui/copy-message'
import { useCopyFeedback } from '@/flows/ui/use-copy-feedback'
import type { ContentPart, RuntimeMessage } from '@/models/runtime'

interface AssistantMessageProps {
  message: RuntimeMessage
  className?: string
  agentId: string
}

/**
 * Render prose parts (text + image + compaction-summary). The chain
 * (thinking + tool-call) lives in `message.lineage` and is rendered
 * separately by `WorkingStream` (state 1) or `ActionChainFold` (state 2).
 */
function renderProsePart(part: ContentPart, i: number) {
  if (part.type === 'text') {
    return <MarkdownPart key={`text-${i}`} source={part.text} />
  }
  if (part.type === 'image') {
    return <ImagePart key={`image-${i}`} data={part.data} mimeType={part.mimeType} />
  }
  if (part.type === 'compaction-summary') {
    return (
      <CompactionCard
        key={`compaction-${i}`}
        tokensBefore={part.tokensBefore}
        summary={part.summary}
      />
    )
  }
  return null
}

export function AssistantMessage({
  message,
  className,
}: AssistantMessageProps) {
  const { copied, trigger } = useCopyFeedback()

  // The lineage is the single source of truth for state 1 / state 2.
  // When `message.lineageFrozen` is true (queue's finalize-message op or
  // the 60s safety net set it), render the fold. Otherwise render the
  // WorkingStream — the chain rows grow live as the agent streams.
  const lineage = message.lineage ?? []
  const frozen = message.lineageFrozen === true

  // In state 1, we DON'T render prose yet — only the chain. Prose appears
  // in state 2 below the fold. This is the explicit user-facing rule.
  const showProse = frozen

  return (
    <div
      className={cn(
        'group relative w-full py-button-y flex flex-col gap-2',
        className ?? '',
      )}
    >
      {lineage.length > 0 ? (
        frozen ? (
          <ActionChainFold rows={lineage} />
        ) : (
          <WorkingStream lineage={lineage} />
        )
      ) : null}

      {showProse ? (
        <>
          {message.parts.map((part, i) => {
            if (part.type === 'thinking' || part.type === 'tool-call') return null
            return renderProsePart(part, i)
          })}
        </>
      ) : null}

      {frozen ? (
        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-gap-tight mt-1">
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground h-7 w-7 border-0"
            onClick={() => {
              void copyMessage(message).then((ok) => {
                if (ok) trigger()
              })
            }}
            aria-label={copied ? 'Copied' : 'Copy message'}
          >
            {copied ? (
              <HugeIcon
                icon={CheckIcon}
                size={14}
                className="size-3.5"
              />
            ) : (
              <HugeIcon
                icon={Copy01Icon}
                size={14}
                className="size-3.5"
              />
            )}
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
      ) : null}
    </div>
  )
}
