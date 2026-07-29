export interface ProjectDirectoryRecord {
  id: string
  name: string
  localPath: string
}

export interface ProjectDirectory {
  get(projectId: string): Promise<ProjectDirectoryRecord | null>
}

