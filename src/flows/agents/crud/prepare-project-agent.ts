/**
 * prepareProjectAgent — creates a project-coordinator agent (kind =
 * 'project-coordinator'), seeds settings, starts the runtime, and waits
 * until it is ready for sending messages.
 *
 * Used as a building block by `prepareProject`; not called directly from
 * a dialog.
 */

import { agents } from '@/api/agents'
import { waitForAgentReady } from './wait-for-agent-ready'
import type { Agent } from '@/types/electron'
import type {
  PrepareProjectAgentInput,
  PrepareProjectAgentResult,
} from '@/models/agent'

export async function prepareProjectAgent(
  input: PrepareProjectAgentInput,
): Promise<PrepareProjectAgentResult> {
  let agent: Agent
  try {
    agent = await agents.create({
      name: input.name.trim(),
      folderName: input.folderName.trim(),
      parentDir: input.parentDir.trim(),
      agentKind: 'project-coordinator',
      projectId: input.projectId,
      category: input.category,
    })
  } catch (err) {
    return {
      ok: false,
      reason: 'create-failed',
      message: err instanceof Error ? err.message : 'Failed to create project agent',
    }
  }

  try {
    const startResult = await agents.start(agent.id)
    if (!startResult.ok) {
      await agents.delete(agent.id).catch(() => {})
      return {
        ok: false,
        reason: 'start-failed',
        message: 'Project agent runtime failed to start',
      }
    }
  } catch (err) {
    await agents.delete(agent.id).catch(() => {})
    return {
      ok: false,
      reason: 'start-failed',
      message: err instanceof Error ? err.message : 'Project agent runtime failed to start',
    }
  }

  return waitForAgentReady(agent.id).then(async (result) => {
    if (result.ok) return { ok: true as const, agent }
    await agents.delete(agent.id).catch(() => {})
    if (result.reason === 'error') {
      return { ok: false as const, reason: 'error' as const, message: result.message }
    }
    return result
  })
}
