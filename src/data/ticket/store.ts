/**
 * Tickets store — thin wrapper over DataSource.tickets (UniversalTicket).
 */
import { getDataSource } from '@/data/datasource/index';
import { TicketsRepository } from './repository';
import {
  validateTicketInput,
  generateTicketId,
  ticketActionToStatus,
} from '@/functions/tickets';
import type { UniversalTicket, UniversalTicketStatus, Priority, TicketType } from './interface';

const repo = new TicketsRepository(getDataSource());

export function listUniversalTickets(workspaceId?: string): UniversalTicket[] {
  return repo.list(workspaceId);
}

export function patchTicket(id: string, patch: { status?: UniversalTicketStatus; priority?: Priority; type?: TicketType; assigneeName?: string }): UniversalTicket | undefined {
  return repo.patch(id, patch);
}

export function markTicketDone(id: string): UniversalTicket | undefined {
  const status = ticketActionToStatus('done');
  if (!status) return undefined;
  return repo.patch(id, { status });
}

export function snoozeTicket(id: string): void {
  const status = ticketActionToStatus('snooze');
  if (!status) return;
  repo.patch(id, { status });
}

export function archiveTicket(id: string): UniversalTicket | undefined {
  return repo.archive(id);
}

export function listActiveTickets(workspaceId?: string): UniversalTicket[] {
  return repo.listActive(workspaceId);
}

export function createTicket(input: {
  title: string;
  projectName: string;
  workspaceId: string;
  priority: Priority;
  type: TicketType;
  assigneeName: string;
  assigneeIsAI?: boolean;
  assigneeAvatarUrl?: string;
}): UniversalTicket | null {
  const validated = validateTicketInput(input);
  if (!validated) return null;
  return repo.create({
    id: generateTicketId(),
    ...validated,
  });
}

export type { UniversalTicket, UniversalTicketStatus, Priority, TicketType };
