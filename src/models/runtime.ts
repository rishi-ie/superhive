import type { InitStep, UsageSnapshot, ContextSnapshot, ModelInfo } from '../../electron/pi-protocol/types'
export type { InitStep, UsageSnapshot, ContextSnapshot, ModelInfo } from '../../electron/pi-protocol/types'
export { INIT_STEPS } from '../../electron/pi-protocol/types'

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

export interface RuntimeStatusPayload {
  agentId: string
  status: 'initializing' | 'running' | 'busy' | 'idle' | 'stopped' | 'error'
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
}

export interface RuntimeExitPayload {
  agentId: string
  code: number | null
  signal: string | null
  status: 'stopped' | 'idle' | 'error'
}
