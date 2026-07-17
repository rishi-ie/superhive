/**
 * waitForAgentReady — poll the main process until an agent's runtime is
 * fully ready for sending messages. "Ready" means:
 *   - status is `active` or `busy`
 *   - bootStep is `ready` (silence-based signal from Pi)
 *   - settings file has a selected model (provider + name)
 *
 * Resolves to one of:
 *   - `{ ok: true, settings }` once all three conditions hold
 *   - `{ ok: false, reason: 'timeout' | 'no-model' | 'error' }` after the
 *     deadline. Distinguishes "runtime came up but no model selected"
 *     from "runtime never reached ready" so callers can surface the right
 *     next-step CTA.
 */

import { agents } from '@/api/agents'
import type { AgentSettingsState } from '@/stores/agent'

export type WaitForReadyFailure =
  | { ok: false; reason: 'timeout'; detail: 'model' | 'runtime'; message?: string }
  | { ok: false; reason: 'error'; message: string }

export type WaitForReadyResult =
  | { ok: true; settings: AgentSettingsState }
  | WaitForReadyFailure

export interface WaitForAgentReadyOptions {
  timeoutMs?: number
  pollMs?: number
}

const DEFAULT_TIMEOUT_MS = 15_000
const DEFAULT_POLL_MS = 300

export async function waitForAgentReady(
  agentId: string,
  options: WaitForAgentReadyOptions = {},
): Promise<WaitForReadyResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const pollMs = options.pollMs ?? DEFAULT_POLL_MS
  const deadline = Date.now() + timeoutMs

  let runtimeReady = false

  while (Date.now() < deadline) {
    let snapshot: Awaited<ReturnType<typeof agents.getRuntimeState>> = null
    try {
      snapshot = await agents.getRuntimeState(agentId)
    } catch (err) {
      return {
        ok: false,
        reason: 'error',
        message: err instanceof Error ? err.message : 'Failed to read runtime state',
      }
    }

    if (snapshot) {
      const statusOk = snapshot.status === 'active' || snapshot.status === 'busy'
      const bootOk = snapshot.bootStep === 'ready'
      if (statusOk && bootOk) {
        runtimeReady = true
        break
      }
    }

    await sleep(pollMs)
  }

  if (!runtimeReady) {
    return {
      ok: false,
      reason: 'timeout',
      detail: 'runtime',
      message: 'Agent runtime did not finish booting',
    }
  }

  let settings: AgentSettingsState | null = null
  try {
    settings = (await agents.readSettings(agentId)) as AgentSettingsState | null
  } catch (err) {
    return {
      ok: false,
      reason: 'error',
      message: err instanceof Error ? err.message : 'Failed to read settings',
    }
  }

  const model = settings?.model as { provider?: string; name?: string } | undefined
  if (!model?.provider || !model?.name) {
    return {
      ok: false,
      reason: 'timeout',
      detail: 'model',
      message: 'No model selected',
    }
  }

  return { ok: true, settings: settings ?? {} }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
