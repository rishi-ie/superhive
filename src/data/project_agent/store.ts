/**
 * project_agents store — public API for project roster operations.
 */
import { getDataSource } from '@/data/datasource/index';
import { ProjectAgentsRepository } from './repository';
import type { ProjectAgent } from './interface';

const repo = new ProjectAgentsRepository(getDataSource());

export function listProjectAgentsByProject(projectId: string): ProjectAgent[] {
  return repo.listByProject(projectId);
}

export function listAgentProjects(agentId: string): ProjectAgent[] {
  return repo.listByAgent(agentId);
}

export function addAgentToProject(projectId: string, agentId: string, role?: string): ProjectAgent {
  return repo.addAgent(projectId, agentId, role);
}

export function removeAgentFromProject(projectId: string, agentId: string): boolean {
  return repo.removeAgent(projectId, agentId);
}

export type { ProjectAgent };
