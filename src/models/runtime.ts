/**
 * Runtime domain shapes — the renderer-side per-agent runtime state.
 *
 * SuperHive Chat Runtime v2:
 *   - `RuntimeAssistantState` is the ephemeral in-memory shape the queue
 *     mutates while Pi is streaming. **Never persisted.** Lives only in
 *     `slice.inFlight`; cleared on dispose.
 *   - `AssistantMessage` is the persisted shape (see `./assistant-message`).
 *   - The on-disk shape and the runtime shape are distinct objects; the
 *     freeze step on `message-end` is the one-shot builder that converts
 *     one into the other.
 *
 * Two persist routes:
 *   - User messages persist immediately on send (handled by main process).
 *   - Assistant messages persist only on `message-end`, in one atomic write
 *     carrying the finalized `AssistantMessage` — fired by the renderer's
 *     `agents.persistAssistantMessage` IPC after `buildAssistantMessage`.
 *
 * Phase BD scope:
 *   - `RuntimeAssistantState` no longer carries the legacy `parts +
 *     lineage + lineageFrozen` triplet. Only `parts` survives (as the
 *     queue's internal mutation target — never persisted). The new fields
 *     `activityTimeline + response + frozen + totalDurationMs + usage`
 *     are the source of truth for state 1 / state 2.
 *   - `RuntimeSliceView.messages` is now finalized-only `ChatRow[]`.
 *     The live in-flight shape lives in `RuntimeSliceView.inFlight`.
 */

import type { InitStep, UsageSnapshot, ContextSnapshot, ModelInfo } from '../../electron/pi-protocol/types'
export type { InitStep, UsageSnapshot, ContextSnapshot, ModelInfo } from '../../electron/pi-protocol/types'
export type { AdapterEvent } from '../../electron/pi-protocol/types'
import type { AgentStatus } from '../storage/types'
export type { AgentStatus } from '../storage/types'
import type { TimelineItem, ResponseBlock } from './assistant-message'
export type { TimelineItem, ResponseBlock } from './assistant-message'
export type { AssistantMessage, AssistantMessageMetadata } from './assistant-message'
export type { ChatRow, UserMessage } from './assistant-message'

/**
 * Per-turn usage snapshot the assistant reports on `message_end`. Optional
 * because not every model/extension emits it.
 */
export interface MessageUsage {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  totalTokens: number
  /** Cost in USD, when the provider reports it. */
  cost?: number
}

// ---------------------------------------------------------------------------
// ContentPart — internal queue mutation target
// ---------------------------------------------------------------------------

/**
 * One structured piece of an assistant message in flight. The queue
 * mutates these as Pi streams events. **Internal to the queue pipeline;
 * never reaches disk.** The freeze step on `message-end` reads from
 * `RuntimeAssistantState.parts` only to derive the `activityTimeline`
 * (thinking + tool-call rows) and `response` (text + image + compaction
 * blocks) before discarding the parts array.
 *
 * `startedAt` on text / image / compaction-summary is captured when the
 * part is first appended. It flows through to the corresponding
 * ResponseBlock so the renderer can interleave prose and timeline items
 * by chronological order.
 */
export type ContentPart =
  | { type: 'text'; text: string; state?: 'streaming' | 'complete'; startedAt: number }
  | {
      type: 'thinking'
      text: string
      state: 'streaming' | 'complete'
    }
  | {
      type: 'tool-call'
      id: string
      name: string
      args: unknown
      state: 'pending' | 'streaming-args' | 'complete'
    }
  | {
      type: 'tool-result'
      id: string
      name: string
      result: ToolResultContent[]
      isError: boolean
      state: 'pending' | 'streaming' | 'complete'
    }
  | { type: 'image'; data: string; mimeType: string; startedAt: number }
  | {
      type: 'compaction-summary'
      tokensBefore: number
      summary: string
      startedAt: number
    }

