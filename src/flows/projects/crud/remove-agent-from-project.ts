import { projects } from '@/api/projects';
import { toast } from 'sonner';
import type { RemoveAgentInput, RemoveAgentResult } from '@/models/project';

export async function removeAgentFromProject(input: RemoveAgentInput): Promise<RemoveAgentResult> {
	const { projectId, agentId } = input;
	if (!projectId || !agentId) {
		toast.error('Missing project or agent');
		return { ok: false, error: 'Missing project or agent' };
	}
	try {
		await projects.removeAgent(projectId, agentId);
		toast.success('Agent removed from project');
		return { ok: true };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to remove agent';
		toast.error(message);
		return { ok: false, error: message };
	}
}