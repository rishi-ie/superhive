import type { IterationStatus, LoopTaskStatus, ProjectExecutionState } from './entities'
import { OrchestrationError } from './errors'

const PROJECT_TRANSITIONS: Record<ProjectExecutionState, readonly ProjectExecutionState[]> = {
  planning: ['awaiting_approval', 'cancelled'],
  awaiting_approval: ['planning', 'running', 'cancelled'],
  running: ['paused', 'needs_user', 'completed', 'cancelled'],
  paused: ['running', 'cancelled'],
  needs_user: ['running', 'paused', 'cancelled'],
  completed: [],
  cancelled: [],
}

const TASK_TRANSITIONS: Record<LoopTaskStatus, readonly LoopTaskStatus[]> = {
  todo: ['running', 'blocked', 'cancelled'],
  running: ['waiting', 'reviewing', 'blocked', 'cancelled'],
  waiting: ['running', 'reviewing', 'blocked', 'cancelled'],
  reviewing: ['running', 'completed', 'blocked', 'cancelled'],
  blocked: ['todo', 'running', 'cancelled'],
  completed: [],
  cancelled: [],
}

const ITERATION_TRANSITIONS: Record<IterationStatus, readonly IterationStatus[]> = {
  created: ['dispatched', 'cancelled'],
  dispatched: ['running', 'failed', 'cancelled', 'expired'],
  running: ['waiting', 'reported', 'failed', 'cancelled', 'expired'],
  waiting: ['running', 'reported', 'failed', 'cancelled', 'expired'],
  reported: ['accepted', 'revision_requested', 'failed', 'cancelled'],
  accepted: [],
  revision_requested: [],
  failed: [],
  cancelled: [],
  expired: [],
}

function transition<T extends string>(
  current: T,
  next: T,
  table: Record<T, readonly T[]>,
  kind: string,
): T {
  if (current === next) return current
  if (!table[current].includes(next)) {
    throw new OrchestrationError(
      'illegal_transition',
      `Illegal ${kind} transition: ${current} → ${next}`,
      { current, next },
    )
  }
  return next
}

export const transitionProject = (current: ProjectExecutionState, next: ProjectExecutionState) =>
  transition(current, next, PROJECT_TRANSITIONS, 'project')

export const transitionTask = (current: LoopTaskStatus, next: LoopTaskStatus) =>
  transition(current, next, TASK_TRANSITIONS, 'task')

export const transitionIteration = (current: IterationStatus, next: IterationStatus) =>
  transition(current, next, ITERATION_TRANSITIONS, 'iteration')

