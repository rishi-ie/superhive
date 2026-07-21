import { listAgents } from '@/flows/agents/crud/list-agents';
import { loadProject } from '@/flows/projects/crud/load-project';
import type { Agent } from '@/storage/types';
import type { ProjectTeam } from '@/models/project';

export async function loadProjectTeam(projectId: string): Promise<ProjectTeam> {
	const [project, agents] = await Promise.all([
		loadProject(projectId),
		listAgents(),
	]);
	if (!project) return { project: null, coordinator: null, members: [] };
	const inProject = agents.filter((a) => project.agentIds.includes(a.id));
	return {
		project,
		coordinator: inProject.find((a) => a.agentKind === 'project-coordinator') ?? null,
		members: inProject.filter((a) => a.agentKind !== 'project-coordinator'),
	};
}

export async function loadUnassignedAgents(): Promise<Agent[]> {
	const agents = await listAgents();
	return agents.filter((a) => a.agentKind !== 'project-coordinator' && a.projectIds.length === 0);
}