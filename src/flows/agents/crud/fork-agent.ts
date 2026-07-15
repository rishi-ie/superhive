import { toast } from 'sonner';
import type { NavigateFunction } from 'react-router-dom';
import { agents } from '@/api/agents';
import type { Agent } from '@/types/electron';

export interface ForkAgentInput {
	sourceAgentId: string;
	parent: Agent;
	parentDir: string;
}

export interface ForkAgentResult {
	ok: boolean;
	agent?: Agent;
	error?: string;
}

function forkFolderName(parent: Agent): string {
	const base = parent.name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');
	const safe = base || 'fork';
	return `${safe}-fork`;
}

function forkName(parent: Agent): string {
	return `${parent.name.trim()} (fork)`;
}

export async function forkAgent(
	input: ForkAgentInput,
	navigate: NavigateFunction,
): Promise<ForkAgentResult> {
	const { sourceAgentId, parent, parentDir } = input;
	if (!sourceAgentId) {
		toast.error('Missing source agent');
		return { ok: false, error: 'Missing source agent' };
	}
	if (!parentDir?.trim()) {
		toast.error('Parent directory is required');
		return { ok: false, error: 'Parent directory is required' };
	}
	try {
		const folderName = forkFolderName(parent);
		const agent = await agents.forkFromSettings(sourceAgentId, {
			name: forkName(parent),
			folderName,
			parentDir,
		});
		toast.success(`Forked "${parent.name}"`);
		navigate(`/agents/${agent.id}`);
		return { ok: true, agent };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to fork agent';
		toast.error(message);
		return { ok: false, error: message };
	}
}
