import type { WorkPacketInputRef } from '../domain/entities'

export interface ContextReference {
  kind: string
  ref: string
}

export interface CoordinatorContextRequest {
  projectId: string
  coordinatorAgentId: string
  query: string
  references: ContextReference[]
}

export interface WorkerContextRequest {
  projectId: string
  coordinatorAgentId: string
  taskId: string
  planId: string
  references: ContextReference[]
}

export interface ContextSlice {
  text: string
  references: ContextReference[]
}

export interface PacketContext {
  inputs: WorkPacketInputRef[]
}

export interface ProjectContextProvider {
  getCoordinatorContext(input: CoordinatorContextRequest): Promise<ContextSlice>
  getWorkerPacketContext(input: WorkerContextRequest): Promise<PacketContext>
}

