export interface ProjectAgentRecord {
  id: string
  name: string
  role: 'coordinator' | 'worker'
  projectId: string
  localPath: string
  workerProfileId?: string
}

export interface ProjectAgentDirectory {
  get(agentId: string): Promise<ProjectAgentRecord | null>
  list(projectId: string): Promise<ProjectAgentRecord[]>
  coordinator(projectId: string): Promise<ProjectAgentRecord | null>
}

