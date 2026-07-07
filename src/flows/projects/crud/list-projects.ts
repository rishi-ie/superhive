import { projects } from '@/api/projects';
import type { Project } from '@/storage/types';

export async function listProjects(): Promise<Project[]> {
  return projects.list();
}
