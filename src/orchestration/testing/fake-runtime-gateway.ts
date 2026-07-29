import type {
  AgentRuntimeGateway,
  AgentRuntimeSnapshot,
  InternalWake,
  SafeRuntimeEvent,
} from '../ports'

export class FakeRuntimeGateway implements AgentRuntimeGateway {
  readonly states = new Map<string, AgentRuntimeSnapshot>()
  readonly wakes: InternalWake[] = []
  readonly listeners = new Map<string, Set<(event: SafeRuntimeEvent) => void>>()

  async getStatus(agentId: string): Promise<AgentRuntimeSnapshot | null> {
    return this.states.get(agentId) ?? null
  }

  async start(agentId: string): Promise<void> {
    this.states.set(agentId, { agentId, status: 'active' })
  }

  async stop(agentId: string): Promise<void> {
    this.states.set(agentId, { agentId, status: 'idle' })
  }

  async enqueueInternalWake(wake: InternalWake): Promise<void> {
    this.wakes.push(wake)
  }

  subscribe(agentId: string, listener: (event: SafeRuntimeEvent) => void): () => void {
    const listeners = this.listeners.get(agentId) ?? new Set()
    listeners.add(listener)
    this.listeners.set(agentId, listeners)
    return () => listeners.delete(listener)
  }
}

