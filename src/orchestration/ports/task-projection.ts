import type { LoopTaskStatus, ProjectPlanTaskV1 } from '../domain/entities'

export interface ProjectTaskProjection {
  id: string
  projectId: string
  planId?: string
  status: LoopTaskStatus
  dependencies: string[]
  assignedAgentId?: string
  currentIterationId?: string
  acceptedIterationId?: string
  iterationCount: number
}

export interface TaskProjection {
  createPlanTasks(
    projectId: string,
    planId: string,
    tasks: Array<Omit<ProjectPlanTaskV1, 'id'>>,
  ): Promise<ProjectPlanTaskV1[]>
  get(taskId: string): Promise<ProjectTaskProjection | null>
  list(projectId: string): Promise<ProjectTaskProjection[]>
  assignIteration(taskId: string, workerAgentId: string, iterationId: string): Promise<void>
  changeStatus(
    taskId: string,
    status: LoopTaskStatus,
    patch?: Partial<ProjectTaskProjection>,
  ): Promise<void>
}
