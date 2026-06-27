import { mockableData } from '@/data/mock/index';
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

const projectsMutable: Project[] = (mockableData.projects ?? []).map(p => ({ ...p }));
const projectsById: Record<string, Project> = Object.fromEntries(
  projectsMutable.map(p => [p.id, p]),
);

let channelMessagesMutable: ChannelMessage[] = (mockableData.channelMessages ?? []).map(m => ({ ...m }));

interface ListProjectsOpts {
  status?: ProjectStatus;
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'project';
}

function listProjects(opts?: ListProjectsOpts): Project[] {
  if (opts?.status) {
    return projectsMutable.filter(p => p.status === opts.status);
  }
  return [...projectsMutable];
}

function getProject(id: string): Project | undefined {
  return projectsById[id];
}

function getProjectByWorkspace(workspaceId: string): Project | undefined {
  return projectsMutable.find(p => p.workspaceId === workspaceId);
}

function getTitle(workspaceId?: string): string {
  const project = workspaceId
    ? projectsMutable.find(p => p.workspaceId === workspaceId)
    : projectsMutable[0];
  return project?.title ?? '';
}

function listTickets(workspaceId?: string): Ticket[] {
  if (!workspaceId) {
    return projectsMutable.flatMap(p => p.tickets);
  }
  return projectsMutable.find(p => p.workspaceId === workspaceId)?.tickets ?? [];
}

function listProjectAgents(workspaceId?: string): ProjectAgent[] {
  if (!workspaceId) {
    return projectsMutable.flatMap(p => p.agents);
  }
  return projectsMutable.find(p => p.workspaceId === workspaceId)?.agents ?? [];
}

function listSwarmActivity(workspaceId?: string): SwarmActivity[] {
  if (!workspaceId) {
    return projectsMutable.flatMap(p => p.activity);
  }
  return projectsMutable.find(p => p.workspaceId === workspaceId)?.activity ?? [];
}

function listChannels(workspaceId?: string): CommunicationChannel[] {
  if (!workspaceId) {
    return projectsMutable.flatMap(p =>
      p.channels.map(ch => ({ ...ch, workspaceId: p.workspaceId })),
    );
  }
  const project = projectsMutable.find(p => p.workspaceId === workspaceId);
  return (project?.channels ?? []).map(ch => ({ ...ch, workspaceId }));
}

function listChannelMessages(channelId: string): ChannelMessage[] {
  return channelMessagesMutable.filter(m => m.channelId === channelId);
}

function getChannel(id: string): CommunicationChannel | undefined {
  for (const project of projectsMutable) {
    const ch = project.channels.find(c => c.id === id);
    if (ch) return { ...ch, workspaceId: project.workspaceId };
  }
  return undefined;
}

function createProject(input: CreateProjectInput): Project | null {
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
}

function archiveProject(id: string): Project | null {
  const project = projectsById[id];
  if (!project) return null;
  project.status = 'ARCHIVED';
  return project;
}

function unarchiveProject(id: string): Project | null {
  const project = projectsById[id];
  if (!project) return null;
  project.status = 'ACTIVE';
  return project;
}

export { listProjects, getProject, getProjectByWorkspace, getTitle as getProjectTitle, listTickets, listProjectAgents, listSwarmActivity, listChannels, listChannelMessages, getChannel, createProject, archiveProject, unarchiveProject };

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
  for (const project of projectsMutable) {
    if (project.tickets.some(t => t.id === ticketId)) {
      return project.id;
    }
  }
  return null;
}

export type { Ticket, ProjectAgent, SwarmActivity, CommunicationChannel, Project, ChannelMessage, CreateProjectInput, ProjectStatus };