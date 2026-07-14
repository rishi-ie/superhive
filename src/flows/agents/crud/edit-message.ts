/**
 * Phase 10.2 — edit-and-resend flow. UI calls this on save of the inline
 * message editor. Validation ensures new text is non-empty; the runtime
 * edit-and-resend already takes care of truncating the conversation.
 */

import { agents } from '@/api/agents';
import { toast } from 'sonner';

export interface EditMessageInput {
  agentId: string;
  messageId: string;
  newText: string;
}

export interface EditMessageResult {
  ok: boolean;
  error?: string;
}

export async function editMessage(input: EditMessageInput): Promise<EditMessageResult> {
  const text = input.newText.trim();
  if (!text) {
    toast.error('Message cannot be empty');
    return { ok: false, error: 'Message cannot be empty' };
  }
  try {
    const result = await agents.editMessage(input.agentId, input.messageId, text);
    if (!result.ok) {
      toast.error('Could not edit message');
      return { ok: false, error: 'Could not edit message' };
    }
    toast.success('Message edited');
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to edit message';
    toast.error(message);
    return { ok: false, error: message };
  }
}
