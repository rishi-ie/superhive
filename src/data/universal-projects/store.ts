import { listProjects } from '@/data/projects/store';
import type { UniversalProject } from './interface';

const universalProjects: UniversalProject[] = listProjects().map(p => ({
  id: p.id,
  title: p.title,
  workspaceId: p.workspaceId,
}));

export function listUniversalProjects(): UniversalProject[] {
  return universalProjects;
}

export function getUniversalProject(id: string): UniversalProject | undefined {
  return universalProjects.find(p => p.id === id);
}
