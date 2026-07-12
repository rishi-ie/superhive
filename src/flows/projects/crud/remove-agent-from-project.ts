import { projects } from '@/api/projects';
import { toast } from 'sonner';

export interface RemoveAgentInput { projectId: string; agentId: string }
export interface RemoveAgentResult { ok: boolean; error?: string }

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