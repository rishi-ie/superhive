import { mockableData } from '@/data/mock/index';
import type { Workspace } from './interface';

const workspaces: Workspace[] = mockableData.workspaces;
const currentWorkspace: Workspace = workspaces.find(w => w.id === mockableData.currentWorkspaceId) ?? workspaces[0]!;

function list(): Workspace[] {
  return workspaces;
}

function getCurrent(): Workspace | undefined {
  return currentWorkspace;
}

export function listWorkspaces(): Workspace[] {
  return list();
}

export function getCurrentWorkspace(): Workspace | undefined {
  return getCurrent();
}

export type { Workspace };