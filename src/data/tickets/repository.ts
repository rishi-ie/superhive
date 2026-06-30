/**
 * Tickets repository — thin wrapper over DataSource.tickets.
 */
import type { DataSource } from '@/data/datasource/types';
import type { UniversalTicket } from './interface';

export class TicketsRepository {
  constructor(private ds: DataSource) {}

  list(workspaceId?: string): UniversalTicket[] {
    const all = this.ds.tickets.findAll();
    if (!workspaceId) return all;
    return all.filter((t) => t.workspaceId === workspaceId);
  }
}

export function createTicketsRepository(ds: DataSource): TicketsRepository {
  return new TicketsRepository(ds);
}
