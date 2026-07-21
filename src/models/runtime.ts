import type { InitStep, UsageSnapshot, ContextSnapshot, ModelInfo } from '../../electron/pi-protocol/types'
export type { InitStep, UsageSnapshot, ContextSnapshot, ModelInfo } from '../../electron/pi-protocol/types'
export type { AdapterEvent } from '../../electron/pi-protocol/types'
import type { AgentStatus } from '../storage/types'
export type { AgentStatus } from '../storage/types'

/**
 * One structured piece of an assistant message. A message is a sequence of
 * content parts (text, thinking, tool call, tool result, image, …) instead of
 * a single concatenated string. Order is significant — the renderer walks
 * `parts` in order and emits a UI card per part type.
 */
export type ContentPart =
  | { type: 'text'; text: string; state?: 'streaming' | 'complete' }
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
  | { type: 'image'; data: string; mimeType: string }
  | {
      type: 'compaction-summary'
      tokensBefore: number
      summary: string
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

/** Per-turn usage snapshot the assistant reports on `message_end`. Optional
 *  because not every model/extension emits it. */
export interface MessageUsage {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  totalTokens: number
  /** Cost in USD, when the provider reports it. */
  cost?: number
}

export interface RuntimeMessage {
  id: string
  role: 'user' | 'assistant'
  parts: ContentPart[]
  ts: number
  usage?: MessageUsage
}

/**
 * Concatenate every text part of a message in order, separated by `\n\n`.
 * This is the cheap display path: a user message is always one text part, so
 * `getMessageText(msg)` returns the user's literal text; an assistant message
 * returns the prose-only view (thinking/tool calls/results excluded) for
 * backward-compatible rendering until Phase 4 ships per-part cards.
 */
export function getMessageText(message: RuntimeMessage): string {
  const out: string[] = []
  for (const part of message.parts) {
    if (part.type === 'text' || part.type === 'thinking') {
      out.push(part.text)
    }
  }
  return out.join('\n\n')
}

/** Cheap, monotonically-changing string used to detect a streaming tail.
 *  Reads the last part's text (or empty) — incrementing on every delta. */
export function getMessageTailFingerprint(message: RuntimeMessage): string {
  const last = message.parts[message.parts.length - 1]
  if (!last) return ''
  if (last.type === 'text' || last.type === 'thinking') return last.text
  return `__${last.type}`
}

/**
 * Convert whatever shape the runtime emitted for a partial / final tool result
 * into the discriminated `ToolResultContent[]` shape persisted on the message.
 * Defaults to a single text entry — adequate for the common string result
 * shape and until Phase 6 (diff view) replaces it with a real diff parser.
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
    // Pi already-shape payloads: { type: 'diff', path, oldText, newText }
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
    // { type: 'truncation', path, reason, totalLines, shownLines }
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
    // { text }
    if (typeof obj.text === 'string') return [{ type: 'text', text: obj.text }]
    // { content: string | string[] }
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
 * Returns true when the message is still being constructed — any part is in a
 * streaming/pending state, or a tool call has been dispatched but its result
 * has not yet arrived.
 */
export function isMessageInFlight(message: RuntimeMessage): boolean {
  for (const part of message.parts) {
    if (part.type === 'text' || part.type === 'thinking') {
      if (part.state === 'streaming') return true
    }
    if (part.type === 'tool-call') {
      if (part.state !== 'complete') return true
      // Args complete — check if the matching result has arrived and is complete
      const hasResult = message.parts.some(
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
 * Falls back to message.ts if no per-part startedAt is tracked.
 */
export function getMessageStartedAt(message: RuntimeMessage): number {
  return message.ts
}

/**
 * Returns a human-readable summary of in-flight tool calls, e.g. "Running 3 tools…"
 * or null when no tools are currently executing.
 */
export function getActiveToolSummary(message: RuntimeMessage): string | null {
  const inFlight = message.parts.filter(
    (p): p is Extract<ContentPart, { type: 'tool-call' }> =>
      p.type === 'tool-call' && p.state !== 'complete',
  )
  if (inFlight.length === 0) return null
  return `Running ${inFlight.length} tool${inFlight.length === 1 ? '' : 's'}…`
}

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
  | { kind: 'finalize-message'; agentId: string; messageId: string }
  | { kind: 'increment-inflight'; agentId: string; delta: number }
  | {
      kind: 'set-messages'
      agentId: string
      messages: RuntimeMessage[]
    }
  | {
      kind: 'append-compaction-summary'
      agentId: string
      summary: string
      tokensBefore: number
    }

/** Read-only view the queue needs of a runtime slice, used to apply ops. */
export interface RuntimeSliceView {
  messages: RuntimeMessage[]
  inFlightToolCount: number
}

/** The accessor the queue calls at tick time to read+notify a slice. */
export interface SliceAccessor {
  slice: RuntimeSliceView
  notify: () => void
}

export type AccessorFn = (agentId: string) => SliceAccessor | null
