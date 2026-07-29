import type { ProjectExecutionSnapshot } from '../domain/entities'

export interface ProjectSnapshotStore {
  read(projectId: string): Promise<ProjectExecutionSnapshot | null>
  write(snapshot: ProjectExecutionSnapshot): Promise<void>
}

