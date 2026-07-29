import type {
  ProjectChannelMessage,
  ProjectExecutionSnapshot,
  WorkerExecutionSnapshot,
} from '../domain/entities'

export interface ProjectProgressViewModel {
  total: number
  completed: number
  active: number
  reviewing: number
  waiting: number
  blocked: number
  queued: number
}

export function selectProjectProgress(
  snapshot: ProjectExecutionSnapshot,
): ProjectProgressViewModel {
  const statuses = Object.values(snapshot.taskStatuses)
  return {
    total: statuses.length,
    completed: statuses.filter((status) => status === 'completed').length,
    active: statuses.filter((status) => status === 'running').length,
    reviewing: statuses.filter((status) => status === 'reviewing').length,
    waiting: statuses.filter((status) => status === 'waiting').length,
    blocked: statuses.filter((status) => status === 'blocked').length,
    queued: statuses.filter((status) => status === 'todo').length,
  }
}

export function selectWorkerSnapshot(
  snapshot: ProjectExecutionSnapshot,
  agentId: string,
): WorkerExecutionSnapshot | null {
  return snapshot.workers[agentId] ?? null
}

export function selectAgentProjectMessages(
  messages: ProjectChannelMessage[],
  agentId: string,
  activeIterationId?: string,
): ProjectChannelMessage[] {
  return messages.filter((message) =>
    message.actor.id === agentId
    || message.recipients.some((recipient) => recipient.id === agentId)
    || Boolean(activeIterationId && message.iterationId === activeIterationId),
  )
}
