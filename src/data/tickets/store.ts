import { isMockEnabled } from '@/lib/feature-flags';
import { universalTickets } from './mock';
import type {
  UniversalTicket,
  UniversalTicketStatus,
  Priority,
  TicketType,
  Assignee,
} from './interface';

interface TicketsStore {
  list(workspaceId?: string): UniversalTicket[];
}

const emptyStore: TicketsStore = {
  list() { return []; },
};

const mockStore: TicketsStore = {
  list(workspaceId?: string) {
    if (!workspaceId) return universalTickets;
    return universalTickets.filter(t => t.workspaceId === workspaceId);
  },
};

const store: TicketsStore = isMockEnabled('tickets') ? mockStore : emptyStore;

export function listUniversalTickets(workspaceId?: string): UniversalTicket[] {
  return store.list(workspaceId);
}

export type {
  UniversalTicket,
  UniversalTicketStatus,
  Priority,
  TicketType,
  Assignee,
};
