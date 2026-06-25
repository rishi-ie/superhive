import { isMockEnabled } from '@/data/mock/feature-flags';
import mockData from '../mock.json';
import type { MockData } from '../mock/types';
import type { Workspace } from './interface';

const data = mockData as MockData;

const workspaces: Workspace[] = data.workspaces;
const currentWorkspace: Workspace = workspaces.find(w => w.id === data.currentWorkspaceId) ?? workspaces[0]!;

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
