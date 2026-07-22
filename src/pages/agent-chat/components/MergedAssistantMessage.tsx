import { AssistantMessage } from './AssistantMessage'
import type { AssistantMessage as PersistedAssistantMessage } from '@/models/assistant-message'

interface MergedAssistantMessageProps {
  /** Two or more consecutive AssistantMessage rows that should render
   *  as one. ConversationArea groups them upstream so we don't end up
   *  with N footers and N "Finished" markers for what is logically
   *  one user prompt response. */
  messages: PersistedAssistantMessage[]
  agentId: string
  className?: string
  /**
   * Forwarded to the inner `AssistantMessage`. When true, the
   * per-message footer (copy + timestamp + usage) is suppressed
   * even for already-frozen rows — only clears once the agent's
   * entire response has been written (see
   * `RuntimeSlice.agentResponseActive`).
   */
  agentResponseActive?: boolean
}

/**
 * Combine N consecutive AssistantMessage rows into one synthetic
 * AssistantMessage and delegate to the existing component.
 *
 * Why at the renderer level: Pi's agent-loop protocol emits one
 * message_start/message_end pair per turn, so a single user prompt
 * with N turns lands as N rows in `slice.messages`. Each row carries
 * its own indicator, completion marker, and footer — that's the bug
 * the user reported. Merging at the renderer hides the artifact
 * without losing the turn boundaries in the on-disk `chat.jsonl`,
 * which future features may want.
 *
 * The AssistantMessage already handles chronological interleaving of
 * activityTimeline + response via `startedAt`, so concatenating both
 * arrays and letting the existing sort handle ordering gives the
 * correct visual.
 */
export function MergedAssistantMessage({
  messages,
  agentId,
  className,
  agentResponseActive = false,
}: MergedAssistantMessageProps) {
  if (messages.length === 1) {
    return (
      <AssistantMessage
        message={messages[0]!}
        agentId={agentId}
        className={className}
        agentResponseActive={agentResponseActive}
      />
    )
  }

  const first = messages[0]!
  const last = messages[messages.length - 1]!

  // Compute the merged turn duration from absolute timestamps so the
  // thinking label ("Thought (N.Ns)") reflects the whole prompt response,
  // not just the last sub-segment.
  const lastEndedAt = last.timestamp + (last.metadata.totalDurationMs ?? 0)
  const mergedTotalDurationMs = Math.max(0, lastEndedAt - first.timestamp)

  const merged: PersistedAssistantMessage = {
    ...first,
    activityTimeline: messages.flatMap((m) => m.activityTimeline),
    response: messages.flatMap((m) => m.response),
    metadata: {
      ...last.metadata,
      totalDurationMs: mergedTotalDurationMs,
    },
  }

  return (
    <AssistantMessage
      message={merged}
      agentId={agentId}
      className={className}
      agentResponseActive={agentResponseActive}
    />
  )
}