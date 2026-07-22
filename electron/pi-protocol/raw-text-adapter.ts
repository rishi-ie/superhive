import { randomUUID } from 'node:crypto'
import type { AdapterEvent, PiProtocolAdapter, UsageSnapshot } from './types'
import { matchBootStep } from './types'

export class RawTextAdapter implements PiProtocolAdapter {
  private lineBuffer = ''
  private currentMessageId: string | null = null

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
        if (obj.type === 'message_update') {
          const ev = obj.assistantMessageEvent as Record<string, unknown> | undefined
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
            emit({
              type: 'tool-call-start',
              messageId: this.currentMessageId,
              toolCallId: (ev.toolCallId as string) ?? randomUUID(),
              name: (ev.name as string) ?? '',
              contentIndex: typeof ev.contentIndex === 'number' ? ev.contentIndex : 0,
            })
          }
          if (ev?.type === 'toolcall_delta') {
            if (!this.currentMessageId) return
            emit({
              type: 'tool-call-delta',
              messageId: this.currentMessageId,
              toolCallId: (ev.toolCallId as string) ?? '',
              delta: (ev.delta as string) ?? '',
            })
          }
          if (ev?.type === 'toolcall_end') {
            if (!this.currentMessageId) return
            emit({
              type: 'tool-call-end',
              messageId: this.currentMessageId,
              toolCallId: (ev.toolCallId as string) ?? '',
              name: (ev.name as string) ?? '',
              args: ev.args,
            })
          }
          this.maybeEmitUsage(ev, emit)
        } else if (obj.type === 'tool_execution_start') {
          emit({
            type: 'tool-execution-start',
            toolCallId: (obj.toolCallId as string) ?? randomUUID(),
            name: (obj.name as string) ?? '',
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
          const role = (obj as { message?: { role?: string } }).message?.role
          if (role === 'assistant' && this.currentMessageId) {
            emit({ type: 'message-end', messageId: this.currentMessageId })
            this.currentMessageId = null
          }
        } else if (obj.type === 'response' && obj.success === false) {
          emit({
            type: 'error',
            message: (obj.error as string) ?? 'Unknown error from Pi',
            recoverable: true,
          })
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