import type {
  UniversalTicket,
  UniversalTicketStatus,
  Priority,
  TicketType,
  Assignee,
} from './interface';

interface TicketsApi {
  list(workspaceId?: string): Promise<UniversalTicket[]>;
}

export const ticketsApi: TicketsApi = {
  list() { throw new Error('Not implemented — replace with real API call'); },
};

export type { UniversalTicket, UniversalTicketStatus, Priority, TicketType, Assignee };
