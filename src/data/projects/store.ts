import { isMockEnabled } from '@/lib/feature-flags';
import mockData from '../mock.json';
import type { MockData } from '../mock-types';
import type {
  Ticket,
  ProjectAgent,
  SwarmActivity,
  CommunicationChannel,
  Project,
  ChannelMessage,
} from './interface';

const data = mockData as MockData;
const projectsByWorkspace: Record<string, Project> = data.projects;

let channelMessagesMutable: ChannelMessage[] = (data.channelMessages ?? []).map(m => ({ ...m }));

interface ProjectsStore {
  listProjects(): Project[];
  getProject(id: string): Project | undefined;
  getProjectByWorkspace(workspaceId: string): Project | undefined;
  getTitle(workspaceId?: string): string;
  listTickets(workspaceId?: string): Ticket[];
  listProjectAgents(workspaceId?: string): ProjectAgent[];
  listSwarmActivity(workspaceId?: string): SwarmActivity[];
  listChannels(workspaceId?: string): CommunicationChannel[];
  getChannel(id: string): CommunicationChannel | undefined;
  listChannelMessages(channelId: string): ChannelMessage[];
}

const emptyStore: ProjectsStore = {
  listProjects() { return []; },
  getProject() { return undefined; },
  getProjectByWorkspace() { return undefined; },
  getTitle() { return ''; },
  listTickets() { return []; },
  listProjectAgents() { return []; },
  listSwarmActivity() { return []; },
  listChannels() { return []; },
  listChannelMessages() { return []; },
  getChannel() { return undefined; },
};

const mockStore: ProjectsStore = {
  listProjects() {
    return Object.values(projectsByWorkspace);
  },
  getProject(id: string) {
    return Object.values(projectsByWorkspace).find(p => p.id === id);
  },
  getProjectByWorkspace(workspaceId: string) {
    return projectsByWorkspace[workspaceId];
  },
  getTitle(workspaceId?: string) {
    const project = workspaceId
      ? projectsByWorkspace[workspaceId]
      : Object.values(projectsByWorkspace)[0];
    return project?.title ?? '';
  },
  listTickets(workspaceId?: string) {
    if (!workspaceId) {
      return Object.values(projectsByWorkspace).flatMap(p => p.tickets);
    }
    return projectsByWorkspace[workspaceId]?.tickets ?? [];
  },
  listProjectAgents(workspaceId?: string) {
    if (!workspaceId) {
      return Object.values(projectsByWorkspace).flatMap(p => p.agents);
    }
    return projectsByWorkspace[workspaceId]?.agents ?? [];
  },
  listSwarmActivity(workspaceId?: string) {
    if (!workspaceId) {
      return Object.values(projectsByWorkspace).flatMap(p => p.activity);
    }
    return projectsByWorkspace[workspaceId]?.activity ?? [];
  },
  listChannels(workspaceId?: string) {
    if (!workspaceId) {
      return Object.values(projectsByWorkspace).flatMap(p =>
        p.channels.map(ch => ({ ...ch, workspaceId: p.workspaceId }))
      );
    }
    return (projectsByWorkspace[workspaceId]?.channels ?? []).map(ch => ({ ...ch, workspaceId }));
  },
  listChannelMessages(channelId: string) {
    return channelMessagesMutable.filter(m => m.channelId === channelId);
  },
  getChannel(id: string) {
    for (const project of Object.values(projectsByWorkspace)) {
      const ch = project.channels.find(c => c.id === id);
      if (ch) return { ...ch, workspaceId: project.workspaceId };
    }
    return undefined;
  },
};

const store: ProjectsStore = isMockEnabled('projects') ? mockStore : emptyStore;

export function listProjects(): Project[] { return store.listProjects(); }
export function getProject(id: string): Project | undefined { return store.getProject(id); }
export function getProjectByWorkspace(workspaceId: string): Project | undefined { return store.getProjectByWorkspace(workspaceId); }
export function getProjectTitle(workspaceId?: string): string { return store.getTitle(workspaceId); }
export function listTickets(workspaceId?: string): Ticket[] { return store.listTickets(workspaceId); }
export function listProjectAgents(workspaceId?: string): ProjectAgent[] { return store.listProjectAgents(workspaceId); }
export function listSwarmActivity(workspaceId?: string): SwarmActivity[] { return store.listSwarmActivity(workspaceId); }
export function listChannels(workspaceId?: string): CommunicationChannel[] { return store.listChannels(workspaceId); }
export function listChannelMessages(channelId: string): ChannelMessage[] { return store.listChannelMessages(channelId); }
export function getChannel(id: string): CommunicationChannel | undefined { return store.getChannel(id); }
export function addChannelMessage(channelId: string, senderName: string, content: string, isAI: boolean = true): void {
  channelMessagesMutable.push({
    id: `cmsg-${crypto.randomUUID().slice(0, 8)}`,
    channelId,
    senderName,
    content,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    isAI,
  });
}
export function getProjectIdByTicketId(ticketId: string): string | null {
  for (const project of Object.values(projectsByWorkspace)) {
    if (project.tickets.some(t => t.id === ticketId)) {
      return project.id;
    }
  }
  return null;
}

export type { Ticket, ProjectAgent, SwarmActivity, CommunicationChannel, Project, ChannelMessage };
