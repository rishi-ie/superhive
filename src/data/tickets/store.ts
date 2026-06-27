import { mockableData } from '@/data/mock/index';
import type {
  UniversalTicket,
  UniversalTicketStatus,
  Priority,
  TicketType,
  Assignee,
} from './interface';

const universalTickets: UniversalTicket[] = mockableData.universalTickets;

function list(workspaceId?: string): UniversalTicket[] {
  if (!workspaceId) return universalTickets;
  return universalTickets.filter(t => t.workspaceId === workspaceId);
}

export function listUniversalTickets(workspaceId?: string): UniversalTicket[] {
  return list(workspaceId);
}

export type {
  UniversalTicket,
  UniversalTicketStatus,
  Priority,
  TicketType,
  Assignee,
};