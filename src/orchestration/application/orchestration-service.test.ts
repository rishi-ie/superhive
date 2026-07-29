import { describe, expect, test } from 'bun:test'
import type {
  DispatchIterationPayload,
  OrchestrationCommandEnvelope,
  ProposePlanPayload,
  ReportResultPayload,
  ReviewIterationPayload,
  SendMessagePayload,
} from '../domain/commands'
import { createOrchestrationScenario } from '../testing'
import { OrchestrationService } from './orchestration-service'

const coordinator = {
  agentId: 'coord',
  displayName: 'Project Agent',
  role: 'coordinator' as const,
  projectId: 'project',
}

const worker = {
  agentId: 'worker-1',
  displayName: 'Worker One',
  role: 'worker' as const,
  projectId: 'project',
}

function command<T>(
  id: string,
  type: OrchestrationCommandEnvelope['type'],
  payload: T,
): OrchestrationCommandEnvelope<T> {
  return { schemaVersion: 1, id, type, submittedAt: 1, projectId: 'project', payload }
}

describe('OrchestrationService', () => {
  test('runs propose → approve → dispatch → result → review with durable lineage', async () => {
    const scenario = createOrchestrationScenario()
    const proposed = await scenario.service.execute(command<ProposePlanPayload>('cmd-plan', 'plan.propose', {
      goal: 'Test the hypothesis',
      summary: 'Run one bounded experiment',
      assumptions: [],
      constraints: ['Keep raw data'],
      tasks: [{
        key: 'experiment',
        title: 'Run experiment',
        objective: 'Produce baseline metrics',
        deliverables: ['metrics.json'],
        definitionOfDone: ['Metrics are reproducible'],
        dependencies: [],
      }],
    }), coordinator)
    expect(proposed.ok).toBe(true)

    const plan = [...scenario.recordStore.plans.values()][0]!
    await scenario.service.approvePlan('project', plan.id)
    const task = plan.tasks[0]!
    const dispatched = await scenario.service.execute(command<DispatchIterationPayload>('cmd-dispatch', 'iteration.dispatch', {
      packet: {
        schemaVersion: 2,
        projectId: 'project',
        planId: plan.id,
        planVersion: plan.version,
        taskId: task.id,
        coordinatorAgentId: 'coord',
        workerAgentId: 'worker-1',
        workerProfileId: 'general-worker',
        objective: task.objective,
        deliverables: task.deliverables,
        definitionOfDone: task.definitionOfDone,
        constraints: [],
        decisions: [],
        inputs: [],
        dependencyOutputs: [],
        permittedCommunication: { projectAgentId: 'coord', workerIds: ['worker-1', 'worker-2'] },
      },
    }), coordinator)
    expect(dispatched.ok).toBe(true)
    expect(scenario.wakeQueue.wakes.some((wake) => wake.reason === 'assignment_ready')).toBe(true)

    const iteration = [...scenario.recordStore.iterations.values()][0]!
    const question = await scenario.service.execute(command<SendMessagePayload>('cmd-question', 'message.send', {
      blocksWork: true,
      message: {
        role: 'project-channel',
        recipients: [{ kind: 'project-agent', id: 'coord', displayName: 'Project Agent' }],
        kind: 'question',
        text: 'Which baseline should I use?',
        taskId: task.id,
        iterationId: iteration.id,
      },
    }), worker)
    expect(question.ok).toBe(true)
    expect((await scenario.service.getProjectSnapshot('project')).taskStatuses[task.id]).toBe('waiting')

    await scenario.service.execute(command<SendMessagePayload>('cmd-answer', 'message.send', {
      message: {
        role: 'project-channel',
        recipients: [{ kind: 'worker', id: 'worker-1', displayName: 'Worker One' }],
        kind: 'answer',
        text: 'Use the frozen control baseline.',
        taskId: task.id,
        iterationId: iteration.id,
        replyToMessageId: question.recordId,
      },
    }), coordinator)
    expect((await scenario.service.getProjectSnapshot('project')).taskStatuses[task.id]).toBe('running')

    const result = await scenario.service.execute(command<ReportResultPayload>('cmd-result', 'iteration.result', {
      result: {
        schemaVersion: 1,
        projectId: 'project',
        taskId: task.id,
        iterationId: iteration.id,
        status: 'success',
        summary: 'Metrics reproduced',
        deliverables: [{ label: 'metrics', path: 'metrics.json' }],
        evidence: [{ kind: 'test', label: 'reproduction', value: 'pass' }],
        remainingRisks: [],
        questions: [],
      },
    }), worker)
    expect(result.ok).toBe(true)

    const reviewed = await scenario.service.execute(command<ReviewIterationPayload>('cmd-review', 'iteration.review', {
      review: {
        schemaVersion: 1,
        projectId: 'project',
        taskId: task.id,
        iterationId: iteration.id,
        decision: 'accept',
        summary: 'Evidence meets the definition of done',
        feedback: [],
        acceptedDeliverables: ['metrics'],
      },
    }), coordinator)
    expect(reviewed.ok).toBe(true)

    const snapshot = await scenario.service.getProjectSnapshot('project')
    expect(snapshot.state).toBe('completed')
    expect(snapshot.taskStatuses[task.id]).toBe('completed')
    expect(snapshot.activeIterationIds).toHaveLength(0)
    expect(scenario.conversationStore.messages.map((message) => message.kind)).toEqual([
      'handoff',
      'question',
      'answer',
      'result',
      'review',
      'status',
    ])
    expect(await scenario.eventStore.getLastSequence('project')).toBeGreaterThanOrEqual(7)
  })

  test('deduplicates commands and prevents a worker from dispatching work', async () => {
    const scenario = createOrchestrationScenario()
    const input = command<ProposePlanPayload>('same-command', 'plan.propose', {
      goal: 'Goal',
      summary: 'Summary',
      assumptions: [],
      constraints: [],
      tasks: [{
        key: 'task',
        title: 'Task',
        objective: 'Do it',
        deliverables: [],
        definitionOfDone: ['Done'],
        dependencies: [],
      }],
    })
    const first = await scenario.service.execute(input, coordinator)
    const duplicate = await scenario.service.execute(input, coordinator)
    expect(duplicate).toEqual(first)
    expect(scenario.recordStore.plans.size).toBe(1)

    const denied = await scenario.service.execute(command('worker-plan', 'plan.propose', input.payload), worker)
    expect(denied.ok).toBe(false)
    expect(denied.error?.code).toBe('coordinator_required')
  })

  test('deduplicates a durable command after the service is recreated', async () => {
    const scenario = createOrchestrationScenario()
    const input = command<ProposePlanPayload>('durable-command', 'plan.propose', {
      goal: 'Durable goal',
      summary: 'Persist exactly one proposal',
      assumptions: [],
      constraints: [],
      tasks: [{
        key: 'task',
        title: 'Task',
        objective: 'Do it',
        deliverables: [],
        definitionOfDone: ['Done'],
        dependencies: [],
      }],
    })
    const first = await scenario.service.execute(input, coordinator)
    const restarted = new OrchestrationService(scenario.dependencies)
    const duplicate = await restarted.execute(input, coordinator)

    expect(duplicate.ok).toBe(true)
    expect(duplicate.eventIds).toEqual(first.eventIds)
    expect(scenario.recordStore.plans.size).toBe(1)
    expect(await scenario.eventStore.getLastSequence('project')).toBe(1)
  })
})
