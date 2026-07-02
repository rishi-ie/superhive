/**
 * workspace_agents store — public API for workspace roster operations.
 *
 * Delegates to WorkspacesAgentsRepository wrapping DataSource.workspaceAgents.
 */
import { getDataSource } from '@/data/datasource/index';
import { WorkspacesAgentsRepository } from './repository';
import type { WorkspaceAgent } from './repository';

const repo = new WorkspacesAgentsRepository(getDataSource());

export function listWorkspaceAgents(workspaceId: string): WorkspaceAgent[] {
  return repo.listByWorkspace(workspaceId);
}

export function listAgentWorkspaces(agentId: string): WorkspaceAgent[] {
  return repo.listByAgent(agentId);
}

export function addAgentToWorkspace(workspaceId: string, agentId: string, role?: string): WorkspaceAgent {
  return repo.addAgent(workspaceId, agentId, role);
}

export function removeAgentFromWorkspace(workspaceId: string, agentId: string): boolean {
  return repo.removeAgent(workspaceId, agentId);
}

export type { WorkspaceAgent };
