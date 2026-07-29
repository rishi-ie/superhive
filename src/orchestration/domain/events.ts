import type { ProjectActor, ProjectExecutionSnapshot } from './entities'

export type ProjectEventType =
  | 'plan.proposed'
  | 'plan.superseded'
  | 'plan.approved'
  | 'execution.started'
  | 'execution.paused'
  | 'execution.resumed'
  | 'execution.cancelled'
  | 'task.ready'
  | 'task.blocked'
  | 'task.completed'
  | 'iteration.created'
  | 'iteration.dispatched'
  | 'iteration.started'
  | 'iteration.progressed'
  | 'iteration.questioned'
  | 'iteration.reported'
  | 'iteration.late_result_retained'
  | 'iteration.accepted'
  | 'iteration.revision_requested'
  | 'iteration.failed'
  | 'iteration.cancelled'
  | 'message.sent'
  | 'message.delivered'
  | 'message.acknowledged'
  | 'user_decision.requested'
  | 'user_decision.resolved'
  | 'project.status_changed'
  | 'agent.status_changed'
  | 'project.completed'

export interface UncommittedProjectEvent {
  type: ProjectEventType
  actor: ProjectActor
  correlationId?: string
  causationId?: string
  taskId?: string
  iterationId?: string
  messageId?: string
  payload: Record<string, unknown>
}

export interface ProjectEventV1 extends UncommittedProjectEvent {
  schemaVersion: 1
  id: string
  sequence: number
  projectId: string
  occurredAt: number
  previousDigest?: string
  digest: string
}

export type ProjectEventReducer = (
  snapshot: ProjectExecutionSnapshot,
  event: ProjectEventV1,
) => ProjectExecutionSnapshot

export class ProjectEventReducerRegistry {
  private readonly reducers = new Map<ProjectEventType, ProjectEventReducer>()

  register(type: ProjectEventType, reducer: ProjectEventReducer): void {
    if (this.reducers.has(type)) throw new Error(`Reducer already registered for ${type}`)
    this.reducers.set(type, reducer)
  }

  reduce(snapshot: ProjectExecutionSnapshot, event: ProjectEventV1): ProjectExecutionSnapshot {
    const reducer = this.reducers.get(event.type)
    if (!reducer) throw new Error(`No reducer registered for ${event.type}`)
    return reducer(snapshot, event)
  }
}

export function createEmptyProjectSnapshot(projectId: string, now = 0): ProjectExecutionSnapshot {
  return {
    schemaVersion: 1,
    projectId,
    state: 'planning',
    taskIds: [],
    taskStatuses: {},
    activeIterationIds: [],
    iterations: {},
    queuedTaskIds: [],
    blockedTaskIds: [],
    unresolvedQuestionIds: [],
    workers: {},
    lastAppliedSequence: 0,
    updatedAt: now,
  }
}

function finish(snapshot: ProjectExecutionSnapshot, event: ProjectEventV1): ProjectExecutionSnapshot {
  return { ...snapshot, lastAppliedSequence: event.sequence, updatedAt: event.occurredAt }
}

