import log from 'electron-log/main'
import type {
  AgentRuntimeGateway,
  InternalWake,
  InternalWakeQueue,
} from '../../src/orchestration/ports'

const RETRY_MS = 500
const WAKE_PRIORITY: Record<InternalWake['reason'], number> = {
  worker_result: 0,
  command_rejected: 1,
  assignment_ready: 2,
  worker_question: 3,
  user_decision: 4,
  plan_approved: 5,
  resume_after_restart: 6,
  agent_message: 7,
}

export class RuntimeInternalWakeQueue implements InternalWakeQueue {
  private readonly queues = new Map<string, InternalWake[]>()
  private readonly timers = new Map<string, NodeJS.Timeout>()
  private readonly delivered = new Set<string>()

  constructor(private readonly runtime: AgentRuntimeGateway) {}

  async enqueue(wake: InternalWake): Promise<void> {
    if (this.delivered.has(wake.id)) return
    const queue = this.queues.get(wake.agentId) ?? []
    if (!queue.some((candidate) => candidate.id === wake.id)) queue.push(wake)
    queue.sort((left, right) => WAKE_PRIORITY[left.reason] - WAKE_PRIORITY[right.reason])
    this.queues.set(wake.agentId, queue)
    await this.drain(wake.agentId)
  }

  async cancel(predicate: (wake: InternalWake) => boolean): Promise<void> {
    for (const [agentId, queue] of this.queues) {
      this.queues.set(agentId, queue.filter((wake) => !predicate(wake)))
    }
  }

  pending(agentId: string): readonly InternalWake[] {
    return this.queues.get(agentId) ?? []
  }

  private async drain(agentId: string): Promise<void> {
    if (this.timers.has(agentId)) return
    const queue = this.queues.get(agentId)
    if (!queue?.length) return
    try {
      let state = await this.runtime.getStatus(agentId)
      if (!state || state.status === 'idle') {
        await this.runtime.start(agentId)
        state = await this.runtime.getStatus(agentId)
      }
      if (state?.status === 'busy' || state?.status === 'waiting') {
        this.schedule(agentId)
        return
      }
      const wake = queue[0]!
      await this.runtime.enqueueInternalWake(wake)
      queue.shift()
      this.delivered.add(wake.id)
      if (queue.length) this.schedule(agentId)
    } catch (error) {
      log.warn(`[orchestration:wake] delivery failed for ${agentId}:`, error)
      this.schedule(agentId)
    }
  }

  private schedule(agentId: string): void {
    if (this.timers.has(agentId)) return
    const timer = setTimeout(() => {
      this.timers.delete(agentId)
      void this.drain(agentId)
    }, RETRY_MS)
    this.timers.set(agentId, timer)
  }
}
