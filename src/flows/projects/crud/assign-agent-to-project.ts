import { projects } from '@/api/projects';
import { toast } from 'sonner';
import type { AssignAgentInput, AssignAgentResult } from '@/models/project';

export async function assignAgentToProject(input: AssignAgentInput): Promise<AssignAgentResult> {
	const { projectId, agentId } = input;
	if (!projectId || !agentId) {
		toast.error('Missing project or agent');
		return { ok: false, error: 'Missing project or agent' };
	}
	try {
		await projects.addAgent(projectId, agentId);
		toast.success('Agent assigned to project');
		return { ok: true };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to assign agent';
		toast.error(message);
		return { ok: false, error: message };
	}
}