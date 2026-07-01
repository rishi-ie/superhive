/**
 * workspace_agents — workspace roster.
 *
 * Tracks which agents belong to which workspaces, with role and join date.
 */
import type { DataSource } from '@/data/datasource/types';

export type WorkspaceAgent = {
  workspaceId: string;
  agentId: string;
  role: string | null;
  joinedAt: string;
};

export class WorkspacesAgentsRepository {
  constructor(private ds: DataSource) {}

  list(): WorkspaceAgent[] {
    return this.ds.workspaceAgents.findAll();
  }

  listByWorkspace(workspaceId: string): WorkspaceAgent[] {
    return this.ds.workspaceAgents.findAll().filter(w => w.workspaceId === workspaceId);
  }

  listByAgent(agentId: string): WorkspaceAgent[] {
    return this.ds.workspaceAgents.findAll().filter(w => w.agentId === agentId);
  }

  addAgent(workspaceId: string, agentId: string, role?: string): WorkspaceAgent {
    return this.ds.workspaceAgents.create({
      workspaceId,
      agentId,
      role: role ?? null,
      joinedAt: new Date().toISOString(),
    });
  }

  removeAgent(workspaceId: string, agentId: string): boolean {
    const before = this.ds.workspaceAgents.findAll().length;
    this.ds.workspaceAgents.findAll().forEach(w => {
      if (w.workspaceId === workspaceId && w.agentId === agentId) {
        void this.ds.workspaceAgents.delete(`${w.workspaceId}:${w.agentId}`);
      }
    });
    return this.ds.workspaceAgents.findAll().length < before;
  }
}
