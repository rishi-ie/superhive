import { isMockEnabled } from '@/lib/feature-flags';
import { workspaces, currentWorkspace } from './mock';
import type { Workspace } from './interface';

interface WorkspacesStore {
  list(): Workspace[];
  getCurrent(): Workspace | undefined;
}

const emptyStore: WorkspacesStore = {
  list() { return []; },
  getCurrent() { return undefined; },
};

const mockStore: WorkspacesStore = {
  list() { return workspaces; },
  getCurrent() { return currentWorkspace; },
};

const store: WorkspacesStore = isMockEnabled('workspaces') ? mockStore : emptyStore;

export function listWorkspaces(): Workspace[] {
  return store.list();
}

export function getCurrentWorkspace(): Workspace | undefined {
  return store.getCurrent();
}

export type { Workspace };
