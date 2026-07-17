/**
 * prepareStandaloneAgent — creates a new standalone agent, seeds its
 * settings with the top enabled catalog model, starts its runtime, and
 * waits until the runtime is fully ready for sending messages.
 *
 * Returns once the agent can be safely navigated to:
 *   - Settings file has a model selected (composer send button will be enabled)
 *   - Runtime bootStep is `ready` (composer is rendered, not the Booting state)
 *
 * On failure, distinguishes:
 *   - 'create-failed' — the IPC create call rejected
 *   - 'start-failed' — runtime start rejected
 *   - 'timeout' / 'no-model' — runtime is up but the agent has no model
 *
 * Caller (the CreateAgentDialog) owns the navigation decision and the
 * PreparingToast lifecycle. This flow is side-effect-only.
 */

import { agents } from '@/api/agents'
import { waitForAgentReady } from './wait-for-agent-ready'
import type { Agent } from '@/types/electron'

export interface PrepareStandaloneAgentInput {
  name: string
  folderName: string
  parentDir: string
  role?: string
  description?: string
}

export type PrepareStandaloneAgentFailure =
  | { ok: false; reason: 'create-failed'; message: string }
  | { ok: false; reason: 'start-failed'; message: string }
  | { ok: false; reason: 'timeout'; detail: 'model' | 'runtime'; message?: string }
  | { ok: false; reason: 'error'; message: string }

export type PrepareStandaloneAgentResult =
  | { ok: true; agent: Agent }
  | PrepareStandaloneAgentFailure

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
