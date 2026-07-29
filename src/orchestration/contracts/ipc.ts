import type {
  LoopIterationV1,
  ProjectChannelMessage,
  ProjectExecutionSnapshot,
  ProjectPlanV1,
  WorkPacketV2,
  WorkerExecutionSnapshot,
  WorkerResultV1,
  IterationReviewV1,
} from '../domain/entities'

export interface IterationDetail {
  iteration: LoopIterationV1
  packet: WorkPacketV2 | null
  result: WorkerResultV1 | null
  review: IterationReviewV1 | null
}

export interface OrchestrationAPI {
  getProjectSnapshot(projectId: string): Promise<ProjectExecutionSnapshot | null>
  getAgentSnapshot(agentId: string): Promise<WorkerExecutionSnapshot | null>
  listPlans(projectId: string): Promise<ProjectPlanV1[]>
  getIteration(projectId: string, iterationId: string): Promise<IterationDetail | null>
  listProjectMessages(projectId: string): Promise<ProjectChannelMessage[]>
  approvePlan(projectId: string, planId: string): Promise<ProjectExecutionSnapshot>
  pauseProject(projectId: string): Promise<ProjectExecutionSnapshot>
  resumeProject(projectId: string): Promise<ProjectExecutionSnapshot>
  cancelProject(projectId: string): Promise<ProjectExecutionSnapshot>
  onProjectChanged(projectId: string, callback: (snapshot: ProjectExecutionSnapshot) => void): () => void
  onProjectChatChanged(projectId: string, callback: (messageIds: string[]) => void): () => void
  onAgentChanged(agentId: string, callback: (snapshot: WorkerExecutionSnapshot) => void): () => void
}

