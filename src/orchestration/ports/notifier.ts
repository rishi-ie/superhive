import type { ProjectExecutionSnapshot, WorkerExecutionSnapshot } from '../domain/entities'

export interface OrchestrationNotifier {
  projectChanged(snapshot: ProjectExecutionSnapshot): void
  projectChatChanged(projectId: string, messageIds: string[]): void
  agentChanged(snapshot: WorkerExecutionSnapshot): void
}

