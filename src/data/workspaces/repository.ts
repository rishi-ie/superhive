/**
 * Workspaces repository — thin wrapper over DataSource.workspaces.
 * Provides domain-shaped API on top of the generic Collection.
 */
import type { DataSource } from '@/data/datasource/types';
import type { Workspace } from './interface';

export class WorkspacesRepository {
  constructor(private ds: DataSource) {}

  list(): Workspace[] {
    return this.ds.workspaces.findAll();
  }

  getCurrent(): Workspace | undefined {
    const id = this.ds.currentWorkspaceId;
    if (!id) return this.list()[0];
    return this.ds.workspaces.findById(id);
  }

  create(input: { name: string; description?: string }): Workspace {
    const id = `ws-${input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)}-${Date.now().toString(36)}`;
    const initials = input.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
    const now = new Date().toISOString();
    return this.ds.workspaces.create({
      id,
      name: input.name.trim(),
      initials,
      createdAt: now,
      retentionDays: 90,
      archivedAt: null,
    });
  }

  rename(id: string, name: string): Workspace | undefined {
    const existing = this.ds.workspaces.findById(id);
    if (!existing) return undefined;
    const initials = name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
    return this.ds.workspaces.update(id, { name: name.trim(), initials });
  }

  setRetention(id: string, days: number): Workspace | undefined {
    const existing = this.ds.workspaces.findById(id);
    if (!existing) return undefined;
    return this.ds.workspaces.update(id, { retentionDays: days });
  }

  archive(id: string): Workspace | undefined {
    const existing = this.ds.workspaces.findById(id);
    if (!existing) return undefined;
    return this.ds.workspaces.update(id, { archivedAt: new Date().toISOString() });
  }

  setCurrent(_id: string): void {
    void _id;
  }
}

export function createWorkspacesRepository(ds: DataSource): WorkspacesRepository {
  return new WorkspacesRepository(ds);
}
