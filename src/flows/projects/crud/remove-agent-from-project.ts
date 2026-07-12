import { projects } from '@/api/projects';
import { toast } from 'sonner';

export interface RemoveAgentInput { projectId: string; agentId: string }
export interface RemoveAgentResult { ok: boolean; error?: string }

export async function removeAgentFromProject(_input: RemoveAgentInput): Promise<RemoveAgentResult> {
	return { ok: false, error: 'not implemented' };
}