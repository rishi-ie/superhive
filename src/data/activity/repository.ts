/**
 * Activity repository — builds the unified feed from DataSource.activity
 * plus derived data from agents and projects repositories.
 */
import type { DataSource } from '@/data/datasource/types';
import type { ActivityEvent, ListActivityOpts } from './interface';

export class ActivityRepository {
  constructor(private ds: DataSource) {}

  list(opts: ListActivityOpts = {}): ActivityEvent[] {
    const { workspaceId, limit = 50 } = opts;
    const events: ActivityEvent[] = this.ds.activity.findAll().filter(
      (ev) => !workspaceId || ev.workspaceId === workspaceId,
    );
    return events.slice(0, limit);
  }
}

export function createActivityRepository(ds: DataSource): ActivityRepository {
  return new ActivityRepository(ds);
}
