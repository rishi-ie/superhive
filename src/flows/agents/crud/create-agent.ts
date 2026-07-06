import { toast } from 'sonner';
import { agents } from '@/api/agents';
import type { NavigateFunction } from 'react-router-dom';
import type { Agent } from '@/types/electron';

export interface CreateAgentInput {
	name: string;
	folderName: string;
	parentDir: string;
}

export interface CreateAgentResult {
	ok: boolean;
	agent?: Agent;
	error?: string;
}

export async function createAgent(
	input: CreateAgentInput,
	navigate: NavigateFunction,
): Promise<CreateAgentResult> {
	const name = input.name?.trim();
	const folderName = input.folderName?.trim();
	const parentDir = input.parentDir?.trim();

	if (!name) {
		toast.error('Agent name is required');
		return { ok: false, error: 'Agent name is required' };
	}
	if (!folderName) {
		toast.error('Agent folder name is required');
		return { ok: false, error: 'Agent folder name is required' };
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
		});
		try {
			await agents.start(agent.id);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to start agent';
			toast.error(message);
			return { ok: false, error: message, agent };
		}
		toast.success(`Agent "${agent.name}" created`);
		navigate(`/agents/${agent.id}`);
		return { ok: true, agent };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to create agent';
		toast.error(message);
		return { ok: false, error: message };
	}
}
