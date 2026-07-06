import { randomUUID } from 'node:crypto'
import type { AdapterEvent, PiProtocolAdapter } from './types'
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
        if (
          obj.type === 'message_update' &&
          (obj.assistantMessageEvent as Record<string, unknown> | undefined)?.type === 'text_delta'
        ) {
          if (!this.currentMessageId) {
            this.currentMessageId = randomUUID()
            emit({ type: 'message-start', messageId: this.currentMessageId, role: 'assistant' })
          }
          emit({
            type: 'text-delta',
            messageId: this.currentMessageId,
            delta: ((obj.assistantMessageEvent as Record<string, unknown>)?.delta as string) ?? '',
          })
        } else if (obj.type === 'agent_end' || obj.type === 'message_end') {
          if (this.currentMessageId) {
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
}