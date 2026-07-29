import { mkdir, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { WorkPacketV2 } from '../../src/orchestration/domain/entities'
import type {
  ProjectAgentDirectory,
  WorkerAssignmentStore,
} from '../../src/orchestration/ports'
import { writeJsonAtomic } from './filesystem-utils'

export class FilesystemWorkerAssignmentStore implements WorkerAssignmentStore {
  constructor(private readonly agents: ProjectAgentDirectory) {}

  async write(packet: WorkPacketV2): Promise<void> {
    const worker = await this.agents.get(packet.workerAgentId)
    if (!worker?.localPath) throw new Error(`Worker ${packet.workerAgentId} has no local path`)
    const assignments = join(worker.localPath, 'assignments')
    await mkdir(assignments, { recursive: true })
    await writeJsonAtomic(join(assignments, `${packet.iterationId}.json`), packet)
    await writeJsonAtomic(join(assignments, 'current.json'), {
      schemaVersion: 2,
      projectId: packet.projectId,
      taskId: packet.taskId,
      iterationId: packet.iterationId,
    })
  }

  async clear(workerAgentId: string, iterationId: string): Promise<void> {
    const worker = await this.agents.get(workerAgentId)
    if (!worker?.localPath) return
    const currentPath = join(worker.localPath, 'assignments', 'current.json')
    try {
      const current = JSON.parse(await readFile(currentPath, 'utf8')) as { iterationId?: string }
      if (current.iterationId === iterationId) await rm(currentPath, { force: true })
    } catch {
      // Missing or legacy pointer.
    }
  }
}

