import type { AgentActivitySnapshot } from '../domain/entities'
import type { InternalWake } from './wake-queue'

export interface AgentRuntimeSnapshot {
  agentId: string
  status: 'idle' | 'active' | 'busy' | 'waiting'
  lastError?: string
}

export interface SafeRuntimeEvent {
  agentId: string
  type: 'status' | 'activity' | 'exit'
  activity?: AgentActivitySnapshot
}

export interface AgentRuntimeGateway {
  getStatus(agentId: string): Promise<AgentRuntimeSnapshot | null>
  start(agentId: string): Promise<void>
  stop(agentId: string): Promise<void>
  enqueueInternalWake(wake: InternalWake): Promise<void>
  subscribe(agentId: string, listener: (event: SafeRuntimeEvent) => void): () => void
}

