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
    return this.ds.workspaces.create({ id, name: input.name.trim(), initials });
  }

  setCurrent(id: string): void {
    // Workspace "current" is stored as a separate field — we re-use
    // a dedicated writable field on a lightweight object to avoid
    // mutating the Snapshot directly.
    // The actual "currentWorkspaceId" lives on DataSource.currentWorkspaceId
    // which is read-only in this abstraction. Mutation is handled via
    // the store's setCurrentWorkspace path.
    // This repository exposes read-only for now; mutation is in store.
    void id;
  }
}

export function createWorkspacesRepository(ds: DataSource): WorkspacesRepository {
  return new WorkspacesRepository(ds);
}
