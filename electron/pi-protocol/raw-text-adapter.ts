import { randomUUID } from 'node:crypto'
import type { AdapterEvent, PiProtocolAdapter } from './types'
import { matchBootStep } from './types'

export class RawTextAdapter implements PiProtocolAdapter {
  private lineBuffer = ''
  private currentMessageId: string | null = null
  private bootDone = false

  onStdout(chunk: string, emit: (event: AdapterEvent) => void): void {
    this.lineBuffer += chunk
    const lines = this.lineBuffer.split('\n')
    this.lineBuffer = lines.pop() ?? ''

    for (const raw of lines) {
      const line = raw.trim()
      if (!line) continue

      let parsed: any = null
      try {
        parsed = JSON.parse(line)
      } catch {
        emit({ type: 'log', stream: 'stdout', line })
      }

      if (parsed && typeof parsed === 'object') {
        if (
          parsed.type === 'message_update' &&
          parsed.assistantMessageEvent?.type === 'text_delta'
        ) {
          if (!this.currentMessageId) {
            this.currentMessageId = randomUUID()
            emit({ type: 'message-start', messageId: this.currentMessageId, role: 'assistant' })
          }
          emit({
            type: 'text-delta',
            messageId: this.currentMessageId,
            delta: parsed.assistantMessageEvent.delta ?? '',
          })
        } else if (parsed.type === 'agent_end' || parsed.type === 'message_end') {
          if (this.currentMessageId) {
            emit({ type: 'message-end', messageId: this.currentMessageId })
            this.currentMessageId = null
          }
        } else if (parsed.type === 'response' && parsed.success === false) {
          emit({
            type: 'error',
            message: parsed.error ?? 'Unknown error from Pi',
            recoverable: true,
          })
        }
      }

      if (!this.bootDone) {
        this.bootDone = true
        emit({ type: 'boot-step', step: 'ready' })
        emit({ type: 'ready' })
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
    this.bootDone = false
  }
}