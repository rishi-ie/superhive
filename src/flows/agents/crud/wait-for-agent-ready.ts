/**
 * waitForAgentReady — poll the main process until an agent's runtime is
 * ready for sending messages. "Ready" means:
 *   - status is `active` or `busy`
 *   - bootStep is `ready` (silence-based signal from Pi)
 *
 * Resolves to one of:
 *   - `{ ok: true, settings }` once both conditions hold (regardless of
 *     whether the settings file has a model — the user can pick one later)
 *   - `{ ok: false, reason: 'timeout', detail: 'runtime' }` after the
 *     deadline if the runtime never reached ready
 *   - `{ ok: false, reason: 'error' }` if a poll or settings read rejected
 */

import { agents } from '@/api/agents'
import type { AgentSettingsState } from '@/models/agent'
import type { WaitForReadyResult, WaitForAgentReadyOptions } from '@/models/agent'

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

  return { ok: true, settings: settings ?? {} }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
