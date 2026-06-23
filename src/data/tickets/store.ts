import { isMockEnabled } from '@/lib/feature-flags';
import mockData from '../mock.json';
import type { MockData } from '../mock-types';
import type {
  UniversalTicket,
  UniversalTicketStatus,
  Priority,
  TicketType,
  Assignee,
} from './interface';

const data = mockData as MockData;
const universalTickets: UniversalTicket[] = data.universalTickets;

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
