/**
 * Projects store — owns project data + channels + messages.
 *
 * Delegates to ProjectsRepository, which wraps DataSource.projects + DataSource.channelMessages.
 */
import { getDataSource } from '@/data/datasource/index';
import { ProjectsRepository } from './repository';
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
  ChannelStatus,
} from './interface';

const repo = new ProjectsRepository(getDataSource());

export function listProjects(opts?: { status?: ProjectStatus }): Project[] {
  return repo.list(opts?.status);
}

export function getProject(id: string): Project | undefined {
  return repo.byId(id);
}

export function getProjectByWorkspace(workspaceId: string): Project | undefined {
  return repo.byWorkspace(workspaceId);
}

export function getProjectTitle(workspaceId?: string): string {
  return repo.title(workspaceId);
}

export function listTickets(workspaceId?: string): Ticket[] {
  return repo.listTickets(workspaceId);
}

export function listProjectAgents(workspaceId?: string): ProjectAgent[] {
  return repo.listProjectAgents(workspaceId);
}

export function listSwarmActivity(workspaceId?: string): SwarmActivity[] {
  return repo.listSwarmActivity(workspaceId);
}

export function listChannels(workspaceId?: string): CommunicationChannel[] {
  return repo.listChannels(workspaceId);
}

export function getChannel(id: string): CommunicationChannel | undefined {
  return repo.getChannel(id);
}

export function listChannelMessages(channelId: string): ChannelMessage[] {
  return repo.listChannelMessages(channelId);
}

export function createProject(input: CreateProjectInput): Project | null {
  const title = input.title.trim();
  if (!title || !input.workspaceId) return null;

  const globalAgents = listAgents();
  const projectAgents: ProjectAgent[] = (input.agentIds ?? [])
    .map((agentId) => globalAgents.find((a) => a.id === agentId))
    .filter((a): a is NonNullable<typeof a> => a !== undefined)
    .map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      currentStatus: 'IDLE' as const,
      assignedTicketId: null,
      initials: getInitials(a.name),
    }));

  const created = repo.create({
    ...input,
    title,
  });

  if (projectAgents.length > 0) {
    repo.patchAgents(created.id, projectAgents);
  }

  return repo.byId(created.id) ?? created;
}

export function archiveProject(id: string): Project | null {
  repo.archive(id);
  return repo.byId(id) ?? null;
}

export function unarchiveProject(id: string): Project | null {
  repo.unarchive(id);
  return repo.byId(id) ?? null;
}

export function addChannelMessage(channelId: string, senderName: string, content: string, isAI: boolean = true): void {
  repo.addChannelMessage(channelId, senderName, content, isAI);
}

export function getProjectIdByTicketId(ticketId: string): string | null {
  return repo.getProjectIdByTicketId(ticketId);
}

export function patchProject(id: string, patch: Partial<Pick<Project, 'title' | 'description' | 'successCriteria'>>): Project | null {
  const updated = repo.patch(id, patch);
  return updated ?? null;
}

export function patchChannel(channelId: string, patch: { topic?: string; status?: ChannelStatus; participants?: string[] }): ReturnType<typeof repo.patchChannel> {
  return repo.patchChannel(channelId, patch);
}

export function findProjectByChannelId(channelId: string): Project | undefined {
  return repo.findProjectByChannelId(channelId);
}

export function removeAgentFromProject(projectId: string, agentId: string): ProjectAgent | undefined {
  return repo.removeAgent(projectId, agentId);
}

export function addAgentToProject(projectId: string, agentId: string): ProjectAgent | undefined {
  const globalAgents = listAgents();
  const a = globalAgents.find((g) => g.id === agentId);
  if (!a) return undefined;
  const projectAgent: ProjectAgent = {
    id: a.id,
    name: a.name,
    role: a.role,
    currentStatus: 'IDLE',
    assignedTicketId: null,
    initials: getInitials(a.name),
  };
  return repo.addAgent(projectId, projectAgent);
}

export function createChannel(input: {
  projectId: string;
  topic: string;
  status?: ChannelStatus;
  participants: string[];
  relatedTicketId?: string;
}): CommunicationChannel | null {
  if (!input.topic.trim() || !input.projectId) return null;
  const channel = repo.createChannel({
    projectId: input.projectId,
    topic: input.topic.trim(),
    status: input.status ?? 'OPEN',
    participants: input.participants,
    relatedTicketId: input.relatedTicketId,
  });
  return channel ?? null;
}

export type { Ticket, ProjectAgent, SwarmActivity, CommunicationChannel, ChannelStatus, Project, ChannelMessage, CreateProjectInput, ProjectStatus };