export function createDefaultEventReducers(): ProjectEventReducerRegistry {
  const registry = new ProjectEventReducerRegistry()

  registry.register('plan.proposed', (snapshot, event) => finish({
    ...snapshot,
    state: 'awaiting_approval',
    activePlanId: String(event.payload.planId),
    activePlanVersion: Number(event.payload.version),
    taskIds: Array.isArray(event.payload.taskIds) ? event.payload.taskIds.map(String) : [],
    taskStatuses: Object.fromEntries(
      (Array.isArray(event.payload.taskIds) ? event.payload.taskIds : []).map((id) => [String(id), 'todo']),
    ),
    queuedTaskIds: Array.isArray(event.payload.taskIds) ? event.payload.taskIds.map(String) : [],
  }, event))
  registry.register('plan.superseded', finish)
  registry.register('plan.approved', (snapshot, event) => finish({
    ...snapshot,
    approvedPlanId: String(event.payload.planId),
  }, event))
  registry.register('execution.started', (snapshot, event) => finish({
    ...snapshot,
    state: 'running',
    startedAt: event.occurredAt,
  }, event))
  registry.register('execution.paused', (snapshot, event) => finish({
    ...snapshot,
    state: 'paused',
    pausedAt: event.occurredAt,
  }, event))
  registry.register('execution.resumed', (snapshot, event) => finish({
    ...snapshot,
    state: 'running',
    pausedAt: undefined,
  }, event))
  registry.register('execution.cancelled', (snapshot, event) => finish({
    ...snapshot,
    state: 'cancelled',
    activeIterationIds: [],
  }, event))
  registry.register('iteration.created', (snapshot, event) => {
    const iteration = event.payload.iteration
    if (!iteration || typeof iteration !== 'object') return finish(snapshot, event)
    const typed = iteration as ProjectExecutionSnapshot['iterations'][string]
    return finish({
      ...snapshot,
      iterations: { ...snapshot.iterations, [typed.id]: typed },
      activeIterationIds: [...new Set([...snapshot.activeIterationIds, typed.id])],
      taskStatuses: { ...snapshot.taskStatuses, [typed.taskId]: 'running' },
      queuedTaskIds: snapshot.queuedTaskIds.filter((id) => id !== typed.taskId),
      workers: {
        ...snapshot.workers,
        [typed.workerAgentId]: {
          agentId: typed.workerAgentId,
          runtimeStatus: snapshot.workers[typed.workerAgentId]?.runtimeStatus ?? 'idle',
          availability: 'working',
          currentTaskId: typed.taskId,
          currentIterationId: typed.id,
          updatedAt: event.occurredAt,
        },
      },
    }, event)
  })
  for (const type of ['iteration.dispatched', 'iteration.started', 'iteration.progressed'] as const) {
    registry.register(type, (snapshot, event) => {
      const iteration = event.iterationId ? snapshot.iterations[event.iterationId] : undefined
      if (!iteration) return finish(snapshot, event)
      const status = type === 'iteration.dispatched' ? 'dispatched' : 'running'
      return finish({
        ...snapshot,
        iterations: {
          ...snapshot.iterations,
          [iteration.id]: { ...iteration, status, lastActivityAt: event.occurredAt },
        },
        workers: {
          ...snapshot.workers,
          [iteration.workerAgentId]: {
            ...(snapshot.workers[iteration.workerAgentId] ?? {
              agentId: iteration.workerAgentId,
              runtimeStatus: 'idle' as const,
            }),
            availability: 'working',
            currentTaskId: iteration.taskId,
            currentIterationId: iteration.id,
            activity: type === 'iteration.progressed'
              ? {
                  agentId: iteration.workerAgentId,
                  projectId: snapshot.projectId,
                  taskId: iteration.taskId,
                  iterationId: iteration.id,
                  runtimeStatus: snapshot.workers[iteration.workerAgentId]?.runtimeStatus ?? 'idle',
                  phase: 'working',
                  summary: typeof event.payload.summary === 'string' ? event.payload.summary : 'Working',
                  progress: typeof event.payload.progress === 'number' ? event.payload.progress : undefined,
                  updatedAt: event.occurredAt,
                  durable: true,
                }
              : snapshot.workers[iteration.workerAgentId]?.activity,
            updatedAt: event.occurredAt,
          },
        },
      }, event)
    })
  }
  registry.register('iteration.questioned', (snapshot, event) => {
    const iteration = event.iterationId ? snapshot.iterations[event.iterationId] : undefined
    const blocksWork = event.payload.blocksWork === true
    return finish({
      ...snapshot,
      unresolvedQuestionIds: event.messageId
        ? [...new Set([...snapshot.unresolvedQuestionIds, event.messageId])]
        : snapshot.unresolvedQuestionIds,
      iterations: iteration && blocksWork
        ? { ...snapshot.iterations, [iteration.id]: { ...iteration, status: 'waiting' } }
        : snapshot.iterations,
      taskStatuses: iteration && blocksWork
        ? { ...snapshot.taskStatuses, [iteration.taskId]: 'waiting' }
        : snapshot.taskStatuses,
      workers: iteration && blocksWork
        ? {
            ...snapshot.workers,
            [iteration.workerAgentId]: {
              ...(snapshot.workers[iteration.workerAgentId] ?? {
                agentId: iteration.workerAgentId,
                runtimeStatus: 'waiting' as const,
              }),
              runtimeStatus: 'waiting',
              availability: 'waiting',
              currentTaskId: iteration.taskId,
              currentIterationId: iteration.id,
              activity: {
                agentId: iteration.workerAgentId,
                projectId: snapshot.projectId,
                taskId: iteration.taskId,
                iterationId: iteration.id,
                runtimeStatus: 'waiting',
                phase: 'waiting_for_agent',
                summary: 'Waiting for Project Agent',
                updatedAt: event.occurredAt,
                durable: true,
              },
              updatedAt: event.occurredAt,
            },
          }
        : snapshot.workers,
    }, event)
  })
  registry.register('iteration.reported', (snapshot, event) => {
    const iteration = event.iterationId ? snapshot.iterations[event.iterationId] : undefined
    if (!iteration) return finish(snapshot, event)
    return finish({
      ...snapshot,
      iterations: {
        ...snapshot.iterations,
        [iteration.id]: {
          ...iteration,
          status: 'reported',
          resultDigest: typeof event.payload.resultDigest === 'string' ? event.payload.resultDigest : undefined,
          reportedAt: event.occurredAt,
        },
      },
      taskStatuses: { ...snapshot.taskStatuses, [iteration.taskId]: 'reviewing' },
      workers: {
        ...snapshot.workers,
        [iteration.workerAgentId]: {
          ...(snapshot.workers[iteration.workerAgentId] ?? {
            agentId: iteration.workerAgentId,
            runtimeStatus: 'idle' as const,
          }),
          availability: 'awaiting_review',
          currentTaskId: iteration.taskId,
          currentIterationId: iteration.id,
          updatedAt: event.occurredAt,
        },
      },
    }, event)
  })
  registry.register('iteration.late_result_retained', finish)
  registry.register('iteration.accepted', (snapshot, event) => {
    const iteration = event.iterationId ? snapshot.iterations[event.iterationId] : undefined
    if (!iteration) return finish(snapshot, event)
    return finish({
      ...snapshot,
      iterations: {
        ...snapshot.iterations,
        [iteration.id]: { ...iteration, status: 'accepted', reviewedAt: event.occurredAt },
      },
      activeIterationIds: snapshot.activeIterationIds.filter((id) => id !== iteration.id),
      taskStatuses: { ...snapshot.taskStatuses, [iteration.taskId]: 'completed' },
      workers: {
        ...snapshot.workers,
        [iteration.workerAgentId]: {
          ...(snapshot.workers[iteration.workerAgentId] ?? {
            agentId: iteration.workerAgentId,
            runtimeStatus: 'idle' as const,
          }),
          availability: 'available',
          currentTaskId: undefined,
          currentIterationId: undefined,
          updatedAt: event.occurredAt,
        },
      },
    }, event)
  })
  registry.register('iteration.revision_requested', (snapshot, event) => {
    const iteration = event.iterationId ? snapshot.iterations[event.iterationId] : undefined
    if (!iteration) return finish(snapshot, event)
    return finish({
      ...snapshot,
      iterations: {
        ...snapshot.iterations,
        [iteration.id]: { ...iteration, status: 'revision_requested', reviewedAt: event.occurredAt },
      },
      activeIterationIds: snapshot.activeIterationIds.filter((id) => id !== iteration.id),
      taskStatuses: { ...snapshot.taskStatuses, [iteration.taskId]: 'running' },
      workers: {
        ...snapshot.workers,
        [iteration.workerAgentId]: {
          ...(snapshot.workers[iteration.workerAgentId] ?? {
            agentId: iteration.workerAgentId,
            runtimeStatus: 'idle' as const,
          }),
          availability: 'available',
          currentTaskId: undefined,
          currentIterationId: undefined,
          updatedAt: event.occurredAt,
        },
      },
    }, event)
  })
  for (const type of ['iteration.failed', 'iteration.cancelled'] as const) {
    registry.register(type, (snapshot, event) => {
      const iteration = event.iterationId ? snapshot.iterations[event.iterationId] : undefined
      if (!iteration) return finish(snapshot, event)
      const status = type === 'iteration.failed' ? 'failed' : 'cancelled'
      return finish({
        ...snapshot,
        iterations: { ...snapshot.iterations, [iteration.id]: { ...iteration, status } },
        activeIterationIds: snapshot.activeIterationIds.filter((id) => id !== iteration.id),
      }, event)
    })
  }
  registry.register('task.ready', finish)
  registry.register('task.blocked', (snapshot, event) => finish({
    ...snapshot,
    taskStatuses: event.taskId
      ? { ...snapshot.taskStatuses, [event.taskId]: 'blocked' }
      : snapshot.taskStatuses,
    blockedTaskIds: event.taskId
      ? [...new Set([...snapshot.blockedTaskIds, event.taskId])]
      : snapshot.blockedTaskIds,
  }, event))
  registry.register('task.completed', finish)
  registry.register('message.sent', (snapshot, event) => {
    const replyTo = typeof event.payload.replyToMessageId === 'string'
      ? event.payload.replyToMessageId
      : undefined
    const iteration = event.iterationId ? snapshot.iterations[event.iterationId] : undefined
    const resumesWork = Boolean(
      replyTo &&
      iteration?.status === 'waiting' &&
      event.payload.kind === 'answer',
    )
    return finish({
      ...snapshot,
      unresolvedQuestionIds: replyTo
        ? snapshot.unresolvedQuestionIds.filter((id) => id !== replyTo)
        : snapshot.unresolvedQuestionIds,
      iterations: iteration && resumesWork
        ? { ...snapshot.iterations, [iteration.id]: { ...iteration, status: 'running' } }
        : snapshot.iterations,
      taskStatuses: iteration && resumesWork
        ? { ...snapshot.taskStatuses, [iteration.taskId]: 'running' }
        : snapshot.taskStatuses,
      workers: iteration && resumesWork
        ? {
            ...snapshot.workers,
            [iteration.workerAgentId]: {
              ...(snapshot.workers[iteration.workerAgentId] ?? {
                agentId: iteration.workerAgentId,
                runtimeStatus: 'idle' as const,
              }),
              availability: 'working',
              currentTaskId: iteration.taskId,
              currentIterationId: iteration.id,
              updatedAt: event.occurredAt,
            },
          }
        : snapshot.workers,
    }, event)
  })
  registry.register('message.delivered', finish)
  registry.register('message.acknowledged', finish)
  registry.register('user_decision.requested', (snapshot, event) => finish({
    ...snapshot,
    state: event.payload.blocksProject === true ? 'needs_user' : snapshot.state,
    unresolvedQuestionIds: event.messageId
      ? [...new Set([...snapshot.unresolvedQuestionIds, event.messageId])]
      : snapshot.unresolvedQuestionIds,
  }, event))
  registry.register('user_decision.resolved', (snapshot, event) => finish({
    ...snapshot,
    state: snapshot.state === 'needs_user' ? 'running' : snapshot.state,
    unresolvedQuestionIds: event.messageId
      ? snapshot.unresolvedQuestionIds.filter((id) => id !== event.messageId)
      : snapshot.unresolvedQuestionIds,
  }, event))
  registry.register('project.status_changed', (snapshot, event) => finish({
    ...snapshot,
    projectAgentActivity: {
      agentId: event.actor.id,
      projectId: snapshot.projectId,
      runtimeStatus: 'active',
      phase: typeof event.payload.phase === 'string'
        ? event.payload.phase as NonNullable<ProjectExecutionSnapshot['projectAgentActivity']>['phase']
        : 'working',
      summary: typeof event.payload.summary === 'string' ? event.payload.summary : 'Working',
      progress: typeof event.payload.progress === 'number' ? event.payload.progress : undefined,
      updatedAt: event.occurredAt,
      durable: true,
    },
  }, event))
  registry.register('agent.status_changed', finish)
  registry.register('project.completed', (snapshot, event) => finish({
    ...snapshot,
    state: 'completed',
    completedAt: event.occurredAt,
  }, event))
  return registry
}
