/**
 * createProjectAgent — creates a project-coordinator agent.
 *
 * Use this flow when you need an Agent record that represents the
 * project itself (not a standalone working agent). Project-agents:
 * - Live inside the project folder at `<localPath>/agent/`
 * - Are tagged with `agentKind: 'project-coordinator'`
 * - Auto-start their runtime immediately after creation (mirrors createAgent)
 * - Do NOT auto-navigate (caller navigates to /projects/:projectId, not /agents/:agentId)
 *
 * Forked from `createAgent` so project-agent runtimes can evolve
 * independently from standard-agent runtimes. If you change lifecycle
 * behavior here, also check `createAgent` and vice versa.
 *
 * For regular standalone agents that auto-start and auto-navigate,
 * use `createAgent` instead.
 */

import { agents } from '@/api/agents';
import { toast } from 'sonner';
import type { Agent } from '@/types/electron';

export interface CreateProjectAgentInput {
	name: string;
	folderName: string;
	parentDir: string;
}

export interface CreateProjectAgentResult {
	ok: boolean;
	agent?: Agent;
	error?: string;
}

export async function createProjectAgent(
	input: CreateProjectAgentInput,
): Promise<CreateProjectAgentResult> {
	const name = input.name?.trim();
	const folderName = input.folderName?.trim();
	const parentDir = input.parentDir?.trim();

	if (!name) {
		toast.error('Project agent name is required');
		return { ok: false, error: 'Project agent name is required' };
	}
	if (!folderName) {
		toast.error('Project agent folder name is required');
		return { ok: false, error: 'Project agent folder name is required' };
	}
	if (!parentDir) {
		toast.error('Parent directory is required');
		return { ok: false, error: 'Parent directory is required' };
	}

	try {
		const agent = await agents.create({
			name,
			folderName,
			parentDir,
			agentKind: 'project-coordinator',
		});

		// Auto-start so the project-agent is running by the time the user opens the project.
		// Mirrors createAgent behavior. We swallow start errors — the agent still exists and
		// useAgentRuntime will retry on mount.
		agents.start(agent.id).catch((err) => {
			const message = err instanceof Error ? err.message : 'Failed to start project agent';
			toast.error(message);
		});

		return { ok: true, agent };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to create project agent';
		toast.error(message);
		return { ok: false, error: message };
	}
}