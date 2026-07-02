/**
 * Universal projects store — simplified cross-workspace project list.
 *
 * Delegates to UniversalProjectsRepository, which wraps DataSource.projects
 * into a flat universal view.
 */
import { getDataSource } from '@/data/datasource/index';
import { UniversalProjectsRepository } from './repository';
import type { UniversalProject } from './interface';

const repo = new UniversalProjectsRepository(getDataSource());

export function listUniversalProjects(): UniversalProject[] {
  return repo.list();
}

export function getUniversalProject(id: string): UniversalProject | undefined {
  return repo.byId(id);
}
