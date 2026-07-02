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
import { deleteBundle as deleteOkfBundle } from '@/data/okf/fs';
import type { Workspace } from './interface';

const repo = new WorkspacesRepository(getDataSource());

let currentWorkspaceId: string = getDataSource().currentWorkspaceId;

export function listWorkspaces(): Workspace[] {
  return repo.list();
}

export function getCurrentWorkspaceId(): string {
  return currentWorkspaceId;
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

export async function deleteWorkspace(id: string): Promise<boolean> {
  const projects = getDataSource().projects.findAll().filter((p) => p.workspaceId === id);
  const projectIds = projects.map((p) => p.id);

  for (const pid of projectIds) {
    try { await deleteOkfBundle(pid); } catch { /* ignore */ }
  }

  for (const pid of projectIds) {
    getDataSource().projects.delete(pid);
  }

  await Promise.all(projectIds.map((pid) =>
    window.electron.dbExecute('DELETE FROM project_agents WHERE project_id = ?', [pid]).catch(() => {}),
  ));

  await window.electron.dbExecute(
    'DELETE FROM universal_tickets WHERE workspaceId = ?',
    [id],
  ).catch(() => {});

  await window.electron.dbExecute(
    'DELETE FROM workspace_agents WHERE workspace_id = ?',
    [id],
  ).catch(() => {});

  const ok = getDataSource().workspaces.delete(id);
  if (currentWorkspaceId === id) {
    const remaining = repo.list().filter((w) => w.id !== id && !w.archivedAt);
    currentWorkspaceId = remaining[0]?.id ?? '';
  }
  return ok;
}

export function setCurrentWorkspace(id: string): void {
  currentWorkspaceId = id;
}

export async function deleteAllWorkspaces(): Promise<boolean> {
  const all = repo.list().map((w) => w.id);
  for (const id of all) {
    await deleteWorkspace(id);
  }
  currentWorkspaceId = '';
  return true;
}

export type { Workspace };