/**
 * Body of a `tool-result` part. Pi reports results as either text, a unified diff,
 * a truncation marker, or an image. The renderer picks a card style per entry.
 */
export type ToolResultContent =
  | { type: 'text'; text: string }
  | {
      type: 'diff'
      path: string
      oldText: string
      newText: string
    }
  | {
      type: 'truncation'
      path: string
      reason: 'lineLimit' | 'byteLimit' | 'binary'
      totalLines: number
      shownLines: number
    }

// ---------------------------------------------------------------------------
// RuntimeAssistantState — ephemeral in-flight shape
// ---------------------------------------------------------------------------

/**
 * The runtime's per-message workspace while Pi is streaming. Lives only
 * in `slice.inFlight`; cleared on freeze. Never serialized to `chat.jsonl`.
 *
 * Phase BD: this is the live in-memory workspace. The queue mutates
 * `parts` (internal mutation target) + `activityTimeline` + `response`
 * as events arrive. The freeze step (`freezeAssistantState`) seals
 * everything, computes `totalDurationMs`, and hands the state to
 * `buildAssistantMessage` which produces the persisted shape.
 */
export interface RuntimeAssistantState {
  id: string
  ts: number
  role: 'user' | 'assistant'
  /**
   * Internal queue mutation target. The freeze step derives the
   * persisted shape from this. **Never persisted.** Tool-result parts
   * live here only (UI drops them per spec).
   */
  parts: ContentPart[]
  /**
   * Live activity timeline. Populated by the queue ops in lock-step
   * with `parts`. This is the source of truth for the state-1 / state-2
   * chain display.
   */
  activityTimeline: TimelineItem[]
  /**
   * Live response blocks. Populated by the queue ops. Streams
   * alongside `parts` but stays hidden in state 1.
   */
  response: ResponseBlock[]
  /**
   * Total wall-clock duration in ms. Set by the freeze step on
   * `message-end`. Surfaced as the `▶ Thought (3.2s)` label.
   */
  totalDurationMs?: number
  /**
   * True once the queue has frozen the message. Read by
   * `isMessageInFlight` (returns false when true) and by the UI to
   * switch between state 1 (live) and state 2 (finalized).
   */
  frozen?: boolean
  /** Per-turn usage snapshot the assistant reports on `message_end`. */
  usage?: MessageUsage
}

/** Back-compat alias for code that still imports the old name. */
export type RuntimeMessage = RuntimeAssistantState

// ---------------------------------------------------------------------------
// Pure helpers — used by freeze step + queue pipeline
// ---------------------------------------------------------------------------

/**
 * Convert whatever shape the runtime emitted for a partial / final tool
 * result into the discriminated `ToolResultContent[]` shape persisted on
 * the message.
 */
export function normalizeToolResult(raw: unknown): ToolResultContent[] {
  if (raw == null) return [{ type: 'text', text: '' }]
  if (typeof raw === 'string') return [{ type: 'text', text: raw }]
  if (Array.isArray(raw)) {
    const out: ToolResultContent[] = []
    for (const item of raw) {
      out.push(...normalizeToolResult(item))
    }
    return out
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (obj.type === 'diff' && typeof obj.path === 'string') {
      return [
        {
          type: 'diff',
          path: obj.path,
          oldText: typeof obj.oldText === 'string' ? obj.oldText : '',
          newText: typeof obj.newText === 'string' ? obj.newText : '',
        },
      ]
    }
    if (obj.type === 'truncation' && typeof obj.path === 'string') {
      const reason =
        obj.reason === 'lineLimit' || obj.reason === 'byteLimit' || obj.reason === 'binary'
          ? obj.reason
          : 'lineLimit'
      return [
        {
          type: 'truncation',
          path: obj.path,
          reason,
          totalLines: typeof obj.totalLines === 'number' ? obj.totalLines : 0,
          shownLines: typeof obj.shownLines === 'number' ? obj.shownLines : 0,
        },
      ]
    }
    if (typeof obj.text === 'string') return [{ type: 'text', text: obj.text }]
    if (typeof obj.content === 'string') return [{ type: 'text', text: obj.content }]
    if (Array.isArray(obj.content)) {
      const out: ToolResultContent[] = []
      for (const item of obj.content) out.push(...normalizeToolResult(item))
      return out
    }
  }
  return [{ type: 'text', text: String(raw) }]
}

