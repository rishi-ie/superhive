/**
 * Universal projects repository — thin read-only view over DataSource.projects.
 * Exposes a simplified "universal" project shape used by cross-workspace views.
 */
import type { DataSource } from '@/data/datasource/types';
import type { UniversalProject } from './interface';

export class UniversalProjectsRepository {
  constructor(private ds: DataSource) {}

  list(): UniversalProject[] {
    return this.ds.projects.findAll().map((p) => ({
      id: p.id,
      title: p.title,
      workspaceId: p.workspaceId,
    }));
  }

  byId(id: string): UniversalProject | undefined {
    const p = this.ds.projects.findById(id);
    if (!p) return undefined;
    return { id: p.id, title: p.title, workspaceId: p.workspaceId };
  }
}

export function createUniversalProjectsRepository(ds: DataSource): UniversalProjectsRepository {
  return new UniversalProjectsRepository(ds);
}
