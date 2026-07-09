import type { InitStep } from '../../electron/pi-protocol/types'
export type { InitStep } from '../../electron/pi-protocol/types'
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
}

export interface RuntimeExitPayload {
  agentId: string
  code: number | null
  signal: string | null
  status: 'stopped' | 'idle' | 'error'
}
