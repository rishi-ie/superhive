/**
 * Projects repository — wrapper over DataSource.projects + DataSource.channelMessages.
 * Owns project CRUD and all per-project collections (tickets, agents, channels,
 * messages) that in the old store were separate top-level arrays.
 */
import type { DataSource } from '@/data/datasource/types';
import type {
  Project,
  ProjectAgent,
  Ticket,
  CommunicationChannel,
  ChannelMessage,
  SwarmActivity,
  CreateProjectInput,
  ProjectStatus,
} from './interface';

export class ProjectsRepository {
  constructor(private ds: DataSource) {}

  list(status?: ProjectStatus): Project[] {
    const all = this.ds.projects.findAll();
    if (status) return all.filter((p) => p.status === status);
    return all;
  }

  byId(id: string): Project | undefined {
    return this.ds.projects.findById(id);
  }

  byWorkspace(workspaceId: string): Project | undefined {
    return this.list().find((p) => p.workspaceId === workspaceId);
  }

  title(workspaceId?: string): string {
    const p = workspaceId ? this.byWorkspace(workspaceId) : this.list()[0];
    return p?.title ?? '';
  }

  create(input: CreateProjectInput): Project {
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'project';
    const id = `proj-${slug}-${Date.now().toString(36)}`;
    const project: Project = {
      id,
      workspaceId: input.workspaceId,
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      successCriteria: input.successCriteria?.trim() ?? '',
      color: input.color ?? '#0562EF',
      status: 'ACTIVE',
      tickets: [],
      agents: [],
      channels: [],
      activity: [],
    };
    return this.ds.projects.create(project);
  }

  patchAgents(projectId: string, agents: ProjectAgent[]): void {
    this.ds.projects.update(projectId, { agents });
  }

  archive(id: string): void {
    const p = this.byId(id);
    if (p) this.ds.projects.update(id, { status: 'ARCHIVED' });
  }

  unarchive(id: string): void {
    const p = this.byId(id);
    if (p) this.ds.projects.update(id, { status: 'ACTIVE' });
  }

  listTickets(workspaceId?: string): Ticket[] {
    const all = this.ds.projects.findAll();
    if (!workspaceId) return all.flatMap((p) => p.tickets);
    return all.find((p) => p.workspaceId === workspaceId)?.tickets ?? [];
  }

  listProjectAgents(workspaceId?: string): ProjectAgent[] {
    const all = this.ds.projects.findAll();
    if (!workspaceId) return all.flatMap((p) => p.agents);
    return all.find((p) => p.workspaceId === workspaceId)?.agents ?? [];
  }

  listSwarmActivity(workspaceId?: string): SwarmActivity[] {
    const all = this.ds.projects.findAll();
    if (!workspaceId) return all.flatMap((p) => p.activity);
    return all.find((p) => p.workspaceId === workspaceId)?.activity ?? [];
  }

  listChannels(workspaceId?: string): CommunicationChannel[] {
    const all = this.ds.projects.findAll();
    if (!workspaceId) return all.flatMap((p) => p.channels);
    return all.find((p) => p.workspaceId === workspaceId)?.channels ?? [];
  }

  getChannel(id: string): CommunicationChannel | undefined {
    return this.listChannels().find((c) => c.id === id);
  }

  listChannelMessages(channelId: string): ChannelMessage[] {
    return this.ds.channelMessages.findByChannelId(channelId);
  }

  addChannelMessage(
    channelId: string,
    senderName: string,
    content: string,
    isAI: boolean = true,
  ): ChannelMessage {
    return this.ds.channelMessages.create({
      id: `cmsg-${crypto.randomUUID()}` as const,
      channelId,
      senderName,
      content,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isAI,
    });
  }

  getProjectIdByTicketId(ticketId: string): string | null {
    return (
      this.list().find((p) => p.tickets.some((t) => t.id === ticketId))?.id ?? null
    );
  }
}

export function createProjectsRepository(ds: DataSource): ProjectsRepository {
  return new ProjectsRepository(ds);
}