/**
 * Returns true when the runtime state is still being constructed — any
 * part is in a streaming/pending state, or a tool call has been
 * dispatched but its result has not yet arrived.
 */
export function isMessageInFlight(state: RuntimeAssistantState): boolean {
  if (state.frozen) return false
  for (const part of state.parts) {
    if (part.type === 'text' || part.type === 'thinking') {
      if (part.state === 'streaming') return true
    }
    if (part.type === 'tool-call') {
      if (part.state !== 'complete') return true
      const hasResult = state.parts.some(
        (p) =>
          p.type === 'tool-result' &&
          p.id === part.id &&
          p.state === 'complete',
      )
      if (!hasResult) return true
    }
    if (part.type === 'tool-result') {
      if (part.state === 'pending' || part.state === 'streaming') return true
    }
  }
  return false
}

/**
 * Returns the timestamp (ms epoch) at which this message started arriving.
 * Falls back to `Date.now()` when no per-part start is tracked.
 */
export function getMessageStartedAt(state: RuntimeAssistantState): number {
  return state.ts
}

/**
 * Returns a human-readable summary of in-flight tool calls, e.g.
 * "Running 3 tools…" or null when no tools are currently executing.
 */
export function getActiveToolSummary(state: RuntimeAssistantState): string | null {
  const inFlight = state.parts.filter(
    (p): p is Extract<ContentPart, { type: 'tool-call' }> =>
      p.type === 'tool-call' && p.state !== 'complete',
  )
  if (inFlight.length === 0) return null
  return `Running ${inFlight.length} tool${inFlight.length === 1 ? '' : 's'}…`
}

/**
 * Cheap, monotonically-changing string used to detect a streaming tail.
 * Reads the last text part's text (or empty) — increments on every delta.
 *
 * Works on the in-memory `parts` array (ephemeral). The persisted
 * `AssistantMessage` has its own `getAssistantMessageTailFingerprint`.
 */
export function getMessageTailFingerprint(state: RuntimeAssistantState): string {
  const last = state.parts[state.parts.length - 1]
  if (!last) return ''
  if (last.type === 'text' || last.type === 'thinking') return last.text
  return `__${last.type}`
}

/**
 * Concatenate every text part of the in-memory state in order,
 * separated by `\n\n`. Used by `copyMessage` while a message is still
 * streaming (before freeze).
 */
export function getMessageText(state: RuntimeAssistantState): string {
  const out: string[] = []
  for (const part of state.parts) {
    if (part.type === 'text' || part.type === 'thinking') {
      out.push(part.text)
    }
  }
  return out.join('\n\n')
}

// ---------------------------------------------------------------------------
// Live-status payloads (status / exit / retry / compaction)
// ---------------------------------------------------------------------------

/** Active compaction metadata — emitted on `compaction-start`, cleared on `compaction-end`. */
export interface CompactionStatus {
  reason: 'manual' | 'threshold' | 'overflow'
  startedAt: number
}

/** Active auto-retry metadata — emitted on `auto-retry-start`, cleared on `auto-retry-end`. */
export interface RetryStatus {
  attempt: number
  maxAttempts: number
  delayMs: number
  errorMessage: string
  startedAt: number
}

