/**
 * project_agents repository — thin wrapper over DataSource.projectAgents.
 */
import type { DataSource } from '@/data/datasource/types';
import type { ProjectAgent } from './interface';

export class ProjectAgentsRepository {
  constructor(private ds: DataSource) {}

  list(): ProjectAgent[] {
    return this.ds.projectAgents.findAll() as ProjectAgent[];
  }

  listByProject(projectId: string): ProjectAgent[] {
    return this.ds.projectAgents.findAll().filter((pa) => pa.projectId === projectId) as ProjectAgent[];
  }

  listByAgent(agentId: string): ProjectAgent[] {
    return this.ds.projectAgents.findAll().filter((pa) => pa.agentId === agentId) as ProjectAgent[];
  }

  addAgent(projectId: string, agentId: string, role?: string): ProjectAgent {
    return this.ds.projectAgents.create({ projectId, agentId, role }) as ProjectAgent;
  }

  removeAgent(projectId: string, agentId: string): boolean {
    return this.ds.projectAgents.delete(projectId, agentId);
  }
}
