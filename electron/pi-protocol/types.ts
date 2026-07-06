import { matchBootStep as _matchBootStep } from '../../src/types/init-steps'

export type InitStep =
  | 'installing-deps'
  | 'building-runtime'
  | 'generating-manifest'
  | 'creating-workspace'
  | 'launching-runtime'
  | 'connecting-chat'
  | 'ready'

export type AdapterEvent =
  | { type: 'text-delta'; messageId: string; delta: string }
  | { type: 'message-start'; messageId: string; role: 'user' | 'assistant' }
  | { type: 'message-end'; messageId: string }
  | { type: 'boot-step'; step: InitStep }
  | { type: 'ready' }
  | { type: 'log'; stream: 'stdout' | 'stderr'; line: string }
  | { type: 'error'; message: string; recoverable: boolean }

export interface PiProtocolAdapter {
  onStdout(chunk: string, emit: (event: AdapterEvent) => void): void
  onStderr(chunk: string, emit: (event: AdapterEvent) => void): void
  serializeInput(text: string): string
  reset(): void
}

export { _matchBootStep as matchBootStep }