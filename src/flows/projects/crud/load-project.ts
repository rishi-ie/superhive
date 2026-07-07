import { projects } from '@/api/projects';
import type { Project } from '@/storage/types';

export async function loadProject(id: string): Promise<Project | null> {
  return projects.get(id);
}
