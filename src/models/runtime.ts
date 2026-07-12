import type { InitStep, UsageSnapshot, ContextSnapshot, ModelInfo } from '../../electron/pi-protocol/types'
export type { InitStep, UsageSnapshot, ContextSnapshot, ModelInfo } from '../../electron/pi-protocol/types'
export { INIT_STEPS } from '../../electron/pi-protocol/types'

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
