import type {
  IterationReviewV1,
  LoopIterationV1,
  ProjectPlanV1,
  WorkPacketV2,
  WorkerResultV1,
} from '../domain/entities'

export interface OrchestrationRecordStore {
  writePlan(plan: ProjectPlanV1): Promise<void>
  readPlan(projectId: string, planId: string): Promise<ProjectPlanV1 | null>
  listPlans(projectId: string): Promise<ProjectPlanV1[]>
  writeIteration(iteration: LoopIterationV1): Promise<void>
  readIteration(projectId: string, iterationId: string): Promise<LoopIterationV1 | null>
  writePacket(packet: WorkPacketV2): Promise<void>
  readPacket(projectId: string, iterationId: string): Promise<WorkPacketV2 | null>
  writeResult(result: WorkerResultV1): Promise<void>
  readResult(projectId: string, iterationId: string): Promise<WorkerResultV1 | null>
  writeReview(review: IterationReviewV1): Promise<void>
  readReview(projectId: string, iterationId: string): Promise<IterationReviewV1 | null>
}

