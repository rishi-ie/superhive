import { describe, expect, test } from 'bun:test'
import { resolvePolicy } from './policies'
import { transitionIteration, transitionProject, transitionTask } from './transitions'

describe('orchestration domain', () => {
  test('enforces legal state transitions', () => {
    expect(transitionProject('planning', 'awaiting_approval')).toBe('awaiting_approval')
    expect(transitionTask('reviewing', 'completed')).toBe('completed')
    expect(transitionIteration('reported', 'accepted')).toBe('accepted')
    expect(() => transitionIteration('accepted', 'running')).toThrow('Illegal iteration transition')
  })

  test('resolves policy overrides without mutating defaults', () => {
    const policy = resolvePolicy(undefined, {
      execution: { maxParallelIterations: 2 },
      communication: { allowWorkerToWorker: false },
    })
    expect(policy.execution.maxParallelIterations).toBe(2)
    expect(policy.communication.allowWorkerToWorker).toBe(false)
    expect(policy.iterations.maxIterationsPerTask).toBe(5)
  })
})

