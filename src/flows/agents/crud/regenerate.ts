/**
 * Phase 10.3 — regenerate an assistant response.
 */

import { agents } from '@/api/agents';
import { toast } from 'sonner';

export interface RegenerateInput {
  agentId: string;
  fromMessageId: string;
}

export interface RegenerateResult {
  ok: boolean;
  error?: string;
}

export async function regenerate(input: RegenerateInput): Promise<RegenerateResult> {
  try {
    const result = await agents.regenerate(input.agentId, input.fromMessageId);
    if (!result.ok) {
      toast.error('Could not regenerate');
      return { ok: false, error: 'Could not regenerate' };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to regenerate';
    toast.error(message);
    return { ok: false, error: message };
  }
}
