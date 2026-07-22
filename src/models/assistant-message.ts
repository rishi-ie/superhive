/**
 * SuperHive Chat Runtime v2 — persisted assistant message shape.
 *
 * This is the single source of truth for the on-disk representation of an
 * assistant turn in `chat.jsonl`. The runtime never writes streaming or
 * in-flight state to disk: every `AssistantMessage` written here is
 * finalized, with a complete activity timeline and a frozen response.
 *
 * The lifecycle is:
 *   1. The runtime emits `message-start` → `message-end` over IPC.
 *   2. The renderer's queue collects the events into a
 *      `RuntimeAssistantState` (in-memory only, never persisted).
 *   3. On `message-end`, the queue freezes the timeline + response and
 *      constructs an `AssistantMessage`.
 *   4. The renderer calls `agents.persistAssistantMessage(id, message)` →
 *      main process appends to `chat.jsonl` in one atomic write.
 *   5. On conversation reload, `readAll` reads back `AssistantMessage[]`.
 *      The renderer renders state 2 directly from this shape — no
 *      runtime replay, no execution reconstruction.
 *
 * Two distinct fields:
 *   - `activityTimeline`: ordered, append-only, typed list of execution
 *     metadata. Never interleaved with prose. Renders above.
 *   - `response`: the assistant's prose text. Renders below the timeline.
 *     Streams live during execution, but invisible in state 1.
 */

import type { MessageUsage } from './runtime'

// ---------------------------------------------------------------------------
// Activity timeline — execution metadata
// ---------------------------------------------------------------------------

export type TimelineItem =
  | ThinkingTimelineItem
  | ToolCallTimelineItem
  | PlanningTimelineItem
  | SystemTimelineItem
  | WarningTimelineItem
  | ErrorTimelineItem
  | CompletionTimelineItem

export interface ThinkingTimelineItem {
  kind: 'thinking'
  id: string
  text: string
  state: 'streaming' | 'complete'
  /** Wall-clock ms when thinking-start arrived. */
  startedAt: number
  /** Wall-clock ms when thinking-end arrived. 0 while still streaming. */
  endedAt: number
}

export interface ToolCallTimelineItem {
  kind: 'tool-call'
  id: string
  toolName: string
  state: 'pending' | 'streaming-args' | 'complete'
  /** Wall-clock ms when tool-call-start arrived. */
  startedAt: number
  /** Wall-clock ms when tool-call-end arrived. null while still streaming. */
  endedAt: number | null
}

/**
 * Reserved for a future "Planning" item type. The spec defines seven item
 * kinds; we define the type for forward compatibility but never emit one
 * from the queue today.
 */
export interface PlanningTimelineItem {
  kind: 'planning'
  id: string
  text: string
}

/**
 * Reserved for a future "System" item type (e.g. compaction summaries).
 * Defined for forward compatibility; not emitted by the queue today.
 */
export interface SystemTimelineItem {
  kind: 'system'
  id: string
  message: string
}

export interface WarningTimelineItem {
  kind: 'warning'
  id: string
  /** Human-readable warning text. */
  message: string
}

export interface ErrorTimelineItem {
  kind: 'error'
  id: string
  /** Human-readable error text. */
  message: string
}

export interface CompletionTimelineItem {
  kind: 'completion'
  id: string
}

// ---------------------------------------------------------------------------
// Response blocks — assistant prose
// ---------------------------------------------------------------------------

/**
 * One block of the assistant's response. The response is a sequence of
 * blocks (e.g. text + image + a compaction summary card). The renderer
 * streams `state: 'streaming'` blocks live but hides them in state 1.
 *
 * Why a list and not a single string: the assistant can include image
 * attachments inline, and the response can be interleaved with system
 * cards (e.g. "Context compacted" summary cards). A flat list captures
 * both without forcing a shape mismatch.
 */
/**
 * A block of the assistant's prose response. Renders BELOW or BETWEEN
 * timeline items depending on chronological order — see `AssistantMessage`
 * for the interleaving logic.
 *
 * Every variant carries `startedAt` (wall-clock ms). The renderer sorts
 * timeline items and response blocks together by this field to preserve
 * the order in which Pi emitted them, so prose that arrived between
 * two thinking/tool-call rounds renders between them in the lineage.
 */
