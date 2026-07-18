import * as React from 'react'
import { UserMessage } from './UserMessage'
import { AssistantMessage } from './AssistantMessage'
import { cn } from '@/lib/utils'
import { ActiveStateBanners } from './ActiveStateBanners'
import { ChatEmptyState } from './SuggestedPrompts'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import type { RuntimeMessage } from '@/types/electron'

interface ConversationAreaProps {
  messages: RuntimeMessage[]
  busy?: boolean
  compaction?: import('@/models/runtime').CompactionStatus
  retry?: import('@/models/runtime').RetryStatus
  onCancel?: () => void
  agentId?: string
  agentName?: string
  onPromptSelect?: (prompt: string) => void
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
}: ConversationAreaProps) {
  const virtuosoRef = React.useRef<VirtuosoHandle | null>(null)
  const [atBottom, setAtBottom] = React.useState(true)
  const seenIdsRef = React.useRef<Set<string>>(new Set())
  const [freshIds, setFreshIds] = React.useState<Set<string>>(new Set())

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
    if (messages.length === 0) return
    setAtBottom(true)
    requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        align: 'end',
      })
    })
  }, [busy, messages])

  const Scroller = React.useCallback(
    (props: React.HTMLAttributes<HTMLDivElement>) => (
      <div
        {...props}
        className={cn(props.className, 'no-scrollbar chat-fade-bottom')}
      />
    ),
    [],
  )

  if (messages.length === 0 && !busy) {
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
        data={messages}
        computeItemKey={(_, m) => m.id}
        followOutput={atBottom ? 'smooth' : false}
        atBottomStateChange={onAtBottomChange}
        initialTopMostItemIndex={Math.max(0, messages.length - 1)}
        components={{ Scroller }}
        itemContent={(index, message) => (
          <div
            className={
              index === messages.length - 1
                ? 'mx-auto flex w-full max-w-3xl flex-col px-4 sm:px-6 py-2'
                : 'mx-auto flex w-full max-w-3xl flex-col px-4 sm:px-6 py-2'
            }
          >
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
        )}
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
