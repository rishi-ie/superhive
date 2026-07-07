import type { Project } from '@/storage/types';

export const projects = {
  list: (): Promise<Project[]> => window.api.projects.list(),

  get: (id: string): Promise<Project | null> => window.api.projects.get(id),

  create: (data: {
    name: string;
    description?: string;
    localPath?: string;
  }): Promise<Project> => window.api.projects.create(data),
};