export type ResponseBlock =
  | { type: 'text'; text: string; state: 'streaming' | 'complete'; startedAt: number }
  | { type: 'image'; data: string; mimeType: string; startedAt: number }
  | { type: 'compaction-summary'; tokensBefore: number; summary: string; startedAt: number }

// ---------------------------------------------------------------------------
// Persisted assistant message
// ---------------------------------------------------------------------------

/**
 * Persisted metadata about the run that produced this message. Kept narrow
 * today — model name + usage snapshot + total wall-clock duration — but
 * designed to absorb future fields without a schema migration.
 */
export interface AssistantMessageMetadata {
  /** Active model at message-end (provider/name). */
  model?: { provider: string; name: string }
  /** Token usage snapshot reported on message-end. */
  usage?: MessageUsage
  /** Total wall-clock ms from user-send to message-end. Used by the thinking
   *  duration label ("▶ Thought (3.2s)"). */
  totalDurationMs?: number
}

/**
 * One finalized assistant turn. The single on-disk shape for assistant
 * messages in `chat.jsonl`. See file header for the lifecycle.
 */
export interface AssistantMessage {
  id: string
  role: 'assistant'
  /** Wall-clock ms at message-start (== user-send time). */
  timestamp: number
  /** Ordered execution metadata. Renders ABOVE / BETWEEN the response
   *  blocks depending on `startedAt` — see AssistantMessage for the
   *  chronological interleaving logic. */
  activityTimeline: TimelineItem[]
  /** Assistant prose. Sorted with `activityTimeline` by `startedAt` to
   *  preserve chronological order; renderer interleaves them in one list. */
  response: ResponseBlock[]
  metadata: AssistantMessageMetadata
}

// ---------------------------------------------------------------------------
// User message
// ---------------------------------------------------------------------------

/**
 * Persisted shape for a user turn. Stays simple — single text block plus
 * timestamp. User messages persist immediately on send; they never go
 * through the runtime queue.
 */
export interface UserMessage {
  id: string
  role: 'user'
  timestamp: number
  text: string
}

// ---------------------------------------------------------------------------
// Persisted chat row — the on-disk union
// ---------------------------------------------------------------------------

/**
 * One line in `chat.jsonl`. The main process writes rows of this union;
 * the renderer reads back the same union. Order in the file matches
 * conversation order.
 *
 * Note: `RuntimeAssistantState` (the in-flight renderer shape) is NOT
 * part of this union — it's a separate per-agent slot in the runtime
 * slice. Disk only holds finalized rows.
 */
export type ChatRow = UserMessage | AssistantMessage

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Cheap fingerprint used to detect a streaming response tail. Mirrors the
 * pre-v2 `getMessageTailFingerprint` so conversation-area scroll-anchor
 * logic keeps working.
 */
export function getAssistantMessageTailFingerprint(message: AssistantMessage): string {
  const last = message.response[message.response.length - 1]
  if (!last) return ''
  if (last.type === 'text') return last.text
  return `__${last.type}`
}

/**
 * Concatenate every text block of the response in order, separated by
 * `\n\n`. Used by `copyMessage` for the copy-to-clipboard flow.
 */
export function getAssistantMessageText(message: AssistantMessage): string {
  const out: string[] = []
  for (const block of message.response) {
    if (block.type === 'text') out.push(block.text)
  }
  return out.join('\n\n')
}

/**
 * Returns true when any block in the response is still streaming. Used to
 * distinguish state 1 (live) from state 2 (frozen).
 */
export function isAssistantMessageInFlight(message: AssistantMessage): boolean {
  for (const block of message.response) {
    if (block.type === 'text' && block.state === 'streaming') return true
  }
  for (const item of message.activityTimeline) {
    if (item.kind === 'planning' || item.kind === 'system' || item.kind === 'warning' || item.kind === 'error' || item.kind === 'completion') continue
    if (item.state === 'streaming' || item.state === 'pending' || item.state === 'streaming-args') {
      return true
    }
  }
  return false
}
