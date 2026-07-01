/**
 * okf repository — thin wrapper over DataSource.okfBundles.
 */
import type { DataSource } from '@/data/datasource/types';
import type { OkfBundle } from './interface';

export class OkfRepository {
  constructor(private ds: DataSource) {}

  get(projectId: string): OkfBundle | undefined {
    return this.ds.okfBundles.findByProjectId(projectId);
  }

  list(): OkfBundle[] {
    return this.ds.okfBundles.findAll();
  }

  ensure(projectId: string, rootPath: string): OkfBundle {
    return this.ds.okfBundles.upsert(projectId, rootPath);
  }

  setLastSynced(projectId: string, at: string): void {
    this.ds.okfBundles.setLastSynced(projectId, at);
  }

  incrementEntryCount(projectId: string): void {
    this.ds.okfBundles.incrementEntryCount(projectId);
  }
}
