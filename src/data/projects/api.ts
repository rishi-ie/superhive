import type {
  Project,
  Ticket,
  ProjectAgent,
  SwarmActivity,
  CommunicationChannel,
} from './interface';

interface ProjectsApi {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  getProjectByWorkspace(workspaceId: string): Promise<Project | undefined>;
  getTitle(workspaceId?: string): Promise<string>;
  listTickets(workspaceId?: string): Promise<Ticket[]>;
  listProjectAgents(workspaceId?: string): Promise<ProjectAgent[]>;
  listSwarmActivity(workspaceId?: string): Promise<SwarmActivity[]>;
  listChannels(workspaceId?: string): Promise<CommunicationChannel[]>;
}

export const projectsApi: ProjectsApi = {
  listProjects() { throw new Error('Not implemented — replace with real API call'); },
  getProject() { throw new Error('Not implemented — replace with real API call'); },
  getProjectByWorkspace() { throw new Error('Not implemented — replace with real API call'); },
  getTitle() { throw new Error('Not implemented — replace with real API call'); },
  listTickets() { throw new Error('Not implemented — replace with real API call'); },
  listProjectAgents() { throw new Error('Not implemented — replace with real API call'); },
  listSwarmActivity() { throw new Error('Not implemented — replace with real API call'); },
  listChannels() { throw new Error('Not implemented — replace with real API call'); },
};
