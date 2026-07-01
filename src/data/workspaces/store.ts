/**
 * Workspaces store — mutable list of workspaces plus active workspace tracking.
 *
 * Built-in read functions (listWorkspaces, getCurrentWorkspace) are used everywhere.
 * The createWorkspace / setCurrentWorkspace mutators are used by the setup wizards.
 *
 * Delegates to WorkspacesRepository, which wraps DataSource.workspaces.
 * currentWorkspaceId is tracked locally (ephemeral session state, not persisted).
 */
import { getDataSource } from '@/data/datasource/index';
import { WorkspacesRepository } from './repository';
import type { Workspace } from './interface';

const repo = new WorkspacesRepository(getDataSource());

let currentWorkspaceId: string = getDataSource().currentWorkspaceId;

export function listWorkspaces(): Workspace[] {
  return repo.list();
}

export function getCurrentWorkspace(): Workspace | undefined {
  return repo.list().find((w) => w.id === currentWorkspaceId) ?? repo.list()[0];
}

export function createWorkspace(input: { name: string; description?: string }): Workspace {
  const ws = repo.create(input);
  currentWorkspaceId = ws.id;
  return ws;
}

export function renameWorkspace(id: string, name: string): Workspace | undefined {
  return repo.rename(id, name);
}

export function setRetention(id: string, days: number): Workspace | undefined {
  return repo.setRetention(id, days);
}

export function archiveWorkspace(id: string): Workspace | undefined {
  return repo.archive(id);
}

export function setCurrentWorkspace(id: string): void {
  currentWorkspaceId = id;
}

export type { Workspace };
