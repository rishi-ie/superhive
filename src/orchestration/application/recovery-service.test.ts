import { describe, expect, test } from 'bun:test'
import type {
  OrchestrationCommandEnvelope,
  ProposePlanPayload,
} from '../domain/commands'
import { createOrchestrationScenario } from '../testing'
import { RecoveryService } from './recovery-service'

const coordinator = {
  agentId: 'coord',
  displayName: 'Project Agent',
  role: 'coordinator' as const,
  projectId: 'project',
}

function command<T>(
  id: string,
  type: OrchestrationCommandEnvelope['type'],
  payload: T,
): OrchestrationCommandEnvelope<T> {
  return { schemaVersion: 1, id, type, submittedAt: 1, projectId: 'project', payload }
}

describe('RecoveryService', () => {
  test('wakes the coordinator when approved queued work stalled without an iteration', async () => {
    const scenario = createOrchestrationScenario()
    await scenario.service.execute(command<ProposePlanPayload>('plan-command', 'plan.propose', {
      goal: 'Run work',
      summary: 'One task',
      assumptions: [],
      constraints: [],
      tasks: [{
        key: 'task',
        title: 'Task',
        objective: 'Do the work',
        deliverables: ['result'],
        definitionOfDone: ['result exists'],
        dependencies: [],
      }],
    }), coordinator)
    const plan = [...scenario.recordStore.plans.values()][0]!
    await scenario.service.approvePlan('project', plan.id)
    scenario.wakeQueue.wakes.length = 0

    await new RecoveryService(scenario.dependencies).recoverProject('project')

    expect(scenario.wakeQueue.wakes).toEqual([
      expect.objectContaining({
        agentId: 'coord',
        reason: 'resume_after_restart',
        projectId: 'project',
      }),
    ])
  })
})
