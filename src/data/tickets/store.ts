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
  list(): UniversalTicket[];
}

const emptyStore: TicketsStore = {
  list() { return []; },
};

const mockStore: TicketsStore = {
  list() { return universalTickets; },
};

const store: TicketsStore = isMockEnabled('tickets') ? mockStore : emptyStore;

export function listUniversalTickets(): UniversalTicket[] {
  return store.list();
}

export type {
  UniversalTicket,
  UniversalTicketStatus,
  Priority,
  TicketType,
  Assignee,
};
