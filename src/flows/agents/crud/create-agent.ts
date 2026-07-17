/**
 * createAgent — creates a standalone agent record + folder + settings seed.
 *
 * Does NOT start the runtime or navigate. Callers that want a ready-to-use
 * agent should use `prepareStandaloneAgent` instead, which composes create
 * + start + wait-for-ready and owns the PreparingToast lifecycle.
 *
 * Returns `{ ok, agent }` on success, `{ ok: false, error }` on validation
 * or IPC failure. The validation-toast pattern is intentionally minimal
 * here because `prepareStandaloneAgent` is the path used by the dialog;
 * callers that invoke `createAgent` directly (none today) handle their
 * own UX.
 */

import { agents } from '@/api/agents';
import type { Agent } from '@/types/electron';

export interface CreateAgentInput {
  name: string;
  folderName: string;
  parentDir: string;
  role?: string;
  description?: string;
}

export interface CreateAgentResult {
  ok: boolean;
  agent?: Agent;
  error?: string;
}

export async function createAgent(
  input: CreateAgentInput,
): Promise<CreateAgentResult> {
  const name = input.name?.trim();
  const folderName = input.folderName?.trim();
  const parentDir = input.parentDir?.trim();

  if (!name) {
    return { ok: false, error: 'Agent name is required' };
  }
  if (!folderName) {
    return { ok: false, error: 'Agent folder name is required' };
  }
  if (!parentDir) {
    return { ok: false, error: 'Parent directory is required' };
  }

  try {
    const agent = await agents.create({
      name,
      folderName,
      parentDir,
      role: input.role,
      description: input.description,
    });
    return { ok: true, agent };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to create agent',
    };
  }
}
