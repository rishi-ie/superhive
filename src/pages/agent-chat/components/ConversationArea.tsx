import * as React from 'react'
import { UserMessage } from './UserMessage'
import { AssistantMessage } from './AssistantMessage'
import { MergedAssistantMessage } from './MergedAssistantMessage'
import { cn } from '@/lib/utils'
import { ActiveStateBanners } from './ActiveStateBanners'
import { ChatEmptyState } from './SuggestedPrompts'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import type { AssistantMessage as PersistedAssistantMessage, ChatRow } from '@/models/assistant-message'
import type { RuntimeAssistantState } from '@/models/runtime'
import { isMessageInFlight } from '@/models/runtime'

type Row =
  | { kind: 'message'; message: ChatRow }                       // user message (non-assistant) only
  | { kind: 'merged-assistant'; messages: PersistedAssistantMessage[] }
  | { kind: 'in-flight'; message: RuntimeAssistantState }
  | { kind: 'pending'; id: string; startedAt: number }

interface ConversationAreaProps {
  messages: ChatRow[]
  inFlight?: RuntimeAssistantState | null
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
  /**
   * True from the first assistant `message-start` until the next
   * `agent-end`. Forwards into `AssistantMessage`'s footer gate so
   * the per-message footer (copy + timestamp + usage) only appears
   * after the agent's *entire* response has been written. Stays true
   * across turns in a multi-turn response — only `agent-end` clears
   * it.
   */
  agentResponseActive?: boolean
}

export function ConversationArea({
  messages,
  inFlight = null,
  busy = false,
  compaction,
  retry,
  onCancel,
  agentId,
  agentName,
  onPromptSelect,
  pendingTurn = null,
  agentResponseActive = false,
}: ConversationAreaProps) {
  const virtuosoRef = React.useRef<VirtuosoHandle | null>(null)
  const [atBottom, setAtBottom] = React.useState(true)
  const seenIdsRef = React.useRef<Set<string>>(new Set())
  const [freshIds, setFreshIds] = React.useState<Set<string>>(new Set())

  const rows: Row[] = React.useMemo(() => {
    const out: Row[] = []

    // Walk the message list and collapse consecutive AssistantMessage
    // rows into a single `merged-assistant` row. Pi's agent-loop emits
    // one message_start/message_end pair per turn, so a single user
    // prompt can land as N AssistantMessage rows in `slice.messages`.
    // Merging here gives the user one indicator + one footer +
    // interleaved prose per prompt response. User messages and any
    // other role break the chain (each renders individually).
    let i = 0
    while (i < messages.length) {
      const m = messages[i]!
      if (m.role !== 'assistant') {
        out.push({ kind: 'message', message: m })
        i++
        continue
      }
      const group: PersistedAssistantMessage[] = [m as PersistedAssistantMessage]
      let j = i + 1
      while (j < messages.length && messages[j]!.role === 'assistant') {
        group.push(messages[j]! as PersistedAssistantMessage)
        j++
      }
      out.push({ kind: 'merged-assistant', messages: group })
      i = j
    }

    // If there's an in-flight message AND no finalized row already carries
    // that id, render it as a virtual trailing row. The frozen AssistantMessage
    // already includes the in-flight id once `finalize-message` lands, so
    // `set-messages` clears the slot.
    const inFlightId = inFlight?.id
    const alreadyInMessages =
      inFlightId !== undefined && messages.some((m) => m.id === inFlightId)
    if (inFlight && !alreadyInMessages) {
      out.push({ kind: 'in-flight', message: inFlight })
    }

    // If the tail is an in-flight assistant message (either via `inFlight`
    // slot OR a finalized row whose id matches the live in-flight), the
    // AssistantMessage component is already rendering the chain. Don't
    // stack a "Waiting for response…" placeholder on top.
    const tail = out[out.length - 1]
    const tailIsInFlightAssistant =
      tail?.kind === 'in-flight' && isMessageInFlight(tail.message)

    if (pendingTurn && !tailIsInFlightAssistant) {
      out.push({
        kind: 'pending',
        id: pendingTurn.userMessageId,
        startedAt: pendingTurn.startedAt,
      })
    }
    return out
  }, [messages, inFlight, pendingTurn])

  React.useEffect(() => {
    const currentIds = new Set<string>()
    for (const m of messages) currentIds.add(m.id)
    if (inFlight) currentIds.add(inFlight.id)
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
  }, [messages, inFlight])

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
        computeItemKey={(_, row) => {
          if (row.kind === 'pending') return `pending-${row.id}`
          if (row.kind === 'in-flight') return `inflight-${row.message.id}`
          if (row.kind === 'merged-assistant') return `merged-${row.messages[0]!.id}`
          return row.message.id
        }}
        followOutput={atBottom ? 'smooth' : false}
        atBottomStateChange={onAtBottomChange}
        initialTopMostItemIndex={Math.max(0, rows.length - 1)}
        components={{ Scroller }}
        itemContent={(_index, row) => {
          if (row.kind === 'pending') {
            return (
              <div className="mx-auto flex w-full max-w-4xl flex-col px-4 sm:px-6 py-2">
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
          if (row.kind === 'in-flight') {
            return (
              <div className="mx-auto flex w-full max-w-4xl flex-col px-4 sm:px-6 py-2">
                <AssistantMessage
                  key={row.message.id}
                  message={row.message}
                  agentId={agentId ?? ''}
                  agentResponseActive={agentResponseActive}
                  className={
                    freshIds.has(row.message.id)
                      ? 'animate-in fade-in-0 slide-in-from-bottom-2 duration-200'
                      : undefined
                  }
                />
              </div>
            )
          }
          if (row.kind === 'merged-assistant') {
            // Animate-in if any of the merged messages is fresh.
            const isFresh = row.messages.some((m) => freshIds.has(m.id))
            return (
              <div className="mx-auto flex w-full max-w-4xl flex-col px-4 sm:px-6 py-2">
                <MergedAssistantMessage
                  messages={row.messages}
                  agentId={agentId ?? ''}
                  agentResponseActive={agentResponseActive}
                  className={
                    isFresh
                      ? 'animate-in fade-in-0 slide-in-from-bottom-2 duration-200'
                      : undefined
                  }
                />
              </div>
            )
          }
          // kind: 'message' — user messages only (assistant rows were
          // collapsed into `merged-assistant` upstream).
          const userMessage = row.message as Extract<ChatRow, { role: 'user' }>
          return (
            <div className="mx-auto flex w-full max-w-4xl flex-col px-4 sm:px-6 py-2">
              <UserMessage
                key={userMessage.id}
                message={userMessage}
                agentId={agentId ?? ''}
              />
            </div>
          )
        }}
      />
      {compaction || retry ? (
        <div className="absolute top-2 inset-x-0 z-10 mx-auto max-w-4xl px-4 sm:px-6">
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
