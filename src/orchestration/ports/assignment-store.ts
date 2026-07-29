import type { WorkPacketV2 } from '../domain/entities'

export interface WorkerAssignmentStore {
  write(packet: WorkPacketV2): Promise<void>
  clear(workerAgentId: string, iterationId: string): Promise<void>
}

