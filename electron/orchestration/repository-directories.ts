import type {
  ProjectAgentDirectory,
  ProjectAgentRecord,
  ProjectDirectory,
} from '../../src/orchestration/ports'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'
import { ProjectRepository } from '../../src/storage/repositories/ProjectRepository'

export class RepositoryProjectDirectory implements ProjectDirectory {
  async get(projectId: string) {
    const project = await ProjectRepository.getById(projectId)
    if (!project?.localPath) return null
    return { id: project.id, name: project.name, localPath: project.localPath }
  }
}

export class RepositoryProjectAgentDirectory implements ProjectAgentDirectory {
  async get(agentId: string): Promise<ProjectAgentRecord | null> {
    const agent = await AgentRepository.getById(agentId)
    if (!agent?.localPath || agent.projectIds.length !== 1) return null
    return {
      id: agent.id,
      name: agent.name,
      role: agent.agentKind === 'project-coordinator' ? 'coordinator' : 'worker',
      projectId: agent.projectIds[0]!,
      localPath: agent.localPath,
      workerProfileId: agent.agentKind === 'project-coordinator'
        ? undefined
        : agent.workerProfileId ?? 'general-worker',
    }
  }

  async list(projectId: string): Promise<ProjectAgentRecord[]> {
    return (await AgentRepository.getByProject(projectId))
      .filter((agent) => Boolean(agent.localPath))
      .map((agent) => ({
        id: agent.id,
        name: agent.name,
        role: agent.agentKind === 'project-coordinator' ? 'coordinator' as const : 'worker' as const,
        projectId,
        localPath: agent.localPath!,
        workerProfileId: agent.agentKind === 'project-coordinator'
          ? undefined
          : agent.workerProfileId ?? 'general-worker',
      }))
  }

  async coordinator(projectId: string): Promise<ProjectAgentRecord | null> {
    return (await this.list(projectId)).find((agent) => agent.role === 'coordinator') ?? null
  }
}
