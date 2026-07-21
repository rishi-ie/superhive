/**
 * prepareStandaloneAgent — creates a new standalone agent, seeds its
 * settings, starts its runtime, and waits until the runtime is ready.
 *
 * Returns once the agent can be safely navigated to:
 *   - Runtime bootStep is `ready`
 *
 * The settings file may or may not have a model selected — if not, the
 * user picks one from the agent's settings panel after landing.
 *
 * On failure, distinguishes:
 *   - 'create-failed' — the IPC create call rejected
 *   - 'start-failed' — runtime start rejected
 *   - 'timeout' / detail 'runtime' — runtime never reached ready
 *   - 'error' — poll/settings read rejected
 *
 * Caller (the CreateAgentDialog) owns the navigation decision and the
 * PreparingToast lifecycle. This flow is side-effect-only.
 */

import { agents } from '@/api/agents'
import { waitForAgentReady } from './wait-for-agent-ready'
import type { Agent } from '@/types/electron'
import type {
  PrepareStandaloneAgentInput,
  PrepareStandaloneAgentResult,
} from '@/models/agent'

export async function prepareStandaloneAgent(
  input: PrepareStandaloneAgentInput,
): Promise<PrepareStandaloneAgentResult> {
  let agent: Agent
  try {
    agent = await agents.create({
      name: input.name.trim(),
      folderName: input.folderName.trim(),
      parentDir: input.parentDir.trim(),
      role: input.role?.trim() || undefined,
      description: input.description?.trim() || undefined,
    })
  } catch (err) {
    return {
      ok: false,
      reason: 'create-failed',
      message: err instanceof Error ? err.message : 'Failed to create agent',
    }
  }

  try {
    const startResult = await agents.start(agent.id)
    if (!startResult.ok) {
      await agents.delete(agent.id).catch(() => {})
      return {
        ok: false,
        reason: 'start-failed',
        message: 'Agent runtime failed to start',
      }
    }
  } catch (err) {
    await agents.delete(agent.id).catch(() => {})
    return {
      ok: false,
      reason: 'start-failed',
      message: err instanceof Error ? err.message : 'Agent runtime failed to start',
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
