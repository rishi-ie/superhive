import * as React from 'react'
import { UserMessage } from './UserMessage'
import { AssistantMessage } from './AssistantMessage'
import { cn } from '@/lib/utils'
import { ActiveStateBanners } from './ActiveStateBanners'
import { ChatEmptyState } from './SuggestedPrompts'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import type { RuntimeMessage } from '@/types/electron'
import { isMessageInFlight } from '@/models/runtime'

type Row =
  | { kind: 'message'; message: RuntimeMessage }
  | { kind: 'pending'; id: string; startedAt: number }

interface ConversationAreaProps {
  messages: RuntimeMessage[]
  busy?: boolean
  compaction?: import('@/models/runtime').CompactionStatus
  retry?: import('@/models/runtime').RetryStatus
  onCancel?: () => void
  agentId?: string
  agentName?: string
  onPromptSelect?: (prompt: string) => void
  /**
   * Optimistic sentinel set the instant the user sends a message. Renders as
   * a virtual "Waiting for response…" row at the end of the list —
   * disappears when the first `message-start` event lands or when the
   * 60s safety net fires.
   */
  pendingTurn?: { userMessageId: string; startedAt: number } | null
}

export function ConversationArea({
  messages,
  busy = false,
  compaction,
  retry,
  onCancel,
  agentId,
  agentName,
  onPromptSelect,
  pendingTurn = null,
}: ConversationAreaProps) {
  const virtuosoRef = React.useRef<VirtuosoHandle | null>(null)
  const [atBottom, setAtBottom] = React.useState(true)
  const seenIdsRef = React.useRef<Set<string>>(new Set())
  const [freshIds, setFreshIds] = React.useState<Set<string>>(new Set())

  const rows: Row[] = React.useMemo(() => {
    const out: Row[] = messages.map((m) => ({ kind: 'message', message: m }))

    // If the last message is an in-flight assistant message, the
    // AssistantMessage component is already rendering a WorkingStream.
    // Don't stack a second state-1 row on top of it.
    const tail = messages[messages.length - 1]
    const tailIsInFlightAssistant =
      tail?.role === 'assistant' && isMessageInFlight(tail)

    if (pendingTurn && !tailIsInFlightAssistant) {
      out.push({
        kind: 'pending',
        id: pendingTurn.userMessageId,
        startedAt: pendingTurn.startedAt,
      })
    }
    return out
  }, [messages, pendingTurn])

  React.useEffect(() => {
    const currentIds = new Set(messages.map((m) => m.id))
    const next = new Set<string>()
    for (const id of currentIds) {
      if (!seenIdsRef.current.has(id)) next.add(id)
    }
    seenIdsRef.current = currentIds
    if (next.size === 0) return
    setFreshIds((prev) => {
      const merged = new Set(prev)
      for (const id of next) merged.add(id)
      return merged
    })
    const t = setTimeout(() => {
      setFreshIds((prev) => {
        const trimmed = new Set(prev)
        for (const id of next) trimmed.delete(id)
        return trimmed
      })
    }, 400)
    return () => clearTimeout(t)
  }, [messages])

  const onAtBottomChange = React.useCallback((bottom: boolean) => {
    setAtBottom(bottom)
  }, [])

  React.useEffect(() => {
    if (!busy) return
    if (rows.length === 0) return
    setAtBottom(true)
    requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({
        index: rows.length - 1,
        align: 'end',
      })
    })
  }, [busy, rows])

  const Scroller = React.useCallback(
    (props: React.HTMLAttributes<HTMLDivElement>) => (
      <div
        {...props}
        className={cn(props.className, 'no-scrollbar chat-fade-bottom')}
      />
    ),
    [],
  )

  if (rows.length === 0 && !busy) {
    return (
      <ChatEmptyState agentName={agentName} onPromptSelect={onPromptSelect} />
    )
  }

  return (
    <div
      className="relative flex-1 h-full min-h-0"
      aria-busy={busy}
      aria-live="polite"
      aria-relevant="additions text"
    >
      <Virtuoso
        ref={virtuosoRef}
        style={{ height: '100%' }}
        data={rows}
        computeItemKey={(_, row) => (row.kind === 'pending' ? `pending-${row.id}` : row.message.id)}
        followOutput={atBottom ? 'smooth' : false}
        atBottomStateChange={onAtBottomChange}
        initialTopMostItemIndex={Math.max(0, rows.length - 1)}
        components={{ Scroller }}
        itemContent={(_index, row) => {
          if (row.kind === 'pending') {
            return (
              <div className="mx-auto flex w-full max-w-3xl flex-col px-4 sm:px-6 py-2">
                <div className="flex items-center gap-2 self-start text-xs text-muted-foreground">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-muted-foreground opacity-50" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  </span>
                  <span>Waiting for response…</span>
                </div>
              </div>
            )
          }
          const message = row.message
          return (
            <div className="mx-auto flex w-full max-w-3xl flex-col px-4 sm:px-6 py-2">
              {message.role === 'user' ? (
                <UserMessage
                  key={message.id}
                  message={message}
                  agentId={agentId ?? ''}
                />
              ) : (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  agentId={agentId ?? ''}
                  className={
                    freshIds.has(message.id)
                      ? 'animate-in fade-in-0 slide-in-from-bottom-2 duration-200'
                      : undefined
                  }
                />
              )}
            </div>
          )
        }}
      />
      {compaction || retry ? (
        <div className="absolute top-2 inset-x-0 z-10 mx-auto max-w-3xl px-4 sm:px-6">
          <ActiveStateBanners
            compaction={compaction}
            retry={retry}
            onCancel={onCancel ?? (() => {})}
          />
        </div>
      ) : null}
    </div>
  )
}
