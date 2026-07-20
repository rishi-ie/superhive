import type { Project, ProjectUpdateInput } from '@/types/electron';

export const projects = {
  list: (): Promise<Project[]> => window.api.projects.list(),

  get: (id: string): Promise<Project | null> => window.api.projects.get(id),

  create: (data: {
    name: string;
    description?: string;
    localPath?: string;
  }): Promise<Project> => window.api.projects.create(data),

  update: (id: string, data: ProjectUpdateInput): Promise<Project | null> =>
    window.api.projects.update(id, data),

  delete: (id: string): Promise<boolean> => window.api.projects.delete(id),

  addAgent: (projectId: string, agentId: string): Promise<void> =>
    window.api.projects.addAgent(projectId, agentId),

  removeAgent: (projectId: string, agentId: string): Promise<void> =>
    window.api.projects.removeAgent(projectId, agentId),

  reveal: (id: string): Promise<{ ok: boolean }> => window.api.projects.reveal(id),

  onChanged: (cb: () => void): (() => void) => window.api.projects.onChanged(cb),

  onFolderMissing: (
    cb: (removed: Array<{ id: string; name: string }>) => void,
  ): (() => void) => window.api.projects.onFolderMissing(cb),
};
