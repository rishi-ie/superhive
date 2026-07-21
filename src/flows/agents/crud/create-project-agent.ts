/**
 * createProjectAgent — creates a project-coordinator agent record.
 *
 * Does NOT start the runtime. Callers wanting a ready-to-use coordinator
 * should use `prepareProjectAgent` (which composes create + start + wait)
 * or `prepareProject` (which orchestrates the full project + coordinator
 * setup).
 */

import { agents } from '@/api/agents';
import type { CreateProjectAgentInput, CreateProjectAgentResult } from '@/models/agent';

export async function createProjectAgent(
  input: CreateProjectAgentInput,
): Promise<CreateProjectAgentResult> {
  const name = input.name?.trim();
  const folderName = input.folderName?.trim();
  const parentDir = input.parentDir?.trim();

  if (!name) {
    return { ok: false, error: 'Project agent name is required' };
  }
  if (!folderName) {
    return { ok: false, error: 'Project agent folder name is required' };
  }
  if (!parentDir) {
    return { ok: false, error: 'Parent directory is required' };
  }

  try {
    const agent = await agents.create({
      name,
      folderName,
      parentDir,
      agentKind: 'project-coordinator',
      projectId: input.projectId,
    });
    return { ok: true, agent };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to create project agent',
    };
  }
}
