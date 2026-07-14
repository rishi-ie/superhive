import { Icon } from '@/components/ui/icon'
import { ArrowsClockwiseIcon, TrashIcon } from '@phosphor-icons/react'
import { HugeIcon } from '@/components/ui/huge-icon'
import { Copy01Icon, Loading03Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ThinkingPart } from './message-parts/ThinkingPart'
import { ToolCallPart } from './message-parts/ToolCallPart'
import { ToolResultPart } from './message-parts/ToolResultPart'
import { MarkdownPart } from './message-parts/MarkdownPart'
import { ImagePart } from './message-parts/ImagePart'
import { CompactionCard } from './message-parts/CompactionCard'
import { copyToClipboard } from '@/lib/clipboard'
import { regenerate, deleteMessage } from '@/flows/agents/crud'
import type { ContentPart } from '@/models/runtime'
import type { RuntimeMessage } from '@/types/electron'

interface AssistantMessageProps {
  message: RuntimeMessage
  className?: string
  agentId: string
  onRegenerate?: (messageId: string) => void
  onDelete?: (messageId: string) => void
}

const COLLAPSE_AFTER_PARTS = 1

export function AssistantMessage({ message, className, agentId, onRegenerate, onDelete }: AssistantMessageProps) {
  // Map every `tool-call` to its matching `tool-result`, if present. The
  // parts list keeps insertion order, so a `tool-result` immediately after
  // a `tool-call` belongs to that call (Phase 1.2 runtime handles this
  // linkup at ingest time).
  const toolCalls = message.parts.filter((p): p is Extract<ContentPart, { type: 'tool-call' }> => p.type === 'tool-call')
  const toolResultsById = new Map<string, Extract<ContentPart, { type: 'tool-result' }>>()
  for (const part of message.parts) {
    if (part.type === 'tool-result') toolResultsById.set(part.id, part)
  }

  // Group all non-tool-call-and-result parts into "prose" sections for
  // markdown rendering. We split by tool-call/result boundaries so a tool
  // execution that lands mid-message renders inline.
  const proseSections: ContentPart[][] = []
  let current: ContentPart[] = []
  for (const part of message.parts) {
    if (part.type === 'tool-call' || part.type === 'tool-result') {
      if (current.length > 0) {
        proseSections.push(current)
        current = []
      }
    } else {
      current.push(part)
    }
  }
  if (current.length > 0) proseSections.push(current)

  const lastPart = message.parts[message.parts.length - 1]
  const isStreamingText =
    !!lastPart && lastPart.type === 'text' && lastPart.state === 'streaming'

  const copyText = message.parts
    .filter((p) => p.type === 'text' || p.type === 'thinking')
    .map((p) => (p.type === 'text' || p.type === 'thinking' ? p.text : ''))
    .join('\n\n')

  return (
    <div className={`group relative w-full py-button-y flex flex-col gap-2${className ? ` ${className}` : ''}`}>
      {message.parts.map((part, i) => {
        if (part.type === 'thinking') {
          const isLast = i === message.parts.length - 1
          return (
            <ThinkingPart
              key={`thinking-${i}`}
              text={part.text}
              isStreaming={isLast && part.state === 'streaming'}
            />
          )
        }
        if (part.type === 'image') {
          return (
            <ImagePart
              key={`image-${i}`}
              data={part.data}
              mimeType={part.mimeType}
            />
          )
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
      })}

      {proseSections.map((section, i) => (
        <ProseSection key={`prose-${i}`} parts={section} index={i} />
      ))}

      {toolCalls.length === 0 ? null : (
        <div
          className={cn(
            'flex flex-col gap-1.5 rounded-card p-1',
            toolCalls.length > 1 && 'bg-muted/30 border border-border',
          )}
        >
          {toolCalls.length > 1 ? (
            <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground">
              <HugeIcon
                icon={Loading03Icon}
                size={12}
                className="size-3 animate-spin text-chat-status-running"
              />
              <span>Running {toolCalls.length} tools…</span>
            </div>
          ) : null}
          {toolCalls.map((call, i) => (
            <ToolCallPart
              key={`tool-${call.id}-${i}`}
              part={call}
              result={toolResultsById.get(call.id)}
            />
          ))}
        </div>
      )}

      {/* Orphan tool-results: persisted JSONL where the call was pruned. */}
      {message.parts
        .filter((p) => p.type === 'tool-result')
        .map((part) => {
          // Already rendered above as part of its matching tool-call, skip
          if (Array.from(toolResultsById.values()).includes(part) === false) return null
          const match = toolCalls.find((c) => c.id === part.id)
          if (match) return null
          return (
            <ToolResultPart key={`orphan-${(part as { id: string }).id}`} part={part} />
          )
        })}

      {isStreamingText ? (
        <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-foreground/70 animate-pulse" />
      ) : null}

      <div className="flex items-center gap-gap-tight mt-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
          Assistant
        </span>
        <span className="text-[11px] text-muted-foreground">
          {new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-gap-tight mt-1">
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground h-7 w-7 border-0"
          onClick={() => copyToClipboard(copyText)}
          aria-label="Copy message"
        >
          <HugeIcon icon={Copy01Icon} size={14} className="size-3.5" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground h-7 w-7 border-0"
          onClick={() => {
            if (typeof onRegenerate === 'function') onRegenerate(message.id)
            else void regenerate({ agentId, fromMessageId: message.id })
          }}
          aria-label="Regenerate response"
        >
          <Icon icon={ArrowsClockwiseIcon} className="size-3.5" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground h-7 w-7 border-0"
          onClick={() => {
            if (typeof onDelete === 'function') onDelete(message.id)
            else void deleteMessage({ agentId, messageId: message.id })
          }}
          aria-label="Delete message"
        >
          <Icon icon={TrashIcon} className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Render a stretch of `text` parts (with markdown support) inline. The
 * `index === 0` short-circuit avoids empty-zero rendering for messages that
 * start straight into tool calls.
 */
function ProseSection({
  parts,
  index,
}: {
  parts: ContentPart[]
  index: number
}) {
  const text = parts
    .filter((p) => p.type === 'text')
    .map((p) => (p.type === 'text' ? p.text : ''))
    .join('')
  if (!text.trim()) return null
  return (
    <div className={index >= COLLAPSE_AFTER_PARTS ? '' : ''}>
      <MarkdownPart source={text} />
    </div>
  )
}
