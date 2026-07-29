import { readFile } from 'node:fs/promises'
import type { ProjectExecutionSnapshot } from '../../src/orchestration/domain/entities'
import type { ProjectSnapshotStore } from '../../src/orchestration/ports'
import { FilesystemOrchestrationLayout } from './filesystem-layout'
import { writeJsonAtomic } from './filesystem-utils'

export class FilesystemProjectSnapshotStore implements ProjectSnapshotStore {
  constructor(private readonly layout: FilesystemOrchestrationLayout) {}

  async read(projectId: string): Promise<ProjectExecutionSnapshot | null> {
    try {
      return JSON.parse(await readFile(await this.layout.snapshot(projectId), 'utf8')) as ProjectExecutionSnapshot
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
  }

  async write(snapshot: ProjectExecutionSnapshot): Promise<void> {
    await writeJsonAtomic(await this.layout.snapshot(snapshot.projectId), snapshot)
  }
}

