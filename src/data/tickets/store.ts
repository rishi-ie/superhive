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

export function patchTicket(id: string, patch: { status?: UniversalTicketStatus; priority?: Priority; type?: TicketType; assigneeName?: string }): UniversalTicket | undefined {
  return repo.patch(id, patch);
}

export function markTicketDone(id: string): UniversalTicket | undefined {
  return repo.patch(id, { status: 'MERGED' });
}

export function snoozeTicket(id: string): void {
  repo.patch(id, { status: 'BACKLOG' });
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
  if (!input.title.trim() || !input.workspaceId) return null;
  const id = `UT-${Date.now().toString(36)}`;
  return repo.create({
    id,
    title: input.title.trim(),
    projectName: input.projectName,
    workspaceId: input.workspaceId,
    priority: input.priority,
    type: input.type,
    assigneeName: input.assigneeName,
    assigneeIsAI: input.assigneeIsAI ?? true,
    assigneeAvatarUrl: input.assigneeAvatarUrl,
  });
}

export type { UniversalTicket, UniversalTicketStatus, Priority, TicketType };
