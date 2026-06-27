import { isMockEnabled } from '@/data/mock/feature-flags';
import mockData from '@/data/mock.json';
import type { MockData } from '@/data/mock/types';
import { getInitials } from '@/lib/initials';
import { listAgents } from '@/data/agents/store';
import type {
  Ticket,
  ProjectAgent,
  SwarmActivity,
  CommunicationChannel,
  Project,
  ChannelMessage,
  CreateProjectInput,
  ProjectStatus,
} from './interface';

const data = mockData as MockData;

const projectsMutable: Project[] = (data.projects ?? []).map(p => ({ ...p }));
const projectsById: Record<string, Project> = Object.fromEntries(
  projectsMutable.map(p => [p.id, p]),
);

let channelMessagesMutable: ChannelMessage[] = (data.channelMessages ?? []).map(m => ({ ...m }));

interface ListProjectsOpts {
  status?: ProjectStatus;
}

interface ProjectsStore {
  listProjects(opts?: ListProjectsOpts): Project[];
  getProject(id: string): Project | undefined;
  getProjectByWorkspace(workspaceId: string): Project | undefined;
  getTitle(workspaceId?: string): string;
  listTickets(workspaceId?: string): Ticket[];
  listProjectAgents(workspaceId?: string): ProjectAgent[];
  listSwarmActivity(workspaceId?: string): SwarmActivity[];
  listChannels(workspaceId?: string): CommunicationChannel[];
  getChannel(id: string): CommunicationChannel | undefined;
  listChannelMessages(channelId: string): ChannelMessage[];
  createProject(input: CreateProjectInput): Project | null;
  archiveProject(id: string): Project | null;
  unarchiveProject(id: string): Project | null;
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'project';
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
  createProject() { return null; },
  archiveProject() { return null; },
  unarchiveProject() { return null; },
};

const mockStore: ProjectsStore = {
  listProjects(opts) {
    if (opts?.status) {
      return projectsMutable.filter(p => p.status === opts.status);
    }
    return [...projectsMutable];
  },
  getProject(id: string) {
    return projectsById[id];
  },
  getProjectByWorkspace(workspaceId: string) {
    return projectsMutable.find(p => p.workspaceId === workspaceId);
  },
  getTitle(workspaceId?: string) {
    const project = workspaceId
      ? projectsMutable.find(p => p.workspaceId === workspaceId)
      : projectsMutable[0];
    return project?.title ?? '';
  },
  listTickets(workspaceId?: string) {
    if (!workspaceId) {
      return projectsMutable.flatMap(p => p.tickets);
    }
    return projectsMutable.find(p => p.workspaceId === workspaceId)?.tickets ?? [];
  },
  listProjectAgents(workspaceId?: string) {
    if (!workspaceId) {
      return projectsMutable.flatMap(p => p.agents);
    }
    return projectsMutable.find(p => p.workspaceId === workspaceId)?.agents ?? [];
  },
  listSwarmActivity(workspaceId?: string) {
    if (!workspaceId) {
      return projectsMutable.flatMap(p => p.activity);
    }
    return projectsMutable.find(p => p.workspaceId === workspaceId)?.activity ?? [];
  },
  listChannels(workspaceId?: string) {
    if (!workspaceId) {
      return projectsMutable.flatMap(p =>
        p.channels.map(ch => ({ ...ch, workspaceId: p.workspaceId })),
      );
    }
    const project = projectsMutable.find(p => p.workspaceId === workspaceId);
    return (project?.channels ?? []).map(ch => ({ ...ch, workspaceId }));
  },
  listChannelMessages(channelId: string) {
    return channelMessagesMutable.filter(m => m.channelId === channelId);
  },
  getChannel(id: string) {
    for (const project of projectsMutable) {
      const ch = project.channels.find(c => c.id === id);
      if (ch) return { ...ch, workspaceId: project.workspaceId };
    }
    return undefined;
  },
  createProject(input) {
    const title = input.title.trim();
    if (!title || !input.workspaceId) return null;
    const id = `proj-${slugifyTitle(title)}-${Date.now().toString(36)}`;
    const globalAgents = listAgents();
    const projectAgents: ProjectAgent[] = (input.agentIds ?? [])
      .map(agentId => globalAgents.find(a => a.id === agentId))
      .filter((a): a is NonNullable<typeof a> => a !== undefined)
      .map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        currentStatus: 'IDLE',
        assignedTicketId: null,
        initials: getInitials(a.name),
      }));
    const project: Project = {
      id,
      workspaceId: input.workspaceId,
      title,
      description: input.description?.trim() ?? '',
      successCriteria: input.successCriteria?.trim() ?? '',
      color: input.color ?? '#0562EF',
      status: 'ACTIVE',
      tickets: [],
      agents: projectAgents,
      channels: [],
      activity: [],
    };
    projectsMutable.unshift(project);
    projectsById[id] = project;
    return project;
  },
  archiveProject(id: string) {
    const project = projectsById[id];
    if (!project) return null;
    project.status = 'ARCHIVED';
    return project;
  },
  unarchiveProject(id: string) {
    const project = projectsById[id];
    if (!project) return null;
    project.status = 'ACTIVE';
    return project;
  },
};

const store: ProjectsStore = isMockEnabled('projects') ? mockStore : emptyStore;

export function listProjects(opts?: ListProjectsOpts): Project[] { return store.listProjects(opts); }
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
export function createProject(input: CreateProjectInput): Project | null { return store.createProject(input); }
export function archiveProject(id: string): Project | null { return store.archiveProject(id); }
export function unarchiveProject(id: string): Project | null { return store.unarchiveProject(id); }
export function getProjectIdByTicketId(ticketId: string): string | null {
  for (const project of projectsMutable) {
    if (project.tickets.some(t => t.id === ticketId)) {
      return project.id;
    }
  }
  return null;
}

export type { Ticket, ProjectAgent, SwarmActivity, CommunicationChannel, Project, ChannelMessage, CreateProjectInput, ProjectStatus };