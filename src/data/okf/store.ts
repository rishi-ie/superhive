/**
 * okf/store — public API for OKF bundle operations.
 *
 * getBundlePath / ensureBundlePath — work with the SQLite metadata table.
 * Actual file reads/writes go through data/okf/fs.ts → Electron IPC.
 */
import { getDataSource } from '@/data/datasource/index';
import { OkfRepository } from './repository';
import type { OkfBundle } from './interface';

const repo = new OkfRepository(getDataSource());

export function getBundle(projectId: string): OkfBundle | undefined {
  return repo.get(projectId);
}

export function listBundles(): OkfBundle[] {
  return repo.list();
}

export function ensureBundle(projectId: string): OkfBundle {
  const rootPath = `${projectId}`;
  return repo.ensure(projectId, rootPath);
}

export function setLastSynced(projectId: string, at: string): void {
  repo.setLastSynced(projectId, at);
}

export function incrementEntryCount(projectId: string): void {
  repo.incrementEntryCount(projectId);
}

export type { OkfBundle };
