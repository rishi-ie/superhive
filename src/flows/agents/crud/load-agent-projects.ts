import { agents } from '@/api/agents';
import type { Project } from '@/storage/types';

export async function loadAgentProjects(agentId: string): Promise<Project[]> {
	if (!agentId) return [];
	return agents.getProjects(agentId);
}