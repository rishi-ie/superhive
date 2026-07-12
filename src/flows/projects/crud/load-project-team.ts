import { listAgents } from '@/flows/agents/crud/list-agents';
import { loadProject } from '@/flows/projects/crud/load-project';
import type { Agent, Project } from '@/storage/types';

export interface ProjectTeam {
	project: Project | null;
	coordinator: Agent | null;
	members: Agent[];
}

export async function loadProjectTeam(projectId: string): Promise<ProjectTeam> {
	return { project: null, coordinator: null, members: [] };
}