import { projects } from '@/api/projects';
import { toast } from 'sonner';

export interface AssignAgentInput { projectId: string; agentId: string }
export interface AssignAgentResult { ok: boolean; error?: string }

export async function assignAgentToProject(_input: AssignAgentInput): Promise<AssignAgentResult> {
	return { ok: false, error: 'not implemented' };
}