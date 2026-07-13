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

export interface RuntimeMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
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
