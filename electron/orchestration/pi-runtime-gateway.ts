import type {
  AgentRuntimeGateway,
  AgentRuntimeSnapshot,
  InternalWake,
  SafeRuntimeEvent,
} from '../../src/orchestration/ports'
import { runtime } from '../general-kai-runtime'
import { startManagedAgent } from '../ipc/runtime'

export class PiRuntimeGateway implements AgentRuntimeGateway {
  async getStatus(agentId: string): Promise<AgentRuntimeSnapshot | null> {
    const status = runtime.getStatusPayload(agentId)
    return status
      ? { agentId, status: status.status, lastError: status.lastError }
      : null
  }

  async start(agentId: string): Promise<void> {
    await startManagedAgent(agentId)
  }

  async stop(agentId: string): Promise<void> {
    runtime.abortTurn(agentId)
  }

  async enqueueInternalWake(wake: InternalWake): Promise<void> {
    const sent = runtime.sendInternal(wake.agentId, internalWakePrompt(wake))
    if (!sent) throw new Error(`Could not deliver internal wake to ${wake.agentId}`)
  }

  subscribe(_agentId: string, _listener: (event: SafeRuntimeEvent) => void): () => void {
    // Runtime IPC remains the live renderer stream. The wake queue polls the
    // serializable runtime state, so this port needs no second event bus yet.
    return () => undefined
  }
}

function internalWakePrompt(wake: InternalWake): string {
  const refs = [
    `project=${wake.projectId}`,
    wake.taskId ? `task=${wake.taskId}` : '',
    wake.iterationId ? `iteration=${wake.iterationId}` : '',
    wake.messageId ? `message=${wake.messageId}` : '',
  ].filter(Boolean).join(' ')
  return `[Super Hive internal event: ${wake.reason}] ${refs}. Use the orchestration tools to read durable state and continue.`
}
