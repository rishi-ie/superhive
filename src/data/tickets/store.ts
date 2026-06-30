/**
 * Tickets store — thin wrapper over DataSource.tickets (UniversalTicket).
 */
import { getDataSource } from '@/data/datasource/index';
import { TicketsRepository } from './repository';
import type { UniversalTicket, UniversalTicketStatus, Priority, TicketType } from './interface';

const repo = new TicketsRepository(getDataSource());

export function listUniversalTickets(workspaceId?: string): UniversalTicket[] {
  return repo.list(workspaceId);
}

export type { UniversalTicket, UniversalTicketStatus, Priority, TicketType };
