import { describe, expect, test } from 'bun:test'
import type {
  AgentRuntimeGateway,
  AgentRuntimeSnapshot,
  InternalWake,
  SafeRuntimeEvent,
} from '../../src/orchestration/ports'
import { RuntimeInternalWakeQueue } from './internal-wake-queue'

class Runtime implements AgentRuntimeGateway {
  state: AgentRuntimeSnapshot | null = null
  starts = 0
  wakes: InternalWake[] = []

  async getStatus() { return this.state }
  async start(agentId: string) {
    this.starts += 1
    this.state = { agentId, status: 'active' }
  }
  async stop() {}
  async enqueueInternalWake(wake: InternalWake) { this.wakes.push(wake) }
  subscribe(_agentId: string, _listener: (event: SafeRuntimeEvent) => void) {
    return () => undefined
  }
}

describe('RuntimeInternalWakeQueue', () => {
  test('starts an idle worker and immediately delivers its assignment wake', async () => {
    const runtime = new Runtime()
    const queue = new RuntimeInternalWakeQueue(runtime)
    const wake: InternalWake = {
      id: 'assignment',
      agentId: 'worker',
      reason: 'assignment_ready',
      projectId: 'project',
      taskId: 'task',
      iterationId: 'iteration',
    }

    await queue.enqueue(wake)

    expect(runtime.starts).toBe(1)
    expect(runtime.wakes).toEqual([wake])
    expect(queue.pending('worker')).toEqual([])
  })
})
