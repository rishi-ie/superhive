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
};
