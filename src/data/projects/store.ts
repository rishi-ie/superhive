import { isMockEnabled } from '@/lib/feature-flags';
import {
  projectTitle,
  tickets,
  projectAgents,
  swarmActivity,
  channels,
} from './mock';
import type {
  Ticket,
  ProjectAgent,
  SwarmActivity,
  CommunicationChannel,
  TicketStatus,
  AgentCurrentStatus,
  ChannelStatus,
} from './interface';

interface ProjectsStore {
  getTitle(): string;
  listTickets(): Ticket[];
  listProjectAgents(): ProjectAgent[];
  listSwarmActivity(): SwarmActivity[];
  listChannels(): CommunicationChannel[];
}

const emptyStore: ProjectsStore = {
  getTitle() { return ''; },
  listTickets() { return []; },
  listProjectAgents() { return []; },
  listSwarmActivity() { return []; },
  listChannels() { return []; },
};

const mockStore: ProjectsStore = {
  getTitle() { return projectTitle; },
  listTickets() { return tickets; },
  listProjectAgents() { return projectAgents; },
  listSwarmActivity() { return swarmActivity; },
  listChannels() { return channels; },
};

const store: ProjectsStore = isMockEnabled('projects') ? mockStore : emptyStore;

export function getProjectTitle(): string { return store.getTitle(); }
export function listTickets(): Ticket[] { return store.listTickets(); }
export function listProjectAgents(): ProjectAgent[] { return store.listProjectAgents(); }
export function listSwarmActivity(): SwarmActivity[] { return store.listSwarmActivity(); }
export function listChannels(): CommunicationChannel[] { return store.listChannels(); }

export type {
  Ticket,
  ProjectAgent,
  SwarmActivity,
  CommunicationChannel,
  TicketStatus,
  AgentCurrentStatus,
  ChannelStatus,
};
