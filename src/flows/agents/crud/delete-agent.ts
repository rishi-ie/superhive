import { toast } from 'sonner';
import { agents } from '@/api/agents';
import { disposeSlice } from '@/flows/agents/settings';

export interface DeleteAgentResult {
  ok: boolean;
  error?: string;
}

export async function deleteAgent(id: string): Promise<DeleteAgentResult> {
  try {
    await agents.stop(id).catch(() => {});
    const ok = await agents.delete(id);
    if (!ok) {
      toast.error('Agent not found');
      return { ok: false, error: 'Agent not found' };
    }
    toast.success('Agent deleted');
    disposeSlice(id);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete agent';
    toast.error(message);
    return { ok: false, error: message };
  }
}