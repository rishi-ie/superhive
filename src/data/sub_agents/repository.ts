/**
 * sub_agents repository — thin wrapper over DataSource.subAgents.
 */
import type { DataSource } from '@/data/datasource/types';
import type { SubAgent } from './interface';

export class SubAgentsRepository {
  constructor(private ds: DataSource) {}

  list(): SubAgent[] {
    return this.ds.subAgents.findAll() as SubAgent[];
  }

  get(id: string): SubAgent | undefined {
    return this.ds.subAgents.findById(id) as SubAgent | undefined;
  }

  listByParent(parentUlid: string): SubAgent[] {
    return this.ds.subAgents.listByParent(parentUlid) as SubAgent[];
  }

  register(opts: { id: string; parentUlid: string; name: string; kind: string; task?: string }): SubAgent {
    return this.ds.subAgents.create({
      parentUlid: opts.parentUlid,
      name: opts.name,
      kind: opts.kind,
      status: 'STARTING',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      task: opts.task ?? null,
    }) as SubAgent;
  }

  setStatus(id: string, status: string): void {
    this.ds.subAgents.setStatus(id, status);
  }

  finish(id: string): void {
    this.ds.subAgents.finish(id);
  }
}