export interface RuntimeStatusPayload {
  agentId: string
  status: AgentStatus
  pid?: number
  startedAt?: number
  endedAt?: number
  lastError?: string
  bootStep?: InitStep
  usage?: UsageSnapshot
  contextUsage?: ContextSnapshot
  availableModels?: ModelInfo[]
  activeModelContextWindow?: number
  activeModelName?: string
  activeModelProvider?: string
  /** Live compaction state; absent unless compaction is currently active. */
  compaction?: CompactionStatus
  /** Live auto-retry state; absent unless retry is currently in flight. */
  retry?: RetryStatus
}

export interface RuntimeExitPayload {
  agentId: string
  code: number | null
  signal: string | null
  /** Exits only happen when there is no live runtime, so the agent lands in `idle`. */
  status: 'idle'
}

// ---------------------------------------------------------------------------
// Stream queue ops (renderer-side pipeline)
// ---------------------------------------------------------------------------

/**
 * The per-agent stream queue's discriminated ops. The queue batches
 * high-frequency `AdapterEvent` mutations and applies them on a 50ms
 * tick so the renderer re-renders once per tick instead of once per
 * event. See `src/flows/agents/runtime/queue.ts` for the queue
 * mechanics and `event-translator.ts` for the event → op mapping.
 */
export type StreamOp =
  | {
      kind: 'message-start'
      agentId: string
      messageId: string
      role: 'user' | 'assistant'
    }
  | {
      /**
       * End of the agent's response to the current user prompt. Bridge
       * of Pi's `agent_end` event through the runtime pipeline. The
       * queue flips `agentResponseActive` to false on this op so the
       * chat footer (copy + timestamp + usage) becomes visible.
       */
      kind: 'agent-end'
      agentId: string
    }
  | { kind: 'append-part'; agentId: string; messageId: string; part: ContentPart }
  | {
      kind: 'append-delta'
      agentId: string
      messageId: string
      partType: 'text' | 'thinking'
      delta: string
    }
  | {
      kind: 'append-tool-call-delta'
      agentId: string
      messageId: string
      toolCallId: string
      delta: string
    }
  | {
      kind: 'finalize-part'
      agentId: string
      messageId: string
      partType: 'text' | 'thinking'
      content?: string
    }
  | {
      kind: 'finalize-tool-call'
      agentId: string
      messageId: string
      toolCallId: string
      args: unknown
    }
  | {
      kind: 'finalize-tool-result'
      agentId: string
      toolCallId: string
      result: ToolResultContent[]
      isError: boolean
    }
  | {
      kind: 'finalize-message'
      agentId: string
      messageId: string
      model?: { provider: string; name: string }
      usage?: MessageUsage
    }
  | {
      kind: 'set-frozen'
      agentId: string
      messageId: string
    }
  | { kind: 'increment-inflight'; agentId: string; delta: number }
  | {
      kind: 'set-messages'
      agentId: string
      messages: import('./assistant-message').ChatRow[]
    }
  | {
      kind: 'append-compaction-summary'
      agentId: string
      summary: string
      tokensBefore: number
    }
  | {
      kind: 'append-error'
      agentId: string
      messageId: string
      message: string
      recoverable: boolean
    }

/** Slice fields the queue reads (and writes — the queue is the single
 *  writer of `messages` + `inFlight` + `inFlightToolCount` and also
 *  reads+clears `lastResponseStart` when applying a `message-start` op).
 *
 * Phase BD: split into finalized `ChatRow[]` (persisted) + a separate
 * `inFlight` slot for the live in-memory `RuntimeAssistantState`.
 */
export interface RuntimeSliceView {
  messages: import('./assistant-message').ChatRow[]
  inFlight: RuntimeAssistantState | null
  inFlightToolCount: number
  lastResponseStart: number | null
  /**
   * True from the first assistant `message-start` until the next
   * `agent-end`. See `RuntimeSlice.agentResponseActive`.
   */
  agentResponseActive: boolean
}

/** The accessor the queue calls at tick time to read+notify a slice. */
export interface SliceAccessor {
  slice: RuntimeSliceView
  notify: () => void
}

export type AccessorFn = (agentId: string) => SliceAccessor | null
