import type { Workspace } from './interface';

interface WorkspacesApi {
  list(): Promise<Workspace[]>;
  getCurrent(): Promise<Workspace | undefined>;
}

export const workspacesApi: WorkspacesApi = {
  list() {
    throw new Error('Not implemented — replace with real API call');
  },
  getCurrent() {
    throw new Error('Not implemented — replace with real API call');
  },
};
