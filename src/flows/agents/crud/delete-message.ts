/**
 * Phase 10.4 — delete a single message.
 */

import { agents } from '@/api/agents';
import { toast } from 'sonner';

export interface DeleteMessageInput {
  agentId: string;
  messageId: string;
}

export interface DeleteMessageResult {
  ok: boolean;
  error?: string;
}

export async function deleteMessage(input: DeleteMessageInput): Promise<DeleteMessageResult> {
  try {
    const result = await agents.deleteMessage(input.agentId, input.messageId);
    if (!result.ok) {
      toast.error('Could not delete message');
      return { ok: false, error: 'Could not delete message' };
    }
    toast.success('Message deleted');
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete message';
    toast.error(message);
    return { ok: false, error: message };
  }
}
