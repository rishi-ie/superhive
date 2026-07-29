import type { InternalWake, InternalWakeQueue } from '../ports'

export class FakeWakeQueue implements InternalWakeQueue {
  readonly wakes: InternalWake[] = []

  async enqueue(wake: InternalWake): Promise<void> {
    if (!this.wakes.some((candidate) => candidate.id === wake.id)) this.wakes.push(wake)
  }

  async cancel(predicate: (wake: InternalWake) => boolean): Promise<void> {
    const kept = this.wakes.filter((wake) => !predicate(wake))
    this.wakes.splice(0, this.wakes.length, ...kept)
  }

  pending(agentId: string): readonly InternalWake[] {
    return this.wakes.filter((wake) => wake.agentId === agentId)
  }
}

