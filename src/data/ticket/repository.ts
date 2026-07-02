/**
 * Tickets repository — thin wrapper over DataSource.tickets.
 */
import type { DataSource } from '@/data/datasource/types';
import type { UniversalTicket, Priority, TicketType } from './interface';

export class TicketsRepository {
  constructor(private ds: DataSource) {}

  list(workspaceId?: string): UniversalTicket[] {
    const all = this.ds.tickets.findAll();
    if (!workspaceId) return all;
    return all.filter((t) => t.workspaceId === workspaceId);
  }

  create(input: {
    id: string;
    title: string;
    projectName: string;
    workspaceId: string;
    priority: Priority;
    type: TicketType;
    assigneeName: string;
    assigneeAvatarUrl?: string;
    assigneeIsAI: boolean;
  }): UniversalTicket {
    return this.ds.tickets.create({
      id: input.id,
      title: input.title,
      projectName: input.projectName,
      workspaceId: input.workspaceId,
      status: 'BACKLOG',
      priority: input.priority,
      type: input.type,
      assignee: {
        name: input.assigneeName,
        avatarUrl: input.assigneeAvatarUrl,
        isAI: input.assigneeIsAI,
      },
      archivedAt: null,
    });
  }

  patch(id: string, patch: { status?: string; priority?: string; type?: string; assigneeName?: string }): UniversalTicket | undefined {
    const existing = this.ds.tickets.findById(id);
    if (!existing) return undefined;
    return this.ds.tickets.update(id, {
      ...(patch.status !== undefined ? { status: patch.status as UniversalTicket['status'] } : {}),
      ...(patch.priority !== undefined ? { priority: patch.priority as UniversalTicket['priority'] } : {}),
      ...(patch.type !== undefined ? { type: patch.type as UniversalTicket['type'] } : {}),
      ...(patch.assigneeName !== undefined ? { assignee: { ...existing.assignee, name: patch.assigneeName } } : {}),
    });
  }

  archive(id: string): UniversalTicket | undefined {
    const existing = this.ds.tickets.findById(id);
    if (!existing) return undefined;
    return this.ds.tickets.update(id, { archivedAt: new Date().toISOString() });
  }

  listActive(workspaceId?: string): UniversalTicket[] {
    const all = this.list(workspaceId);
    return all.filter((t) => !t.archivedAt);
  }
}

export function createTicketsRepository(ds: DataSource): TicketsRepository {
  return new TicketsRepository(ds);
}
