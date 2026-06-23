import { isMockEnabled } from '@/lib/feature-flags';
import { projectsByWorkspace } from './mock';
import type {
  Ticket,
  ProjectAgent,
  SwarmActivity,
  CommunicationChannel,
  Project,
} from './interface';

interface ProjectsStore {
  listProjects(): Project[];
  getProject(id: string): Project | undefined;
  getProjectByWorkspace(workspaceId: string): Project | undefined;
  getTitle(workspaceId?: string): string;
  listTickets(workspaceId?: string): Ticket[];
  listProjectAgents(workspaceId?: string): ProjectAgent[];
  listSwarmActivity(workspaceId?: string): SwarmActivity[];
  listChannels(workspaceId?: string): CommunicationChannel[];
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
      return Object.values(projectsByWorkspace).flatMap(p => p.channels);
    }
    return projectsByWorkspace[workspaceId]?.channels ?? [];
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

export type { Ticket, ProjectAgent, SwarmActivity, CommunicationChannel, Project };
