import { randomUUID } from 'node:crypto'
import type { AdapterEvent, PiProtocolAdapter, UsageSnapshot } from './types'
import { matchBootStep } from './types'

export class RawTextAdapter implements PiProtocolAdapter {
  private lineBuffer = ''
  private currentMessageId: string | null = null
  private toolCallIds = new Map<number, string>()
  private streamedAssistantContent = false
  private sawNativeThinking = false

  onStdout(chunk: string, emit: (event: AdapterEvent) => void): void {
    this.lineBuffer += chunk
    const lines = this.lineBuffer.split('\n')
    this.lineBuffer = lines.pop() ?? ''

    for (const raw of lines) {
      const line = raw.trim()
      if (!line) continue

      let parsed: unknown = null
      try {
        parsed = JSON.parse(line)
      } catch {
        emit({ type: 'log', stream: 'stdout', line })
      }

      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>
        if (obj.type === 'agent_start') {
          // Current Pi RPC emits this before any assistant content. Starting
          // here makes the renderer show the live working state immediately.
          this.ensureAssistantMessage(emit)
        } else if (obj.type === 'message_start') {
          if (messageRole(obj) === 'assistant') this.ensureAssistantMessage(emit)
        } else if (obj.type === 'message_update') {
          const ev = obj.assistantMessageEvent as Record<string, unknown> | undefined
          const eventType = typeof ev?.type === 'string' ? ev.type : ''
          if (eventType.startsWith('text_') || eventType.startsWith('thinking_') || eventType.startsWith('toolcall_')) {
            this.streamedAssistantContent = true
          }
          if (ev?.type === 'text_start') {
            if (!this.currentMessageId) {
              this.currentMessageId = randomUUID()
              emit({ type: 'message-start', messageId: this.currentMessageId, role: 'assistant' })
            }
            emit({
              type: 'text-start',
              messageId: this.currentMessageId,
              contentIndex: typeof ev.contentIndex === 'number' ? ev.contentIndex : 0,
            })
          }
          if (ev?.type === 'text_delta') {
            if (!this.currentMessageId) {
              this.currentMessageId = randomUUID()
              emit({ type: 'message-start', messageId: this.currentMessageId, role: 'assistant' })
            }
            emit({
              type: 'text-delta',
              messageId: this.currentMessageId,
              delta: (ev.delta as string) ?? '',
            })
          }
          if (ev?.type === 'text_end') {
            if (!this.currentMessageId) return
            emit({
              type: 'text-end',
              messageId: this.currentMessageId,
              contentIndex: typeof ev.contentIndex === 'number' ? ev.contentIndex : 0,
              content: (ev.content as string) ?? '',
            })
          }
          if (ev?.type === 'thinking_start') {
            this.sawNativeThinking = true
            if (!this.currentMessageId) {
              this.currentMessageId = randomUUID()
              emit({ type: 'message-start', messageId: this.currentMessageId, role: 'assistant' })
            }
            emit({
              type: 'thinking-start',
              messageId: this.currentMessageId,
              contentIndex: typeof ev.contentIndex === 'number' ? ev.contentIndex : 0,
            })
          }
          if (ev?.type === 'thinking_delta') {
            this.sawNativeThinking = true
            if (!this.currentMessageId) {
              this.currentMessageId = randomUUID()
              emit({ type: 'message-start', messageId: this.currentMessageId, role: 'assistant' })
            }
            emit({
              type: 'thinking-delta',
              messageId: this.currentMessageId,
              contentIndex: typeof ev.contentIndex === 'number' ? ev.contentIndex : 0,
              delta: (ev.delta as string) ?? '',
            })
          }
          if (ev?.type === 'thinking_end') {
            this.sawNativeThinking = true
            if (!this.currentMessageId) {
              this.currentMessageId = randomUUID()
              emit({ type: 'message-start', messageId: this.currentMessageId, role: 'assistant' })
            }
            emit({
              type: 'thinking-end',
              messageId: this.currentMessageId,
              contentIndex: typeof ev.contentIndex === 'number' ? ev.contentIndex : 0,
              content: (ev.content as string) ?? '',
            })
          }
          if (ev?.type === 'toolcall_start') {
            if (!this.currentMessageId) {
              this.currentMessageId = randomUUID()
              emit({ type: 'message-start', messageId: this.currentMessageId, role: 'assistant' })
            }
            const contentIndex = typeof ev.contentIndex === 'number' ? ev.contentIndex : 0
            const toolCall = toolCallFromEvent(ev)
            const toolCallId = stringValue(toolCall?.id) ?? stringValue(ev.toolCallId) ?? randomUUID()
            this.toolCallIds.set(contentIndex, toolCallId)
            emit({
              type: 'tool-call-start',
              messageId: this.currentMessageId,
              toolCallId,
              name: stringValue(toolCall?.name) ?? stringValue(ev.name) ?? '',
              contentIndex,
            })
          }
          if (ev?.type === 'toolcall_delta') {
            if (!this.currentMessageId) return
            const contentIndex = typeof ev.contentIndex === 'number' ? ev.contentIndex : 0
            emit({
              type: 'tool-call-delta',
              messageId: this.currentMessageId,
              toolCallId: stringValue(ev.toolCallId) ?? this.toolCallIds.get(contentIndex) ?? '',
              delta: (ev.delta as string) ?? '',
            })
          }
          if (ev?.type === 'toolcall_end') {
            if (!this.currentMessageId) return
            const contentIndex = typeof ev.contentIndex === 'number' ? ev.contentIndex : 0
            const toolCall = toolCallFromEvent(ev)
            const toolCallId = stringValue(toolCall?.id) ?? stringValue(ev.toolCallId) ?? this.toolCallIds.get(contentIndex) ?? ''
            this.toolCallIds.delete(contentIndex)
            emit({
              type: 'tool-call-end',
              messageId: this.currentMessageId,
              toolCallId,
              name: stringValue(toolCall?.name) ?? stringValue(ev.name) ?? '',
              args: toolCall?.arguments ?? ev.args,
            })
          }
          this.maybeEmitUsage(ev, emit)
        } else if (obj.type === 'tool_execution_start') {
          emit({
            type: 'tool-execution-start',
            toolCallId: (obj.toolCallId as string) ?? randomUUID(),
            name: stringValue(obj.toolName) ?? stringValue(obj.name) ?? '',
            args: obj.args,
          })
        } else if (obj.type === 'tool_execution_update') {
          emit({
            type: 'tool-execution-update',
            toolCallId: (obj.toolCallId as string) ?? '',
            partialResult: obj.partialResult,
          })
        } else if (obj.type === 'tool_execution_end') {
          emit({
            type: 'tool-execution-end',
            toolCallId: (obj.toolCallId as string) ?? '',
            name: stringValue(obj.toolName) ?? stringValue(obj.name) ?? '',
            result: obj.result,
            isError: obj.isError === true,
          })
        } else if (obj.type === 'compaction_start') {
          const reason: 'manual' | 'threshold' | 'overflow' =
            obj.reason === 'manual' || obj.reason === 'threshold' || obj.reason === 'overflow'
              ? obj.reason
              : 'threshold'
          emit({ type: 'compaction-start', reason })
        } else if (obj.type === 'compaction_end') {
          const reason: 'manual' | 'threshold' | 'overflow' =
            obj.reason === 'manual' || obj.reason === 'threshold' || obj.reason === 'overflow'
              ? obj.reason
              : 'threshold'
          emit({
            type: 'compaction-end',
            reason,
            result: obj.result,
            aborted: obj.aborted === true,
            willRetry: obj.willRetry === true,
          })
        } else if (obj.type === 'auto_retry_start') {
          emit({
            type: 'auto-retry-start',
            attempt: typeof obj.attempt === 'number' ? obj.attempt : 1,
            maxAttempts: typeof obj.maxAttempts === 'number' ? obj.maxAttempts : 1,
            delayMs: typeof obj.delayMs === 'number' ? obj.delayMs : 0,
            errorMessage: (obj.errorMessage as string) ?? '',
          })
        } else if (obj.type === 'auto_retry_end') {
          emit({
            type: 'auto-retry-end',
            success: obj.success === true,
            attempt: typeof obj.attempt === 'number' ? obj.attempt : 1,
            finalError: typeof obj.finalError === 'string' ? obj.finalError : undefined,
          })
        } else if (obj.type === 'agent_end') {
          // End of the agent run. Always close our assistant slot.
          if (this.currentMessageId) {
            emit({ type: 'message-end', messageId: this.currentMessageId })
            this.currentMessageId = null
            this.toolCallIds.clear()
          }
          // Surface "response fully written" to the renderer so it can
          // show the per-message footer (copy + timestamp + usage).
          // Per-turn `message-end`s freeze their rows individually; only
          // `agent_end` says the entire prompt response is complete.
          emit({ type: 'agent-end' })
        } else if (obj.type === 'message_end') {
          // Pi emits message_end for every message in its protocol —
          // assistant, toolResult, and user. We only want to close our
          // assistant slot when the closing event is for the assistant
          // turn. Otherwise, a toolResult message_end mid-turn would
          // reset currentMessageId and the next text_start would create
          // a brand-new (split) assistant message — turning a single
          // Pi turn into N+1 AssistantMessage rows, each with its own
          // Indicator, Completion, and footer.
          const role = messageRole(obj)
          if (role === 'assistant' && this.currentMessageId) {
            this.emitFinalThinking(obj.message, emit)
            if (!this.streamedAssistantContent && !this.emitDirectAssistantContent(obj.message, emit)) {
              emit({
                type: 'error',
                message: 'The selected provider returned an empty response. Verify its model and credentials, then retry.',
                recoverable: true,
              })
            }
            emit({ type: 'message-end', messageId: this.currentMessageId })
            console.info('[pi-protocol] assistant response', {
              contentTypes: contentTypes(obj.message),
              nativeThinking: this.sawNativeThinking,
            })
            this.currentMessageId = null
            this.toolCallIds.clear()
            this.streamedAssistantContent = false
            this.sawNativeThinking = false
          }
        } else if (obj.type === 'response' && obj.success === false) {
			const messageId = this.ensureAssistantMessage(emit)
          emit({
            type: 'error',
            message: (obj.error as string) ?? 'Unknown error from Pi',
            recoverable: true,
          })
			emit({ type: 'message-end', messageId })
			this.currentMessageId = null
			this.toolCallIds.clear()
			emit({ type: 'agent-end' })
        }
      }
    }
  }

  onStderr(chunk: string, emit: (event: AdapterEvent) => void): void {
    for (const raw of chunk.split('\n')) {
      const line = raw.trim()
      if (!line) continue
      emit({ type: 'log', stream: 'stderr', line })
      const step = matchBootStep(line)
      if (step) emit({ type: 'boot-step', step })
    }
  }

  serializeInput(text: string): string {
    return JSON.stringify({ type: 'prompt', message: text }) + '\n'
  }

  reset(): void {
    this.lineBuffer = ''
    this.currentMessageId = null
    this.toolCallIds.clear()
    this.streamedAssistantContent = false
    this.sawNativeThinking = false
  }

  private ensureAssistantMessage(emit: (event: AdapterEvent) => void): string {
    if (!this.currentMessageId) {
      this.currentMessageId = randomUUID()
      this.streamedAssistantContent = false
      this.sawNativeThinking = false
      emit({ type: 'message-start', messageId: this.currentMessageId, role: 'assistant' })
    }
    return this.currentMessageId
  }

  private emitDirectAssistantContent(message: unknown, emit: (event: AdapterEvent) => void): boolean {
    if (!this.currentMessageId || !message || typeof message !== 'object') return false
    const content = (message as { content?: unknown }).content
    if (!Array.isArray(content)) return false
    let emitted = false
    for (const [contentIndex, part] of content.entries()) {
      if (!part || typeof part !== 'object') continue
      const value = part as Record<string, unknown>
      if (value.type !== 'text' || typeof value.text !== 'string' || !value.text) continue
      emit({ type: 'text-delta', messageId: this.currentMessageId, delta: value.text })
      emit({ type: 'text-end', messageId: this.currentMessageId, contentIndex, content: value.text })
      emitted = true
    }
    return emitted
  }

  private emitFinalThinking(message: unknown, emit: (event: AdapterEvent) => void): void {
    if (!this.currentMessageId || this.sawNativeThinking || !message || typeof message !== 'object') return
    const content = (message as { content?: unknown }).content
    if (!Array.isArray(content)) return
    for (const [contentIndex, part] of content.entries()) {
      if (!part || typeof part !== 'object') continue
      const value = part as Record<string, unknown>
      if (value.type !== 'thinking' || typeof value.thinking !== 'string' || !value.thinking) continue
      this.sawNativeThinking = true
      emit({ type: 'thinking-start', messageId: this.currentMessageId, contentIndex })
      emit({ type: 'thinking-delta', messageId: this.currentMessageId, contentIndex, delta: value.thinking })
      emit({ type: 'thinking-end', messageId: this.currentMessageId, contentIndex, content: value.thinking })
    }
  }

  private maybeEmitUsage(
    ev: Record<string, unknown> | undefined,
    emit: (event: AdapterEvent) => void,
  ): void {
    const partial = ev?.partial as Record<string, unknown> | undefined
    const u = partial?.usage as Record<string, unknown> | undefined
    if (!u) return
    const input = typeof u.input === 'number' ? u.input : 0
    const total = typeof u.totalTokens === 'number' ? u.totalTokens : 0
    if (input <= 0 && total <= 0) return
    const usage: UsageSnapshot = {
      input,
      output: typeof u.output === 'number' ? u.output : 0,
      cacheRead: typeof u.cacheRead === 'number' ? u.cacheRead : 0,
      cacheWrite: typeof u.cacheWrite === 'number' ? u.cacheWrite : 0,
      totalTokens: total,
    }
    emit({ type: 'usage', usage })
  }
}

function contentTypes(message: unknown): string[] {
  if (!message || typeof message !== 'object') return []
  const content = (message as { content?: unknown }).content
  return Array.isArray(content)
    ? content.flatMap((part) => part && typeof part === 'object' && typeof (part as { type?: unknown }).type === 'string' ? [(part as { type: string }).type] : [])
    : []
}

function messageRole(value: Record<string, unknown>): string | undefined {
  const message = value.message
  if (!message || typeof message !== 'object') return undefined
  const role = (message as { role?: unknown }).role
  return typeof role === 'string' ? role : undefined
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function toolCallFromEvent(event: Record<string, unknown>): Record<string, unknown> | undefined {
  if (event.toolCall && typeof event.toolCall === 'object') {
    return event.toolCall as Record<string, unknown>
  }
  const partial = event.partial as { content?: unknown[] } | undefined
  const index = typeof event.contentIndex === 'number' ? event.contentIndex : -1
  const item = index >= 0 ? partial?.content?.[index] : undefined
  return item && typeof item === 'object' ? item as Record<string, unknown> : undefined
}
